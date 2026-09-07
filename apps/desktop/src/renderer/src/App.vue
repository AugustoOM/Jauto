<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, watch } from 'vue';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  HomePage,
  EditorView,
  createBeforeUnloadHandler,
  saveDocumentKey,
  runProtectedDocumentAction,
  useApplicationCommands,
  useDocumentStore,
} from '@jauto/ui';
import type { AutomatonKind } from '@jauto/core';
import DesktopAppHeader from './DesktopAppHeader.vue';
import { DesktopFileService } from './DesktopFileService';

const docStore = useDocumentStore();
const fileService = new DesktopFileService();
const commands = useApplicationCommands(fileService, (message) => window.alert(message));
let unlistenMenu: (() => void) | null = null;
let unlistenClose: (() => void) | null = null;
let closeApproved = false;
docStore.restoreRecoveryDraft();
const beforeUnload = createBeforeUnloadHandler(() => docStore.isDirty);
window.addEventListener('beforeunload', beforeUnload);
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload);
  unlistenMenu?.();
  unlistenClose?.();
});

async function saveCurrentDocument(): Promise<boolean> {
  const result = await commands.saveDocument(false);
  if (result) updateTitle();
  return result;
}

provide(saveDocumentKey, saveCurrentDocument);

async function handleNew(kind: AutomatonKind) {
  if (await commands.newDocument(kind)) updateTitle();
}

async function handleOpen() {
  if (await commands.openDocument()) updateTitle();
}

onMounted(async () => {
  unlistenMenu = await listen<string>('menu-command', async (event) => {
    const command = event.payload;
    await commands.handleMenuCommand(command);
  });

  const nativeWindow = getCurrentWindow();
  unlistenClose = await nativeWindow.onCloseRequested(async (event) => {
    if (closeApproved || !docStore.isDirty) return;
    event.preventDefault();
    await runProtectedDocumentAction({
      isDirty: true,
      save: saveCurrentDocument,
      action: async () => {
        closeApproved = true;
        await nativeWindow.close();
      },
    });
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
