import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseJFF } from '../src/parser';

describe('official JFLAP tutorial documents', () => {
  it('reads the PDA stack initialization and string operations unchanged', () => {
    const xml = readFileSync(new URL('./fixtures/official/pdaexample.jff', import.meta.url), 'utf8');
    const { automaton, warnings } = parseJFF(xml);
    expect(automaton.kind).toBe('pda');
    expect(warnings).toEqual([]);
    expect(automaton.states).toHaveLength(4);
    expect(automaton.transitions).toHaveLength(5);
    expect(automaton.transitions).toContainEqual(expect.objectContaining({ from: '0', to: '1', read: 'a', pop: 'Z', push: 'aZ' }));
    expect(automaton.transitions).toContainEqual(expect.objectContaining({ from: '2', to: '3', read: '', pop: 'Z', push: 'Z' }));
  });
});
