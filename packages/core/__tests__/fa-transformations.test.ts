import { describe, expect, it } from 'vitest';
import type { FiniteAutomaton } from '../src/types';
import {
  determinize,
  finiteAutomatonToRegularExpression,
  minimizeDFA,
} from '../src/fa-transformations';
import {
  formatRegularExpression,
  parseRegularExpression,
  regularExpressionToNFA,
} from '../src/regular-expression';
import { isDeterministic } from '../src/validation';

const accepts = (automaton: FiniteAutomaton, input: string): boolean => {
  const byFrom = new Map<string, typeof automaton.transitions>();
  for (const transition of automaton.transitions)
    byFrom.set(transition.from, [...(byFrom.get(transition.from) ?? []), transition]);
  const finalIds = new Set(
    automaton.states.filter((state) => state.isFinal).map((state) => state.id),
  );
  const queue = automaton.states
    .filter((state) => state.isInitial)
    .map((state) => [state.id, 0] as const);
  const seen = new Set<string>();
  while (queue.length) {
    const [state, offset] = queue.shift()!;
    const key = `${state}\u0000${offset}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (offset === input.length && finalIds.has(state)) return true;
    for (const transition of byFrom.get(state) ?? [])
      if (input.startsWith(transition.read, offset))
        queue.push([transition.to, offset + transition.read.length]);
  }
  return false;
};

const samples = ['', 'a', 'b', 'ab', 'abb', 'aab', 'abab', 'bbb'];

describe('regular expressions and finite automata transformations', () => {
  it('parses and formats JFLAP regular-expression syntax', () => {
    const source = '(!+a)(b+c)*';
    expect(formatRegularExpression(parseRegularExpression(source))).toBe(source);
    expect(() => parseRegularExpression('(a+b')).toThrow('Missing closing parenthesis');
  });

  it('constructs an equivalent Thompson NFA', () => {
    const nfa = regularExpressionToNFA('a(b+c)*');
    expect(samples.map((word) => accepts(nfa, word))).toEqual([
      false,
      true,
      false,
      true,
      true,
      false,
      false,
      false,
    ]);
  });

  it('determinizes epsilon and multi-character transitions without changing the language', () => {
    const nfa: FiniteAutomaton = {
      kind: 'fa',
      states: [
        { id: '0', name: 'q0', x: 0, y: 0, isInitial: true, isFinal: false },
        { id: '1', name: 'q1', x: 0, y: 0, isInitial: false, isFinal: true },
      ],
      transitions: [
        { id: 'e', from: '0', to: '1', read: '' },
        { id: 'w', from: '0', to: '1', read: 'ab' },
        { id: 'a', from: '1', to: '1', read: 'a' },
      ],
    };
    const dfa = determinize(nfa);
    expect(isDeterministic(dfa)).toBe(true);
    expect(samples.map((word) => accepts(dfa, word))).toEqual(
      samples.map((word) => accepts(nfa, word)),
    );
  });

  it('minimizes and converts both ways while preserving sample behavior', () => {
    const source = regularExpressionToNFA('(a+b)*abb');
    const minimized = minimizeDFA(source);
    expect(minimized.states).toHaveLength(4);
    const expression = finiteAutomatonToRegularExpression(minimized);
    const reopened = regularExpressionToNFA(expression);
    expect(samples.map((word) => accepts(reopened, word))).toEqual(
      samples.map((word) => accepts(source, word)),
    );
  });
});
