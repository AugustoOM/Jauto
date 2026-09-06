import type { AnyAutomaton, AnyTransition } from '@jauto/core';

export function transitionGroupKey(from: string, to: string): string {
  return from === to ? `loop:${from}` : [from, to].sort().join('\u0000');
}

export function buildRenderIndex(automaton: AnyAutomaton) {
  const statesById = new Map(automaton.states.map((state) => [state.id, state]));
  const transitionGroups = new Map<string, AnyTransition[]>();
  for (const transition of automaton.transitions) {
    const key = transitionGroupKey(transition.from, transition.to);
    const group = transitionGroups.get(key);
    if (group) group.push(transition);
    else transitionGroups.set(key, [transition]);
  }
  return { statesById, transitionGroups };
}
