import type { AnyAutomaton, AutomatonKind, FiniteAutomaton, PushdownAutomaton, TuringMachine } from '@jauto/core';
import { XMLParser } from 'fast-xml-parser';
import { TAG } from './constants';
import { JFFParseError, JFFValidationWarning } from './errors';
import { parseStates } from './parsers/states';
import { parseFATransitions } from './parsers/fa';
import { parsePDATransitions } from './parsers/pda';
import { parseTMTransitions } from './parsers/tm';

export interface ParseResult {
  automaton: AnyAutomaton;
  warnings: JFFValidationWarning[];
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  parseTagValue: false,
  trimValues: true,
  isArray: (name) => name === TAG.STATE || name === TAG.TRANSITION,
});

export function parseJFF(xml: string): ParseResult {
  const warnings: JFFValidationWarning[] = [];

  let parsed: Record<string, unknown>;
  try {
    parsed = xmlParser.parse(xml) as Record<string, unknown>;
  } catch (e) {
    throw new JFFParseError(`Invalid XML: ${e instanceof Error ? e.message : String(e)}`);
  }

  const structure = parsed[TAG.STRUCTURE] as Record<string, unknown> | undefined;
  if (!structure) {
    throw new JFFParseError('Missing <structure> root element');
  }

  const typeStr = String(structure[TAG.TYPE] ?? '').trim();
  if (!typeStr) {
    throw new JFFParseError('Missing <type> element');
  }

  const kind = typeStr as AutomatonKind;
  if (kind !== 'fa' && kind !== 'pda' && kind !== 'turing') {
    throw new JFFParseError(`Unsupported automaton type: "${typeStr}"`);
  }

  const automatonNode = (structure[TAG.AUTOMATON] ?? structure) as Record<string, unknown>;
  const states = parseStates(automatonNode);

  if (states.filter((s) => s.isInitial).length === 0) {
    warnings.push(new JFFValidationWarning('No initial state found'));
  }

  switch (kind) {
    case 'fa': {
      const transitions = parseFATransitions(automatonNode);
      const automaton: FiniteAutomaton = { kind: 'fa', states, transitions };
      return { automaton, warnings };
    }
    case 'pda': {
      const transitions = parsePDATransitions(automatonNode);
      const automaton: PushdownAutomaton = { kind: 'pda', states, transitions };
      return { automaton, warnings };
    }
    case 'turing': {
      const transitions = parseTMTransitions(automatonNode);
      const tapesRaw = structure[TAG.TAPES] ?? automatonNode[TAG.TAPES];
      const tapes = tapesRaw ? parseInt(String(tapesRaw), 10) : 1;
      if (tapes > 1) {
        warnings.push(new JFFValidationWarning(`Multi-tape TM detected (${tapes} tapes). Only tape 1 is supported in MVP.`));
      }
      const automaton: TuringMachine = { kind: 'turing', states, transitions, tapes };
      return { automaton, warnings };
    }
  }
}
