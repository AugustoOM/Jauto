import type { Automaton, AutomatonState, AnyTransition } from './types';

export function addState<T extends AnyTransition>(
  automaton: Automaton<T>,
  state: AutomatonState,
): Automaton<T> {
  return { ...automaton, states: [...automaton.states, state] };
}

export function removeState<T extends AnyTransition>(
  automaton: Automaton<T>,
  stateId: string,
): Automaton<T> {
  return {
    ...automaton,
    states: automaton.states.filter((s) => s.id !== stateId),
    transitions: automaton.transitions.filter((t) => t.from !== stateId && t.to !== stateId),
  };
}

export function updateState<T extends AnyTransition>(
  automaton: Automaton<T>,
  stateId: string,
  updates: Partial<Omit<AutomatonState, 'id'>>,
): Automaton<T> {
  return {
    ...automaton,
    states: automaton.states.map((s) => (s.id === stateId ? { ...s, ...updates } : s)),
  };
}

export function addTransition<T extends AnyTransition>(
  automaton: Automaton<T>,
  transition: T,
): Automaton<T> {
  return { ...automaton, transitions: [...automaton.transitions, transition] };
}

export function removeTransition<T extends AnyTransition>(
  automaton: Automaton<T>,
  transitionId: string,
): Automaton<T> {
  return {
    ...automaton,
    transitions: automaton.transitions.filter((t) => t.id !== transitionId),
  };
}

export function updateTransition<T extends AnyTransition>(
  automaton: Automaton<T>,
  transitionId: string,
  updates: Partial<Omit<T, 'id'>>,
): Automaton<T> {
  return {
    ...automaton,
    transitions: automaton.transitions.map((t) =>
      t.id === transitionId ? { ...t, ...updates } : t,
    ),
  };
}

export function findState<T extends AnyTransition>(
  automaton: Automaton<T>,
  predicate: (state: AutomatonState) => boolean,
): AutomatonState | undefined {
  return automaton.states.find(predicate);
}

export function getStateById<T extends AnyTransition>(
  automaton: Automaton<T>,
  stateId: string,
): AutomatonState | undefined {
  return automaton.states.find((s) => s.id === stateId);
}

export function getTransitionsFrom<T extends AnyTransition>(
  automaton: Automaton<T>,
  stateId: string,
): readonly T[] {
  return automaton.transitions.filter((t) => t.from === stateId);
}

export function getTransitionsTo<T extends AnyTransition>(
  automaton: Automaton<T>,
  stateId: string,
): readonly T[] {
  return automaton.transitions.filter((t) => t.to === stateId);
}

export function getAlphabet<T extends AnyTransition>(automaton: Automaton<T>): Set<string> {
  const symbols = new Set<string>();
  for (const t of automaton.transitions) {
    if (t.read !== '') {
      symbols.add(t.read);
    }
  }
  return symbols;
}
