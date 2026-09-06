import type { AnyAutomaton } from '@jauto/core';
import { validateStructure } from '@jauto/core';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { JFFParseError, JFFValidationWarning } from './errors';
import { parseStates } from './parsers/states';
import { parseFATransitions } from './parsers/fa';
import { parsePDATransitions } from './parsers/pda';
import { parseTMTransitions } from './parsers/tm';
import { checkKeys, xmlElements, xmlNode, xmlNumber, xmlText, xmlEntityDecoder } from './xml';

export interface ParseResult {
  automaton: AnyAutomaton;
  warnings: JFFValidationWarning[];
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  entityDecoder: xmlEntityDecoder,
  isArray: (name) => ['state', 'transition', 'note'].includes(name),
});

export function parseJFF(xml: string): ParseResult {
  if (xml.length > 5_000_000) throw new JFFParseError('Document exceeds the 5 MB import limit');
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new JFFParseError('DTD and custom XML entities are not supported');
  const valid = XMLValidator.validate(xml);
  if (valid !== true) throw new JFFParseError(`Invalid XML: ${valid.err.msg}`);
  const parsed = xmlNode(xmlParser.parse(xml), 'document');
  checkKeys(parsed, ['?xml', 'structure'], 'document');
  if (!('structure' in parsed)) throw new JFFParseError('Missing <structure> root element');
  const structure = xmlNode(parsed.structure, 'structure');
  const kind = xmlText(structure.type, 'type').trim();
  if (!kind) throw new JFFParseError('Missing <type> element');
  if (kind !== 'fa' && kind !== 'pda' && kind !== 'turing') {
    throw new JFFParseError(`Unsupported automaton type: "${kind}"`);
  }
  checkKeys(structure, ['type', 'tapes', 'automaton', 'state', 'transition', 'note'], 'structure');
  if ('automaton' in structure && ['state', 'transition', 'note'].some((key) => key in structure)) {
    throw new JFFParseError('Mixed nested and legacy automaton structures are not supported');
  }
  const node = 'automaton' in structure ? xmlNode(structure.automaton, 'automaton') : structure;
  checkKeys(node, node === structure ? ['type', 'tapes', 'state', 'transition', 'note'] : ['tapes', 'state', 'transition', 'note'], 'automaton');
  if (kind !== 'turing' && ('tapes' in structure || 'tapes' in node)) {
    throw new JFFParseError('Tape declarations are only supported for Turing machines');
  }
  const tapes = xmlNumber(structure.tapes ?? node.tapes, 'tapes', 1);
  if (tapes !== 1 || xmlNumber(node.tapes, 'tapes', 1) !== 1) {
    throw new JFFParseError('Only single-tape documents are currently supported');
  }
  const states = parseStates(node);
  const notes = xmlElements(node.note, 'note').map((note) => {
    checkKeys(note, ['text', 'x', 'y'], 'note');
    return { text: xmlText(note.text, 'text'), x: xmlNumber(note.x, 'x'), y: xmlNumber(note.y, 'y') };
  });
  const base = { states, ...(notes.length ? { meta: { notes } } : {}) };
  let automaton: AnyAutomaton;
  switch (kind) {
    case 'fa': automaton = { ...base, kind, transitions: parseFATransitions(node) }; break;
    case 'pda': automaton = { ...base, kind, transitions: parsePDATransitions(node) }; break;
    case 'turing': automaton = { ...base, kind, tapes, transitions: parseTMTransitions(node) }; break;
  }
  const errors = validateStructure(automaton);
  if (errors.length) throw new JFFParseError(errors.map((error) => error.message).join('; '));
  const warnings: JFFValidationWarning[] = [];
  if (!states.some((state) => state.isInitial)) warnings.push(new JFFValidationWarning('No initial state found; set one before simulation'));
  return { automaton, warnings };
}
