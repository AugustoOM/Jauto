import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseJFF } from '../src/parser';
import { JFFParseError } from '../src/errors';
import type { FiniteAutomaton, PushdownAutomaton, TuringMachine } from '@jauto/core';

function fixture(name: string): string {
  return readFileSync(resolve(__dirname, 'fixtures', name), 'utf-8');
}

describe('parseJFF', () => {
  describe('DFA', () => {
    it('parses dfa-simple.jff correctly', () => {
      const { automaton, warnings } = parseJFF(fixture('dfa-simple.jff'));
      const fa = automaton as FiniteAutomaton;

      expect(fa.kind).toBe('fa');
      expect(fa.states).toHaveLength(2);
      expect(fa.transitions).toHaveLength(4);

      const q0 = fa.states.find((s) => s.name === 'q0')!;
      expect(q0.isInitial).toBe(true);
      expect(q0.isFinal).toBe(false);
      expect(q0.x).toBe(100);
      expect(q0.y).toBe(200);

      const q1 = fa.states.find((s) => s.name === 'q1')!;
      expect(q1.isFinal).toBe(true);
      expect(q1.isInitial).toBe(false);

      expect(warnings).toHaveLength(0);
    });
  });

  describe('NFA with epsilon', () => {
    it('parses nfa-epsilon.jff with empty read as epsilon', () => {
      const { automaton } = parseJFF(fixture('nfa-epsilon.jff'));
      const fa = automaton as FiniteAutomaton;

      expect(fa.states).toHaveLength(3);
      expect(fa.transitions).toHaveLength(3);

      const epsTrans = fa.transitions.find((t) => t.read === '');
      expect(epsTrans).toBeDefined();
      expect(epsTrans!.from).toBe('0');
      expect(epsTrans!.to).toBe('1');
    });
  });

  describe('PDA', () => {
    it('parses pda-anbn.jff correctly', () => {
      const { automaton } = parseJFF(fixture('pda-anbn.jff'));
      const pda = automaton as PushdownAutomaton;

      expect(pda.kind).toBe('pda');
      expect(pda.states).toHaveLength(3);
      expect(pda.transitions).toHaveLength(4);

      const pushTrans = pda.transitions.find((t) => t.push === 'A')!;
      expect(pushTrans.read).toBe('a');
      expect(pushTrans.pop).toBe('');

      const popTrans = pda.transitions.find((t) => t.pop === 'A')!;
      expect(popTrans.read).toBe('b');
      expect(popTrans.push).toBe('');
    });
  });

  describe('Turing Machine', () => {
    it('parses tm-binary-increment.jff correctly', () => {
      const { automaton } = parseJFF(fixture('tm-binary-increment.jff'));
      const tm = automaton as TuringMachine;

      expect(tm.kind).toBe('turing');
      expect(tm.tapes).toBe(1);
      expect(tm.states).toHaveLength(3);
      expect(tm.transitions).toHaveLength(6);

      const moveLeft = tm.transitions.find((t) => t.move === 'L')!;
      expect(moveLeft).toBeDefined();

      const stay = tm.transitions.find((t) => t.move === 'S')!;
      expect(stay).toBeDefined();
    });
  });

  describe('empty automaton', () => {
    it('parses empty automaton with warning', () => {
      const { automaton, warnings } = parseJFF(fixture('empty-automaton.jff'));
      expect(automaton.states).toHaveLength(0);
      expect(automaton.transitions).toHaveLength(0);
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('throws on invalid XML', () => {
      expect(() => parseJFF('not xml at all <<<<')).toThrow(JFFParseError);
    });

    it('throws on missing structure element', () => {
      expect(() => parseJFF('<?xml version="1.0"?><root></root>')).toThrow(JFFParseError);
    });

    it('throws on missing type element', () => {
      expect(() => parseJFF('<?xml version="1.0"?><structure><automaton></automaton></structure>')).toThrow(JFFParseError);
    });

    it('throws on unsupported type', () => {
      expect(() =>
        parseJFF('<?xml version="1.0"?><structure><type>grammar</type><automaton></automaton></structure>'),
      ).toThrow(JFFParseError);
    });
  });
});
