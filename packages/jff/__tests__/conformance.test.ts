import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { FiniteAutomaton, TuringMachine } from '@jauto/core';
import { createNFARunner } from '../../simulator/src/nfa-runner';
import { createTMRunner } from '../../simulator/src/tm-runner';
import { parseJFF } from '../src/parser';
import { serializeJFF } from '../src/serializer';

function load(name: string) {
  const xml = readFileSync(new URL(`./fixtures/official/${name}`, import.meta.url), 'utf8');
  return parseJFF(xml).automaton;
}

function normalizedTransitions(automaton: ReturnType<typeof load>) {
  const stateIndex = new Map(automaton.states.map((state, index) => [state.id, index]));
  return automaton.transitions.map(({ from, to, id: _id, ...semantic }) => ({
    from: stateIndex.get(from),
    to: stateIndex.get(to),
    ...semantic,
  }));
}

describe('vendor-authored JFLAP conformance corpus', () => {
  it('executes the published ex1.3a NFA examples', () => {
    const automaton = load('ex1.3a.jff') as FiniteAutomaton;
    for (const input of ['aa', 'aaa', 'aaaabbb', 'aaaaaabbbb']) {
      expect(createNFARunner(automaton, input).run().outcome, input).toBe('accepted');
    }
    for (const input of ['', 'a', 'aab', 'aaaab']) {
      expect(createNFARunner(automaton, input).run().outcome, input).toBe('rejected');
    }
  });

  it('executes the published ex9 single-tape TM examples', () => {
    const automaton = load('ex9-anbncn.jff') as TuringMachine;
    for (const input of ['', 'abc', 'aabbcc', 'aaabbbccc']) {
      expect(createTMRunner(automaton, input).run().outcome, input || 'epsilon').toBe('accepted');
    }
    for (const input of ['a', 'ab', 'aabcc', 'aabbccc', 'abcabc']) {
      expect(createTMRunner(automaton, input).run().outcome, input).not.toBe('accepted');
    }
  });

  it.each(['ex1.3a.jff', 'ex5.1.jff', 'ex9-anbncn.jff'])('%s preserves graph semantics through export', (name) => {
    const original = load(name);
    const restored = parseJFF(serializeJFF(original)).automaton;
    expect(restored.kind).toBe(original.kind);
    expect(restored.states.map(({ name, x, y, isInitial, isFinal }) => ({ name, x, y, isInitial, isFinal })))
      .toEqual(original.states.map(({ name, x, y, isInitial, isFinal }) => ({ name, x, y, isInitial, isFinal })));
    expect(normalizedTransitions(restored)).toEqual(normalizedTransitions(original));
  });
});
