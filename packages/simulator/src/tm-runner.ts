import { isDeterministic, type TuringMachine } from '@jauto/core';
import { UnsupportedSimulationError, type SimulationRunner, type StepResult, type RunResult, type SimulationStatus } from './types';
import type { TMConfig } from './configs';
import { validateRunBudget } from './run-budget';

const BLANK = '\u25A1';

export interface TMRunnerOptions {
  acceptByFinalState?: boolean;
  acceptByHalting?: boolean;
  allowStay?: boolean;
}

export function createTMRunner(
  automaton: TuringMachine,
  input: string,
  options: TMRunnerOptions = {},
): SimulationRunner<TMConfig> {
  const acceptByFinalState = options.acceptByFinalState ?? true;
  const acceptByHalting = options.acceptByHalting ?? false;
  const allowStay = options.allowStay ?? true;
  if (!isDeterministic(automaton)) {
    throw new UnsupportedSimulationError('Nondeterministic Turing machines are not supported yet');
  }
  if (automaton.transitions.some((transition) => /[!~}]/.test(transition.read) || /[!~}]/.test(transition.write))) {
    throw new UnsupportedSimulationError('JFLAP Turing-machine shortcut syntax is not supported yet');
  }
  if (!allowStay && automaton.transitions.some((transition) => transition.move === 'S')) {
    throw new UnsupportedSimulationError('Stay moves are disabled by this execution profile');
  }
  const initialState = automaton.states.find((s) => s.isInitial);
  if (!initialState) throw new Error('No initial state');
  const initialId = initialState.id;
  const initialIsFinal = initialState.isFinal;

  const initialTape = input.length > 0 ? input.split('') : [BLANK];

  let tape = [...initialTape];
  let headPosition = 0;
  let currentState = initialState.id;
  let stepCount = 0;
  let haltReason: 'final-state' | 'no-transition' | null =
    initialIsFinal && acceptByFinalState ? 'final-state' : null;
  let canceled = false;

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
    if (canceled) return 'canceled';
    if (haltReason === 'final-state') return 'accepted';
    if (haltReason === 'no-transition') return acceptByHalting ? 'accepted' : 'halted';
    return 'running';
  }

  function step(): StepResult<TMConfig> {
    if (getStatus() !== 'running') {
      return { config: getConfig(), status: getStatus(), stepIndex: stepCount };
    }

    const currentSymbol = readTape();

    const transition = automaton.transitions.find((t) => {
      if (t.from !== currentState) return false;
      const tRead = t.read || BLANK;
      return tRead === currentSymbol || (t.read === '' && currentSymbol === BLANK);
    });

    if (!transition) {
      haltReason = 'no-transition';
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
    if (state?.isFinal && acceptByFinalState) {
      haltReason = 'final-state';
    }

    return { config: getConfig(), status: getStatus(), stepIndex: stepCount };
  }

  function run(maxSteps = 10000): RunResult<TMConfig> {
    validateRunBudget(maxSteps);
    const steps: StepResult<TMConfig>[] = [];
    while (steps.length < maxSteps) {
      const result = step();
      steps.push(result);
      if (result.status !== 'running') break;
    }
    const status = getStatus();
    const outcome = status === 'running' ? 'incomplete' : status;
    return { accepted: outcome === 'accepted', outcome, incompleteReason: outcome === 'incomplete' ? 'step-limit' : undefined, steps, finalConfig: getConfig() };
  }

  function reset() {
    tape = [...initialTape];
    headPosition = 0;
    currentState = initialId;
    stepCount = 0;
    haltReason = initialIsFinal && acceptByFinalState ? 'final-state' : null;
    canceled = false;
  }

  function cancel() { canceled = true; }

  return {
    step,
    run,
    reset,
    cancel,
    get isHalted() { return getStatus() !== 'running'; },
    get isAccepted() { return getStatus() === 'accepted'; },
    get currentConfig() { return getConfig(); },
  };
}
