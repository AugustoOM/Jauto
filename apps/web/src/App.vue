<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { HomePage, EditorView, createBeforeUnloadHandler, runProtectedDocumentAction, useDocumentStore, useHistoryStore, useSimulationStore } from '@jauto/ui';
import type { AutomatonKind } from '@jauto/core';
import { WebFileService, openAutomaton, saveAutomaton } from '@jauto/file-io';
import AppHeader from './AppHeader.vue';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const docStore = useDocumentStore();
const historyStore = useHistoryStore();
const simStore = useSimulationStore();
const fileService = new WebFileService();
docStore.restoreRecoveryDraft();
const beforeUnload = createBeforeUnloadHandler(() => docStore.isDirty);
window.addEventListener('beforeunload', beforeUnload);
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));

useKeyboardShortcuts();

async function saveCurrentDocument(): Promise<boolean> {
  try {
    const name = docStore.fileName ?? 'untitled.jff';
    const token = docStore.createRevisionToken();
    const result = await saveAutomaton(fileService, docStore.automaton, name);
    if (result) docStore.markSaved(token, result.name, result.path);
    return result !== null;
  } catch (error) {
    alert(`Failed to save: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function handleNew(kind: AutomatonKind) {
  await runProtectedDocumentAction({
    isDirty: docStore.isDirty,
    save: saveCurrentDocument,
    action: () => {
      docStore.newDocument(kind);
      historyStore.clear();
      simStore.stop();
    },
  });
}

async function handleOpen() {
  await runProtectedDocumentAction({
    isDirty: docStore.isDirty,
    save: saveCurrentDocument,
    action: async () => {
      try {
        const result = await openAutomaton(fileService);
        if (result) {
          docStore.loadAutomaton(result.automaton, result.fileName, result.warnings, result.filePath);
          historyStore.clear();
          simStore.stop();
        }
      } catch (err) {
        alert(`Failed to open file: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  });
}
</script>

<template>
  <div class="app">
    <template v-if="docStore.currentView === 'home'">
      <HomePage :can-resume="docStore.canResume" @new="handleNew" @open="handleOpen" @resume="docStore.resume" />
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
