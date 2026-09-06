import { describe, it, expect } from 'vitest';
import {
  createEmptyAutomaton,
  addState,
  addTransition,
} from '../src/index';
import {
  hasInitialState,
  isDeterministic,
  isComplete,
  hasUnreachableStates,
  validate,
} from '../src/validation';
import type { AutomatonState, FATransition, FiniteAutomaton, PushdownAutomaton, TuringMachine } from '../src/index';

function s(id: string, opts: Partial<AutomatonState> = {}): AutomatonState {
  return { id, name: `q${id}`, x: 0, y: 0, isInitial: false, isFinal: false, ...opts };
}

function t(id: string, from: string, to: string, read: string): FATransition {
  return { id, from, to, read };
}

function buildFA(
  states: AutomatonState[],
  transitions: FATransition[],
): FiniteAutomaton {
  let fa: FiniteAutomaton = createEmptyAutomaton('fa');
  for (const state of states) fa = addState(fa, state);
  for (const trans of transitions) fa = addTransition(fa, trans);
  return fa;
}

describe('validation', () => {
  describe('hasInitialState', () => {
    it('returns false for empty automaton', () => {
      expect(hasInitialState(createEmptyAutomaton('fa'))).toBe(false);
    });

    it('returns true when an initial state exists', () => {
      const fa = buildFA([s('0', { isInitial: true })], []);
      expect(hasInitialState(fa)).toBe(true);
    });
  });

  describe('isDeterministic', () => {
    it('returns true for a proper DFA', () => {
      const fa = buildFA(
        [s('0', { isInitial: true }), s('1', { isFinal: true })],
        [t('t0', '0', '1', 'a'), t('t1', '0', '0', 'b'), t('t2', '1', '1', 'a'), t('t3', '1', '0', 'b')],
      );
      expect(isDeterministic(fa)).toBe(true);
    });

    it('returns false when epsilon transitions exist', () => {
      const fa = buildFA(
        [s('0'), s('1')],
        [t('t0', '0', '1', '')],
      );
      expect(isDeterministic(fa)).toBe(false);
    });

    it('returns false when multiple transitions on same symbol', () => {
      const fa = buildFA(
        [s('0'), s('1'), s('2')],
        [t('t0', '0', '1', 'a'), t('t1', '0', '2', 'a')],
      );
      expect(isDeterministic(fa)).toBe(false);
    });

    it('returns false for prefix-overlapping string transitions', () => {
      const fa = buildFA(
        [s('0'), s('1'), s('2')],
        [t('t0', '0', '1', 'a'), t('t1', '0', '2', 'ab')],
      );
      expect(isDeterministic(fa)).toBe(false);
    });

    it('detects overlapping PDA epsilon and stack patterns', () => {
      const pda: PushdownAutomaton = {
        kind: 'pda',
        states: [s('0')],
        transitions: [
          { id: 't0', from: '0', to: '0', read: '', pop: '', push: 'A' },
          { id: 't1', from: '0', to: '0', read: 'a', pop: 'Z', push: '' },
        ],
      };
      expect(isDeterministic(pda)).toBe(false);
    });

    it('treats empty and explicit blank TM reads as the same symbol', () => {
      const tm: TuringMachine = {
        kind: 'turing', tapes: 1, states: [s('0')],
        transitions: [
          { id: 'empty', from: '0', to: '0', read: '', write: '', move: 'R' },
          { id: 'blank', from: '0', to: '0', read: '\u25A1', write: '', move: 'L' },
        ],
      };
      expect(isDeterministic(tm)).toBe(false);
    });
  });

  describe('isComplete', () => {
    it('returns true when every state covers every symbol', () => {
      const fa = buildFA(
        [s('0'), s('1')],
        [t('t0', '0', '1', 'a'), t('t1', '0', '0', 'b'), t('t2', '1', '0', 'a'), t('t3', '1', '1', 'b')],
      );
      expect(isComplete(fa)).toBe(true);
    });

    it('returns false when a state is missing a transition for a symbol', () => {
      const fa = buildFA(
        [s('0'), s('1')],
        [t('t0', '0', '1', 'a'), t('t1', '1', '0', 'b')],
      );
      expect(isComplete(fa)).toBe(false);
    });

    it('checks generalized FA completeness per input symbol', () => {
      const fa = buildFA([s('0')], [t('t0', '0', '0', 'ab')]);
      expect(isComplete(fa)).toBe(false);
    });

    it('checks PDA input/stack coverage instead of assuming completeness', () => {
      const incomplete: PushdownAutomaton = {
        kind: 'pda', states: [s('0')],
        transitions: [{ id: 't', from: '0', to: '0', read: 'a', pop: 'Z', push: 'Z' }],
      };
      expect(isComplete(incomplete)).toBe(true);
      expect(isComplete({ ...incomplete, states: [...incomplete.states, s('1')] })).toBe(false);
    });

    it('requires TM transitions for every tape symbol from every state', () => {
      const tm: TuringMachine = {
        kind: 'turing', tapes: 1, states: [s('0')],
        transitions: [
          { id: 'a', from: '0', to: '0', read: 'a', write: 'a', move: 'R' },
          { id: 'blank', from: '0', to: '0', read: '', write: '', move: 'R' },
        ],
      };
      expect(isComplete(tm)).toBe(true);
      expect(isComplete({ ...tm, transitions: tm.transitions.slice(0, 1) })).toBe(false);
    });
  });

  describe('hasUnreachableStates', () => {
    it('returns false when all states are reachable', () => {
      const fa = buildFA(
        [s('0', { isInitial: true }), s('1')],
        [t('t0', '0', '1', 'a')],
      );
      expect(hasUnreachableStates(fa)).toBe(false);
    });

    it('returns true when a state is disconnected', () => {
      const fa = buildFA(
        [s('0', { isInitial: true }), s('1'), s('2')],
        [t('t0', '0', '1', 'a')],
      );
      expect(hasUnreachableStates(fa)).toBe(true);
    });
  });

  describe('validate', () => {
    it('reports no initial state', () => {
      const fa = buildFA([s('0')], []);
      const diags = validate(fa);
      expect(diags.some((d) => d.message.includes('No initial state'))).toBe(true);
    });

    it('reports missing target state in transition', () => {
      const fa = buildFA(
        [s('0', { isInitial: true })],
        [t('t0', '0', 'ghost', 'a')],
      );
      const diags = validate(fa);
      expect(diags.some((d) => d.message.includes('ghost'))).toBe(true);
    });

    it('warns about no final states', () => {
      const fa = buildFA([s('0', { isInitial: true })], []);
      const diags = validate(fa);
      expect(diags.some((d) => d.level === 'warning' && d.message.includes('accepting'))).toBe(true);
    });
  });
});
