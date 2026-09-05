import { beforeEach, describe, expect, it } from 'vitest';
import { addState, addTransition } from '../src/graph';
import { generateStateId, generateTransitionId, resetIdCounters } from '../src/ids';
import { createEmptyAutomaton, type FiniteAutomaton, type TuringMachine } from '../src/types';
import { validateStructure } from '../src/validation';

const state = { id: 's0', name: 'q0', x: 0, y: 0, isInitial: true, isFinal: false };

describe('document identity invariants', () => {
  beforeEach(resetIdCounters);

  it('allocates unused IDs after reopening a document in a fresh session', () => {
    expect(generateStateId([{ id: 's0' }, { id: 's1' }])).toBe('s2');
    expect(generateTransitionId([{ id: 't0' }])).toBe('t1');
  });

  it('refuses duplicate IDs at the mutation boundary', () => {
    const fa = addState(createEmptyAutomaton('fa'), state);
    expect(() => addState(fa, state)).toThrow('already exists');
    const edge = { id: 't0', from: 's0', to: 's0', read: 'a' };
    expect(() => addTransition(addTransition(fa, edge), edge)).toThrow('already exists');
  });

  it('diagnoses damaged imports without rejecting an empty editable draft', () => {
    expect(validateStructure(createEmptyAutomaton('fa'))).toEqual([]);
    const fa: FiniteAutomaton = { kind: 'fa', states: [state, { ...state, x: NaN }], transitions: [{ id: 't', from: 's0', to: 'missing', read: '' }] };
    const diagnostics = validateStructure(fa);
    expect(diagnostics.map((d) => d.message).join('\n')).toMatch(/Duplicate.*state ID/);
    expect(diagnostics.some((d) => d.stateId === 's0' && d.message.includes('finite'))).toBe(true);
    expect(diagnostics.some((d) => d.transitionId === 't' && d.message.includes('missing'))).toBe(true);
  });

  it('validates runtime TM properties', () => {
    const tm = { kind: 'turing', tapes: 0, states: [state], transitions: [{ id: 't', from: 's0', to: 's0', read: '', write: '', move: 'UP' }] } as unknown as TuringMachine;
    expect(validateStructure(tm)).toHaveLength(2);
  });
});
