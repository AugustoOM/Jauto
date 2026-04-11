import { describe, it, expect } from 'vitest';
import { createNFARunner } from '../src/nfa-runner';
import type { FiniteAutomaton, AutomatonState, FATransition } from '@jauto/core';

function buildNFA(states: AutomatonState[], transitions: FATransition[]): FiniteAutomaton {
  return { kind: 'fa', states, transitions };
}

const s = (id: string, opts: Partial<AutomatonState> = {}): AutomatonState => ({
  id, name: `q${id}`, x: 0, y: 0, isInitial: false, isFinal: false, ...opts,
});

const t = (id: string, from: string, to: string, read: string): FATransition => ({
  id, from, to, read,
});

describe('NFA Runner', () => {
  it('accepts via epsilon transitions', () => {
    const nfa = buildNFA(
      [s('0', { isInitial: true }), s('1'), s('2', { isFinal: true })],
      [t('t0', '0', '1', ''), t('t1', '0', '0', 'a'), t('t2', '1', '2', 'b')],
    );
    const runner = createNFARunner(nfa, 'b');
    const result = runner.run();
    expect(result.accepted).toBe(true);
  });

  it('accepts with multiple branches', () => {
    const nfa = buildNFA(
      [s('0', { isInitial: true }), s('1'), s('2', { isFinal: true })],
      [t('t0', '0', '1', 'a'), t('t1', '0', '2', 'a')],
    );
    const runner = createNFARunner(nfa, 'a');
    const result = runner.run();
    expect(result.accepted).toBe(true);
  });

  it('rejects when no branch reaches final', () => {
    const nfa = buildNFA(
      [s('0', { isInitial: true }), s('1'), s('2', { isFinal: true })],
      [t('t0', '0', '1', 'a')],
    );
    const runner = createNFARunner(nfa, 'a');
    const result = runner.run();
    expect(result.accepted).toBe(false);
  });

  it('step returns active state set', () => {
    const nfa = buildNFA(
      [s('0', { isInitial: true }), s('1'), s('2')],
      [t('t0', '0', '1', 'a'), t('t1', '0', '2', 'a')],
    );
    const runner = createNFARunner(nfa, 'a');
    runner.step();
    const config = runner.currentConfig;
    expect(config.activeStates.size).toBe(2);
    expect(config.activeStates.has('1')).toBe(true);
    expect(config.activeStates.has('2')).toBe(true);
  });

  it('epsilon closure is computed at init', () => {
    const nfa = buildNFA(
      [s('0', { isInitial: true }), s('1', { isFinal: true })],
      [t('t0', '0', '1', '')],
    );
    const runner = createNFARunner(nfa, '');
    expect(runner.isAccepted).toBe(true);
  });
});
