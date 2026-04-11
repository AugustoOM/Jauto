<script setup lang="ts">
import { onMounted } from 'vue';
import { HomePage, EditorView, useDocumentStore, useHistoryStore } from '@jauto/ui';
import type { AutomatonKind } from '@jauto/core';
import { openAutomaton, saveAutomaton } from '@jauto/file-io';
import { DesktopFileService } from './DesktopFileService';

const docStore = useDocumentStore();
const historyStore = useHistoryStore();
const fileService = new DesktopFileService();

function handleNew(kind: AutomatonKind) {
  docStore.newDocument(kind);
  historyStore.clear();
  updateTitle();
}

async function handleOpen() {
  try {
    const result = await openAutomaton(fileService);
    if (result) {
      docStore.loadAutomaton(result.automaton, result.fileName);
      historyStore.clear();
      updateTitle();
    }
  } catch (err) {
    console.error('Failed to open:', err);
  }
}

onMounted(() => {
  if (!window.electronAPI) return;

  window.electronAPI.onMenuCommand(async (command: string) => {
    switch (command) {
      case 'menu:new-fa':
        docStore.newDocument('fa');
        historyStore.clear();
        updateTitle();
        break;
      case 'menu:new-pda':
        docStore.newDocument('pda');
        historyStore.clear();
        updateTitle();
        break;
      case 'menu:new-tm':
        docStore.newDocument('turing');
        historyStore.clear();
        updateTitle();
        break;
      case 'menu:open':
        await handleOpen();
        break;
      case 'menu:save':
        try {
          const name = docStore.fileName ?? 'untitled.jff';
          await saveAutomaton(fileService, docStore.automaton, name);
          docStore.markSaved(name);
          updateTitle();
        } catch (err) {
          console.error('Failed to save:', err);
        }
        break;
      case 'menu:export-png': {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const pngName =
                (docStore.fileName ?? 'automaton').replace(/\.jff$/, '') + '.png';
              await fileService.exportImage(blob, pngName);
            }
          });
        }
        break;
      }
      case 'menu:undo':
        historyStore.undo();
        break;
      case 'menu:redo':
        historyStore.redo();
        break;
      case 'menu:home':
        docStore.goHome();
        break;
    }
  });

  updateTitle();
});

function updateTitle() {
  const name = docStore.fileName ?? 'untitled';
  const dirty = docStore.isDirty ? ' *' : '';
  document.title = `${name}${dirty} — Jauto`;
}
</script>

<template>
  <div class="app">
    <template v-if="docStore.currentView === 'home'">
      <HomePage @new="handleNew" @open="handleOpen" />
    </template>
    <template v-else>
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
