import type { TuringBlockMachine, TuringBlockTransition } from '@jauto/core';

export interface TuringBlockRunResult {
  readonly outcome: 'accepted' | 'rejected' | 'incomplete';
  readonly tape: string;
  readonly headPosition: number;
  readonly steps: number;
}

interface Runtime {
  tape: Map<number, string>;
  head: number;
  variables: Map<string, string>;
  steps: number;
  limit: number;
}

function read(runtime: Runtime): string {
  return runtime.tape.get(runtime.head) ?? '';
}
function normalized(symbol: string): string {
  return symbol === '□' ? '' : symbol;
}

function matches(
  transition: TuringBlockTransition,
  symbol: string,
  variables: Map<string, string>,
): boolean {
  const pattern = transition.read;
  const assignmentAt = pattern.lastIndexOf('}');
  if (assignmentAt > 0 && assignmentAt < pattern.length - 1) {
    const choices = pattern.slice(0, assignmentAt).split(',').map(normalized);
    if (!choices.includes(symbol)) return false;
    variables.set(pattern.slice(assignmentAt + 1), symbol);
    return true;
  }
  if (pattern === '~') return true;
  if (pattern.startsWith('!')) return symbol !== normalized(pattern.slice(1));
  return symbol === (variables.get(pattern) ?? normalized(pattern));
}

function apply(transition: TuringBlockTransition, runtime: Runtime): void {
  if (transition.blockEdge) return;
  const current = read(runtime);
  const replacement =
    transition.write === '~'
      ? current
      : (runtime.variables.get(transition.write) ?? normalized(transition.write));
  if (replacement) runtime.tape.set(runtime.head, replacement);
  else runtime.tape.delete(runtime.head);
  if (transition.move === 'L') runtime.head--;
  if (transition.move === 'R') runtime.head++;
}

function execute(machine: TuringBlockMachine, runtime: Runtime): string | undefined {
  let state = machine.states.find((candidate) => candidate.isInitial);
  if (!state) throw new Error('Every building-block machine requires an initial state');
  while (runtime.steps < runtime.limit) {
    if (state.block) {
      const nestedHalt = execute(state.block.machine, runtime);
      if (nestedHalt === undefined) return undefined;
    }
    const symbol = read(runtime);
    const candidates = machine.transitions.filter((transition) => transition.from === state!.id);
    const matching = candidates.filter((transition) => {
      const scratch = new Map(runtime.variables);
      return matches(transition, symbol, scratch);
    });
    if (matching.length > 1)
      throw new Error('Building-block Turing machines must be deterministic');
    const transition = matching[0];
    if (!transition) return state.id;
    if (!matches(transition, symbol, runtime.variables))
      throw new Error('Transition matching changed unexpectedly');
    apply(transition, runtime);
    runtime.steps++;
    state = machine.states.find((candidate) => candidate.id === transition.to);
    if (!state) throw new Error('Building-block transition references a missing state');
  }
  return undefined;
}

export function runTuringBlockMachine(
  machine: TuringBlockMachine,
  input: string,
  maxSteps = 100_000,
): TuringBlockRunResult {
  if (!Number.isInteger(maxSteps) || maxSteps < 1)
    throw new RangeError('maxSteps must be a positive integer');
  const runtime: Runtime = {
    tape: new Map([...input].map((symbol, index) => [index, symbol])),
    head: 0,
    variables: new Map(),
    steps: 0,
    limit: maxSteps,
  };
  const haltedState = execute(machine, runtime);
  const indexes = [...runtime.tape.keys()];
  const left = Math.min(0, ...indexes);
  const right = Math.max(-1, ...indexes);
  let tape = '';
  for (let index = left; index <= right; index++) tape += runtime.tape.get(index) ?? '□';
  tape = tape.replace(/^□+|□+$/gu, '');
  return {
    outcome:
      haltedState === undefined
        ? 'incomplete'
        : machine.states.find((state) => state.id === haltedState)?.isFinal
          ? 'accepted'
          : 'rejected',
    tape,
    headPosition: runtime.head,
    steps: runtime.steps,
  };
}
