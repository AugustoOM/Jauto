<script setup lang="ts">
import { computed, inject, ref, type Component } from 'vue';
import { MousePointer2, Circle, MoveRight, Trash2, Undo2, Redo2, Save } from '@lucide/vue';
import { useDocumentStore, type EditorTool } from '../stores/document';
import { useHistoryStore } from '../stores/history';
import { saveDocumentKey } from '../injectionKeys';

const docStore = useDocumentStore();
const historyStore = useHistoryStore();
const saveDocument = inject(saveDocumentKey, null);
const saving = ref(false);

async function onSaveFile() {
  if (!saveDocument) return;
  saving.value = true;
  try {
    await saveDocument();
  } finally {
    saving.value = false;
  }
}

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
  <div class="toolbar" role="toolbar" aria-label="Automaton editor tools">
    <div class="toolbar__tools" role="group" aria-label="Editing tools">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="toolbar__btn"
        :class="{
          'toolbar__btn--active': docStore.activeTool === tool.id,
          'toolbar__btn--modifier': modifierTool === tool.id,
        }"
        :title="`${tool.label} (${tool.shortcut})`"
        :aria-pressed="docStore.activeTool === tool.id"
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
      <template v-if="saveDocument">
        <div class="toolbar__separator" />
        <button
          type="button"
          class="toolbar__btn toolbar__btn--save"
          :disabled="saving || !docStore.isDirty"
          :title="docStore.isDirty ? 'Save .jff (Ctrl+S)' : 'No unsaved changes'"
          @click="onSaveFile"
        >
          <Save :size="14" class="toolbar__icon" />
          <span class="toolbar__label">{{ saving ? 'Saving…' : 'Save' }}</span>
        </button>
      </template>
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
  flex-wrap: wrap;
}

.toolbar__btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }

@media (max-width: 620px) {
  .toolbar { align-items: stretch; overflow-x: auto; }
  .toolbar__tools, .toolbar__actions { flex-wrap: wrap; }
  .toolbar__label { font-size: 11px; }
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

.toolbar__btn--save:not(:disabled) {
  color: var(--color-text);
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
}

.toolbar__btn--save:not(:disabled):hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--accent-glow);
}

.toolbar__icon {
  flex-shrink: 0;
}

.toolbar__label {
  line-height: 1;
}
</style>
