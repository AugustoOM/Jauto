import { describe, it, expect } from 'vitest';
import { createTMRunner } from '../src/tm-runner';
import type { TuringMachine, AutomatonState, TMTransition } from '@jauto/core';

function buildTM(states: AutomatonState[], transitions: TMTransition[]): TuringMachine {
  return { kind: 'turing', states, transitions, tapes: 1 };
}

const s = (id: string, opts: Partial<AutomatonState> = {}): AutomatonState => ({
  id, name: `q${id}`, x: 0, y: 0, isInitial: false, isFinal: false, ...opts,
});

const t = (id: string, from: string, to: string, read: string, write: string, move: 'L' | 'R' | 'S'): TMTransition => ({
  id, from, to, read, write, move,
});

describe('TM Runner', () => {
  // TM that accepts strings of the form 0*1* by scanning right
  const tm = buildTM(
    [s('0', { isInitial: true }), s('1'), s('2', { isFinal: true })],
    [
      t('t0', '0', '0', '0', '0', 'R'),
      t('t1', '0', '1', '1', '1', 'R'),
      t('t2', '1', '1', '1', '1', 'R'),
      t('t3', '1', '2', '', '', 'S'),
      t('t4', '0', '2', '', '', 'S'), // blank from q0 -> accept
    ],
  );

  it('accepts "0011"', () => {
    const runner = createTMRunner(tm, '0011');
    const result = runner.run();
    expect(result.accepted).toBe(true);
  });

  it('accepts "111"', () => {
    const runner = createTMRunner(tm, '111');
    const result = runner.run();
    expect(result.accepted).toBe(true);
  });

  it('accepts "000"', () => {
    const runner = createTMRunner(tm, '000');
    const result = runner.run();
    expect(result.accepted).toBe(true);
  });

  it('halts (rejects) on invalid input "010"', () => {
    const runner = createTMRunner(tm, '010');
    const result = runner.run();
    expect(result.accepted).toBe(false);
  });

  it('step-by-step shows head movement', () => {
    const runner = createTMRunner(tm, '01');
    const s1 = runner.step();
    expect(s1.config.headPosition).toBe(1);

    const s2 = runner.step();
    expect(s2.config.headPosition).toBe(2);
  });

  it('reset returns to initial config', () => {
    const runner = createTMRunner(tm, '01');
    runner.step();
    runner.step();
    runner.reset();
    expect(runner.currentConfig.headPosition).toBe(0);
    expect(runner.currentConfig.stepCount).toBe(0);
  });
});
