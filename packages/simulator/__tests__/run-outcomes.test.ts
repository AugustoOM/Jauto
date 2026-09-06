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
    expect(result).toMatchObject({ accepted: false, outcome: 'incomplete', incompleteReason: 'step-limit', steps: [] });
    expect(result.finalConfig).toBeDefined();
  });

  it('distinguishes a completed rejection from a step limit', () => {
    const rejected = createDFARunner({ ...dfa, transitions: [] }, 'a').run();
    expect(rejected.outcome).toBe('rejected');
    expect(rejected.steps).toHaveLength(1);
  });

  it.each([
    ['negative', -1],
    ['fractional', 1.5],
    ['infinite', Number.POSITIVE_INFINITY],
  ])('rejects a %s execution budget', (_name, budget) => {
    expect(() => createDFARunner(dfa, 'a').run(budget)).toThrow(RangeError);
  });

  it('reports PDA configuration exhaustion without treating it as rejection', () => {
    const branchStates = Array.from({ length: 1001 }, (_, index) => ({
      id: `q${index + 1}`,
      name: `q${index + 1}`,
      x: index,
      y: 0,
      isInitial: false,
      isFinal: false,
    }));
    const branching: PushdownAutomaton = {
      kind: 'pda',
      states: [states[0], ...branchStates],
      transitions: branchStates.map((state, index) => ({
        id: `t${index}`,
        from: 'q0',
        to: state.id,
        read: 'a',
        pop: '',
        push: String(index),
      })),
    };
    expect(createPDARunner(branching, 'a').run()).toMatchObject({
      accepted: false,
      outcome: 'incomplete',
      incompleteReason: 'configuration-limit',
    });
  });

  it.each([
    ['DFA', () => createDFARunner(dfa, 'a')],
    ['NFA', () => createNFARunner(nfa, 'a')],
    ['PDA', () => createPDARunner(pda, 'a')],
    ['TM', () => createTMRunner(tm, 'a')],
  ])('%s terminal steps are idempotent', (_name, createRunner) => {
    const runner = createRunner();
    runner.run();
    const first = runner.step();
    const second = runner.step();
    expect(second).toEqual(first);
  });

  it.each([
    ['DFA', () => createDFARunner(dfa, 'a')],
    ['NFA', () => createNFARunner(nfa, 'a')],
    ['PDA', () => createPDARunner(pda, 'a')],
    ['TM', () => createTMRunner(tm, 'a')],
  ])('%s exposes cancellation as a terminal outcome', (_name, createRunner) => {
    const runner = createRunner();
    runner.cancel();
    expect(runner.run()).toMatchObject({ accepted: false, outcome: 'canceled' });
    expect(runner.step().status).toBe('canceled');
  });
});
