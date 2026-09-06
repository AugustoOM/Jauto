<script setup lang="ts">
import { nextTick, ref } from 'vue';
import {
  ArrowLeft,
  exportDiagramPng,
  Pencil,
  Save,
  ThemeToggle,
  runProtectedDocumentAction,
  useDocumentStore,
  useHistoryStore,
  useSimulationStore,
} from '@jauto/ui';
import type { AutomatonKind } from '@jauto/core';
import { openAutomaton, saveAutomaton } from '@jauto/file-io';
import { DesktopFileService } from './DesktopFileService';

const docStore = useDocumentStore();
const historyStore = useHistoryStore();
const simStore = useSimulationStore();
const fileService = new DesktopFileService();
const openMenu = ref<string | null>(null);
const isRenaming = ref(false);
const renameCancelled = ref(false);
const renameInput = ref<HTMLInputElement | null>(null);
const renameValue = ref('');
const savingFile = ref(false);

function toggleMenu(menu: string) {
  openMenu.value = openMenu.value === menu ? null : menu;
}

function closeMenu() {
  openMenu.value = null;
}

async function saveForLifecycle(): Promise<boolean> {
  try {
    return await persistToDisk();
  } catch (err) {
    window.alert(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function goBack() {
  closeMenu();
  simStore.stop();
  docStore.goHome();
}

async function newDocument(kind: AutomatonKind) {
  closeMenu();
  docStore.flushInspectorEdits();
  await runProtectedDocumentAction({
    isDirty: docStore.isDirty,
    save: saveForLifecycle,
    action: () => {
      docStore.newDocument(kind);
      historyStore.clear();
      simStore.stop();
    },
  });
}

async function openFile() {
  closeMenu();
  docStore.flushInspectorEdits();
  await runProtectedDocumentAction({
    isDirty: docStore.isDirty,
    save: saveForLifecycle,
    action: async () => {
      try {
        const result = await openAutomaton(fileService);
        if (result) {
          docStore.loadAutomaton(result.automaton, result.fileName, result.warnings, result.filePath);
          historyStore.clear();
          simStore.stop();
        }
      } catch (err) {
        window.alert(`Failed to open: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  });
}

async function persistToDisk(saveAs = false): Promise<boolean> {
  docStore.flushInspectorEdits();
  const name = docStore.fileName ?? 'untitled.jff';
  const token = docStore.createRevisionToken();
  const result = await saveAutomaton(
    fileService,
    docStore.automaton,
    name,
    saveAs ? undefined : docStore.filePath ?? undefined,
  );
  if (result) docStore.markSaved(token, result.name, result.path);
  return result !== null;
}

async function saveFile() {
  closeMenu();
  try {
    await persistToDisk(true);
  } catch (err) {
    window.alert(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function onSaveClick() {
  if (savingFile.value) return;
  savingFile.value = true;
  try {
    await persistToDisk();
  } catch (err) {
    window.alert(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    savingFile.value = false;
  }
}

async function exportPNG() {
  closeMenu();
  try {
    const blob = await exportDiagramPng(docStore.automaton, { scale: 2, showGrid: false });
    const name = (docStore.fileName ?? 'automaton').replace(/\.jff$/, '') + '.png';
    await fileService.exportImage(blob, name);
  } catch (err) {
    window.alert(`Failed to export PNG: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function startRename() {
  closeMenu();
  const current = docStore.fileName ?? 'untitled.jff';
  renameValue.value = current.replace(/\.jff$/, '');
  renameCancelled.value = false;
  isRenaming.value = true;
  nextTick(() => {
    renameInput.value?.focus();
    renameInput.value?.select();
  });
}

function commitRename() {
  if (renameCancelled.value) return;
  const value = renameValue.value.trim();
  if (value) {
    docStore.rename(value);
  }
  isRenaming.value = false;
}

function cancelRename() {
  renameCancelled.value = true;
  isRenaming.value = false;
}

function onRenameKey(e: KeyboardEvent) {
  if (e.key === 'Enter') commitRename();
  if (e.key === 'Escape') cancelRename();
}
</script>

<template>
  <header class="app-header" @mouseleave="closeMenu">
    <button class="app-header__back" type="button" title="Back" @click="goBack">
      <ArrowLeft :size="16" />
    </button>
    <button class="app-header__brand" type="button" title="Back to Home" @click="goBack">
      <img src="/logo-small.png" alt="JAuto" class="app-header__brand-img" />
    </button>
    <nav class="app-header__nav">
      <div class="app-header__menu-group">
        <button class="app-header__nav-btn" type="button" @click="toggleMenu('file')">File</button>
        <div v-if="openMenu === 'file'" class="app-header__dropdown">
          <button class="app-header__dropdown-item" type="button" @click="newDocument('fa')">
            New DFA / NFA
          </button>
          <button class="app-header__dropdown-item" type="button" @click="newDocument('pda')">
            New PDA
          </button>
          <button class="app-header__dropdown-item" type="button" @click="newDocument('turing')">
            New Turing Machine
          </button>
          <div class="app-header__dropdown-sep" />
          <button class="app-header__dropdown-item" type="button" @click="openFile">
            Open .jff...
          </button>
          <button class="app-header__dropdown-item" type="button" @click="saveFile">
            Save as .jff
          </button>
          <button class="app-header__dropdown-item" type="button" @click="startRename">
            Rename...
          </button>
          <div class="app-header__dropdown-sep" />
          <button class="app-header__dropdown-item" type="button" @click="exportPNG">
            Export PNG
          </button>
        </div>
      </div>
    </nav>
    <div class="app-header__right">
      <button
        type="button"
        class="app-header__save"
        :disabled="savingFile || !docStore.isDirty"
        :title="docStore.isDirty ? 'Save .jff' : 'No unsaved changes'"
        @click="onSaveClick"
      >
        <Save :size="15" class="app-header__save-icon" />
        <span>{{ savingFile ? 'Saving...' : 'Save' }}</span>
      </button>
      <div class="app-header__file-label">
        <template v-if="isRenaming">
          <input
            ref="renameInput"
            v-model="renameValue"
            class="app-header__rename-input"
            @blur="commitRename"
            @keydown="onRenameKey"
          />
          <span class="app-header__rename-ext">.jff</span>
        </template>
        <template v-else>
          <span class="app-header__filename" title="Double-click to rename" @dblclick="startRename">
            {{ docStore.fileName ?? 'untitled.jff' }}{{ docStore.isDirty ? ' *' : '' }}
          </span>
          <button class="app-header__rename-btn" type="button" title="Rename" @click="startRename">
            <Pencil :size="12" />
          </button>
        </template>
      </div>
      <span class="app-header__kind">{{ docStore.automatonKind.toUpperCase() }}</span>
      <ThemeToggle />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 16px;
  background: var(--nav-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  user-select: none;
}

.app-header__back,
.app-header__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}

.app-header__back {
  width: 30px;
  height: 30px;
}

.app-header__brand {
  padding: 2px 4px;
}

.app-header__back:hover,
.app-header__brand:hover {
  background: var(--accent-glow);
  color: var(--color-text);
}

.app-header__brand-img {
  width: auto;
  height: 24px;
}

.app-header__nav {
  display: flex;
  gap: 2px;
}

.app-header__menu-group {
  position: relative;
}

.app-header__nav-btn {
  padding: 4px 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.app-header__nav-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.app-header__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  min-width: 200px;
  padding: 4px 0;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.app-header__dropdown-item {
  display: block;
  width: 100%;
  padding: 6px 14px;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.app-header__dropdown-item:hover {
  background: var(--color-primary);
  color: white;
}

.app-header__dropdown-sep {
  height: 1px;
  margin: 4px 0;
  background: var(--color-border);
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  font-size: 12px;
}

.app-header__save {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s, color 0.1s, opacity 0.1s;
}

.app-header__save:hover:not(:disabled) {
  background: var(--accent-glow);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.app-header__save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.app-header__save-icon {
  flex-shrink: 0;
}

.app-header__file-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-header__filename {
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: default;
  transition: background 0.1s;
}

.app-header__filename:hover {
  background: var(--color-border);
}

.app-header__rename-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}

.app-header__rename-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.app-header__rename-input {
  width: 140px;
  padding: 2px 6px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  outline: none;
  background: var(--color-bg);
  box-shadow: 0 0 0 2px var(--accent-glow-strong);
  color: var(--color-text);
  font-family: inherit;
  font-size: 12px;
}

.app-header__rename-ext {
  color: var(--color-text-muted);
  font-size: 12px;
}

.app-header__kind {
  padding: 2px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
}
</style>
