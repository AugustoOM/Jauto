import type { AnyAutomaton, FiniteAutomaton, PushdownAutomaton, TuringMachine } from '@jauto/core';
import { serializeStates } from './serializers/states';
import { serializeFATransitions } from './serializers/fa';
import { serializePDATransitions } from './serializers/pda';
import { serializeTMTransitions } from './serializers/tm';

export function serializeJFF(automaton: AnyAutomaton): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
  lines.push('<!--Created with Jauto.-->');
  lines.push('<structure>');
  lines.push(`\t<type>${automaton.kind}</type>`);
  lines.push('\t<automaton>');

  const statesXml = serializeStates(automaton.states);
  if (statesXml) lines.push(statesXml);

  let transitionsXml = '';
  switch (automaton.kind) {
    case 'fa':
      transitionsXml = serializeFATransitions((automaton as FiniteAutomaton).transitions);
      break;
    case 'pda':
      transitionsXml = serializePDATransitions((automaton as PushdownAutomaton).transitions);
      break;
    case 'turing':
      transitionsXml = serializeTMTransitions((automaton as TuringMachine).transitions);
      break;
  }
  if (transitionsXml) lines.push(transitionsXml);

  lines.push('\t</automaton>');
  lines.push('</structure>');
  return lines.join('\n');
}
