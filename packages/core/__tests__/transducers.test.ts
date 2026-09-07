import { describe, expect, it } from 'vitest';
import { runTransducer, type MealyMachine, type MooreMachine } from '../src';

const base = { id: '0', name: 'q0', x: 0, y: 0, isInitial: true };

describe('Mealy and Moore transducers', () => {
  it('runs a Mealy bit complement machine', () => {
    const machine: MealyMachine = {
      kind: 'mealy',
      states: [base],
      transitions: [
        { id: '0', from: '0', to: '0', read: '0', output: '1' },
        { id: '1', from: '0', to: '0', read: '1', output: '0' },
      ],
    };
    expect(runTransducer(machine, '101')).toMatchObject({ output: '010', complete: true });
  });

  it('emits the initial state output under JFLAP Moore semantics', () => {
    const machine: MooreMachine = {
      kind: 'moore',
      states: [
        { ...base, output: 'x' },
        { ...base, id: '1', isInitial: false, output: 'y' },
      ],
      transitions: [{ id: '0', from: '0', to: '1', read: 'a' }],
    };
    expect(runTransducer(machine, '')).toMatchObject({ output: 'x', complete: true });
    expect(runTransducer(machine, 'a')).toMatchObject({ output: 'xy', complete: true });
    expect(runTransducer(machine, 'aa')).toMatchObject({ output: 'xy', complete: false });
  });

  it('refuses nondeterministic transducers', () => {
    const machine: MealyMachine = {
      kind: 'mealy',
      states: [base],
      transitions: [
        { id: '0', from: '0', to: '0', read: 'a', output: 'x' },
        { id: '1', from: '0', to: '0', read: 'ab', output: 'y' },
      ],
    };
    expect(() => runTransducer(machine, 'ab')).toThrow('deterministic');
  });
});
