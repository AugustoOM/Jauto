<script setup lang="ts">
import { useDocumentStore, type EditorTool } from '../stores/document';
import { useHistoryStore } from '../stores/history';

const docStore = useDocumentStore();
const historyStore = useHistoryStore();

const tools: { id: EditorTool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '⊹' },
  { id: 'add-state', label: 'Add State', icon: '◯' },
  { id: 'add-transition', label: 'Add Transition', icon: '→' },
  { id: 'delete', label: 'Delete', icon: '✕' },
];

function selectTool(tool: EditorTool) {
  docStore.setTool(tool);
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__tools">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="toolbar__btn"
        :class="{ 'toolbar__btn--active': docStore.activeTool === tool.id }"
        :title="tool.label"
        @click="selectTool(tool.id)"
      >
        <span class="toolbar__icon">{{ tool.icon }}</span>
        <span class="toolbar__label">{{ tool.label }}</span>
      </button>
    </div>
    <div class="toolbar__separator" />
    <div class="toolbar__actions">
      <button
        class="toolbar__btn"
        :disabled="!historyStore.canUndo"
        title="Undo"
        @click="historyStore.undo()"
      >
        <span class="toolbar__icon">↩</span>
        <span class="toolbar__label">Undo</span>
      </button>
      <button
        class="toolbar__btn"
        :disabled="!historyStore.canRedo"
        title="Redo"
        @click="historyStore.redo()"
      >
        <span class="toolbar__icon">↪</span>
        <span class="toolbar__label">Redo</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.toolbar__tools,
.toolbar__actions {
  display: flex;
  gap: 2px;
}

.toolbar__separator {
  width: 1px;
  height: 24px;
  background: var(--color-border);
  margin: 0 4px;
}

.toolbar__btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s, color 0.1s;
}

.toolbar__btn:hover:not(:disabled) {
  background: var(--color-border);
  color: var(--color-text);
}

.toolbar__btn--active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.toolbar__btn--active:hover {
  background: var(--color-primary-hover);
  color: white;
}

.toolbar__btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.toolbar__icon {
  font-size: 14px;
  line-height: 1;
}

.toolbar__label {
  line-height: 1;
}
</style>
