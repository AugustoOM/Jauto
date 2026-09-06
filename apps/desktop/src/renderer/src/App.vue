<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, watch } from 'vue';
import { listen } from '@tauri-apps/api/event';
import {
  HomePage,
  EditorView,
  createBeforeUnloadHandler,
  runProtectedDocumentAction,
  saveDocumentKey,
  useDocumentStore,
  useHistoryStore,
  useSimulationStore,
} from '@jauto/ui';
import type { AutomatonKind } from '@jauto/core';
import { openAutomaton, saveAutomaton } from '@jauto/file-io';
import DesktopAppHeader from './DesktopAppHeader.vue';
import { DesktopFileService } from './DesktopFileService';

const docStore = useDocumentStore();
const historyStore = useHistoryStore();
const simStore = useSimulationStore();
const fileService = new DesktopFileService();
docStore.restoreRecoveryDraft();
const beforeUnload = createBeforeUnloadHandler(() => docStore.isDirty);
window.addEventListener('beforeunload', beforeUnload);
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));

async function saveCurrentDocument(): Promise<boolean> {
  try {
    const name = docStore.fileName ?? 'untitled.jff';
    const token = docStore.createRevisionToken();
    const result = await saveAutomaton(fileService, docStore.automaton, name, docStore.filePath ?? undefined);
    if (result) {
      docStore.markSaved(token, result.name, result.path);
      updateTitle();
    }
    return result !== null;
  } catch (err) {
    window.alert(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

provide(saveDocumentKey, saveCurrentDocument);

async function replaceDocument(action: () => void | Promise<void>) {
  return runProtectedDocumentAction({ isDirty: docStore.isDirty, save: saveCurrentDocument, action });
}

async function handleNew(kind: AutomatonKind) {
  await replaceDocument(() => {
    docStore.newDocument(kind);
    historyStore.clear();
    simStore.stop();
    updateTitle();
  });
}

async function handleOpen() {
  await replaceDocument(async () => {
    try {
      const result = await openAutomaton(fileService);
      if (result) {
        docStore.loadAutomaton(result.automaton, result.fileName, result.warnings, result.filePath);
        historyStore.clear();
        simStore.stop();
        updateTitle();
      }
    } catch (err) {
      window.alert(`Failed to open: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}

onMounted(() => {
  void listen<string>('menu-command', async (event) => {
    const command = event.payload;

    switch (command) {
      case 'menu:new-fa':
        await handleNew('fa');
        break;
      case 'menu:new-pda':
        await handleNew('pda');
        break;
      case 'menu:new-tm':
        await handleNew('turing');
        break;
      case 'menu:open':
        await handleOpen();
        break;
      case 'menu:save':
        await saveCurrentDocument();
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
        simStore.stop();
        docStore.goHome();
        break;
    }
  });

  updateTitle();
});

watch(
  () => [docStore.fileName, docStore.isDirty, docStore.currentView],
  () => updateTitle(),
);

function updateTitle() {
  const name = docStore.fileName ?? 'untitled';
  const dirty = docStore.isDirty ? ' *' : '';
  document.title = `${name}${dirty} — Jauto`;
}
</script>

<template>
  <div class="app">
    <template v-if="docStore.currentView === 'home'">
      <HomePage :can-resume="docStore.canResume" @new="handleNew" @open="handleOpen" @resume="docStore.resume" />
    </template>
    <template v-else>
      <DesktopAppHeader />
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
