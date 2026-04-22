<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Check } from 'lucide-vue-next';
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

const transitionStateNames = computed(() => {
  const t = selectedTransition.value;
  if (!t) return null;
  const fromState = docStore.automaton.states.find((s) => s.id === t.from);
  const toState = docStore.automaton.states.find((s) => s.id === t.to);
  return {
    from: fromState?.name ?? t.from,
    to: toState?.name ?? t.to,
  };
});

/** Local inspector copy; committed to the automaton with "Apply changes". */
const stateDraft = ref<{
  id: string;
  name: string;
  isInitial: boolean;
  isFinal: boolean;
} | null>(null);

const transitionDraft = ref<Record<string, string> | null>(null);

watch(
  () => selectedState.value,
  (s) => {
    if (!s) {
      stateDraft.value = null;
      return;
    }
    stateDraft.value = {
      id: s.id,
      name: s.name,
      isInitial: s.isInitial,
      isFinal: s.isFinal,
    };
  },
  { immediate: true },
);

watch(
  () => selectedTransition.value,
  (t) => {
    if (!t) {
      transitionDraft.value = null;
      return;
    }
    const d: Record<string, string> = { read: t.read };
    if ('pop' in t && 'push' in t) {
      d.pop = t.pop;
      d.push = t.push;
    }
    if ('write' in t && 'move' in t) {
      d.write = t.write;
      d.move = t.move;
    }
    transitionDraft.value = d;
  },
  { immediate: true },
);

const hasPendingStateEdits = computed(() => {
  const state = selectedState.value;
  const draft = stateDraft.value;
  if (!state || !draft || draft.id !== state.id) return false;
  return (
    draft.name !== state.name ||
    draft.isInitial !== state.isInitial ||
    draft.isFinal !== state.isFinal
  );
});

const hasPendingTransitionEdits = computed(() => {
  const t = selectedTransition.value;
  const d = transitionDraft.value;
  if (!t || !d) return false;
  for (const [key, value] of Object.entries(d)) {
    const cur = (t as unknown as Record<string, string>)[key];
    if (cur !== value) return true;
  }
  return false;
});

const showApply = computed(
  () =>
    (selectedState.value && stateDraft.value) ||
    (selectedTransition.value && transitionDraft.value),
);

const canApply = computed(() => hasPendingStateEdits.value || hasPendingTransitionEdits.value);

function applyStateEdits() {
  const state = selectedState.value;
  const draft = stateDraft.value;
  if (!state || !draft || draft.id !== state.id) return;

  const oldProps: Record<string, unknown> = {};
  const newProps: Record<string, unknown> = {};
  if (draft.name !== state.name) {
    oldProps.name = state.name;
    newProps.name = draft.name;
  }
  if (draft.isInitial !== state.isInitial) {
    oldProps.isInitial = state.isInitial;
    newProps.isInitial = draft.isInitial;
  }
  if (draft.isFinal !== state.isFinal) {
    oldProps.isFinal = state.isFinal;
    newProps.isFinal = draft.isFinal;
  }
  if (Object.keys(newProps).length === 0) return;
  historyStore.dispatch(
    new UpdateStateCommand(
      state.id,
      oldProps as Partial<Omit<AutomatonState, 'id'>>,
      newProps as Partial<Omit<AutomatonState, 'id'>>,
    ),
  );
}

function applyTransitionEdits() {
  const t = selectedTransition.value;
  const draft = transitionDraft.value;
  if (!t || !draft) return;

  const oldProps: Partial<Omit<AnyTransition, 'id'>> = {};
  const newProps: Partial<Omit<AnyTransition, 'id'>> = {};
  const tRec = t as unknown as Record<string, string>;
  for (const [key, value] of Object.entries(draft)) {
    if (tRec[key] !== value) {
      (oldProps as Record<string, unknown>)[key] = tRec[key];
      (newProps as Record<string, unknown>)[key] = value;
    }
  }
  if (Object.keys(newProps).length === 0) return;
  historyStore.dispatch(new UpdateTransitionCommand(t.id, oldProps, newProps));
}

function applyChanges() {
  if (hasPendingStateEdits.value) applyStateEdits();
  else if (hasPendingTransitionEdits.value) applyTransitionEdits();
}

const transitionFields = computed(() => {
  const t = selectedTransition.value;
  if (!t) return [];
  const fields: { key: string; label: string }[] = [{ key: 'read', label: 'Read' }];
  if ('pop' in t && 'push' in t) {
    fields.push({ key: 'pop', label: 'Pop' });
    fields.push({ key: 'push', label: 'Push' });
  }
  if ('write' in t && 'move' in t) {
    fields.push({ key: 'write', label: 'Write' });
    fields.push({ key: 'move', label: 'Move' });
  }
  return fields;
});
</script>

<template>
  <aside class="inspector">
    <div v-if="selectedState && stateDraft" class="inspector__section">
      <h3 class="inspector__title">State</h3>
      <label class="inspector__field">
        <span class="inspector__label">Name</span>
        <input v-model="stateDraft.name" class="inspector__input" />
      </label>
      <label class="inspector__field inspector__field--row">
        <input v-model="stateDraft.isInitial" type="checkbox" />
        <span>Initial</span>
      </label>
      <label class="inspector__field inspector__field--row">
        <input v-model="stateDraft.isFinal" type="checkbox" />
        <span>Final (Accepting)</span>
      </label>
      <div class="inspector__coords">
        x: {{ Math.round(selectedState.x) }}, y: {{ Math.round(selectedState.y) }}
      </div>
    </div>

    <div v-else-if="selectedTransition && transitionDraft" class="inspector__section">
      <h3 class="inspector__title">Transition</h3>
      <div class="inspector__meta">
        {{ transitionStateNames?.from }} → {{ transitionStateNames?.to }}
      </div>
      <label v-for="field in transitionFields" :key="field.key" class="inspector__field">
        <span class="inspector__label">{{ field.label }}</span>
        <input v-model="transitionDraft[field.key]" class="inspector__input" />
      </label>
    </div>

    <div v-else class="inspector__empty">
      <p>Select a state or transition to inspect its properties.</p>
    </div>

    <div v-if="showApply" class="inspector__actions">
      <button
        type="button"
        class="inspector__apply"
        :disabled="!canApply"
        :title="
          canApply ? 'Write inspector values to the automaton on the canvas' : 'No pending edits'
        "
        @click="applyChanges"
      >
        <Check :size="14" class="inspector__apply-icon" />
        <span>Apply changes</span>
      </button>
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

.inspector__actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.inspector__apply {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
}

.inspector__apply:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.inspector__apply:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.inspector__apply-icon {
  flex-shrink: 0;
}
</style>
