<script setup lang="ts">
import { computed, type Component } from 'vue';
import { MousePointer2, Circle, MoveRight, Trash2, Undo2, Redo2 } from 'lucide-vue-next';
import { useDocumentStore, type EditorTool } from '../stores/document';
import { useHistoryStore } from '../stores/history';

const docStore = useDocumentStore();
const historyStore = useHistoryStore();

const tools: { id: EditorTool; label: string; shortcut: string; icon: Component }[] = [
  { id: 'select', label: 'Select', shortcut: 'Click', icon: MousePointer2 },
  { id: 'add-state', label: 'Add State', shortcut: 'Right Click', icon: Circle },
  { id: 'add-transition', label: 'Add Transition', shortcut: 'Shift + Click', icon: MoveRight },
  { id: 'delete', label: 'Delete', shortcut: 'Ctrl + Right Click', icon: Trash2 },
];

const modifierTool = computed<EditorTool | null>(() => {
  if (docStore.heldModifier === 'shift') return 'add-transition';
  if (docStore.heldModifier === 'ctrl') return 'delete';
  return null;
});

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
        :class="{
          'toolbar__btn--active': docStore.activeTool === tool.id,
          'toolbar__btn--modifier': modifierTool === tool.id,
        }"
        :title="`${tool.label} (${tool.shortcut})`"
        @click="selectTool(tool.id)"
      >
        <component :is="tool.icon" :size="14" class="toolbar__icon" />
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
        <Undo2 :size="14" class="toolbar__icon" />
        <span class="toolbar__label">Undo</span>
      </button>
      <button
        class="toolbar__btn"
        :disabled="!historyStore.canRedo"
        title="Redo"
        @click="historyStore.redo()"
      >
        <Redo2 :size="14" class="toolbar__icon" />
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

.toolbar__btn--modifier {
  background: var(--accent-glow);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.toolbar__btn--modifier:hover {
  background: var(--accent-glow-strong);
  color: var(--color-primary);
}

.toolbar__btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.toolbar__icon {
  flex-shrink: 0;
}

.toolbar__label {
  line-height: 1;
}
</style>
