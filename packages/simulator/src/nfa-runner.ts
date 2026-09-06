import type { FiniteAutomaton } from '@jauto/core';
import type { SimulationRunner, StepResult, RunResult, SimulationStatus } from './types';
import type { NFAConfig } from './configs';

interface Branch {
  state: string;
  inputIndex: number;
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

  function epsilonClosure(seed: readonly Branch[]): Branch[] {
    const closure = new Map(seed.map((branch) => [branchKey(branch), branch]));
    const queue = [...seed];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const transition of automaton.transitions) {
        if (transition.from !== current.state || transition.read !== '') continue;
        const next = { state: transition.to, inputIndex: current.inputIndex };
        const key = branchKey(next);
        if (!closure.has(key)) {
          closure.set(key, next);
          queue.push(next);
        }
      }
    }
    return [...closure.values()];
  }

  const initialBranches = epsilonClosure([{ state: initialState.id, inputIndex: 0 }]);
  let branches = initialBranches;
  let stepIndex = 0;

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
    if (branches.some(isAccepting)) return 'accepted';
    if (branches.length === 0 || !hasApplicableTransition()) return 'rejected';
    return 'running';
  }

  function step(): StepResult<NFAConfig> {
    const currentStatus = getStatus();
    if (currentStatus !== 'running') {
      return { config: toPublicConfig(), status: currentStatus, stepIndex };
    }

    const next = new Map<string, Branch>();
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
          };
          next.set(branchKey(candidate), candidate);
        }
      }
    }
    branches = epsilonClosure([...next.values()]);
    stepIndex++;
    return { config: toPublicConfig(), status: getStatus(), stepIndex };
  }

  function run(maxSteps = 10000): RunResult<NFAConfig> {
    const steps: StepResult<NFAConfig>[] = [];
    while (steps.length < maxSteps) {
      const result = step();
      steps.push(result);
      if (result.status !== 'running') break;
    }
    const status = getStatus();
    const outcome = status === 'running' ? 'step-limit' : status;
    return { accepted: outcome === 'accepted', outcome, steps, finalConfig: toPublicConfig() };
  }

  function reset() {
    branches = initialBranches;
    stepIndex = 0;
  }

  return {
    step,
    run,
    reset,
    get isHalted() { return getStatus() !== 'running'; },
    get isAccepted() { return getStatus() === 'accepted'; },
    get currentConfig() { return toPublicConfig(); },
  };
}
