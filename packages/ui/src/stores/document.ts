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
  const recoveryKey = 'jauto:recovery-draft:v1';
  const currentView = ref<AppView>('home');
  const automaton = ref<AnyAutomaton>(createEmptyAutomaton('fa'));
  const fileName = ref<string | null>(null);
  const filePath = ref<string | null>(null);
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
  const canResume = computed(() => automaton.value.states.length > 0 || isDirty.value || fileName.value !== null);

  function recoveryStorage(): Storage | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
      return null;
    }
  }

  function persistRecoveryDraft() {
    const storage = recoveryStorage();
    if (!storage) return;
    storage.setItem(recoveryKey, JSON.stringify({ automaton: automaton.value, fileName: fileName.value, filePath: filePath.value }));
  }

  function clearRecoveryDraft() {
    recoveryStorage()?.removeItem(recoveryKey);
  }

  function setAutomaton(newAutomaton: AnyAutomaton): number {
    automaton.value = newAutomaton;
    revision.value = ++nextRevision;
    persistRecoveryDraft();
    return revision.value;
  }

  function restoreAutomaton(newAutomaton: AnyAutomaton, restoredRevision: number) {
    automaton.value = newAutomaton;
    revision.value = restoredRevision;
    if (isDirty.value) persistRecoveryDraft();
    else clearRecoveryDraft();
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

  function loadAutomaton(newAutomaton: AnyAutomaton, name: string | null = null, warnings: readonly { message: string }[] = [], path: string | null = null) {
    importWarnings.value = warnings;
    automaton.value = newAutomaton;
    fileName.value = name;
    filePath.value = path;
    resetIdentity();
    clearRecoveryDraft();
    selectedElement.value = null;
    currentView.value = 'editor';
  }

  function newDocument(kind: AutomatonKind) {
    importWarnings.value = [];
    automaton.value = createEmptyAutomaton(kind);
    fileName.value = null;
    filePath.value = null;
    resetIdentity();
    clearRecoveryDraft();
    selectedElement.value = null;
    currentView.value = 'editor';
  }

  function goHome() {
    currentView.value = 'home';
  }

  function resume() {
    if (canResume.value) currentView.value = 'editor';
  }

  function restoreRecoveryDraft(): boolean {
    const raw = recoveryStorage()?.getItem(recoveryKey);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw) as { automaton?: AnyAutomaton; fileName?: string | null; filePath?: string | null };
      if (!parsed.automaton || !['fa', 'pda', 'turing'].includes(parsed.automaton.kind)) return false;
      if (!Array.isArray(parsed.automaton.states) || !Array.isArray(parsed.automaton.transitions)) return false;
      automaton.value = parsed.automaton;
      fileName.value = parsed.fileName ?? null;
      filePath.value = parsed.filePath ?? null;
      resetIdentity();
      revision.value = ++nextRevision;
      currentView.value = 'home';
      return true;
    } catch {
      clearRecoveryDraft();
      return false;
    }
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

  function markSaved(token: DocumentRevisionToken, name?: string, path?: string): boolean {
    if (token.documentId !== documentId.value) return false;
    savedRevision.value = token.revision;
    if (name) fileName.value = name;
    if (path) filePath.value = path;
    if (isDirty.value) persistRecoveryDraft();
    else clearRecoveryDraft();
    return true;
  }

  return {
    currentView,
    automaton,
    fileName,
    filePath,
    documentId,
    revision,
    savedRevision,
    isDirty,
    canResume,
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
    resume,
    restoreRecoveryDraft,
    clearRecoveryDraft,
    rename,
    select,
    requestInspectorFocus,
    clearSelection,
    setTool,
    markSaved,
    createRevisionToken,
  };
});
