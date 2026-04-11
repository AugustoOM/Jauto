<script setup lang="ts">
</script>

<template>
  <div class="editor-view">
    <div class="editor-view__canvas">
      <AutomatonCanvas />
    </div>
  </div>
</template>

<style scoped>
.editor-view {
  display: flex;
  width: 100%;
  height: 100%;
}

.editor-view__canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
