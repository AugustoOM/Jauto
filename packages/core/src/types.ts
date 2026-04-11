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

export interface FATransition {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly read: string;
}

export interface PDATransition {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly read: string;
  readonly pop: string;
  readonly push: string;
}

export interface TMTransition {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly read: string;
  readonly write: string;
  readonly move: 'L' | 'R' | 'S';
}

export type AnyTransition = FATransition | PDATransition | TMTransition;

export interface Automaton<T extends AnyTransition> {
  readonly kind: AutomatonKind;
  readonly states: readonly AutomatonState[];
  readonly transitions: readonly T[];
  readonly meta?: { readonly comment?: string };
}

export type FiniteAutomaton = Automaton<FATransition>;
export type PushdownAutomaton = Automaton<PDATransition>;
export type TuringMachine = Automaton<TMTransition> & { readonly tapes: number };

export type AnyAutomaton = FiniteAutomaton | PushdownAutomaton | TuringMachine;

export function createEmptyAutomaton(kind: 'fa'): FiniteAutomaton;
export function createEmptyAutomaton(kind: 'pda'): PushdownAutomaton;
export function createEmptyAutomaton(kind: 'turing'): TuringMachine;
export function createEmptyAutomaton(kind: AutomatonKind): AnyAutomaton;
export function createEmptyAutomaton(kind: AutomatonKind): AnyAutomaton {
  const base = { states: [], transitions: [], meta: {} };
  switch (kind) {
    case 'fa':
      return { ...base, kind: 'fa' } as FiniteAutomaton;
    case 'pda':
      return { ...base, kind: 'pda' } as PushdownAutomaton;
    case 'turing':
      return { ...base, kind: 'turing', tapes: 1 } as TuringMachine;
  }
}
