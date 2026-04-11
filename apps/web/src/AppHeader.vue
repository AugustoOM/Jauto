<script setup lang="ts">
import { ref } from 'vue';
import { useDocumentStore } from '@jauto/ui';
import type { AutomatonKind } from '@jauto/core';
import { WebFileService, openAutomaton, saveAutomaton } from '@jauto/file-io';

const docStore = useDocumentStore();
const fileService = new WebFileService();
const openMenu = ref<string | null>(null);
const theme = ref<'light' | 'dark'>('light');

function toggleMenu(menu: string) {
  openMenu.value = openMenu.value === menu ? null : menu;
}

function closeMenu() {
  openMenu.value = null;
}

async function newDocument(kind: AutomatonKind) {
  docStore.newDocument(kind);
  closeMenu();
}

async function openFile() {
  closeMenu();
  try {
    const result = await openAutomaton(fileService);
    if (result) {
      docStore.loadAutomaton(result.automaton, result.fileName);
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

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme.value);
  closeMenu();
}
</script>

<template>
  <header class="app-header" @mouseleave="closeMenu">
    <div class="app-header__brand">Jauto</div>
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
          <div class="app-header__dropdown-sep" />
          <button class="app-header__dropdown-item" @click="exportPNG">Export PNG</button>
        </div>
      </div>

      <div class="app-header__menu-group">
        <button class="app-header__nav-btn" @click="toggleMenu('view')">View</button>
        <div v-if="openMenu === 'view'" class="app-header__dropdown">
          <button class="app-header__dropdown-item" @click="toggleTheme">
            {{ theme === 'light' ? 'Dark Mode' : 'Light Mode' }}
          </button>
        </div>
      </div>
    </nav>
    <div class="app-header__file-info">
      <span v-if="docStore.fileName" class="app-header__filename">
        {{ docStore.fileName }}{{ docStore.isDirty ? ' *' : '' }}
      </span>
      <span v-else class="app-header__filename">
        untitled{{ docStore.isDirty ? ' *' : '' }}
      </span>
      <span class="app-header__kind">{{ docStore.automatonKind.toUpperCase() }}</span>
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
  font-weight: 700;
  font-size: 15px;
  color: var(--color-primary);
  letter-spacing: -0.02em;
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

.app-header__file-info {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.app-header__filename {
  color: var(--color-text-secondary);
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
