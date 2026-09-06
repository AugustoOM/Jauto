import { describe, expect, it } from 'vitest';
import type { FiniteAutomaton, PushdownAutomaton, TuringMachine } from '@jauto/core';
import { createDFARunner, createNFARunner, createPDARunner, createTMRunner } from '../src';

const states = [
  { id: 'q0', name: 'q0', x: 0, y: 0, isInitial: true, isFinal: false },
  { id: 'q1', name: 'q1', x: 100, y: 0, isInitial: false, isFinal: true },
] as const;

describe('bounded run outcomes', () => {
  const dfa: FiniteAutomaton = {
    kind: 'fa', states, transitions: [{ id: 't0', from: 'q0', to: 'q1', read: 'a' }],
  };
  const nfa: FiniteAutomaton = {
    kind: 'fa', states, transitions: [
      { id: 't0', from: 'q0', to: 'q0', read: 'a' },
      { id: 't1', from: 'q0', to: 'q1', read: 'a' },
    ],
  };
  const pda: PushdownAutomaton = {
    kind: 'pda', states, transitions: [{ id: 't0', from: 'q0', to: 'q1', read: 'a', pop: '', push: '' }],
  };
  const tm: TuringMachine = {
    kind: 'turing', tapes: 1, states,
    transitions: [{ id: 't0', from: 'q0', to: 'q1', read: 'a', write: 'a', move: 'S' }],
  };

  it.each([
    ['DFA', () => createDFARunner(dfa, 'a')],
    ['NFA', () => createNFARunner(nfa, 'a')],
    ['PDA', () => createPDARunner(pda, 'a')],
    ['TM', () => createTMRunner(tm, 'a')],
  ])('%s reports a zero-step limit without crashing', (_name, createRunner) => {
    const result = createRunner().run(0);
    expect(result).toMatchObject({ accepted: false, outcome: 'step-limit', steps: [] });
    expect(result.finalConfig).toBeDefined();
  });

  it('distinguishes a completed rejection from a step limit', () => {
    const rejected = createDFARunner({ ...dfa, transitions: [] }, 'a').run();
    expect(rejected.outcome).toBe('rejected');
    expect(rejected.steps).toHaveLength(1);
  });
});
