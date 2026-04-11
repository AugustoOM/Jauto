export { default as EditorView } from './components/EditorView.vue';
export { default as AutomatonCanvas } from './components/AutomatonCanvas.vue';
export { default as Toolbar } from './components/Toolbar.vue';
export { default as InspectorPanel } from './components/InspectorPanel.vue';

export { useDocumentStore } from './stores/document';
export { useHistoryStore } from './stores/history';

export type { SelectedElement, EditorTool } from './stores/document';
