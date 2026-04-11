<script setup lang="ts">
import { HomePage, EditorView, useDocumentStore, useHistoryStore, useSimulationStore } from '@jauto/ui';
import type { AutomatonKind } from '@jauto/core';
import { WebFileService, openAutomaton } from '@jauto/file-io';
import AppHeader from './AppHeader.vue';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const docStore = useDocumentStore();
const historyStore = useHistoryStore();
const simStore = useSimulationStore();
const fileService = new WebFileService();

useKeyboardShortcuts();

function handleNew(kind: AutomatonKind) {
  docStore.newDocument(kind);
  historyStore.clear();
  simStore.stop();
}

async function handleOpen() {
  try {
    const result = await openAutomaton(fileService);
    if (result) {
      docStore.loadAutomaton(result.automaton, result.fileName);
      historyStore.clear();
      simStore.stop();
    }
  } catch (err) {
    alert(`Failed to open file: ${err instanceof Error ? err.message : String(err)}`);
  }
}
</script>

<template>
  <div class="app">
    <template v-if="docStore.currentView === 'home'">
      <HomePage @new="handleNew" @open="handleOpen" />
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
