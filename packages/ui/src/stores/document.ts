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

export const useDocumentStore = defineStore('document', () => {
  const currentView = ref<AppView>('home');
  const automaton = ref<AnyAutomaton>(createEmptyAutomaton('fa'));
  const fileName = ref<string | null>(null);
  const isDirty = ref(false);
  const importWarnings = ref<readonly { message: string }[]>([]);
  const selectedElement = ref<SelectedElement>(null);
  const inspectorFocusTarget = ref<InspectorFocusTarget | null>(null);
  const activeTool = ref<EditorTool>('select');
  const heldModifier = ref<'shift' | 'ctrl' | null>(null);
  let inspectorFocusNonce = 0;

  const automatonKind = computed<AutomatonKind>(() => automaton.value.kind);

  function setAutomaton(newAutomaton: AnyAutomaton) {
    automaton.value = newAutomaton;
    isDirty.value = true;
  }

  function loadAutomaton(newAutomaton: AnyAutomaton, name: string | null = null, warnings: readonly { message: string }[] = []) {
    importWarnings.value = warnings;
    automaton.value = newAutomaton;
    fileName.value = name;
    isDirty.value = false;
    selectedElement.value = null;
    currentView.value = 'editor';
  }

  function newDocument(kind: AutomatonKind) {
    importWarnings.value = [];
    automaton.value = createEmptyAutomaton(kind);
    fileName.value = null;
    isDirty.value = false;
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

  function markSaved(name?: string) {
    isDirty.value = false;
    if (name) fileName.value = name;
  }

  return {
    currentView,
    automaton,
    fileName,
    isDirty,
    importWarnings,
    selectedElement,
    inspectorFocusTarget,
    activeTool,
    heldModifier,
    automatonKind,
    setAutomaton,
    loadAutomaton,
    newDocument,
    goHome,
    rename,
    select,
    requestInspectorFocus,
    clearSelection,
    setTool,
    markSaved,
  };
});
