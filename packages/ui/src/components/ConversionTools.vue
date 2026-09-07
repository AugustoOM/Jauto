<script setup lang="ts">
import { ref } from 'vue';
import {
  ReplaceAutomatonCommand,
  determinize,
  finiteAutomatonToRegularExpression,
  minimizeDFA,
  regularExpressionToNFA,
} from '@jauto/core';
import { useDocumentStore } from '../stores/document';
import { useHistoryStore } from '../stores/history';

const document = useDocumentStore();
const history = useHistoryStore();
const open = ref(false);
const expression = ref('a*b(a+b)');
const result = ref('');
const error = ref('');

function apply(label: string, operation: () => ReturnType<typeof determinize>) {
  try {
    error.value = '';
    document.flushInspectorEdits();
    history.dispatch(new ReplaceAutomatonCommand(label, operation()));
    document.clearSelection();
    open.value = false;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
  }
}

function showExpression() {
  try {
    error.value = '';
    if (document.automaton.kind !== 'fa')
      throw new Error('FA-to-RE conversion requires a finite automaton');
    result.value = finiteAutomatonToRegularExpression(document.automaton);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
  }
}

function currentFA() {
  if (document.automaton.kind !== 'fa') throw new Error('Finite automaton required');
  return document.automaton;
}
</script>

<template>
  <button
    type="button"
    class="conversion-trigger"
    :disabled="document.automaton.kind !== 'fa'"
    @click="open = true"
  >
    Conversions
  </button>
  <div v-if="open" class="conversion-backdrop" @click.self="open = false">
    <section
      class="conversion-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversion-title"
    >
      <div class="conversion-heading">
        <h2 id="conversion-title">Finite automata conversions</h2>
        <button type="button" @click="open = false">Close</button>
      </div>
      <div class="conversion-actions">
        <button type="button" @click="apply('Convert NFA to DFA', () => determinize(currentFA()))">
          Convert to DFA
        </button>
        <button type="button" @click="apply('Minimize DFA', () => minimizeDFA(currentFA()))">
          Minimize DFA
        </button>
        <button type="button" @click="showExpression">Convert FA to expression</button>
      </div>
      <label>JFLAP regular expression <input v-model="expression" /></label>
      <button
        type="button"
        @click="apply('Convert expression to NFA', () => regularExpressionToNFA(expression))"
      >
        Create NFA from expression
      </button>
      <label v-if="result">Equivalent expression <textarea :value="result" readonly /></label>
      <p v-if="error" class="conversion-error" role="alert">{{ error }}</p>
    </section>
  </div>
</template>

<style scoped>
.conversion-trigger,
.conversion-dialog button,
.conversion-dialog input,
.conversion-dialog textarea {
  min-height: 30px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
}
.conversion-trigger,
.conversion-dialog button {
  padding: 5px 10px;
  cursor: pointer;
}
.conversion-trigger:disabled {
  opacity: 0.4;
  cursor: default;
}
.conversion-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 55%);
}
.conversion-dialog {
  width: min(560px, 100%);
  display: grid;
  gap: 14px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: 0 20px 60px rgb(0 0 0 / 35%);
}
.conversion-heading,
.conversion-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.conversion-heading h2 {
  margin: 0;
  font-size: 18px;
}
.conversion-dialog label {
  display: grid;
  gap: 5px;
  font-size: 12px;
}
.conversion-dialog input,
.conversion-dialog textarea {
  padding: 8px;
  font-family: var(--font-mono);
}
.conversion-dialog textarea {
  min-height: 90px;
  resize: vertical;
}
.conversion-error {
  margin: 0;
  color: var(--color-danger);
}
</style>
