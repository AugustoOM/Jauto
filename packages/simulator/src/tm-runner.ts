import { isDeterministic, type TMTapeAction, type TuringMachine } from '@jauto/core';
import {
  UnsupportedSimulationError,
  type SimulationRunner,
  type StepResult,
  type RunResult,
  type SimulationStatus,
} from './types';
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
  if (!isDeterministic(automaton))
    throw new UnsupportedSimulationError('Nondeterministic Turing machines are not supported yet');
  const actionsFor = (transition: TuringMachine['transitions'][number]): readonly TMTapeAction[] =>
    transition.tapeActions ?? [transition];
  if (
    automaton.transitions.some((transition) => actionsFor(transition).length !== automaton.tapes)
  ) {
    throw new UnsupportedSimulationError('Every Turing transition must define one action per tape');
  }
  if (
    automaton.transitions.some((transition) =>
      actionsFor(transition).some(
        (action) => /[!~}]/.test(action.read) || /[!~}]/.test(action.write),
      ),
    )
  ) {
    throw new UnsupportedSimulationError(
      'JFLAP Turing-machine shortcut syntax is not supported yet',
    );
  }
  if (
    automaton.transitions.some((transition) =>
      actionsFor(transition).some((action) => action.read.length > 1 || action.write.length > 1),
    )
  ) {
    throw new UnsupportedSimulationError('Turing transitions must read and write one tape symbol');
  }
  if (
    !allowStay &&
    automaton.transitions.some((transition) =>
      actionsFor(transition).some((action) => action.move === 'S'),
    )
  ) {
    throw new UnsupportedSimulationError('Stay moves are disabled by this execution profile');
  }
  const initialState = automaton.states.find((state) => state.isInitial);
  if (!initialState) throw new Error('No initial state');
  const initialStateId = initialState.id;
  const initialStateIsFinal = initialState.isFinal;
  const statesById = new Map(automaton.states.map((state) => [state.id, state]));
  const transitionsByState = new Map<string, typeof automaton.transitions>();
  for (const transition of automaton.transitions)
    transitionsByState.set(transition.from, [
      ...(transitionsByState.get(transition.from) ?? []),
      transition,
    ]);
  const initialTapes = Array.from({ length: automaton.tapes }, (_, index) =>
    index === 0 && input.length > 0 ? input.split('') : [BLANK],
  );

  let tapes = initialTapes.map((tape) => [...tape]);
  let headPositions = Array.from({ length: automaton.tapes }, () => 0);
  let currentState = initialState.id;
  let stepCount = 0;
  let haltReason: 'final-state' | 'no-transition' | null =
    initialState.isFinal && acceptByFinalState ? 'final-state' : null;
  let canceled = false;
  let path: string[] = [];
  let lastTransitionId: string | undefined;

  function normalizeHead(index: number) {
    while (headPositions[index]! < 0) {
      tapes[index]!.unshift(BLANK);
      headPositions[index] = headPositions[index]! + 1;
    }
    while (headPositions[index]! >= tapes[index]!.length) tapes[index]!.push(BLANK);
  }

  function readTape(index: number): string {
    normalizeHead(index);
    return tapes[index]![headPositions[index]!] ?? BLANK;
  }

  function writeTape(index: number, symbol: string) {
    normalizeHead(index);
    tapes[index]![headPositions[index]!] = symbol || BLANK;
  }

  function getConfig(): TMConfig {
    return {
      currentState,
      tape: [...tapes[0]!],
      headPosition: headPositions[0]!,
      tapes: tapes.map((tape) => [...tape]),
      headPositions: [...headPositions],
      stepCount,
    };
  }

  function getStatus(): SimulationStatus {
    if (canceled) return 'canceled';
    if (haltReason === 'final-state') return 'accepted';
    if (haltReason === 'no-transition') return acceptByHalting ? 'accepted' : 'halted';
    return 'running';
  }

  function snapshot(transitionIds: readonly string[] = []): StepResult<TMConfig> {
    const config = getConfig();
    const status = getStatus();
    return {
      config,
      configurations: [
        {
          id: `${currentState}\u0000${headPositions.join(',')}\u0000${stepCount}`,
          config,
          transitionId: lastTransitionId,
          path: lastTransitionId ? [lastTransitionId] : [],
        },
      ],
      transitionIds,
      acceptingPath: status === 'accepted' ? [...path] : undefined,
      status,
      stepIndex: stepCount,
    };
  }

  function step(): StepResult<TMConfig> {
    if (getStatus() !== 'running') return snapshot();
    const transition = (transitionsByState.get(currentState) ?? []).find((candidate) =>
      actionsFor(candidate).every((action, index) => (action.read || BLANK) === readTape(index)),
    );
    if (!transition) {
      haltReason = 'no-transition';
      return snapshot();
    }
    const actions = actionsFor(transition);
    actions.forEach((action, index) => writeTape(index, action.write || BLANK));
    actions.forEach((action, index) => {
      if (action.move === 'R') headPositions[index] = headPositions[index]! + 1;
      else if (action.move === 'L') headPositions[index] = headPositions[index]! - 1;
      normalizeHead(index);
    });
    currentState = transition.to;
    stepCount++;
    path.push(transition.id);
    lastTransitionId = transition.id;
    if (statesById.get(currentState)?.isFinal && acceptByFinalState) haltReason = 'final-state';
    return snapshot([transition.id]);
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
    return {
      accepted: outcome === 'accepted',
      outcome,
      incompleteReason: outcome === 'incomplete' ? 'step-limit' : undefined,
      steps,
      finalConfig: getConfig(),
    };
  }

  function reset() {
    tapes = initialTapes.map((tape) => [...tape]);
    headPositions = Array.from({ length: automaton.tapes }, () => 0);
    currentState = initialStateId;
    stepCount = 0;
    haltReason = initialStateIsFinal && acceptByFinalState ? 'final-state' : null;
    canceled = false;
    path = [];
    lastTransitionId = undefined;
  }

  function cancel() {
    canceled = true;
  }

  return {
    step,
    run,
    reset,
    cancel,
    get isHalted() {
      return getStatus() !== 'running';
    },
    get isAccepted() {
      return getStatus() === 'accepted';
    },
    get currentConfig() {
      return getConfig();
    },
    get currentStep() {
      return snapshot();
    },
  };
}
