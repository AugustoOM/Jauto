import type { AnyAutomaton, Grammar } from '@jauto/core';
import { parseRegularExpression } from '@jauto/core';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { JFFParseError, JFFSerializeError } from './errors';
import { parseJFF } from './parser';
import { serializeJFF } from './serializer';
import { checkKeys, escapeXml, xmlElements, xmlEntityDecoder, xmlNode, xmlText } from './xml';

export interface RegularExpressionDocument {
  readonly kind: 'regular-expression';
  readonly expression: string;
}

export interface GrammarDocument extends Grammar {
  readonly kind: 'grammar';
}

export type JFFDocument = AnyAutomaton | RegularExpressionDocument | GrammarDocument;

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  entityDecoder: xmlEntityDecoder,
  isArray: (name) => name === 'production',
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
  const root = xmlNode(parser.parse(xml), 'document');
  checkKeys(root, ['?xml', 'structure'], 'document');
  const structure = xmlNode(root.structure, 'structure');
  if (type === 'grammar') {
    checkKeys(structure, ['type', 'production'], 'grammar');
    const productions = xmlElements(structure.production, 'production').map((production) => {
      checkKeys(production, ['left', 'right'], 'production');
      const left = xmlText(production.left, 'production left');
      if (!left) throw new JFFParseError('Grammar production left side cannot be empty');
      return {
        left,
        right: 'right' in production ? xmlText(production.right, 'production right') : '',
      };
    });
    return { kind: 'grammar', startSymbol: productions[0]?.left ?? 'S', productions };
  }
  if (type !== 're') throw new JFFParseError(`Unsupported JFF document type: "${type}"`);
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
  if (document.kind === 'fa' || document.kind === 'pda' || document.kind === 'turing')
    return serializeJFF(document);
  if (document.kind === 'grammar') {
    if (document.productions.some((production) => !production.left))
      throw new JFFSerializeError('Grammar production left side cannot be empty');
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
      '<!--Created with Jauto.-->',
      '<structure>',
      '\t<type>grammar</type>',
      ...document.productions.map(
        (production) =>
          `\t<production><left>${escapeXml(production.left)}</left>${production.right ? `<right>${escapeXml(production.right)}</right>` : '<right/>'}</production>`,
      ),
      '</structure>',
    ].join('\n');
  }
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
