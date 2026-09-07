import { describe, expect, it } from 'vitest';
import {
  deriveLSystem,
  pumpContextFree,
  pumpRegular,
  validateContextFreePumping,
  validateRegularPumping,
} from '../src';

describe('L-system and pumping-lemma activities', () => {
  it('derives space-delimited L-system symbols in parallel', () => {
    const system = {
      axiom: 'X',
      productions: [
        { left: 'X', replacements: ['g g X'] },
        { left: 'g', replacements: ['g g'] },
      ],
    };
    expect(deriveLSystem(system, 2)).toEqual(['g', 'g', 'g', 'g', 'g', 'g', 'X']);
  });

  it('selects reproducible stochastic alternatives', () => {
    const system = { axiom: 'X X', productions: [{ left: 'X', replacements: ['a', 'b'] }] };
    expect(deriveLSystem(system, 1, () => 1)).toEqual(['b', 'b']);
  });

  it('validates and pumps regular decompositions', () => {
    const parts = { x: 'aa', y: 'aa', z: 'bbbb' };
    expect(validateRegularPumping('aaaabbbb', 4, parts)).toBe(true);
    expect(pumpRegular(parts, 2)).toBe('aaaaaabbbb');
    expect(validateRegularPumping('aaaabbbb', 3, parts)).toBe(false);
  });

  it('validates and pumps context-free decompositions', () => {
    const parts = { u: 'a', v: 'a', x: 'ab', y: 'b', z: '' };
    expect(validateContextFreePumping('aaabb', 4, parts)).toBe(true);
    expect(pumpContextFree(parts, 0)).toBe('aab');
  });
});
