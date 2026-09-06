<script setup lang="ts">
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Square, Zap } from '@lucide/vue';
import { useDocumentStore } from '../stores/document';
import { useSimulationStore } from '../stores/simulation';

const docStore = useDocumentStore();
const sim = useSimulationStore();

function handleStart() {
  docStore.flushInspectorEdits();
  sim.start(docStore.automaton);
}

function handlePlay() {
  sim.play(docStore.automaton);
}

function handleReset() {
  sim.reset(docStore.automaton);
}

function handleNextStep() {
  sim.nextStep(docStore.automaton);
}

function stateText(config: Record<string, unknown>): string {
  if (typeof config.currentState === 'string') return config.currentState;
  if (config.activeStates instanceof Set) return [...config.activeStates].join(', ');
  return '—';
}

function consumedText(config: Record<string, unknown>): string {
  return sim.input.slice(0, Number(config.inputIndex) || 0) || 'ε';
}

function remainingText(config: Record<string, unknown>): string {
  return typeof config.remainingInput === 'string' ? config.remainingInput || 'ε' : '—';
}
</script>

<template>
  <div class="sim-controls">
    <div class="sim-controls__input-row">
      <label class="sim-controls__label">Input</label>
      <input
        v-model="sim.input"
        class="sim-controls__input"
        placeholder="Enter input string..."
        :disabled="sim.isActive"
      />
    </div>
    <div class="sim-controls__buttons">
      <button
        v-if="!sim.isActive"
        class="sim-controls__btn sim-controls__btn--primary"
        @click="handleStart"
      >
        <Zap :size="13" /> Start
      </button>
      <template v-else>
        <button
          v-if="!sim.isRunning"
          class="sim-controls__btn"
          :disabled="!sim.canGoPrevious"
          @click="sim.previousStep()"
        >
          <SkipBack :size="13" /> Previous
        </button>
        <button
          v-if="!sim.isRunning"
          class="sim-controls__btn"
          :disabled="!sim.canGoNext"
          @click="handleNextStep"
        >
          <SkipForward :size="13" /> Next
        </button>
        <button
          v-if="!sim.isRunning"
          class="sim-controls__btn sim-controls__btn--primary"
          :disabled="sim.status !== 'running'"
          @click="handlePlay"
        >
          <Play :size="13" /> Play
        </button>
        <button
          v-if="sim.isRunning"
          class="sim-controls__btn"
          @click="sim.pause()"
        >
          <Pause :size="13" /> Pause
        </button>
        <button class="sim-controls__btn" @click="handleReset">
          <RotateCcw :size="13" /> Reset
        </button>
        <button class="sim-controls__btn" @click="sim.stop()">
          <Square :size="13" /> Stop
        </button>
      </template>
    </div>
    <div v-if="sim.isActive" class="sim-controls__status">
      <span class="sim-controls__step">Step {{ sim.stepIndex }}</span>
      <span v-if="sim.transitionHighlights.length" class="sim-controls__detail">
        {{ sim.transitionHighlights.map((transition) => `${transition.transitionId}: ${transition.label}`).join(' | ') }}
      </span>
      <span
        class="sim-controls__result"
        :class="{
          'sim-controls__result--accepted': sim.status === 'accepted',
          'sim-controls__result--rejected': sim.status !== 'running' && sim.status !== 'accepted',
        }"
      >
        {{ sim.status === 'running' ? 'Running...' :
           sim.status === 'accepted' ? 'Accepted' :
           sim.status === 'halted' ? 'Halted' :
           sim.status === 'invalid' ? 'Invalid machine' :
           sim.status === 'incomplete' ? 'Incomplete' :
           sim.status === 'canceled' ? 'Canceled' : 'Rejected' }}
      </span>
      <span v-if="sim.errorMessage" class="sim-controls__detail">{{ sim.errorMessage }}</span>
    </div>
    <div v-if="sim.isActive && sim.activeConfigurations.length" class="sim-controls__trace" aria-live="polite">
      <div class="sim-controls__trace-title">
        Active configurations ({{ sim.activeConfigurations.length }})
        <span v-if="sim.activeTraceIndex < sim.executionIndex">
          · replay {{ sim.activeTraceIndex }}/{{ sim.executionIndex }}
        </span>
      </div>
      <div class="sim-controls__branches">
        <div v-for="branch in sim.activeConfigurations" :key="branch.id" class="sim-controls__branch">
          <strong>{{ branch.id }}</strong>
          <span>state {{ stateText(branch.config) }}</span>
          <span v-if="'inputIndex' in branch.config">consumed {{ consumedText(branch.config) }} · remaining {{ remainingText(branch.config) }}</span>
          <span v-if="Array.isArray(branch.config.stack)">stack [{{ branch.config.stack.join(', ') }}]</span>
          <span v-if="Array.isArray(branch.config.tape)" class="sim-controls__tape">
            tape
            <template v-for="(symbol, index) in branch.config.tape" :key="index">
              <b :class="{ 'sim-controls__head': index === branch.config.headPosition }">{{ symbol }}</b>
            </template>
          </span>
          <span>path {{ branch.path.length ? branch.path.join(' → ') : 'initial' }}</span>
        </div>
      </div>
      <div v-if="sim.acceptingPath.length" class="sim-controls__witness">
        Accepting witness: {{ sim.acceptingPath.join(' → ') }}
      </div>
    </div>
    <div v-if="sim.isActive" class="sim-controls__speed">
      <label class="sim-controls__label">Speed</label>
      <input
        v-model.number="sim.speed"
        type="range"
        min="50"
        max="2000"
        step="50"
        class="sim-controls__slider"
      />
      <span class="sim-controls__speed-val">{{ sim.speed }}ms</span>
    </div>
    <details v-if="!sim.isActive" class="sim-controls__batch">
      <summary>Batch input testing</summary>
      <label class="sim-controls__label" for="batch-inputs">One input per line (a blank line tests ε)</label>
      <textarea id="batch-inputs" v-model="sim.batchInput" rows="4" class="sim-controls__input" />
      <button class="sim-controls__btn" @click="sim.runBatch(docStore.automaton)">Run batch</button>
      <table v-if="sim.batchResults.length" class="sim-controls__results">
        <thead><tr><th>Input</th><th>Outcome</th><th>Steps</th></tr></thead>
        <tbody>
          <tr v-for="(result, index) in sim.batchResults" :key="`${index}:${result.input}`">
            <td>{{ result.input || 'ε' }}</td><td>{{ result.outcome }}</td><td>{{ result.steps }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </div>
</template>

<style scoped>
.sim-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
}

