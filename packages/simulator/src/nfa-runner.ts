import type { FiniteAutomaton } from '@jauto/core';
import type { SimulationRunner, StepResult, RunResult, SimulationStatus } from './types';
import type { NFAConfig } from './configs';

export function createNFARunner(
  automaton: FiniteAutomaton,
  input: string,
): SimulationRunner<NFAConfig> {
  const initialState = automaton.states.find((s) => s.isInitial);
  if (!initialState) throw new Error('No initial state');

  function epsilonClosure(stateIds: ReadonlySet<string>): ReadonlySet<string> {
    const closure = new Set(stateIds);
    const queue = [...stateIds];

    while (queue.length > 0) {
      const current = queue.pop()!;
      for (const t of automaton.transitions) {
        if (t.from === current && t.read === '' && !closure.has(t.to)) {
          closure.add(t.to);
          queue.push(t.to);
        }
      }
    }
    return closure;
  }

  const initialClosure = epsilonClosure(new Set([initialState.id]));
  let config: NFAConfig = {
    activeStates: initialClosure,
    remainingInput: input,
    inputIndex: 0,
  };
  let stepIndex = 0;

  function getStatus(): SimulationStatus {
    if (config.remainingInput.length === 0) {
      for (const stateId of config.activeStates) {
        const state = automaton.states.find((s) => s.id === stateId);
        if (state?.isFinal) return 'accepted';
      }
      return 'rejected';
    }
    if (config.activeStates.size === 0) return 'rejected';
    return 'running';
  }

  function step(): StepResult<NFAConfig> {
    if (config.remainingInput.length === 0 || config.activeStates.size === 0) {
      return { config, status: getStatus(), stepIndex };
    }

    const symbol = config.remainingInput[0]!;
    const nextStates = new Set<string>();

    for (const stateId of config.activeStates) {
      for (const t of automaton.transitions) {
        if (t.from === stateId && t.read === symbol) {
          nextStates.add(t.to);
        }
      }
    }

    config = {
      activeStates: epsilonClosure(nextStates),
      remainingInput: config.remainingInput.slice(1),
      inputIndex: config.inputIndex + 1,
    };
    stepIndex++;
    return { config, status: getStatus(), stepIndex };
  }

  function run(maxSteps = 10000): RunResult<NFAConfig> {
    const steps: StepResult<NFAConfig>[] = [];
    while (steps.length < maxSteps) {
      const result = step();
      steps.push(result);
      if (result.status !== 'running') break;
    }
    const final = steps.at(-1)!;
    return { accepted: final.status === 'accepted', steps, finalConfig: final.config };
  }

  function reset() {
    config = { activeStates: initialClosure, remainingInput: input, inputIndex: 0 };
    stepIndex = 0;
  }

  return {
    step,
    run,
    reset,
    get isHalted() { return config.remainingInput.length === 0 || config.activeStates.size === 0; },
    get isAccepted() { return getStatus() === 'accepted'; },
    get currentConfig() { return config; },
  };
}
