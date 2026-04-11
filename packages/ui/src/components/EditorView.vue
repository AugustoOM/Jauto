<script setup lang="ts">
import AutomatonCanvas from './AutomatonCanvas.vue';
import Toolbar from './Toolbar.vue';
import InspectorPanel from './InspectorPanel.vue';
import SimulationControls from './SimulationControls.vue';
</script>

<template>
  <div class="editor-view">
    <Toolbar />
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
