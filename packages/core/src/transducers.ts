export interface TransducerState {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly isInitial: boolean;
}

export interface MealyTransition {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly read: string;
  readonly output: string;
}

export interface MealyMachine {
  readonly kind: 'mealy';
  readonly states: readonly TransducerState[];
  readonly transitions: readonly MealyTransition[];
}

export interface MooreState extends TransducerState {
  readonly output: string;
}
export interface MooreTransition {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly read: string;
}
export interface MooreMachine {
  readonly kind: 'moore';
  readonly states: readonly MooreState[];
  readonly transitions: readonly MooreTransition[];
}

export type Transducer = MealyMachine | MooreMachine;
export interface TransducerStep {
  readonly stateId: string;
  readonly inputIndex: number;
  readonly output: string;
  readonly transitionId?: string;
}
export interface TransducerResult {
  readonly output: string;
  readonly complete: boolean;
  readonly steps: readonly TransducerStep[];
}

export function runTransducer(machine: Transducer, input: string): TransducerResult {
  const initial = machine.states.find((state) => state.isInitial);
  if (!initial) throw new Error('Transducer requires exactly one initial state');
  if (machine.states.filter((state) => state.isInitial).length !== 1)
    throw new Error('Transducer requires exactly one initial state');
  for (const state of machine.states) {
    const reads = machine.transitions
      .filter((transition) => transition.from === state.id)
      .map((transition) => transition.read);
    if (reads.some((read) => read === ''))
      throw new Error('Transducer transitions cannot read epsilon');
    for (let left = 0; left < reads.length; left++)
      for (let right = left + 1; right < reads.length; right++) {
        if (reads[left]!.startsWith(reads[right]!) || reads[right]!.startsWith(reads[left]!))
          throw new Error('Transducer must be deterministic');
      }
  }
  const stateIds = new Set(machine.states.map((state) => state.id));
  if (
    machine.transitions.some(
      (transition) => !stateIds.has(transition.from) || !stateIds.has(transition.to),
    )
  )
    throw new Error('Transducer transition references a missing state');
  let stateId = initial.id;
  let inputIndex = 0;
  let output =
    machine.kind === 'moore' ? machine.states.find((state) => state.id === initial.id)!.output : '';
  const steps: TransducerStep[] = [{ stateId, inputIndex, output }];
  while (inputIndex < input.length) {
    const transition = machine.transitions.find(
      (candidate) => candidate.from === stateId && input.startsWith(candidate.read, inputIndex),
    );
    if (!transition) return { output, complete: false, steps };
    inputIndex += transition.read.length;
    stateId = transition.to;
    if (machine.kind === 'mealy') {
      output += machine.transitions.find((candidate) => candidate.id === transition.id)!.output;
    } else {
      output += machine.states.find((state) => state.id === stateId)!.output;
    }
    steps.push({ stateId, inputIndex, output, transitionId: transition.id });
  }
  return { output, complete: true, steps };
}
