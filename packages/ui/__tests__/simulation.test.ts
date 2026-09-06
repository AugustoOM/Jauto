import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { FiniteAutomaton } from '@jauto/core';
import { useSimulationStore } from '../src/stores/simulation';

function finiteAutomaton(
  transitions: FiniteAutomaton['transitions'],
  finalState = 'q2',
): FiniteAutomaton {
  return {
    kind: 'fa',
    states: [
      { id: 'q0', name: 'q0', x: 0, y: 0, isInitial: true, isFinal: false },
      { id: 'q1', name: 'q1', x: 100, y: 0, isInitial: false, isFinal: false },
      { id: 'q2', name: 'q2', x: 200, y: 0, isInitial: false, isFinal: finalState === 'q2' },
    ],
    transitions,
  };
}

describe('simulation store finite-automaton routing', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('accepts empty input through an epsilon closure', () => {
    const simulation = useSimulationStore();
    simulation.input = '';
    simulation.start(finiteAutomaton([
      { id: 't0', from: 'q0', to: 'q2', read: '' },
    ]));

    expect(simulation.status).toBe('accepted');
    expect(simulation.highlightedStates).toEqual(new Set(['q0', 'q2']));
  });

  it('explores all nondeterministic branches for the next symbol', () => {
    const simulation = useSimulationStore();
    const automaton = finiteAutomaton([
      { id: 't0', from: 'q0', to: 'q1', read: 'a' },
      { id: 't1', from: 'q0', to: 'q2', read: 'a' },
    ]);
    simulation.input = 'a';
    simulation.start(automaton);
    simulation.step(automaton);

    expect(simulation.status).toBe('accepted');
    expect(simulation.highlightedStates).toEqual(new Set(['q1', 'q2']));
  });

  it('reports acceptance immediately when a deterministic initial state is final', () => {
    const simulation = useSimulationStore();
    const automaton: FiniteAutomaton = {
      kind: 'fa',
      states: [{ id: 'q0', name: 'q0', x: 0, y: 0, isInitial: true, isFinal: true }],
      transitions: [],
    };
    simulation.start(automaton);

    expect(simulation.status).toBe('accepted');
  });
});
