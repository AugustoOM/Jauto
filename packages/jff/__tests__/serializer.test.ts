import { describe, it, expect } from 'vitest';
import { serializeJFF } from '../src/serializer';
import type { FiniteAutomaton, PushdownAutomaton, TuringMachine } from '@jauto/core';

describe('serializeJFF', () => {
  it('serializes a finite automaton', () => {
    const fa: FiniteAutomaton = {
      kind: 'fa',
      states: [
        { id: '0', name: 'q0', x: 100, y: 200, isInitial: true, isFinal: false },
        { id: '1', name: 'q1', x: 300, y: 200, isInitial: false, isFinal: true },
      ],
      transitions: [
        { id: 't0', from: '0', to: '1', read: 'a' },
      ],
    };

    const xml = serializeJFF(fa);
    expect(xml).toContain('<type>fa</type>');
    expect(xml).toContain('<state id="0" name="q0">');
    expect(xml).toContain('<initial/>');
    expect(xml).toContain('<final/>');
    expect(xml).toContain('<from>0</from>');
    expect(xml).toContain('<to>1</to>');
    expect(xml).toContain('<read>a</read>');
    expect(xml).toContain('<!--Created with Jauto.-->');
  });

  it('serializes a PDA', () => {
    const pda: PushdownAutomaton = {
      kind: 'pda',
      states: [
        { id: '0', name: 'q0', x: 0, y: 0, isInitial: true, isFinal: false },
      ],
      transitions: [
        { id: 't0', from: '0', to: '0', read: 'a', pop: '', push: 'A' },
      ],
    };

    const xml = serializeJFF(pda);
    expect(xml).toContain('<type>pda</type>');
    expect(xml).toContain('<pop></pop>');
    expect(xml).toContain('<push>A</push>');
  });

  it('serializes a Turing Machine', () => {
    const tm: TuringMachine = {
      kind: 'turing',
      tapes: 1,
      states: [
        { id: '0', name: 'q0', x: 0, y: 0, isInitial: true, isFinal: false },
      ],
      transitions: [
        { id: 't0', from: '0', to: '0', read: '0', write: '1', move: 'R' },
      ],
    };

    const xml = serializeJFF(tm);
    expect(xml).toContain('<type>turing</type>');
    expect(xml).toContain('<write>1</write>');
    expect(xml).toContain('<move>R</move>');
  });

  it('serializes an empty automaton', () => {
    const fa: FiniteAutomaton = { kind: 'fa', states: [], transitions: [] };
    const xml = serializeJFF(fa);
    expect(xml).toContain('<type>fa</type>');
    expect(xml).toContain('<automaton>');
    expect(xml).toContain('</automaton>');
  });
});
