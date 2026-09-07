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
  // q0: confirm the JFLAP-provided Z bottom marker and move to q1
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
      t('t0', '0', '1', '', 'Z', 'Z'),      // retain the initial bottom marker
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

  it('starts with JFLAP bottom marker Z and keeps terminal acceptance idempotent', () => {
    const acceptsEmpty = buildPDA([s('0', { isInitial: true, isFinal: true })], []);
    const runner = createPDARunner(acceptsEmpty, '');
    expect(runner.currentConfig.stack).toEqual(['Z']);
    expect(runner.step().status).toBe('accepted');
    expect(runner.step().status).toBe('accepted');
    expect(runner.currentConfig.stack).toEqual(['Z']);
  });

  it('matches complete read and stack strings with the leftmost stack symbol on top', () => {
    const stringPda = buildPDA(
      [s('0', { isInitial: true }), s('1'), s('2', { isFinal: true })],
      [
        t('t0', '0', '1', 'ab', 'Z', 'xyZ'),
        t('t1', '1', '2', 'cd', 'xy', ''),
      ],
    );
    expect(createPDARunner(stringPda, 'abcd').run().outcome).toBe('accepted');
    expect(createPDARunner(stringPda, 'abd').run().outcome).toBe('rejected');
  });

  it('retains every active stack configuration and its transition path', () => {
    const branching = buildPDA(
      [s('0', { isInitial: true }), s('1', { isFinal: true }), s('2')],
      [t('accept', '0', '1', 'a', '', 'A'), t('other', '0', '2', 'a', '', 'B')],
    );
    const result = createPDARunner(branching, 'a').step();

    expect(result.transitionIds).toEqual(['accept', 'other']);
    expect(result.configurations.map((branch) => branch.config.stack)).toEqual([['Z', 'A'], ['Z', 'B']]);
    expect(result.acceptingPath).toEqual(['accept']);
  });
});
