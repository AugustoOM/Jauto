import type { PushdownAutomaton } from '@jauto/core';
import type { SimulationRunner, StepResult, RunResult, SimulationStatus } from './types';
import type { PDAConfig } from './configs';

interface PDAConfiguration {
  state: string;
  remaining: string;
  inputIndex: number;
  stack: string[];
}

const MAX_CONFIGS = 1000;

export function createPDARunner(
  automaton: PushdownAutomaton,
  input: string,
): SimulationRunner<PDAConfig> {
  const initialState = automaton.states.find((s) => s.isInitial);
  if (!initialState) throw new Error('No initial state');

  let configs: PDAConfiguration[] = [
    { state: initialState.id, remaining: input, inputIndex: 0, stack: [] },
  ];
  let stepIndex = 0;
  let accepted = false;

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
      const topOfStack = c.stack.at(-1) ?? '';
      for (const t of automaton.transitions) {
        if (t.from !== c.state) continue;
        const readMatches = t.read === '' || (c.remaining.length > 0 && t.read === c.remaining[0]);
        const popMatches = t.pop === '' || t.pop === topOfStack;
        if (readMatches && popMatches) return true;
      }
    }
    return false;
  }

  function getStatus(): SimulationStatus {
    if (accepted) return 'accepted';
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
    if (configs.length === 0 || accepted) {
      return { config: toPublicConfig(), status: getStatus(), stepIndex };
    }

    const nextConfigs: PDAConfiguration[] = [];

    for (const c of configs) {
      const topOfStack = c.stack.at(-1) ?? '';

      for (const t of automaton.transitions) {
        if (t.from !== c.state) continue;

        const readMatches = t.read === '' || (c.remaining.length > 0 && t.read === c.remaining[0]);
        const popMatches = t.pop === '' || t.pop === topOfStack;

        if (readMatches && popMatches) {
          const newStack = [...c.stack];
          if (t.pop !== '') newStack.pop();
          if (t.push !== '') {
            for (let i = t.push.length - 1; i >= 0; i--) {
              newStack.push(t.push[i]!);
            }
          }

          const consumed = t.read !== '' ? 1 : 0;
          nextConfigs.push({
            state: t.to,
            remaining: c.remaining.slice(consumed),
            inputIndex: c.inputIndex + consumed,
            stack: newStack,
          });
        }
      }
    }

    configs = nextConfigs.slice(0, MAX_CONFIGS);
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

    return { config: toPublicConfig(), status: getStatus(), stepIndex };
  }

  function run(maxSteps = 10000): RunResult<PDAConfig> {
    const steps: StepResult<PDAConfig>[] = [];
    while (steps.length < maxSteps) {
      const result = step();
      steps.push(result);
      if (result.status !== 'running') break;
    }
    const final = steps.at(-1)!;
    return { accepted: final.status === 'accepted', steps, finalConfig: final.config };
  }

  function reset() {
    configs = [{ state: initialState.id, remaining: input, inputIndex: 0, stack: [] }];
    stepIndex = 0;
    accepted = false;
  }

  return {
    step,
    run,
    reset,
    get isHalted() { return configs.length === 0 || accepted || getStatus() !== 'running'; },
    get isAccepted() { return accepted || getStatus() === 'accepted'; },
    get currentConfig() { return toPublicConfig(); },
  };
}