.sim-controls__input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sim-controls__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.sim-controls__input {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
  font-family: var(--font-mono);
}

.sim-controls__input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.sim-controls__buttons {
  display: flex;
  gap: 6px;
}

.sim-controls__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 12px;
  cursor: pointer;
}

.sim-controls__btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
}

.sim-controls__btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.sim-controls__btn--primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.sim-controls__btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.sim-controls__status {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  min-width: 0;
}

.sim-controls__step {
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.sim-controls__detail {
  min-width: 0;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-simulation-edge);
  font-family: var(--font-mono);
  font-weight: 600;
}

.sim-controls__result {
  font-weight: 600;
}

.sim-controls__result--accepted {
  color: var(--color-success);
}

.sim-controls__result--rejected {
  color: var(--color-danger);
}

.sim-controls__speed {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sim-controls__slider {
  flex: 1;
}

.sim-controls__speed-val {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  width: 50px;
}

.sim-controls__trace {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.sim-controls__trace-title,
.sim-controls__witness {
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 600;
}

.sim-controls__branches {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.sim-controls__branch {
  display: grid;
  gap: 2px;
  min-width: 180px;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font: 11px/1.35 var(--font-mono);
}

.sim-controls__tape {
  display: flex;
  align-items: center;
  gap: 2px;
}

.sim-controls__tape b {
  min-width: 17px;
  padding: 1px 3px;
  border: 1px solid var(--color-border);
  text-align: center;
}

.sim-controls__tape .sim-controls__head {
  border-color: var(--color-primary);
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.sim-controls__witness {
  color: var(--color-success);
  font-family: var(--font-mono);
}

.sim-controls__batch {
  display: grid;
  gap: 7px;
  font-size: 12px;
}

.sim-controls__batch summary {
  cursor: pointer;
  font-weight: 600;
}

.sim-controls__batch textarea {
  width: 100%;
  resize: vertical;
}

.sim-controls__results {
  width: 100%;
  border-collapse: collapse;
  font: 11px var(--font-mono);
}

.sim-controls__results th,
.sim-controls__results td {
  padding: 4px 6px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}
</style>
