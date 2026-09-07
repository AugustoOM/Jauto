<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import {
  HomePage,
  EditorView,
  createBeforeUnloadHandler,
  useApplicationCommands,
  useDocumentStore,
} from '@jauto/ui';
import type { AutomatonKind } from '@jauto/core';
import { WebFileService } from '@jauto/file-io';
import AppHeader from './AppHeader.vue';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const docStore = useDocumentStore();
const fileService = new WebFileService();
const commands = useApplicationCommands(fileService);
docStore.restoreRecoveryDraft();
const beforeUnload = createBeforeUnloadHandler(
  () => docStore.currentView === 'editor' && docStore.isDirty,
);
window.addEventListener('beforeunload', beforeUnload);
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));

useKeyboardShortcuts();

async function handleNew(kind: AutomatonKind) {
  await commands.newDocument(kind);
}

async function handleOpen() {
  await commands.openDocument();
}
</script>

<template>
  <div class="app">
    <template v-if="docStore.currentView === 'home'">
      <HomePage
        :can-resume="docStore.canResume"
        @new="handleNew"
        @open="handleOpen"
        @resume="docStore.resume"
      />
    </template>
    <template v-else>
      <AppHeader />
      <main class="app-main">
        <EditorView />
      </main>
    </template>
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
