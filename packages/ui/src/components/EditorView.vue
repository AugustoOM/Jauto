<script setup lang="ts">
import AutomatonCanvas from './AutomatonCanvas.vue';
import Toolbar from './Toolbar.vue';
import InspectorPanel from './InspectorPanel.vue';
import SimulationControls from './SimulationControls.vue';
import SemanticDiagramPanel from './SemanticDiagramPanel.vue';
import { PanelRightClose, PanelRightOpen } from '@lucide/vue';
import { ref } from 'vue';
import { useDocumentStore } from '../stores/document';
const docStore = useDocumentStore();
const inspectorOpen = ref(true);

function toggleInspector() {
  if (inspectorOpen.value) docStore.flushInspectorEdits();
  inspectorOpen.value = !inspectorOpen.value;
}
</script>

<template>
  <div class="editor-view">
    <Toolbar />
    <button class="editor-view__inspector-toggle" type="button" :aria-expanded="inspectorOpen" aria-controls="property-inspector" @click="toggleInspector">
      <PanelRightClose v-if="inspectorOpen" :size="14" />
      <PanelRightOpen v-else :size="14" />
      {{ inspectorOpen ? 'Hide inspector' : 'Show inspector' }}
    </button>
    <div v-if="docStore.importWarnings.length" class="editor-view__notices" role="status">
      <strong>Import notices</strong>
      <ul><li v-for="(warning, index) in docStore.importWarnings" :key="index">{{ warning.message }}</li></ul>
      <button type="button" @click="docStore.importWarnings = []">Dismiss notices</button>
    </div>
    <div class="editor-view__body">
      <div class="editor-view__center">
        <SemanticDiagramPanel />
        <div class="editor-view__canvas">
          <AutomatonCanvas />
        </div>
        <SimulationControls />
      </div>
      <InspectorPanel v-if="inspectorOpen" id="property-inspector" />
    </div>
  </div>
</template>

<style scoped>
.editor-view__notices { padding: 8px 16px; border-bottom: 1px solid var(--color-border); }
.editor-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.editor-view__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-view__inspector-toggle { align-self: flex-end; margin: 4px 8px; display: inline-flex; align-items: center; gap: 4px; min-height: 30px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg-secondary); color: var(--color-text); cursor: pointer; }
.editor-view__inspector-toggle:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

.editor-view__center {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-view__canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

@media (max-width: 760px) {
  .editor-view__body { flex-direction: column; }
  .editor-view__center { min-height: 55%; }
  :deep(.inspector) { width: auto; max-height: 40%; border-top: 1px solid var(--color-border); border-left: 0; }
}
</style>
