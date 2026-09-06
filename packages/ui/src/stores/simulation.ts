import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import type { SimulationRunner, StepResult, SimulationStatus } from '@jauto/simulator';
import { createDFARunner, createNFARunner, createPDARunner, createTMRunner } from '@jauto/simulator';
import { isDeterministic } from '@jauto/core';
import type { AnyAutomaton, AnyTransition, PushdownAutomaton, TuringMachine } from '@jauto/core';
import { useDocumentStore } from './document';

export interface TransitionHighlight {
  transitionId: string;
  sourceStateId: string;
  targetStateId: string;
  label: string;
}

export interface BatchResult {
  input: string;
  outcome: SimulationStatus;
  steps: number;
  message?: string;
}

export const useSimulationStore = defineStore('simulation', () => {
  const document = useDocumentStore();
  const input = ref('');
  const isRunning = ref(false);
  const status = ref<SimulationStatus | null>(null);
  const errorMessage = ref<string | null>(null);
  const stepIndex = ref(0);
  const highlightedStates = ref<Set<string>>(new Set());
  const activeTraceIndex = ref(-1);
  const speed = ref(500);
  const batchInput = ref('');
  const batchResults = ref<BatchResult[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let runner: SimulationRunner<any> | null = null;
  let activeAutomaton: AnyAutomaton | null = null;
  let activeSemanticSignature: string | null = null;
  let executionStatus: SimulationStatus | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const traceSteps = ref<StepResult<any>[]>([]);

  function createRunnerFor(automaton: AnyAutomaton, inputStr: string) {
    switch (automaton.kind) {
      case 'fa':
        return isDeterministic(automaton) ? createDFARunner(automaton, inputStr) : createNFARunner(automaton, inputStr);
      case 'pda':
        return createPDARunner(automaton as PushdownAutomaton, inputStr);
      case 'turing':
        return createTMRunner(automaton as TuringMachine, inputStr);
    }
  }

  const activeSnapshot = computed(() => traceSteps.value[activeTraceIndex.value] ?? null);
  const executionIndex = computed(() => traceSteps.value.length - 1);
  const transitionHighlights = computed<TransitionHighlight[]>(() => {
    if (!activeAutomaton || !activeSnapshot.value) return [];
    const ids = new Set(activeSnapshot.value.transitionIds);
    return activeAutomaton.transitions.filter((transition) => ids.has(transition.id)).map(toHighlight);
  });
  const activeTransition = computed(() => transitionHighlights.value[0] ?? null);
  const activeConfigurations = computed(() => activeSnapshot.value?.configurations ?? []);
  const acceptingPath = computed(() => activeSnapshot.value?.acceptingPath ?? []);

  function toHighlight(transition: AnyTransition): TransitionHighlight {
    return { transitionId: transition.id, sourceStateId: transition.from, targetStateId: transition.to, label: getTransitionLabel(transition) };
  }

  function displaySnapshot(index: number) {
    const snapshot = traceSteps.value[index];
    if (!snapshot) return;
    activeTraceIndex.value = index;
    stepIndex.value = snapshot.stepIndex;
    status.value = snapshot.status;
    const states = new Set<string>();
    for (const branch of snapshot.configurations) {
      const config = branch.config as Record<string, unknown>;
      if (typeof config.currentState === 'string' && config.currentState) states.add(config.currentState);
      if (config.activeStates instanceof Set) {
        for (const state of config.activeStates) if (typeof state === 'string') states.add(state);
      }
    }
    highlightedStates.value = states;
  }

  function start(automaton: AnyAutomaton) {
    stop();
    try {
      runner = createRunnerFor(automaton, input.value);
      activeAutomaton = automaton;
      activeSemanticSignature = semanticSignature(automaton);
    } catch (error) {
      status.value = 'invalid';
      errorMessage.value = error instanceof Error ? error.message : String(error);
      return;
    }
    const initial = runner.currentStep;
    traceSteps.value = [initial];
    executionStatus = initial.status;
    errorMessage.value = null;
    displaySnapshot(0);
  }

  function executeStep() {
    if (!runner || executionStatus !== 'running') return;
    const result = runner.step();
    traceSteps.value = [...traceSteps.value, result];
    executionStatus = result.status;
    displaySnapshot(traceSteps.value.length - 1);
  }

  function nextStep(automaton: AnyAutomaton) {
    activeAutomaton = automaton;
    if (activeTraceIndex.value < executionIndex.value) {
      displaySnapshot(activeTraceIndex.value + 1);
      return;
    }
    executeStep();
  }

  function previousStep() {
    if (activeTraceIndex.value > 0) displaySnapshot(activeTraceIndex.value - 1);
  }

  function play(automaton: AnyAutomaton) {
    if (!runner) start(automaton);
    if (!runner || (activeTraceIndex.value >= executionIndex.value && executionStatus !== 'running')) return;
    activeAutomaton = automaton;
    isRunning.value = true;
    intervalId = setInterval(() => {
      if (activeAutomaton) nextStep(activeAutomaton);
      if (activeTraceIndex.value >= executionIndex.value && executionStatus !== 'running') pause();
    }, speed.value);
  }

  function pause() {
    isRunning.value = false;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function stop() {
    pause();
    runner?.cancel();
    runner = null;
    activeAutomaton = null;
    activeSemanticSignature = null;
    executionStatus = null;
    status.value = null;
    errorMessage.value = null;
    stepIndex.value = 0;
    traceSteps.value = [];
    activeTraceIndex.value = -1;
    highlightedStates.value = new Set();
  }

  function invalidate(message = 'The machine changed. Restart the simulation to use the new definition.') {
    if (!runner) return;
    pause();
    runner.cancel();
    runner = null;
    executionStatus = 'invalid';
    status.value = 'invalid';
    errorMessage.value = message;
  }

  function reset(automaton: AnyAutomaton) {
    stop();
    start(automaton);
  }

  function runBatch(automaton: AnyAutomaton, maxSteps = 10000) {
    batchResults.value = batchInput.value.split(/\r?\n/).map((value) => value.trim()).map((value) => {
      try {
        const batchRunner = createRunnerFor(automaton, value);
        const result = batchRunner.run(maxSteps);
        return { input: value, outcome: result.outcome, steps: result.steps.length };
      } catch (error) {
        return { input: value, outcome: 'invalid' as const, steps: 0, message: error instanceof Error ? error.message : String(error) };
      }
    });
  }

  watch(speed, () => {
    if (!isRunning.value || intervalId === null) return;
    clearInterval(intervalId);
    intervalId = setInterval(() => {
      if (activeAutomaton) nextStep(activeAutomaton);
      if (activeTraceIndex.value >= executionIndex.value && executionStatus !== 'running') pause();
    }, speed.value);
  });

  watch(() => document.automaton, (automaton) => {
    if (!runner || activeSemanticSignature === null) return;
    const nextSignature = semanticSignature(automaton);
    if (nextSignature !== activeSemanticSignature) invalidate();
    else activeAutomaton = automaton;
  });

  const isActive = computed(() => status.value !== null);
  const canGoPrevious = computed(() => activeTraceIndex.value > 0);
  const canGoNext = computed(() => activeTraceIndex.value < executionIndex.value || executionStatus === 'running');

  function semanticSignature(automaton: AnyAutomaton): string {
    return JSON.stringify({
      kind: automaton.kind,
      tapes: automaton.kind === 'turing' ? automaton.tapes : undefined,
      states: automaton.states.map(({ x: _x, y: _y, ...state }) => state),
      transitions: automaton.transitions.map(({ controlX: _controlX, controlY: _controlY, ...transition }) => transition),
    });
  }

  function getTransitionLabel(transition: AnyTransition): string {
    const read = transition.read || 'ε';
    if ('pop' in transition && 'push' in transition) return `${read}, ${transition.pop || 'ε'} -> ${transition.push || 'ε'}`;
    if ('write' in transition && 'move' in transition) return `${read} -> ${transition.write || '□'}, ${transition.move}`;
    return read;
  }

  return {
    input, isRunning, isActive, status, errorMessage, stepIndex, highlightedStates,
    activeTransition, activeConfigurations, activeSnapshot, acceptingPath,
    activeTraceIndex, executionIndex, transitionHighlights, canGoPrevious, canGoNext,
    speed, traceSteps, batchInput, batchResults, start, step: (_automaton: AnyAutomaton) => executeStep(), nextStep,
    previousStep, play, pause, stop, invalidate, reset, runBatch,
  };
});
