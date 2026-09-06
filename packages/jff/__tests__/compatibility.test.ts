import { describe, expect, it } from 'vitest';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { AnyAutomaton, FiniteAutomaton } from '@jauto/core';
import { parseJFF } from '../src/parser';
import { serializeJFF } from '../src/serializer';

const state = { id: 's0', name: 'q0', x: 0, y: 0, isInitial: true, isFinal: false };
const graph: FiniteAutomaton = { kind: 'fa', states: [state, { ...state, id: 's1', name: 'q1', isInitial: false, isFinal: true }], transitions: [{ id: 't', from: 's0', to: 's1', read: '' }] };
const wrap = (body: string, kind = 'fa', extra = '') => `<structure><type>${kind}</type>${extra}<automaton>${body}</automaton></structure>`;
const q = '<state id="0" name="q0"><x>0</x><y>0</y><initial/></state>';

describe('JFLAP exchange safety', () => {
  it('exports independent integer identities with consistent endpoints', () => {
    const xml = serializeJFF({ ...graph, states: [...graph.states, { ...state, id: '0', isInitial: false }] });
    expect(XMLValidator.validate(xml)).toBe(true);
    const doc = new XMLParser({ ignoreAttributes: false, parseAttributeValue: false }).parse(xml);
    const ids = doc.structure.automaton.state.map((s: Record<string, string>) => s['@_id']);
    expect(new Set(ids).size).toBe(3);
    expect(ids.every((id: string) => /^(0|[1-9]\d*)$/.test(id))).toBe(true);
    expect(String(doc.structure.automaton.transition.from)).toBe(ids[0]);
    expect(String(doc.structure.automaton.transition.to)).toBe(ids[1]);
    expect(graph.states[0]?.id).toBe('s0');
  });

  it.each(['fa', 'pda', 'turing'] as const)('escapes every semantic field for %s', (kind) => {
    const value = ' <&>"\'Ω ';
    const edge = { ...graph.transitions[0]!, read: value, pop: value, push: value, write: value, move: 'S' as const };
    const automaton = { ...graph, kind, tapes: 1, transitions: [edge] } as AnyAutomaton;
    const xml = serializeJFF(automaton);
    expect(XMLValidator.validate(xml)).toBe(true);
    const parsed = parseJFF(xml).automaton.transitions[0]!;
    expect(parsed.read).toBe(value);
    if ('pop' in parsed) { expect(parsed.pop).toBe(value); expect(parsed.push).toBe(value); }
    if ('write' in parsed) expect(parsed.write).toBe(value);
  });

  it('preserves literal whitespace separately from epsilon', () => {
    const parsed = parseJFF(wrap(q + '<transition><from>0</from><to>0</to><read> </read></transition>'));
    expect(parsed.automaton.transitions[0]?.read).toBe(' ');
    expect(parseJFF(serializeJFF(parsed.automaton)).automaton.transitions[0]?.read).toBe(' ');
  });

  it('preserves whitespace even in state-name attributes', () => {
    const named = { ...graph, states: graph.states.map((s) => ({ ...s, name: 'a\tb\nc\rd' })) };
    expect(parseJFF(serializeJFF(named)).automaton.states[0]?.name).toBe('a\tb\nc\rd');
  });

  it('decodes numeric references once and refuses invalid entities', () => {
    const body = (read: string) => wrap(q + `<transition><from>0</from><to>0</to><read>${read}</read></transition>`);
    expect(parseJFF(body('&#x1F600;&amp;lt;')).automaton.transitions[0]?.read).toBe('😀&lt;');
    expect(() => parseJFF(body('&#0;'))).toThrow();
    expect(() => parseJFF(body('&unknown;'))).toThrow();
  });

  it('preserves notes, labels and transition control points', () => {
    const parsed = parseJFF(wrap(q.replace('<initial/>', '<initial/><label> label </label>') + '<note><text>proof &amp; explanation</text><x>-10</x><y>5.5</y></note><transition><from>0</from><to>0</to><read/><controlx>22</controlx><controly>-30</controly></transition>')).automaton;
    const next = parseJFF(serializeJFF(parsed)).automaton;
    expect(next.meta?.notes).toEqual([{ text: 'proof & explanation', x: -10, y: 5.5 }]);
    expect(next.states[0]?.label).toBe(' label ');
    expect(next.transitions[0]).toMatchObject({ controlX: 22, controlY: -30 });
  });

  it.each([
    '<structure><type>fa</type><automaton>',
    wrap(q + q),
    wrap(q.replace('<x>0</x>', '<x>12abc</x>')),
    wrap(q + '<transition><from>0</from><to>99</to><read>a</read></transition>'),
    wrap('<block id="0"/>', 'turing'),
    wrap(q, 'turing', '<tapes>2</tapes>'),
    wrap(q + '<transition><from>0</from><to>0</to><read/><write/><move>UP</move></transition>', 'turing'),
    wrap(q + '<unknown>unpreservable</unknown>'),
    '<!DOCTYPE structure [<!ENTITY x "expansion">]>' + wrap(q),
  ])('rejects malformed or unsupported documents without degrading them', (xml) => {
    expect(() => parseJFF(xml)).toThrow();
  });

  it('reads tape-one attributes but refuses additional tape fields', () => {
    const edge = '<transition><from>0</from><to>0</to><read tape="1">a</read><write tape="1"/><move tape="1">S</move></transition>';
    expect(parseJFF(wrap(q + edge, 'turing')).automaton.transitions[0]).toMatchObject({ read: 'a', write: '', move: 'S' });
    expect(() => parseJFF(wrap(q + edge.replace('<read tape="1">a</read>', '<read tape="1">a</read><read tape="2">b</read>'), 'turing'))).toThrow();
  });

  it('refuses corrupt graphs and forbidden characters on export', () => {
    expect(() => serializeJFF({ ...graph, states: [state, state] })).toThrow();
    expect(() => serializeJFF({ ...graph, transitions: [{ ...graph.transitions[0]!, read: '\u0000' }] })).toThrow('forbidden');
  });
});
