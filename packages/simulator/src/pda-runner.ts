import type { PushdownAutomaton } from '@jauto/core';
import type { SimulationRunner, StepResult, RunResult, SimulationStatus } from './types';
import type { PDAConfig } from './configs';
import { validateRunBudget } from './run-budget';

interface PDAConfiguration {
  state: string;
  remaining: string;
  inputIndex: number;
  stack: string[];
  transitionId?: string;
  path: string[];
}

const MAX_CONFIGS = 1000;

export function createPDARunner(
  automaton: PushdownAutomaton,
  input: string,
): SimulationRunner<PDAConfig> {
  const initialState = automaton.states.find((s) => s.isInitial);
  if (!initialState) throw new Error('No initial state');
  const initialId = initialState.id;

  let configs: PDAConfiguration[] = [
    { state: initialId, remaining: input, inputIndex: 0, stack: ['Z'], path: [] },
  ];
  let stepIndex = 0;
  let accepted = false;
  let configurationLimitReached = false;
  let canceled = false;

  function configurationKey(config: PDAConfiguration): string {
    return `${config.state}\u0000${config.inputIndex}\u0000${config.stack.join('\u0001')}`;
  }

  function toPublicConfig(): PDAConfig {
    const first = configs[0];
    if (!first) return { currentState: '', remainingInput: '', inputIndex: 0, stack: [] };
    return {
      currentState: first.state,
      remainingInput: first.remaining,
      inputIndex: first.inputIndex,
      stack: [...first.stack],
    };
  }

  function hasApplicableTransitions(): boolean {
    for (const c of configs) {
      for (const t of automaton.transitions) {
        if (t.from !== c.state) continue;
        const readMatches = c.remaining.startsWith(t.read);
        const popMatches = stackEndsWith(c.stack, t.pop);
        if (readMatches && popMatches) return true;
      }
    }
    return false;
  }

  function stackEndsWith(stack: readonly string[], pop: string): boolean {
    if (pop.length > stack.length) return false;
    for (let i = 0; i < pop.length; i++) {
      if (stack[stack.length - 1 - i] !== pop[i]) return false;
    }
    return true;
  }

  function getStatus(): SimulationStatus {
    if (canceled) return 'canceled';
    if (accepted) return 'accepted';
    if (configurationLimitReached) return 'incomplete';
    if (configs.length === 0) return 'rejected';

    for (const c of configs) {
      if (c.remaining.length === 0) {
        const state = automaton.states.find((s) => s.id === c.state);
        if (state?.isFinal) return 'accepted';
      }
    }

    if (!hasApplicableTransitions()) return 'rejected';
    return 'running';
  }

  function step(): StepResult<PDAConfig> {
    const currentStatus = getStatus();
    if (currentStatus !== 'running') {
      return snapshot();
    }

    const nextConfigs = new Map<string, PDAConfiguration>();
    const executed = new Set<string>();

    for (const c of configs) {
      for (const t of automaton.transitions) {
        if (t.from !== c.state) continue;

        const readMatches = c.remaining.startsWith(t.read);
        const popMatches = stackEndsWith(c.stack, t.pop);

        if (readMatches && popMatches) {
          const newStack = [...c.stack];
          newStack.splice(newStack.length - t.pop.length, t.pop.length);
          if (t.push !== '') {
            for (let i = t.push.length - 1; i >= 0; i--) {
              newStack.push(t.push[i]!);
            }
          }

          const consumed = t.read.length;
          const next = {
            state: t.to,
            remaining: c.remaining.slice(consumed),
            inputIndex: c.inputIndex + consumed,
            stack: newStack,
            transitionId: t.id,
            path: [...c.path, t.id],
          };
          if (!nextConfigs.has(configurationKey(next))) nextConfigs.set(configurationKey(next), next);
          executed.add(t.id);
          if (nextConfigs.size > MAX_CONFIGS) {
            configurationLimitReached = true;
            return snapshot([...executed]);
          }
        }
      }
    }

    configs = [...nextConfigs.values()];
    stepIndex++;

    for (const c of configs) {
      if (c.remaining.length === 0) {
        const state = automaton.states.find((s) => s.id === c.state);
        if (state?.isFinal) {
          accepted = true;
          break;
        }
      }
    }

    return snapshot([...executed]);
  }

  function toBranchConfig(config: PDAConfiguration): PDAConfig {
    return { currentState: config.state, remainingInput: config.remaining, inputIndex: config.inputIndex, stack: [...config.stack] };
  }

  function snapshot(transitionIds: readonly string[] = []): StepResult<PDAConfig> {
    const config = toPublicConfig();
    const status = getStatus();
    const accepting = configs.find((candidate) => candidate.remaining.length === 0 && automaton.states.some((state) => state.id === candidate.state && state.isFinal));
    return {
      config,
      configurations: configs.map((candidate) => ({ id: configurationKey(candidate), config: toBranchConfig(candidate), transitionId: candidate.transitionId, path: candidate.path })),
      transitionIds,
      acceptingPath: status === 'accepted' ? accepting?.path : undefined,
      status,
      stepIndex,
    };
  }

  function run(maxSteps = 10000): RunResult<PDAConfig> {
    validateRunBudget(maxSteps);
    const steps: StepResult<PDAConfig>[] = [];
    while (steps.length < maxSteps) {
      const result = step();
      steps.push(result);
      if (result.status !== 'running') break;
    }
    const status = getStatus();
    const outcome = status === 'running' ? 'incomplete' : status;
    const incompleteReason = outcome === 'incomplete'
      ? configurationLimitReached ? 'configuration-limit' : 'step-limit'
      : undefined;
    return { accepted: outcome === 'accepted', outcome, incompleteReason, steps, finalConfig: toPublicConfig() };
  }

  function reset() {
    configs = [{ state: initialId, remaining: input, inputIndex: 0, stack: ['Z'], path: [] }];
    stepIndex = 0;
    accepted = false;
    configurationLimitReached = false;
    canceled = false;
  }

  function cancel() { canceled = true; }

  return {
    step,
    run,
    reset,
    cancel,
    get isHalted() { return getStatus() !== 'running'; },
    get isAccepted() { return accepted || getStatus() === 'accepted'; },
    get currentConfig() { return toPublicConfig(); },
    get currentStep() { return snapshot(); },
  };
}
