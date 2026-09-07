import { describe, expect, it } from 'vitest';
import type { TuringBlockMachine } from '@jauto/core';
import { runTuringBlockMachine } from '../src';

const state = (id: string, initial = false, final = false) => ({
  id,
  name: id,
  x: 0,
  y: 0,
  isInitial: initial,
  isFinal: final,
});

describe('Turing building blocks', () => {
  it('runs a nested block until it halts and then follows the outer edge', () => {
    const nested: TuringBlockMachine = {
      kind: 'turing-blocks',
      tapes: 1,
      states: [state('n0', true), state('n1')],
      transitions: [{ id: 'n', from: 'n0', to: 'n1', read: '~', write: 'x', move: 'R' }],
    };
    const machine: TuringBlockMachine = {
      kind: 'turing-blocks',
      tapes: 1,
      states: [
        { ...state('b', true), block: { tag: 'write.jff', machine: nested } },
        state('done', false, true),
      ],
      transitions: [
        { id: 'out', from: 'b', to: 'done', read: '~', write: '~', move: 'S', blockEdge: true },
      ],
    };
    expect(runTuringBlockMachine(machine, 'a')).toMatchObject({ outcome: 'accepted', tape: 'x' });
  });

  it('supports not, identity, and variable-assignment shortcuts', () => {
    const machine: TuringBlockMachine = {
      kind: 'turing-blocks',
      tapes: 1,
      states: [state('0', true), state('1'), state('2', false, true)],
      transitions: [
        { id: 'a', from: '0', to: '1', read: 'a,b}w', write: '~', move: 'R' },
        { id: 'b', from: '1', to: '2', read: '!□', write: 'w', move: 'S' },
      ],
    };
    expect(runTuringBlockMachine(machine, 'ab')).toMatchObject({ outcome: 'accepted', tape: 'aa' });
  });
});
