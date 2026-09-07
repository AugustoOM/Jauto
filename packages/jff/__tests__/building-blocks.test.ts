import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runTuringBlockMachine } from '@jauto/simulator';
import { parseJFFDocument, serializeJFFDocument } from '../src';

const fixture = fileURLToPath(new URL('./fixtures/official/asfirst.jff', import.meta.url));

describe('JFLAP Turing building blocks', () => {
  it('imports embedded machines and executes the official transducer', () => {
    const machine = parseJFFDocument(readFileSync(fixture, 'utf8'));
    expect(machine.kind).toBe('turing-blocks');
    if (machine.kind !== 'turing-blocks') return;
    expect(machine.states.every((state) => state.block)).toBe(true);
    expect(runTuringBlockMachine(machine, 'ababa')).toMatchObject({
      outcome: 'accepted',
      tape: 'aaabb',
    });
  });

  it('preserves embedded definitions through JFF export', () => {
    const machine = parseJFFDocument(readFileSync(fixture, 'utf8'));
    if (machine.kind !== 'turing-blocks') return;
    const reopened = parseJFFDocument(serializeJFFDocument(machine));
    expect(reopened.kind).toBe('turing-blocks');
    if (reopened.kind !== 'turing-blocks') return;
    expect(runTuringBlockMachine(reopened, 'bbbaa')).toMatchObject({
      outcome: 'accepted',
      tape: 'aabbb',
    });
  });
});
