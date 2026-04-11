import { describe, it, expect } from 'vitest';
import {
  addState,
  removeState,
  updateState,
  addTransition,
  removeTransition,
  updateTransition,
  findState,
  getStateById,
  getTransitionsFrom,
  getTransitionsTo,
  getAlphabet,
  createEmptyAutomaton,
} from '../src/index';
import type { AutomatonState, FATransition, FiniteAutomaton } from '../src/index';

function makeState(overrides: Partial<AutomatonState> = {}): AutomatonState {
  return {
    id: 's0',
    name: 'q0',
    x: 100,
    y: 200,
    isInitial: false,
    isFinal: false,
    ...overrides,
  };
}

function makeTrans(overrides: Partial<FATransition> = {}): FATransition {
  return {
    id: 't0',
    from: 's0',
    to: 's1',
    read: 'a',
    ...overrides,
  };
}

describe('graph operations', () => {
  describe('addState', () => {
    it('adds a state to an empty automaton', () => {
      const fa = createEmptyAutomaton('fa');
      const state = makeState();
      const result = addState(fa, state);
      expect(result.states).toHaveLength(1);
      expect(result.states[0]).toEqual(state);
    });

    it('does not mutate the original automaton', () => {
      const fa = createEmptyAutomaton('fa');
      const result = addState(fa, makeState());
      expect(fa.states).toHaveLength(0);
      expect(result.states).toHaveLength(1);
    });
  });

  describe('removeState', () => {
    it('removes a state and its connected transitions', () => {
      let fa: FiniteAutomaton = createEmptyAutomaton('fa');
      fa = addState(fa, makeState({ id: 's0' }));
      fa = addState(fa, makeState({ id: 's1', name: 'q1' }));
      fa = addTransition(fa, makeTrans({ id: 't0', from: 's0', to: 's1' }));
      fa = addTransition(fa, makeTrans({ id: 't1', from: 's1', to: 's0', read: 'b' }));

      const result = removeState(fa, 's0');
      expect(result.states).toHaveLength(1);
      expect(result.states[0]!.id).toBe('s1');
      expect(result.transitions).toHaveLength(0);
    });
  });

  describe('updateState', () => {
    it('updates state properties immutably', () => {
      let fa: FiniteAutomaton = createEmptyAutomaton('fa');
      fa = addState(fa, makeState({ id: 's0', name: 'q0' }));

      const result = updateState(fa, 's0', { name: 'start', isFinal: true });
      expect(result.states[0]!.name).toBe('start');
      expect(result.states[0]!.isFinal).toBe(true);
      expect(fa.states[0]!.name).toBe('q0');
    });
  });

  describe('addTransition', () => {
    it('adds a transition', () => {
      let fa: FiniteAutomaton = createEmptyAutomaton('fa');
      fa = addState(fa, makeState({ id: 's0' }));
      fa = addState(fa, makeState({ id: 's1' }));
      const result = addTransition(fa, makeTrans());
      expect(result.transitions).toHaveLength(1);
    });
  });

  describe('removeTransition', () => {
    it('removes a transition by id', () => {
      let fa: FiniteAutomaton = createEmptyAutomaton('fa');
      fa = addTransition(fa, makeTrans({ id: 't0' }));
      fa = addTransition(fa, makeTrans({ id: 't1', read: 'b' }));
      const result = removeTransition(fa, 't0');
      expect(result.transitions).toHaveLength(1);
      expect(result.transitions[0]!.id).toBe('t1');
    });
  });

  describe('updateTransition', () => {
    it('updates transition properties immutably', () => {
      let fa: FiniteAutomaton = createEmptyAutomaton('fa');
      fa = addTransition(fa, makeTrans({ id: 't0', read: 'a' }));

      const result = updateTransition(fa, 't0', { read: 'b' });
      expect(result.transitions[0]!.read).toBe('b');
      expect(fa.transitions[0]!.read).toBe('a');
    });
  });

  describe('findState', () => {
    it('finds a state matching a predicate', () => {
      let fa: FiniteAutomaton = createEmptyAutomaton('fa');
      fa = addState(fa, makeState({ id: 's0', isFinal: false }));
      fa = addState(fa, makeState({ id: 's1', name: 'q1', isFinal: true }));

      const found = findState(fa, (s) => s.isFinal);
      expect(found?.id).toBe('s1');
    });

    it('returns undefined when no match', () => {
      const fa = createEmptyAutomaton('fa');
      expect(findState(fa, () => true)).toBeUndefined();
    });
  });

  describe('getStateById', () => {
    it('returns the state with the given id', () => {
      let fa: FiniteAutomaton = createEmptyAutomaton('fa');
      fa = addState(fa, makeState({ id: 's0', name: 'q0' }));
      fa = addState(fa, makeState({ id: 's1', name: 'q1' }));

      expect(getStateById(fa, 's1')?.name).toBe('q1');
      expect(getStateById(fa, 'missing')).toBeUndefined();
    });
  });

  describe('getTransitionsFrom / getTransitionsTo', () => {
    it('filters transitions by source/target', () => {
      let fa: FiniteAutomaton = createEmptyAutomaton('fa');
      fa = addTransition(fa, makeTrans({ id: 't0', from: 's0', to: 's1' }));
      fa = addTransition(fa, makeTrans({ id: 't1', from: 's0', to: 's2', read: 'b' }));
      fa = addTransition(fa, makeTrans({ id: 't2', from: 's1', to: 's0', read: 'c' }));

      expect(getTransitionsFrom(fa, 's0')).toHaveLength(2);
      expect(getTransitionsTo(fa, 's0')).toHaveLength(1);
    });
  });

  describe('getAlphabet', () => {
    it('collects unique non-epsilon symbols', () => {
      let fa: FiniteAutomaton = createEmptyAutomaton('fa');
      fa = addTransition(fa, makeTrans({ id: 't0', read: 'a' }));
      fa = addTransition(fa, makeTrans({ id: 't1', read: 'b' }));
      fa = addTransition(fa, makeTrans({ id: 't2', read: 'a' }));
      fa = addTransition(fa, makeTrans({ id: 't3', read: '' })); // epsilon

      const alphabet = getAlphabet(fa);
      expect(alphabet.size).toBe(2);
      expect(alphabet.has('a')).toBe(true);
      expect(alphabet.has('b')).toBe(true);
      expect(alphabet.has('')).toBe(false);
    });
  });
});
