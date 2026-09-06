<script setup lang="ts">
import AutomatonCanvas from './AutomatonCanvas.vue';
import Toolbar from './Toolbar.vue';
import InspectorPanel from './InspectorPanel.vue';
import SimulationControls from './SimulationControls.vue';
import { useDocumentStore } from '../stores/document';
const docStore = useDocumentStore();
</script>

<template>
  <div class="editor-view">
    <Toolbar />
    <div v-if="docStore.importWarnings.length" class="editor-view__notices" role="status">
      <strong>Import notices</strong>
      <ul><li v-for="(warning, index) in docStore.importWarnings" :key="index">{{ warning.message }}</li></ul>
      <button type="button" @click="docStore.importWarnings = []">Dismiss notices</button>
    </div>
    <div class="editor-view__body">
      <div class="editor-view__center">
        <div class="editor-view__canvas">
          <AutomatonCanvas />
        </div>
        <SimulationControls />
      </div>
      <InspectorPanel />
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
</style>
