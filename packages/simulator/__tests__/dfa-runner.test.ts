import { describe, it, expect } from 'vitest';
import { createDFARunner } from '../src/dfa-runner';
import type { FiniteAutomaton, AutomatonState, FATransition } from '@jauto/core';

function buildDFA(states: AutomatonState[], transitions: FATransition[]): FiniteAutomaton {
  return { kind: 'fa', states, transitions };
}

const s = (id: string, opts: Partial<AutomatonState> = {}): AutomatonState => ({
  id, name: `q${id}`, x: 0, y: 0, isInitial: false, isFinal: false, ...opts,
});

const t = (id: string, from: string, to: string, read: string): FATransition => ({
  id, from, to, read,
});

describe('DFA Runner', () => {
  const dfa = buildDFA(
    [s('0', { isInitial: true }), s('1', { isFinal: true })],
    [t('t0', '0', '1', 'a'), t('t1', '0', '0', 'b'), t('t2', '1', '1', 'a'), t('t3', '1', '0', 'b')],
  );

  it('accepts "a"', () => {
    const runner = createDFARunner(dfa, 'a');
    const result = runner.run();
    expect(result.accepted).toBe(true);
  });

  it('accepts "aaa"', () => {
    const runner = createDFARunner(dfa, 'aaa');
    const result = runner.run();
    expect(result.accepted).toBe(true);
  });

  it('rejects "b"', () => {
    const runner = createDFARunner(dfa, 'b');
    const result = runner.run();
    expect(result.accepted).toBe(false);
  });

  it('rejects "ab"', () => {
    const runner = createDFARunner(dfa, 'ab');
    const result = runner.run();
    expect(result.accepted).toBe(false);
  });

  it('rejects empty string', () => {
    const runner = createDFARunner(dfa, '');
    const result = runner.run();
    expect(result.accepted).toBe(false);
  });

  it('step-by-step returns correct states', () => {
    const runner = createDFARunner(dfa, 'ab');
    const s1 = runner.step();
    expect(s1.config.currentState).toBe('1');
    expect(s1.status).toBe('running');

    const s2 = runner.step();
    expect(s2.config.currentState).toBe('0');
    expect(s2.status).toBe('rejected');
  });

  it('reset returns to initial config', () => {
    const runner = createDFARunner(dfa, 'a');
    runner.step();
    runner.reset();
    expect(runner.currentConfig.currentState).toBe('0');
    expect(runner.currentConfig.remainingInput).toBe('a');
  });

  it('rejects on missing transition', () => {
    const small = buildDFA(
      [s('0', { isInitial: true }), s('1', { isFinal: true })],
      [t('t0', '0', '1', 'a')],
    );
    const runner = createDFARunner(small, 'b');
    const result = runner.run();
    expect(result.accepted).toBe(false);
  });
});
