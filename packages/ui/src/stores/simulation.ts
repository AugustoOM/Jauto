import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { SimulationRunner, StepResult, SimulationStatus } from '@jauto/simulator';
import { createDFARunner, createNFARunner, createPDARunner, createTMRunner } from '@jauto/simulator';
import { isDeterministic } from '@jauto/core';
import type { AnyAutomaton, AnyTransition, PushdownAutomaton, TuringMachine } from '@jauto/core';

export interface TransitionHighlight {
  transitionId: string;
  sourceStateId: string;
  targetStateId: string;
  label: string;
}

export const useSimulationStore = defineStore('simulation', () => {
  const input = ref('');
  const isRunning = ref(false);
  const status = ref<SimulationStatus | null>(null);
  const stepIndex = ref(0);
  const highlightedStates = ref<Set<string>>(new Set());
  const transitionHighlights = ref<TransitionHighlight[]>([]);
  const activeTraceIndex = ref(-1);
  const speed = ref(500);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let runner: SimulationRunner<any> | null = null;
  let activeAutomaton: AnyAutomaton | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const traceSteps = ref<StepResult<any>[]>([]);

  function createRunnerFor(automaton: AnyAutomaton, inputStr: string) {
    switch (automaton.kind) {
      case 'fa':
        return isDeterministic(automaton)
          ? createDFARunner(automaton, inputStr)
          : createNFARunner(automaton, inputStr);
      case 'pda':
        return createPDARunner(automaton as PushdownAutomaton, inputStr);
      case 'turing':
        return createTMRunner(automaton as TuringMachine, inputStr);
    }
  }

  const activeTransition = computed(() => {
    if (activeTraceIndex.value < 0) return null;
    return transitionHighlights.value[activeTraceIndex.value] ?? null;
  });

  function updateHighlights() {
    if (!runner) {
      highlightedStates.value = new Set();
      return;
    }

    if (activeTransition.value) {
      highlightedStates.value = new Set([
        activeTransition.value.sourceStateId,
        activeTransition.value.targetStateId,
      ]);
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

  function start(automaton: AnyAutomaton) {
    stop();
    try {
      runner = createRunnerFor(automaton, input.value);
      activeAutomaton = automaton;
    } catch {
      status.value = 'rejected';
      return;
    }
    status.value = runner.isAccepted ? 'accepted' : runner.isHalted ? 'rejected' : 'running';
    stepIndex.value = 0;
    traceSteps.value = [];
    transitionHighlights.value = [];
    activeTraceIndex.value = -1;
    updateHighlights();
  }

  function step(automaton: AnyAutomaton) {
    if (!runner || status.value !== 'running') return;
    const previousConfig = runner.currentConfig;
    const result = runner.step();
    const highlight = inferTransitionHighlight(automaton, previousConfig, result.config);
    traceSteps.value = [...traceSteps.value, result];
    transitionHighlights.value = highlight
      ? [...transitionHighlights.value, highlight]
      : transitionHighlights.value;
    activeTraceIndex.value = transitionHighlights.value.length - 1;
    stepIndex.value = result.stepIndex;
    status.value = result.status;
    updateHighlights();
  }

  function nextStep(automaton: AnyAutomaton) {
    if (activeTraceIndex.value < transitionHighlights.value.length - 1) {
      activeTraceIndex.value++;
      stepIndex.value = activeTraceIndex.value + 1;
      updateHighlights();
      return;
    }
    step(automaton);
  }

  function previousStep() {
    if (activeTraceIndex.value <= 0) return;
    activeTraceIndex.value--;
    stepIndex.value = activeTraceIndex.value + 1;
    updateHighlights();
  }

  function play(automaton: AnyAutomaton) {
    if (!runner) start(automaton);
    if (status.value !== 'running') return;
    activeAutomaton = automaton;
    isRunning.value = true;
    intervalId = setInterval(() => {
      if (activeAutomaton) step(activeAutomaton);
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
    activeAutomaton = null;
    status.value = null;
    stepIndex.value = 0;
    traceSteps.value = [];
    transitionHighlights.value = [];
    activeTraceIndex.value = -1;
    highlightedStates.value = new Set();
  }

  function reset(automaton: AnyAutomaton) {
    stop();
    start(automaton);
  }

  watch(speed, () => {
    if (isRunning.value && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (activeAutomaton) step(activeAutomaton);
        if (status.value !== 'running') pause();
      }, speed.value);
    }
  });

  const isActive = computed(() => status.value !== null);
  const canGoPrevious = computed(() => activeTraceIndex.value > 0);
  const canGoNext = computed(
    () => activeTraceIndex.value < transitionHighlights.value.length - 1 || status.value === 'running',
  );

  function inferTransitionHighlight(
    automaton: AnyAutomaton,
    previousConfig: unknown,
    nextConfig: unknown,
  ): TransitionHighlight | null {
    const transition = findTransitionForStep(automaton, previousConfig, nextConfig);
    if (!transition) return null;
    return {
      transitionId: transition.id,
      sourceStateId: transition.from,
      targetStateId: transition.to,
      label: getTransitionLabel(transition),
    };
  }

  function findTransitionForStep(
    automaton: AnyAutomaton,
    previousConfig: unknown,
    nextConfig: unknown,
  ): AnyTransition | null {
    if (!hasCurrentState(previousConfig) || !hasCurrentState(nextConfig)) return null;
    const candidates = automaton.transitions.filter(
      (t) => t.from === previousConfig.currentState && t.to === nextConfig.currentState,
    );
    if (candidates.length === 0) return null;

    if (automaton.kind === 'fa' || automaton.kind === 'pda') {
      const consumed = getInputIndex(nextConfig) - getInputIndex(previousConfig);
      const read = consumed > 0 ? getRemainingInput(previousConfig)[0] ?? '' : '';
      return candidates.find((t) => 'read' in t && t.read === read) ?? candidates[0] ?? null;
    }

    if (automaton.kind === 'turing') {
      const read = getTapeSymbol(previousConfig);
      return (
        candidates.find((t) => 'read' in t && (t.read || '\u25A1') === read) ??
        candidates[0] ??
        null
      );
    }

    return candidates[0] ?? null;
  }

  function hasCurrentState(config: unknown): config is { currentState: string } {
    return typeof config === 'object' && config !== null && 'currentState' in config;
  }

  function getInputIndex(config: unknown): number {
    if (typeof config === 'object' && config !== null && 'inputIndex' in config) {
      return Number(config.inputIndex) || 0;
    }
    return 0;
  }

  function getRemainingInput(config: unknown): string {
    if (typeof config === 'object' && config !== null && 'remainingInput' in config) {
      return String(config.remainingInput ?? '');
    }
    return '';
  }

  function getTapeSymbol(config: unknown): string {
    if (
      typeof config === 'object' &&
      config !== null &&
      'tape' in config &&
      'headPosition' in config &&
      Array.isArray(config.tape)
    ) {
      return String(config.tape[Number(config.headPosition)] ?? '\u25A1');
    }
    return '\u25A1';
  }

  function getTransitionLabel(t: AnyTransition): string {
    const read = t.read || '\u03B5';
    if ('pop' in t && 'push' in t) {
      const pop = t.pop || '\u03B5';
      const push = t.push || '\u03B5';
      return `${read}, ${pop} -> ${push}`;
    }
    if ('write' in t && 'move' in t) {
      const write = t.write || '\u25A1';
      return `${read} -> ${write}, ${t.move}`;
    }
    return read;
  }

  return {
    input,
    isRunning,
    isActive,
    status,
    stepIndex,
    highlightedStates,
    activeTransition,
    activeTraceIndex,
    transitionHighlights,
    canGoPrevious,
    canGoNext,
    speed,
    traceSteps,
    start,
    step,
    nextStep,
    previousStep,
    play,
    pause,
    stop,
    reset,
  };
});
