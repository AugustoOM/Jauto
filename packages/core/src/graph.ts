import type { Automaton, AutomatonState, AnyTransition, AnyAutomaton, AutomatonKind, FATransition, PDATransition, TMTransition } from './types';

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

export function getAlphabet(automaton: AnyAutomaton): Set<string> {
  const symbols = new Set<string>();
  switch (automaton.kind) {
    case 'fa': {
      for (const t of automaton.transitions) {
        const ft = t as FATransition;
        if (ft.read !== '') {
          symbols.add(ft.read);
        }
      }
      break;
    }
    case 'pda': {
      for (const t of automaton.transitions) {
        const pt = t as PDATransition;
        if (pt.read !== '') symbols.add(pt.read);
        if (pt.pop !== '') symbols.add(pt.pop);
        if (pt.push !== '') symbols.add(pt.push);
      }
      break;
    }
    case 'turing': {
      for (const t of automaton.transitions) {
        const tt = t as TMTransition;
        if (tt.read !== '') symbols.add(tt.read);
        if (tt.write !== '') symbols.add(tt.write);
      }
      break;
    }
  }
  return symbols;
}
