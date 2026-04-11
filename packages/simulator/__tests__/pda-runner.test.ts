import { describe, it, expect } from 'vitest';
import { createPDARunner } from '../src/pda-runner';
import type { PushdownAutomaton, AutomatonState, PDATransition } from '@jauto/core';

function buildPDA(states: AutomatonState[], transitions: PDATransition[]): PushdownAutomaton {
  return { kind: 'pda', states, transitions };
}

const s = (id: string, opts: Partial<AutomatonState> = {}): AutomatonState => ({
  id, name: `q${id}`, x: 0, y: 0, isInitial: false, isFinal: false, ...opts,
});

const t = (id: string, from: string, to: string, read: string, pop: string, push: string): PDATransition => ({
  id, from, to, read, pop, push,
});

describe('PDA Runner', () => {
  // PDA for a^n b^n (n >= 0) by final state.
  // q0: push Z (bottom marker) and move to q1
  // q1: for each 'a', push A
  // q1: epsilon to q2
  // q2: for each 'b', pop A
  // q2: if see Z, pop and go to q3 (accept)
  const pda = buildPDA(
    [
      s('0', { isInitial: true }),
      s('1'),
      s('2'),
      s('3', { isFinal: true }),
    ],
    [
      t('t0', '0', '1', '', '', 'Z'),      // push bottom marker
      t('t1', '1', '1', 'a', '', 'A'),      // push A for each a
      t('t2', '1', '2', '', '', ''),         // switch to matching b's
      t('t3', '2', '2', 'b', 'A', ''),      // pop A for each b
      t('t4', '2', '3', '', 'Z', ''),        // pop Z, accept
    ],
  );

  it('accepts "aabb"', () => {
    const runner = createPDARunner(pda, 'aabb');
    const result = runner.run();
    expect(result.accepted).toBe(true);
  });

  it('accepts "ab"', () => {
    const runner = createPDARunner(pda, 'ab');
    const result = runner.run();
    expect(result.accepted).toBe(true);
  });

  it('accepts empty string', () => {
    const runner = createPDARunner(pda, '');
    const result = runner.run();
    expect(result.accepted).toBe(true);
  });

  it('rejects "aab" (more a than b)', () => {
    const runner = createPDARunner(pda, 'aab');
    const result = runner.run();
    expect(result.accepted).toBe(false);
  });

  it('rejects "abb" (more b than a)', () => {
    const runner = createPDARunner(pda, 'abb');
    const result = runner.run();
    expect(result.accepted).toBe(false);
  });

  it('rejects "ba" (wrong order)', () => {
    const runner = createPDARunner(pda, 'ba');
    const result = runner.run();
    expect(result.accepted).toBe(false);
  });
});
