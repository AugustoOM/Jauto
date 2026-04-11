import { ref, computed, watch } from 'vue';
import type { SimulationRunner, StepResult, SimulationStatus } from '@jauto/simulator';
import { createDFARunner, createNFARunner, createPDARunner, createTMRunner } from '@jauto/simulator';
import type { AnyAutomaton, FiniteAutomaton, PushdownAutomaton, TuringMachine } from '@jauto/core';

export function useSimulation() {
  const input = ref('');
  const isRunning = ref(false);
  const status = ref<SimulationStatus | null>(null);
  const stepIndex = ref(0);
  const highlightedStates = ref<Set<string>>(new Set());
  const speed = ref(500);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let runner: SimulationRunner<any> | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const traceSteps = ref<StepResult<any>[]>([]);

  function createRunner(automaton: AnyAutomaton, inputStr: string) {
    switch (automaton.kind) {
      case 'fa':
        return createDFARunner(automaton as FiniteAutomaton, inputStr);
      case 'pda':
        return createPDARunner(automaton as PushdownAutomaton, inputStr);
      case 'turing':
        return createTMRunner(automaton as TuringMachine, inputStr);
    }
  }

  function start(automaton: AnyAutomaton) {
    stop();
    try {
      runner = createRunner(automaton, input.value);
    } catch {
      status.value = 'rejected';
      return;
    }
    status.value = 'running';
    stepIndex.value = 0;
    traceSteps.value = [];
    updateHighlights();
  }

  function step() {
    if (!runner || status.value !== 'running') return;
    const result = runner.step();
    traceSteps.value = [...traceSteps.value, result];
    stepIndex.value = result.stepIndex;
    status.value = result.status;
    updateHighlights();
  }

  function play(automaton: AnyAutomaton) {
    if (!runner) start(automaton);
    if (status.value !== 'running') return;
    isRunning.value = true;
    intervalId = setInterval(() => {
      step();
      if (status.value !== 'running') {
        pause();
      }
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
    runner = null;
    status.value = null;
    stepIndex.value = 0;
    traceSteps.value = [];
    highlightedStates.value = new Set();
  }

  function reset(automaton: AnyAutomaton) {
    stop();
    start(automaton);
  }

  function updateHighlights() {
    if (!runner) {
      highlightedStates.value = new Set();
      return;
    }
    const config = runner.currentConfig;
    const states = new Set<string>();
    if ('currentState' in config && config.currentState) {
      states.add(config.currentState as string);
    }
    if ('activeStates' in config && config.activeStates instanceof Set) {
      for (const s of config.activeStates) states.add(s as string);
    }
    highlightedStates.value = states;
  }

  watch(speed, () => {
    if (isRunning.value && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        step();
        if (status.value !== 'running') pause();
      }, speed.value);
    }
  });

  const isActive = computed(() => status.value !== null);

  return {
    input,
    isRunning,
    isActive,
    status,
    stepIndex,
    highlightedStates,
    speed,
    traceSteps,
    start,
    step,
    play,
    pause,
    stop,
    reset,
  };
}
