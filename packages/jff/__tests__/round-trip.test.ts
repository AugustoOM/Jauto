import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseJFF } from '../src/parser';
import { serializeJFF } from '../src/serializer';

function fixture(name: string): string {
  return readFileSync(resolve(__dirname, 'fixtures', name), 'utf-8');
}

function roundTrip(name: string) {
  const original = parseJFF(fixture(name));
  const xml = serializeJFF(original.automaton);
  const reparsed = parseJFF(xml);
  return { original: original.automaton, reparsed: reparsed.automaton };
}

function stripIds<T extends { id: string }>(items: readonly T[]): Omit<T, 'id'>[] {
  return items.map(({ id: _, ...rest }) => rest as Omit<T, 'id'>);
}

describe('round-trip: parse → serialize → parse', () => {
  it('dfa-simple.jff round-trips states correctly', () => {
    const { original, reparsed } = roundTrip('dfa-simple.jff');
    expect(reparsed.kind).toBe(original.kind);
    expect(reparsed.states).toEqual(original.states);
  });

  it('dfa-simple.jff round-trips transitions (ignoring generated IDs)', () => {
    const { original, reparsed } = roundTrip('dfa-simple.jff');
    expect(stripIds(reparsed.transitions)).toEqual(stripIds(original.transitions));
  });

  it('nfa-epsilon.jff round-trips', () => {
    const { original, reparsed } = roundTrip('nfa-epsilon.jff');
    expect(reparsed.states).toEqual(original.states);
    expect(stripIds(reparsed.transitions)).toEqual(stripIds(original.transitions));
  });

  it('pda-anbn.jff round-trips', () => {
    const { original, reparsed } = roundTrip('pda-anbn.jff');
    expect(reparsed.states).toEqual(original.states);
    expect(stripIds(reparsed.transitions)).toEqual(stripIds(original.transitions));
  });

  it('tm-binary-increment.jff round-trips', () => {
    const { original, reparsed } = roundTrip('tm-binary-increment.jff');
    expect(reparsed.states).toEqual(original.states);
    expect(stripIds(reparsed.transitions)).toEqual(stripIds(original.transitions));
  });

  it('empty-automaton.jff round-trips', () => {
    const { original, reparsed } = roundTrip('empty-automaton.jff');
    expect(reparsed.states).toEqual(original.states);
    expect(reparsed.transitions).toEqual(original.transitions);
  });
});
