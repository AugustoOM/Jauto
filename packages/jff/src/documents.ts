import type { AnyAutomaton } from '@jauto/core';
import { parseRegularExpression } from '@jauto/core';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { JFFParseError, JFFSerializeError } from './errors';
import { parseJFF } from './parser';
import { serializeJFF } from './serializer';
import { checkKeys, escapeXml, xmlEntityDecoder, xmlNode, xmlText } from './xml';

export interface RegularExpressionDocument {
  readonly kind: 'regular-expression';
  readonly expression: string;
}

export type JFFDocument = AnyAutomaton | RegularExpressionDocument;

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  entityDecoder: xmlEntityDecoder,
});

function documentType(xml: string): string {
  if (xml.length > 5_000_000) throw new JFFParseError('Document exceeds the 5 MB import limit');
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new JFFParseError('DTD and custom XML entities are not supported');
  const valid = XMLValidator.validate(xml);
  if (valid !== true) throw new JFFParseError(`Invalid XML: ${valid.err.msg}`);
  const root = xmlNode(parser.parse(xml), 'document');
  const structure = xmlNode(root.structure, 'structure');
  return xmlText(structure.type, 'type').trim();
}

/** Parses every JFF document family supported by Jauto. */
export function parseJFFDocument(xml: string): JFFDocument {
  const type = documentType(xml);
  if (type === 'fa' || type === 'pda' || type === 'turing') return parseJFF(xml).automaton;
  if (type !== 're') throw new JFFParseError(`Unsupported JFF document type: "${type}"`);
  const root = xmlNode(parser.parse(xml), 'document');
  checkKeys(root, ['?xml', 'structure'], 'document');
  const structure = xmlNode(root.structure, 'structure');
  checkKeys(structure, ['type', 'expression'], 'regular expression');
  const expression = 'expression' in structure ? xmlText(structure.expression, 'expression') : '';
  try {
    parseRegularExpression(expression);
  } catch (error) {
    throw new JFFParseError(error instanceof Error ? error.message : 'Invalid regular expression');
  }
  return { kind: 'regular-expression', expression };
}

export function serializeJFFDocument(document: JFFDocument): string {
  if (document.kind !== 'regular-expression') return serializeJFF(document);
  try {
    parseRegularExpression(document.expression);
  } catch (error) {
    throw new JFFSerializeError(
      error instanceof Error ? error.message : 'Invalid regular expression',
    );
  }
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    '<!--Created with Jauto.-->',
    '<structure>',
    '\t<type>re</type>',
    `\t<expression>${escapeXml(document.expression)}</expression>`,
    '</structure>',
  ].join('\n');
}
