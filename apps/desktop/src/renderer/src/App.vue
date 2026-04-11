<script setup lang="ts">
import { EditorView } from '@jauto/ui';
</script>

<template>
  <div class="app">
    <main class="app-main">
      <EditorView />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.app-main {
  flex: 1;
  overflow: hidden;
}
</style>
