export type AutomatonKind = 'fa' | 'pda' | 'turing';

export interface AutomatonState {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly isInitial: boolean;
  readonly isFinal: boolean;
  readonly label?: string;
}

export interface TransitionLayout {
  readonly controlX?: number;
  readonly controlY?: number;
}

export interface FATransition extends TransitionLayout {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly read: string;
}

export interface PDATransition extends TransitionLayout {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly read: string;
  readonly pop: string;
  readonly push: string;
}

export interface TMTransition extends TransitionLayout {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly read: string;
  readonly write: string;
  readonly move: 'L' | 'R' | 'S';
}

export type AnyTransition = FATransition | PDATransition | TMTransition;

export interface AutomatonNote {
  readonly text: string;
  readonly x: number;
  readonly y: number;
}

export interface Automaton<T extends AnyTransition, K extends AutomatonKind = AutomatonKind> {
  readonly kind: K;
  readonly states: readonly AutomatonState[];
  readonly transitions: readonly T[];
  readonly meta?: { readonly comment?: string; readonly notes?: readonly AutomatonNote[] };
}

export type FiniteAutomaton = Automaton<FATransition, 'fa'>;
export type PushdownAutomaton = Automaton<PDATransition, 'pda'>;
export type TuringMachine = Automaton<TMTransition, 'turing'> & { readonly tapes: number };

export type AnyAutomaton = FiniteAutomaton | PushdownAutomaton | TuringMachine;

export function createEmptyAutomaton(kind: 'fa'): FiniteAutomaton;
export function createEmptyAutomaton(kind: 'pda'): PushdownAutomaton;
export function createEmptyAutomaton(kind: 'turing'): TuringMachine;
export function createEmptyAutomaton(kind: AutomatonKind): AnyAutomaton;
export function createEmptyAutomaton(kind: AutomatonKind): AnyAutomaton {
  const base = { states: [], transitions: [], meta: {} };
  switch (kind) {
    case 'fa':
      return { ...base, kind: 'fa' };
    case 'pda':
      return { ...base, kind: 'pda' };
    case 'turing':
      return { ...base, kind: 'turing', tapes: 1 };
  }
}
