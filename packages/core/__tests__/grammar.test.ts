import { describe, expect, it } from 'vitest';
import { classifyGrammar, recognizeContextFree, recognizeCYK, type Grammar } from '../src';

describe('grammar workflows', () => {
  it('classifies right-linear and context-free grammars', () => {
    expect(
      classifyGrammar({
        startSymbol: 'S',
        productions: [
          { left: 'S', right: 'aB' },
          { left: 'B', right: '' },
        ],
      }),
    ).toBe('regular');
    expect(
      classifyGrammar({
        startSymbol: 'S',
        productions: [
          { left: 'S', right: 'aSb' },
          { left: 'S', right: '' },
        ],
      }),
    ).toBe('context-free');
  });

  it('recognizes a^n b^n with Earley parsing, including epsilon', () => {
    const grammar: Grammar = {
      startSymbol: 'S',
      productions: [
        { left: 'S', right: 'aSb' },
        { left: 'S', right: '' },
      ],
    };
    for (const word of ['', 'ab', 'aabb', 'aaabbb'])
      expect(recognizeContextFree(grammar, word)).toBe(true);
    for (const word of ['a', 'abb', 'abab'])
      expect(recognizeContextFree(grammar, word)).toBe(false);
  });

  it('recognizes CNF grammars with CYK and rejects non-CNF rules', () => {
    const grammar: Grammar = {
      startSymbol: 'S',
      productions: [
        { left: 'S', right: 'AB' },
        { left: 'A', right: 'a' },
        { left: 'B', right: 'b' },
      ],
    };
    expect(recognizeCYK(grammar, 'ab')).toBe(true);
    expect(recognizeCYK(grammar, 'aa')).toBe(false);
    expect(() =>
      recognizeCYK({ startSymbol: 'S', productions: [{ left: 'S', right: 'abc' }] }, 'abc'),
    ).toThrow('Chomsky normal form');
  });
});
