import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AnyAutomaton, AutomatonKind } from '@jauto/core';
import { createEmptyAutomaton } from '@jauto/core';

export type SelectedElement =
  | { type: 'state'; id: string }
  | { type: 'transition'; id: string }
  | null;

export type EditorTool = 'select' | 'add-state' | 'add-transition' | 'delete';
export type AppView = 'home' | 'editor';
export type InspectorFocusTarget =
  | { type: 'state'; field: 'name'; nonce: number }
  | { type: 'transition'; field: string; nonce: number };
export type InspectorFocusRequest =
  | { type: 'state'; field: 'name' }
  | { type: 'transition'; field: string };

export interface DocumentRevisionToken {
  readonly documentId: number;
  readonly revision: number;
}

export const useDocumentStore = defineStore('document', () => {
  const currentView = ref<AppView>('home');
  const automaton = ref<AnyAutomaton>(createEmptyAutomaton('fa'));
  const fileName = ref<string | null>(null);
  const documentId = ref(0);
  const revision = ref(0);
  const savedRevision = ref(0);
  const importWarnings = ref<readonly { message: string }[]>([]);
  const selectedElement = ref<SelectedElement>(null);
  const inspectorFocusTarget = ref<InspectorFocusTarget | null>(null);
  const activeTool = ref<EditorTool>('select');
  const heldModifier = ref<'shift' | 'ctrl' | null>(null);
  let inspectorFocusNonce = 0;
  let nextDocumentId = 0;
  let nextRevision = 0;

  const automatonKind = computed<AutomatonKind>(() => automaton.value.kind);
  const isDirty = computed(() => revision.value !== savedRevision.value);

  function setAutomaton(newAutomaton: AnyAutomaton): number {
    automaton.value = newAutomaton;
    revision.value = ++nextRevision;
    return revision.value;
  }

  function restoreAutomaton(newAutomaton: AnyAutomaton, restoredRevision: number) {
    automaton.value = newAutomaton;
    revision.value = restoredRevision;
  }

  function previewAutomaton(newAutomaton: AnyAutomaton) {
    automaton.value = newAutomaton;
  }

  function resetIdentity() {
    documentId.value = ++nextDocumentId;
    revision.value = 0;
    savedRevision.value = 0;
    nextRevision = 0;
  }

  function loadAutomaton(newAutomaton: AnyAutomaton, name: string | null = null, warnings: readonly { message: string }[] = []) {
    importWarnings.value = warnings;
    automaton.value = newAutomaton;
    fileName.value = name;
    resetIdentity();
    selectedElement.value = null;
    currentView.value = 'editor';
  }

  function newDocument(kind: AutomatonKind) {
    importWarnings.value = [];
    automaton.value = createEmptyAutomaton(kind);
    fileName.value = null;
    resetIdentity();
    selectedElement.value = null;
    currentView.value = 'editor';
  }

  function goHome() {
    currentView.value = 'home';
  }

  function select(element: SelectedElement) {
    selectedElement.value = element;
  }

  function requestInspectorFocus(target: InspectorFocusRequest) {
    if (target.type === 'state') {
      inspectorFocusTarget.value = { type: 'state', field: target.field, nonce: ++inspectorFocusNonce };
      return;
    }
    inspectorFocusTarget.value = { type: 'transition', field: target.field, nonce: ++inspectorFocusNonce };
  }

  function clearSelection() {
    selectedElement.value = null;
    inspectorFocusTarget.value = null;
  }

  function setTool(tool: EditorTool) {
    activeTool.value = tool;
  }

  function rename(name: string) {
    const normalized = name.trim();
    if (normalized) {
      fileName.value = normalized.endsWith('.jff') ? normalized : `${normalized}.jff`;
    }
  }

  function createRevisionToken(): DocumentRevisionToken {
    return { documentId: documentId.value, revision: revision.value };
  }

  function markSaved(token: DocumentRevisionToken, name?: string): boolean {
    if (token.documentId !== documentId.value) return false;
    savedRevision.value = token.revision;
    if (name) fileName.value = name;
    return true;
  }

  return {
    currentView,
    automaton,
    fileName,
    documentId,
    revision,
    savedRevision,
    isDirty,
    importWarnings,
    selectedElement,
    inspectorFocusTarget,
    activeTool,
    heldModifier,
    automatonKind,
    setAutomaton,
    restoreAutomaton,
    previewAutomaton,
    loadAutomaton,
    newDocument,
    goHome,
    rename,
    select,
    requestInspectorFocus,
    clearSelection,
    setTool,
    markSaved,
    createRevisionToken,
  };
});
