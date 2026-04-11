import type { FiniteAutomaton } from '@jauto/core';
import type { SimulationRunner, StepResult, RunResult, SimulationStatus } from './types';
import type { DFAConfig } from './configs';

export function createDFARunner(
  automaton: FiniteAutomaton,
  input: string,
): SimulationRunner<DFAConfig> {
  const initialState = automaton.states.find((s) => s.isInitial);
  if (!initialState) throw new Error('No initial state');
  const initialId = initialState.id;

  let config: DFAConfig = {
    currentState: initialId,
    remainingInput: input,
    inputIndex: 0,
  };
  let stepIndex = 0;
  let halted = false;

  function getStatus(): SimulationStatus {
    if (config.remainingInput.length === 0) {
      const state = automaton.states.find((s) => s.id === config.currentState);
      return state?.isFinal ? 'accepted' : 'rejected';
    }
    return halted ? 'rejected' : 'running';
  }

  function step(): StepResult<DFAConfig> {
    if (halted || config.remainingInput.length === 0) {
      return { config, status: getStatus(), stepIndex };
    }

    const symbol = config.remainingInput[0]!;
    const transition = automaton.transitions.find(
      (t) => t.from === config.currentState && t.read === symbol,
    );

    if (!transition) {
      halted = true;
      return { config, status: 'rejected', stepIndex };
    }

    config = {
      currentState: transition.to,
      remainingInput: config.remainingInput.slice(1),
      inputIndex: config.inputIndex + 1,
    };
    stepIndex++;
    return { config, status: getStatus(), stepIndex };
  }

  function run(maxSteps = 10000): RunResult<DFAConfig> {
    const steps: StepResult<DFAConfig>[] = [];
    while (steps.length < maxSteps) {
      const result = step();
      steps.push(result);
      if (result.status !== 'running') break;
    }
    const final = steps.at(-1)!;
    return { accepted: final.status === 'accepted', steps, finalConfig: final.config };
  }

  function reset() {
    config = { currentState: initialId, remainingInput: input, inputIndex: 0 };
    stepIndex = 0;
    halted = false;
  }

  return {
    step,
    run,
    reset,
    get isHalted() { return halted || config.remainingInput.length === 0; },
    get isAccepted() { return getStatus() === 'accepted'; },
    get currentConfig() { return config; },
  };
}
