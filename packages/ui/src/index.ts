export { default as HomePage } from './components/HomePage.vue';
export { default as EditorView } from './components/EditorView.vue';
export { default as AutomatonCanvas } from './components/AutomatonCanvas.vue';
export { default as Toolbar } from './components/Toolbar.vue';
export { default as InspectorPanel } from './components/InspectorPanel.vue';
export { default as ThemeToggle } from './components/ThemeToggle.vue';

export { useDocumentStore } from './stores/document';
export { useHistoryStore } from './stores/history';
export { useSimulationStore } from './stores/simulation';
export { useThemeStore } from './stores/theme';

export type { SelectedElement, EditorTool, AppView } from './stores/document';
export type { Theme } from './stores/theme';

export { saveDocumentKey, type SaveDocumentFn } from './injectionKeys';

export { STATE_RADIUS, TRANSITION_HIT_TOLERANCE, SELF_LOOP_RADIUS, SELF_LOOP_OFFSET } from './constants';
