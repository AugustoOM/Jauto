<script setup lang="ts">
import { computed } from 'vue';
import { useDocumentStore } from '../stores/document';
import { useHistoryStore } from '../stores/history';
import { UpdateStateCommand, UpdateTransitionCommand } from '@jauto/core';
import type { AutomatonState, AnyTransition } from '@jauto/core';

const docStore = useDocumentStore();
const historyStore = useHistoryStore();

const selectedState = computed<AutomatonState | undefined>(() => {
  const sel = docStore.selectedElement;
  if (!sel || sel.type !== 'state') return undefined;
  return docStore.automaton.states.find((s) => s.id === sel.id);
});

const selectedTransition = computed<AnyTransition | undefined>(() => {
  const sel = docStore.selectedElement;
  if (!sel || sel.type !== 'transition') return undefined;
  return docStore.automaton.transitions.find((t) => t.id === sel.id);
});

function updateStateName(e: Event) {
  const state = selectedState.value;
  if (!state) return;
  const name = (e.target as HTMLInputElement).value;
  historyStore.dispatch(
    new UpdateStateCommand(state.id, { name: state.name }, { name }),
  );
}

function toggleInitial() {
  const state = selectedState.value;
  if (!state) return;
  historyStore.dispatch(
    new UpdateStateCommand(state.id, { isInitial: state.isInitial }, { isInitial: !state.isInitial }),
  );
}

function toggleFinal() {
  const state = selectedState.value;
  if (!state) return;
  historyStore.dispatch(
    new UpdateStateCommand(state.id, { isFinal: state.isFinal }, { isFinal: !state.isFinal }),
  );
}

function updateTransitionField(field: string, value: string) {
  const trans = selectedTransition.value;
  if (!trans) return;
  const oldProps = { [field]: (trans as unknown as Record<string, unknown>)[field] };
  const newProps = { [field]: value };
  historyStore.dispatch(new UpdateTransitionCommand(trans.id, oldProps, newProps));
}

const transitionFields = computed(() => {
  const t = selectedTransition.value;
  if (!t) return [];
  const fields: { key: string; label: string; value: string }[] = [
    { key: 'read', label: 'Read', value: t.read },
  ];
  if ('pop' in t && 'push' in t) {
    fields.push({ key: 'pop', label: 'Pop', value: t.pop });
    fields.push({ key: 'push', label: 'Push', value: t.push });
  }
  if ('write' in t && 'move' in t) {
    fields.push({ key: 'write', label: 'Write', value: t.write });
    fields.push({ key: 'move', label: 'Move', value: t.move });
  }
  return fields;
});
</script>

<template>
  <aside class="inspector">
    <div v-if="selectedState" class="inspector__section">
      <h3 class="inspector__title">State</h3>
      <label class="inspector__field">
        <span class="inspector__label">Name</span>
        <input
          class="inspector__input"
          :value="selectedState.name"
          @change="updateStateName"
        />
      </label>
      <label class="inspector__field inspector__field--row">
        <input
          type="checkbox"
          :checked="selectedState.isInitial"
          @change="toggleInitial"
        />
        <span>Initial</span>
      </label>
      <label class="inspector__field inspector__field--row">
        <input
          type="checkbox"
          :checked="selectedState.isFinal"
          @change="toggleFinal"
        />
        <span>Final (Accepting)</span>
      </label>
      <div class="inspector__coords">
        x: {{ Math.round(selectedState.x) }}, y: {{ Math.round(selectedState.y) }}
      </div>
    </div>

    <div v-else-if="selectedTransition" class="inspector__section">
      <h3 class="inspector__title">Transition</h3>
      <div class="inspector__meta">
        {{ selectedTransition.from }} → {{ selectedTransition.to }}
      </div>
      <label
        v-for="field in transitionFields"
        :key="field.key"
        class="inspector__field"
      >
        <span class="inspector__label">{{ field.label }}</span>
        <input
          class="inspector__input"
          :value="field.value"
          @change="(e) => updateTransitionField(field.key, (e.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <div v-else class="inspector__empty">
      <p>Select a state or transition to inspect its properties.</p>
    </div>
  </aside>
</template>

<style scoped>
.inspector {
  width: 260px;
  padding: 16px;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
  flex-shrink: 0;
}

.inspector__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}

.inspector__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inspector__field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.inspector__field--row {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.inspector__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.inspector__input {
  padding: 5px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
  font-family: var(--font-mono);
}

.inspector__input:focus {
  outline: none;
  border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--accent-glow-strong);
}

.inspector__meta {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  margin-bottom: 4px;
}

.inspector__coords {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.inspector__empty {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.5;
}
</style>
