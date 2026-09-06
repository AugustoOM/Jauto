import { describe, expect, it } from 'vitest';
import { getInputAlphabet, getStackAlphabet, getTapeAlphabet } from '../src';
import type { FiniteAutomaton, PushdownAutomaton, TuringMachine } from '../src';

const states = [{ id: 'q0', name: 'q0', x: 0, y: 0, isInitial: true, isFinal: false }];

describe('machine-specific alphabets', () => {
  it('separates input symbols from epsilon', () => {
    const automaton: FiniteAutomaton = { kind: 'fa', states, transitions: [
      { id: 'a', from: 'q0', to: 'q0', read: 'ab' },
      { id: 'epsilon', from: 'q0', to: 'q0', read: '' },
    ] };
    expect(getInputAlphabet(automaton)).toEqual(new Set(['a', 'b']));
  });

  it('collects PDA stack symbols separately and includes initial Z', () => {
    const automaton: PushdownAutomaton = { kind: 'pda', states, transitions: [
      { id: 't', from: 'q0', to: 'q0', read: 'a', pop: 'XY', push: 'Q' },
    ] };
    expect(getInputAlphabet(automaton)).toEqual(new Set(['a']));
    expect(getStackAlphabet(automaton)).toEqual(new Set(['Z', 'X', 'Y', 'Q']));
  });

  it('collects tape reads, writes, and blank', () => {
    const automaton: TuringMachine = { kind: 'turing', tapes: 1, states, transitions: [
      { id: 't', from: 'q0', to: 'q0', read: 'a', write: 'x', move: 'R' },
    ] };
    expect(getTapeAlphabet(automaton)).toEqual(new Set(['\u25A1', 'a', 'x']));
  });
});
