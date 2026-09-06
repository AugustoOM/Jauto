<script setup lang="ts">
import { computed, ref } from 'vue';
import { AddStateCommand, AddTransitionCommand, generateStateId, generateTransitionId } from '@jauto/core';
import { useDocumentStore } from '../stores/document';
import { useHistoryStore } from '../stores/history';

const document = useDocumentStore();
const history = useHistoryStore();
const fromId = ref('');
const toId = ref('');
const statusMessage = ref('');
const canAddTransition = computed(() => Boolean(fromId.value && toId.value));

function addState() {
  const index = document.automaton.states.length;
  const id = generateStateId(document.automaton.states);
  const state = {
    id,
    name: `q${index}`,
    x: 100 + (index % 5) * 120,
    y: 100 + Math.floor(index / 5) * 100,
    isInitial: index === 0,
    isFinal: false,
  };
  history.dispatch(new AddStateCommand(state));
  document.select({ type: 'state', id });
  statusMessage.value = `Added state ${state.name}. Use the inspector to edit it.`;
}

function addTransition() {
  if (!canAddTransition.value) return;
  const id = generateTransitionId(document.automaton.transitions);
  const common = { id, from: fromId.value, to: toId.value, read: '' };
  const transition = document.automaton.kind === 'pda'
    ? { ...common, pop: '', push: '' }
    : document.automaton.kind === 'turing'
      ? { ...common, write: '', move: 'R' as const }
      : common;
  history.dispatch(new AddTransitionCommand(transition));
  document.select({ type: 'transition', id });
  statusMessage.value = 'Added transition. Use the inspector to edit its symbols.';
}
</script>

<template>
  <details class="diagram-outline">
    <summary>Accessible diagram editor</summary>
    <div class="diagram-outline__content">
      <section aria-labelledby="states-heading">
        <div class="diagram-outline__heading">
          <h2 id="states-heading">States</h2>
          <button type="button" @click="addState">Add state</button>
        </div>
        <p v-if="!document.automaton.states.length">No states.</p>
        <table v-else>
          <thead><tr><th>Name</th><th>Role</th><th>Position</th><th>Action</th></tr></thead>
          <tbody>
            <tr v-for="state in document.automaton.states" :key="state.id">
              <td>{{ state.name }}</td>
              <td>{{ [state.isInitial ? 'initial' : '', state.isFinal ? 'final' : ''].filter(Boolean).join(', ') || 'regular' }}</td>
              <td>{{ Math.round(state.x) }}, {{ Math.round(state.y) }}</td>
              <td><button type="button" @click="document.select({ type: 'state', id: state.id })">Select {{ state.name }}</button></td>
            </tr>
          </tbody>
        </table>
      </section>
      <section aria-labelledby="transitions-heading">
        <div class="diagram-outline__heading"><h2 id="transitions-heading">Transitions</h2></div>
        <form class="diagram-outline__add-transition" @submit.prevent="addTransition">
          <label>From <select v-model="fromId"><option value="">Choose state</option><option v-for="state in document.automaton.states" :key="state.id" :value="state.id">{{ state.name }}</option></select></label>
          <label>To <select v-model="toId"><option value="">Choose state</option><option v-for="state in document.automaton.states" :key="state.id" :value="state.id">{{ state.name }}</option></select></label>
          <button type="submit" :disabled="!canAddTransition">Add transition</button>
        </form>
        <ul class="diagram-outline__transitions">
          <li v-for="transition in document.automaton.transitions" :key="transition.id">
            <button type="button" @click="document.select({ type: 'transition', id: transition.id })">
              {{ document.automaton.states.find((state) => state.id === transition.from)?.name }} to
              {{ document.automaton.states.find((state) => state.id === transition.to)?.name }}, read {{ transition.read || 'ε' }}
            </button>
          </li>
        </ul>
      </section>
      <p class="sr-only" role="status" aria-live="polite">{{ statusMessage }}</p>
    </div>
  </details>
</template>

<style scoped>
.diagram-outline { border-bottom: 1px solid var(--color-border); background: var(--color-bg-secondary); font-size: 12px; }
.diagram-outline > summary { padding: 7px 12px; cursor: pointer; font-weight: 600; }
.diagram-outline__content { display: grid; grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr); gap: 16px; max-height: 250px; padding: 4px 12px 12px; overflow: auto; }
.diagram-outline__heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.diagram-outline h2 { margin: 4px 0; font-size: 13px; }
.diagram-outline table { width: 100%; border-collapse: collapse; }
.diagram-outline th, .diagram-outline td { padding: 4px; border-bottom: 1px solid var(--color-border); text-align: left; }
.diagram-outline button, .diagram-outline select { min-height: 30px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); color: var(--color-text); }
.diagram-outline button { padding: 4px 8px; cursor: pointer; }
.diagram-outline button:focus-visible, .diagram-outline select:focus-visible, .diagram-outline > summary:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.diagram-outline__add-transition { display: flex; flex-wrap: wrap; align-items: end; gap: 8px; }
.diagram-outline__add-transition label { display: grid; gap: 3px; }
.diagram-outline__transitions { display: flex; flex-wrap: wrap; gap: 5px; padding: 6px 0; list-style: none; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 760px) { .diagram-outline__content { grid-template-columns: 1fr; } }
</style>
