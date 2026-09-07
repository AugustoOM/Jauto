import type { AutomatonKind } from '@jauto/core';
import type { FileService } from '@jauto/file-io';
import { openAutomaton, saveAutomaton } from '@jauto/file-io';
import { exportDiagramPng } from './diagramExport';
import { runProtectedDocumentAction } from './documentLifecycle';
import { useDocumentStore } from './stores/document';
import { useHistoryStore } from './stores/history';
import { useSimulationStore } from './stores/simulation';

export type ApplicationMenuCommand =
  | 'menu:home' | 'menu:new-fa' | 'menu:new-pda' | 'menu:new-tm'
  | 'menu:open' | 'menu:save' | 'menu:save-as' | 'menu:export-png'
  | 'menu:undo' | 'menu:redo';

export function useApplicationCommands(
  fileService: FileService,
  reportError: (message: string) => void = (message) => window.alert(message),
) {
  const document = useDocumentStore();
  const history = useHistoryStore();
  const simulation = useSimulationStore();

  function report(action: string, error: unknown) {
    reportError(`${action}: ${error instanceof Error ? error.message : String(error)}`);
  }

  async function saveDocument(saveAs = false): Promise<boolean> {
    try {
      document.flushInspectorEdits();
      const token = document.createRevisionToken();
      const result = await saveAutomaton(
        fileService,
        document.automaton,
        document.fileName ?? 'untitled.jff',
        saveAs ? undefined : document.filePath ?? undefined,
      );
      if (result) document.markSaved(token, result.name, result.path);
      return result !== null;
    } catch (error) {
      report('Failed to save', error);
      return false;
    }
  }

  async function replaceDocument(action: () => void | Promise<void>): Promise<boolean> {
    document.flushInspectorEdits();
    return runProtectedDocumentAction({ isDirty: document.isDirty, save: () => saveDocument(false), action });
  }

  async function newDocument(kind: AutomatonKind): Promise<boolean> {
    return replaceDocument(() => {
      document.newDocument(kind);
      history.clear();
      simulation.stop();
    });
  }

  async function openDocument(): Promise<boolean> {
    return replaceDocument(async () => {
      try {
        const result = await openAutomaton(fileService);
        if (!result) return;
        document.loadAutomaton(result.automaton, result.fileName, result.warnings, result.filePath);
        history.clear();
        simulation.stop();
      } catch (error) {
        report('Failed to open', error);
      }
    });
  }

  function goHome() {
    simulation.stop();
    document.goHome();
  }

  async function exportPng(): Promise<boolean> {
    try {
      document.flushInspectorEdits();
      const blob = await exportDiagramPng(document.automaton, { scale: 2, showGrid: false });
      const name = `${(document.fileName ?? 'automaton').replace(/\.jff$/, '')}.png`;
      const result = await fileService.exportImage(blob, name);
      if (!result) throw new Error('The export was canceled or could not be started');
      return true;
    } catch (error) {
      report('Failed to export PNG', error);
      return false;
    }
  }

  async function handleMenuCommand(command: string): Promise<boolean> {
    switch (command as ApplicationMenuCommand) {
      case 'menu:home': goHome(); return true;
      case 'menu:new-fa': return newDocument('fa');
      case 'menu:new-pda': return newDocument('pda');
      case 'menu:new-tm': return newDocument('turing');
      case 'menu:open': return openDocument();
      case 'menu:save': return saveDocument(false);
      case 'menu:save-as': return saveDocument(true);
      case 'menu:export-png': return exportPng();
      case 'menu:undo': history.undo(); return true;
      case 'menu:redo': history.redo(); return true;
      default: return false;
    }
  }

  return { saveDocument, newDocument, openDocument, goHome, exportPng, handleMenuCommand };
}
