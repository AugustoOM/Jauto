import type { TuringMachine } from '@jauto/core';
import type { SimulationRunner, StepResult, RunResult, SimulationStatus } from './types';
import type { TMConfig } from './configs';

const BLANK = '\u25A1';

export function createTMRunner(
  automaton: TuringMachine,
  input: string,
): SimulationRunner<TMConfig> {
  const initialState = automaton.states.find((s) => s.isInitial);
  if (!initialState) throw new Error('No initial state');
  const initialId = initialState.id;

  const initialTape = input.length > 0 ? input.split('') : [BLANK];

  let tape = [...initialTape];
  let headPosition = 0;
  let currentState = initialState.id;
  let stepCount = 0;
  let halted = false;

  function readTape(): string {
    if (headPosition < 0 || headPosition >= tape.length) return BLANK;
    return tape[headPosition] ?? BLANK;
  }

  function writeTape(symbol: string) {
    while (headPosition >= tape.length) tape.push(BLANK);
    while (headPosition < 0) {
      tape.unshift(BLANK);
      headPosition++;
    }
    tape[headPosition] = symbol || BLANK;
  }

  function getConfig(): TMConfig {
    return {
      currentState,
      tape: [...tape],
      headPosition,
      stepCount,
    };
  }

  function getStatus(): SimulationStatus {
    if (halted) {
      const state = automaton.states.find((s) => s.id === currentState);
      return state?.isFinal ? 'accepted' : 'halted';
    }
    return 'running';
  }

  function step(): StepResult<TMConfig> {
    if (halted) {
      return { config: getConfig(), status: getStatus(), stepIndex: stepCount };
    }

    const currentSymbol = readTape();

    const transition = automaton.transitions.find((t) => {
      if (t.from !== currentState) return false;
      const tRead = t.read || BLANK;
      return tRead === currentSymbol || (t.read === '' && currentSymbol === BLANK);
    });

    if (!transition) {
      halted = true;
      return { config: getConfig(), status: getStatus(), stepIndex: stepCount };
    }

    writeTape(transition.write || BLANK);
    currentState = transition.to;

    if (transition.move === 'R') headPosition++;
    else if (transition.move === 'L') headPosition--;

    while (headPosition < 0) {
      tape.unshift(BLANK);
      headPosition++;
    }
    while (headPosition >= tape.length) {
      tape.push(BLANK);
    }

    stepCount++;

    const state = automaton.states.find((s) => s.id === currentState);
    if (state?.isFinal) {
      halted = true;
    }

    return { config: getConfig(), status: getStatus(), stepIndex: stepCount };
  }

  function run(maxSteps = 10000): RunResult<TMConfig> {
    const steps: StepResult<TMConfig>[] = [];
    while (steps.length < maxSteps) {
      const result = step();
      steps.push(result);
      if (result.status !== 'running') break;
    }
    const final = steps.at(-1)!;
    return { accepted: final.status === 'accepted', steps, finalConfig: final.config };
  }

  function reset() {
    tape = [...initialTape];
    headPosition = 0;
    currentState = initialId;
    stepCount = 0;
    halted = false;
  }

  return {
    step,
    run,
    reset,
    get isHalted() { return halted; },
    get isAccepted() { return getStatus() === 'accepted'; },
    get currentConfig() { return getConfig(); },
  };
}
