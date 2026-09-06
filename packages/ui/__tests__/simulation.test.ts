import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import type { FiniteAutomaton } from '@jauto/core';
import { useSimulationStore } from '../src/stores/simulation';
import { useDocumentStore } from '../src/stores/document';

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

  it('replays cached snapshots without moving the execution head', () => {
    const simulation = useSimulationStore();
    const automaton = finiteAutomaton([
      { id: 'first', from: 'q0', to: 'q1', read: 'a' },
      { id: 'second', from: 'q1', to: 'q2', read: 'b' },
    ]);
    simulation.input = 'ab';
    simulation.start(automaton);
    simulation.nextStep(automaton);
    simulation.nextStep(automaton);

    expect(simulation.executionIndex).toBe(2);
    expect(simulation.transitionHighlights.map((item) => item.transitionId)).toEqual(['second']);
    simulation.previousStep();
    expect(simulation.activeTraceIndex).toBe(1);
    expect(simulation.executionIndex).toBe(2);
    expect(simulation.transitionHighlights.map((item) => item.transitionId)).toEqual(['first']);
    simulation.nextStep(automaton);
    expect(simulation.traceSteps).toHaveLength(3);
  });

  it('keeps layout edits active and invalidates semantic edits', async () => {
    const document = useDocumentStore();
    const simulation = useSimulationStore();
    const automaton = finiteAutomaton([{ id: 't0', from: 'q0', to: 'q2', read: 'a' }]);
    document.loadAutomaton(automaton);
    simulation.input = 'a';
    simulation.start(document.automaton);

    document.setAutomaton({ ...automaton, states: automaton.states.map((state) => ({ ...state, x: state.x + 10 })) });
    await nextTick();
    expect(simulation.status).toBe('running');

    document.setAutomaton({ ...document.automaton, transitions: [{ ...document.automaton.transitions[0]!, read: 'b' }] });
    await nextTick();
    expect(simulation.status).toBe('invalid');
    expect(simulation.errorMessage).toContain('machine changed');
  });
});
