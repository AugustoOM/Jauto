import type { FiniteAutomaton } from '@jauto/core';
import type { SimulationRunner, StepResult, RunResult, SimulationStatus } from './types';
import type { NFAConfig } from './configs';
import { validateRunBudget } from './run-budget';

interface Branch {
  state: string;
  inputIndex: number;
  transitionId?: string;
  path: string[];
}

export function createNFARunner(
  automaton: FiniteAutomaton,
  input: string,
): SimulationRunner<NFAConfig> {
  const initialState = automaton.states.find((state) => state.isInitial);
  if (!initialState) throw new Error('No initial state');

  function branchKey(branch: Branch): string {
    return `${branch.state}\u0000${branch.inputIndex}`;
  }

  function epsilonClosure(seed: readonly Branch[], executed?: Set<string>): Branch[] {
    const closure = new Map(seed.map((branch) => [branchKey(branch), branch]));
    const queue = [...seed];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const transition of automaton.transitions) {
        if (transition.from !== current.state || transition.read !== '') continue;
        const next = { state: transition.to, inputIndex: current.inputIndex, transitionId: transition.id, path: [...current.path, transition.id] };
        const key = branchKey(next);
        if (!closure.has(key)) {
          closure.set(key, next);
          queue.push(next);
          executed?.add(transition.id);
        }
      }
    }
    return [...closure.values()];
  }

  const initialTransitionIds = new Set<string>();
  const initialBranches = epsilonClosure([{ state: initialState.id, inputIndex: 0, path: [] }], initialTransitionIds);
  let branches = initialBranches;
  let stepIndex = 0;
  let canceled = false;

  function toPublicConfig(): NFAConfig {
    const inputIndex = branches.reduce(
      (minimum, branch) => Math.min(minimum, branch.inputIndex),
      input.length,
    );
    return {
      activeStates: new Set(branches.map((branch) => branch.state)),
      remainingInput: input.slice(inputIndex),
      inputIndex,
    };
  }

  function isAccepting(branch: Branch): boolean {
    return branch.inputIndex === input.length &&
      Boolean(automaton.states.find((state) => state.id === branch.state)?.isFinal);
  }

  function hasApplicableTransition(): boolean {
    return branches.some((branch) => automaton.transitions.some((transition) =>
      transition.from === branch.state &&
      transition.read.length > 0 &&
      input.startsWith(transition.read, branch.inputIndex),
    ));
  }

  function getStatus(): SimulationStatus {
    if (canceled) return 'canceled';
    if (branches.some(isAccepting)) return 'accepted';
    if (branches.length === 0 || !hasApplicableTransition()) return 'rejected';
    return 'running';
  }

  function step(): StepResult<NFAConfig> {
    const currentStatus = getStatus();
    if (currentStatus !== 'running') {
      return snapshot();
    }

    const next = new Map<string, Branch>();
    const executed = new Set<string>();
    for (const branch of branches) {
      for (const transition of automaton.transitions) {
        if (
          transition.from === branch.state &&
          transition.read.length > 0 &&
          input.startsWith(transition.read, branch.inputIndex)
        ) {
          const candidate = {
            state: transition.to,
            inputIndex: branch.inputIndex + transition.read.length,
            transitionId: transition.id,
            path: [...branch.path, transition.id],
          };
          if (!next.has(branchKey(candidate))) next.set(branchKey(candidate), candidate);
          executed.add(transition.id);
        }
      }
    }
    branches = epsilonClosure([...next.values()], executed);
    stepIndex++;
    return snapshot([...executed]);
  }

  function snapshot(transitionIds: readonly string[] = []): StepResult<NFAConfig> {
    const config = toPublicConfig();
    const status = getStatus();
    const accepting = branches.find(isAccepting);
    return {
      config,
      configurations: branches.map((branch) => ({
        id: branchKey(branch),
        config: { activeStates: new Set([branch.state]), remainingInput: input.slice(branch.inputIndex), inputIndex: branch.inputIndex },
        transitionId: branch.transitionId,
        path: branch.path,
      })),
      transitionIds,
      acceptingPath: status === 'accepted' ? accepting?.path : undefined,
      status,
      stepIndex,
    };
  }

  function run(maxSteps = 10000): RunResult<NFAConfig> {
    validateRunBudget(maxSteps);
    const steps: StepResult<NFAConfig>[] = [];
    while (steps.length < maxSteps) {
      const result = step();
      steps.push(result);
      if (result.status !== 'running') break;
    }
    const status = getStatus();
    const outcome = status === 'running' ? 'incomplete' : status;
    return { accepted: outcome === 'accepted', outcome, incompleteReason: outcome === 'incomplete' ? 'step-limit' : undefined, steps, finalConfig: toPublicConfig() };
  }

  function reset() {
    branches = initialBranches.map((branch) => ({ ...branch, path: [...branch.path] }));
    stepIndex = 0;
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
    get currentConfig() { return toPublicConfig(); },
    get currentStep() { return snapshot(stepIndex === 0 ? [...initialTransitionIds] : []); },
  };
}
