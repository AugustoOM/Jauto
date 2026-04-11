<script setup lang="ts">
import { useDocumentStore } from '../stores/document';
import { useSimulationStore } from '../stores/simulation';

const docStore = useDocumentStore();
const sim = useSimulationStore();

function handleStart() {
  sim.start(docStore.automaton);
}

function handlePlay() {
  sim.play(docStore.automaton);
}

function handleReset() {
  sim.reset(docStore.automaton);
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
        Start
      </button>
      <template v-else>
        <button
          v-if="!sim.isRunning"
          class="sim-controls__btn"
          :disabled="sim.status !== 'running'"
          @click="sim.step()"
        >
          Step
        </button>
        <button
          v-if="!sim.isRunning"
          class="sim-controls__btn sim-controls__btn--primary"
          :disabled="sim.status !== 'running'"
          @click="handlePlay"
        >
          Play
        </button>
        <button
          v-if="sim.isRunning"
          class="sim-controls__btn"
          @click="sim.pause()"
        >
          Pause
        </button>
        <button class="sim-controls__btn" @click="handleReset">
          Reset
        </button>
        <button class="sim-controls__btn" @click="sim.stop()">
          Stop
        </button>
      </template>
    </div>
    <div v-if="sim.isActive" class="sim-controls__status">
      <span class="sim-controls__step">Step {{ sim.stepIndex }}</span>
      <span
        class="sim-controls__result"
        :class="{
          'sim-controls__result--accepted': sim.status === 'accepted',
          'sim-controls__result--rejected': sim.status === 'rejected' || sim.status === 'halted',
        }"
      >
        {{ sim.status === 'running' ? 'Running...' :
           sim.status === 'accepted' ? 'Accepted' :
           sim.status === 'halted' ? 'Halted' : 'Rejected' }}
      </span>
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
}

.sim-controls__step {
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
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
</style>
