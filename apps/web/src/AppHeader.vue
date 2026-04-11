<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { Pencil } from 'lucide-vue-next';
import { useDocumentStore, useHistoryStore, useSimulationStore, ThemeToggle } from '@jauto/ui';
import type { AutomatonKind } from '@jauto/core';
import { WebFileService, openAutomaton, saveAutomaton } from '@jauto/file-io';

const docStore = useDocumentStore();
const historyStore = useHistoryStore();
const simStore = useSimulationStore();
const fileService = new WebFileService();
const openMenu = ref<string | null>(null);
const isRenaming = ref(false);
const renameCancelled = ref(false);
const renameInput = ref<HTMLInputElement | null>(null);
const renameValue = ref('');

function toggleMenu(menu: string) {
  openMenu.value = openMenu.value === menu ? null : menu;
}

function closeMenu() {
  openMenu.value = null;
}

function goHome() {
  closeMenu();
  simStore.stop();
  docStore.goHome();
}

async function newDocument(kind: AutomatonKind) {
  docStore.newDocument(kind);
  historyStore.clear();
  simStore.stop();
  closeMenu();
}

async function openFile() {
  closeMenu();
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

async function saveFile() {
  closeMenu();
  const name = docStore.fileName ?? 'untitled.jff';
  try {
    await saveAutomaton(fileService, docStore.automaton, name);
    docStore.markSaved(name);
  } catch (err) {
    alert(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function exportPNG() {
  closeMenu();
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  canvas.toBlob(async (blob) => {
    if (blob) {
      const name = (docStore.fileName ?? 'automaton').replace(/\.jff$/, '') + '.png';
      await fileService.exportImage(blob, name);
    }
  });
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
  const val = renameValue.value.trim();
  if (val) {
    docStore.rename(val);
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
    <button class="app-header__brand" @click="goHome" title="Back to Home">
      <img src="/logo-small.png" alt="JAuto" class="app-header__brand-img" />
    </button>
    <nav class="app-header__nav">
      <div class="app-header__menu-group">
        <button class="app-header__nav-btn" @click="toggleMenu('file')">File</button>
        <div v-if="openMenu === 'file'" class="app-header__dropdown">
          <button class="app-header__dropdown-item" @click="newDocument('fa')">New DFA / NFA</button>
          <button class="app-header__dropdown-item" @click="newDocument('pda')">New PDA</button>
          <button class="app-header__dropdown-item" @click="newDocument('turing')">New Turing Machine</button>
          <div class="app-header__dropdown-sep" />
          <button class="app-header__dropdown-item" @click="openFile">Open .jff...</button>
          <button class="app-header__dropdown-item" @click="saveFile">Save as .jff</button>
          <button class="app-header__dropdown-item" @click="startRename">Rename...</button>
          <div class="app-header__dropdown-sep" />
          <button class="app-header__dropdown-item" @click="exportPNG">Export PNG</button>
        </div>
      </div>
    </nav>
    <div class="app-header__right">
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
          <span class="app-header__filename" @dblclick="startRename" title="Double-click to rename">
            {{ docStore.fileName ?? 'untitled.jff' }}{{ docStore.isDirty ? ' *' : '' }}
          </span>
          <button class="app-header__rename-btn" @click="startRename" title="Rename">
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
  gap: 16px;
  padding: 0 16px;
  height: 40px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  user-select: none;
}

.app-header__brand {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  transition: background 0.1s;
}

.app-header__brand:hover {
  background: rgba(66, 99, 235, 0.1);
}

.app-header__brand-img {
  height: 24px;
  width: auto;
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
  font-size: 13px;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: none;
  background: transparent;
}

.app-header__nav-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.app-header__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  padding: 4px 0;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 100;
}

.app-header__dropdown-item {
  display: block;
  width: 100%;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--color-text);
  text-align: left;
  border: none;
  background: transparent;
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
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.app-header__file-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-header__filename {
  color: var(--color-text-secondary);
  cursor: default;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
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
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 12px;
  font-family: inherit;
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 99, 235, 0.2);
}

.app-header__rename-ext {
  font-size: 12px;
  color: var(--color-text-muted);
}

.app-header__kind {
  padding: 2px 6px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
}
</style>
