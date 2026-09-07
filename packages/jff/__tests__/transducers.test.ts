import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runTransducer } from '@jauto/core';
import { parseJFFDocument, serializeJFFDocument } from '../src';

const fixture = (name: string) =>
  readFileSync(fileURLToPath(new URL(`./fixtures/official/${name}`, import.meta.url)), 'utf8');

describe('JFLAP Mealy and Moore documents', () => {
  it('runs and preserves the official Mealy NOT machine', () => {
    const machine = parseJFFDocument(fixture('mealyNOT.jff'));
    expect(machine.kind).toBe('mealy');
    if (machine.kind !== 'mealy') return;
    expect(runTransducer(machine, '101')).toMatchObject({ output: '010', complete: true });
    const reopened = parseJFFDocument(serializeJFFDocument(machine));
    expect(reopened.kind === 'mealy' && runTransducer(reopened, '001').output).toBe('110');
  });

  it('uses JFLAP initial-output semantics for the official Moore NOT machine', () => {
    const machine = parseJFFDocument(fixture('mooreNOT.jff'));
    expect(machine.kind).toBe('moore');
    if (machine.kind !== 'moore') return;
    expect(runTransducer(machine, '101')).toMatchObject({ output: '010', complete: true });
    const reopened = parseJFFDocument(serializeJFFDocument(machine));
    expect(reopened.kind === 'moore' && runTransducer(reopened, '001').output).toBe('110');
  });
});
