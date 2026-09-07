import type {
  AnyAutomaton,
  Grammar,
  MealyMachine,
  MooreMachine,
  TransducerState,
  LSystem,
  TuringBlockMachine,
} from '@jauto/core';
import { parseRegularExpression } from '@jauto/core';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { JFFParseError, JFFSerializeError } from './errors';
import { parseJFF } from './parser';
import { serializeJFF } from './serializer';
import { parseTuringBlockJFF, serializeTuringBlockJFF } from './building-blocks';
import { checkKeys, escapeXml, xmlElements, xmlEntityDecoder, xmlNode, xmlText } from './xml';

export interface RegularExpressionDocument {
  readonly kind: 'regular-expression';
  readonly expression: string;
}

export interface GrammarDocument extends Grammar {
  readonly kind: 'grammar';
}

export interface LSystemDocument extends LSystem {
  readonly kind: 'l-system';
}

export interface PumpingLemmaDocument {
  readonly kind: 'pumping-lemma';
  readonly family: 'regular' | 'context-free';
  readonly fields: Readonly<Record<string, string>>;
  readonly cases: readonly Readonly<Record<string, string>>[];
}

export type JFFDocument =
  | AnyAutomaton
  | RegularExpressionDocument
  | GrammarDocument
  | LSystemDocument
  | PumpingLemmaDocument
  | TuringBlockMachine
  | MealyMachine
  | MooreMachine;

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  entityDecoder: xmlEntityDecoder,
  isArray: (name) => ['production', 'parameter', 'case', 'state', 'transition'].includes(name),
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
  if (type === 'turing' && /<block\b/u.test(xml)) return parseTuringBlockJFF(xml);
  if (type === 'fa' || type === 'pda' || type === 'turing') return parseJFF(xml).automaton;
  const root = xmlNode(parser.parse(xml), 'document');
  checkKeys(root, ['?xml', 'structure'], 'document');
  const structure = xmlNode(root.structure, 'structure');
  if (type === 'mealy' || type === 'moore') return parseTransducer(structure, type);
  if (type === 'lsystem') return parseLSystem(structure);
  if (type === 'regular pumping lemma' || type === 'context-free pumping lemma')
    return parsePumpingLemma(structure, type);
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
  if (document.kind === 'turing-blocks') return serializeTuringBlockJFF(document);
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
  if (document.kind === 'mealy' || document.kind === 'moore') return serializeTransducer(document);
  if (document.kind === 'l-system') return serializeLSystem(document);
  if (document.kind === 'pumping-lemma') return serializePumpingLemma(document);
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

function textValues(value: unknown, context: string): string[] {
  return (Array.isArray(value) ? value : value === undefined ? [] : [value]).map((entry) =>
    xmlText(entry, context),
  );
}

function parseLSystem(structure: Record<string, unknown>): LSystemDocument {
  checkKeys(structure, ['type', 'axiom', 'production', 'parameter'], 'L-system');
  const axiom = xmlText(structure.axiom, 'axiom');
  if (!axiom.trim()) throw new JFFParseError('L-system axiom cannot be empty');
  const productions = xmlElements(structure.production, 'production').map((production) => {
    checkKeys(production, ['left', 'right'], 'L-system production');
    const left = xmlText(production.left, 'production left');
    if (!left.trim()) throw new JFFParseError('L-system production left side cannot be empty');
    return { left, replacements: textValues(production.right, 'production right') };
  });
  const parameters = Object.fromEntries(
    xmlElements(structure.parameter, 'parameter').flatMap((parameter) => {
      checkKeys(parameter, ['name', 'value'], 'L-system parameter');
      const name = xmlText(parameter.name, 'parameter name');
      return name ? [[name, xmlText(parameter.value, 'parameter value')]] : [];
    }),
  );
  return {
    kind: 'l-system',
    axiom,
    productions,
    ...(Object.keys(parameters).length ? { parameters } : {}),
  };
}

const pumpingFields = [
  'name',
  'first_player',
  'm',
  'w',
  'i',
  'xLength',
  'yLength',
  'uLength',
  'vLength',
  'attempt',
] as const;
const caseFields = ['caseULength', 'caseVLength', 'caseXLength', 'caseYLength', 'caseI'] as const;

function parsePumpingLemma(
  structure: Record<string, unknown>,
  type: 'regular pumping lemma' | 'context-free pumping lemma',
): PumpingLemmaDocument {
  checkKeys(structure, ['type', ...pumpingFields, 'case'], 'pumping lemma');
  const fields = Object.fromEntries(
    pumpingFields
      .filter((name) => name in structure)
      .map((name) => [name, xmlText(structure[name], name)]),
  );
  const cases = xmlElements(structure.case, 'case').map((entry) => {
    checkKeys(entry, caseFields, 'pumping lemma case');
    return Object.fromEntries(
      caseFields.filter((name) => name in entry).map((name) => [name, xmlText(entry[name], name)]),
    );
  });
  return {
    kind: 'pumping-lemma',
    family: type === 'regular pumping lemma' ? 'regular' : 'context-free',
    fields,
    cases,
  };
}

function serializeLSystem(document: LSystemDocument): string {
  if (!document.axiom.trim()) throw new JFFSerializeError('L-system axiom cannot be empty');
  const lines = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    '<!--Created with Jauto.-->',
    '<structure>',
    '\t<type>lsystem</type>',
    `\t<axiom>${escapeXml(document.axiom)}</axiom>`,
  ];
  for (const production of document.productions) {
    if (!production.left.trim())
      throw new JFFSerializeError('L-system production left side cannot be empty');
    lines.push(
      '\t<production>',
      `\t\t<left>${escapeXml(production.left)}</left>`,
      ...production.replacements.map((right) => `\t\t<right>${escapeXml(right)}</right>`),
      '\t</production>',
    );
  }
  for (const [name, value] of Object.entries(document.parameters ?? {}))
    lines.push(
      '\t<parameter>',
      `\t\t<name>${escapeXml(name)}</name>`,
      `\t\t<value>${escapeXml(value)}</value>`,
      '\t</parameter>',
    );
  lines.push('</structure>');
  return lines.join('\n');
}

function serializePumpingLemma(document: PumpingLemmaDocument): string {
  const type =
    document.family === 'regular' ? 'regular pumping lemma' : 'context-free pumping lemma';
  const lines = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    '<!--Created with Jauto.-->',
    '<structure>',
    `\t<type>${type}</type>`,
  ];
  for (const name of pumpingFields)
    if (name in document.fields)
      lines.push(`\t<${name}>${escapeXml(document.fields[name]!)}</${name}>`);
  for (const entry of document.cases) {
    lines.push('\t<case>');
    for (const name of caseFields)
      if (name in entry) lines.push(`\t\t<${name}>${escapeXml(entry[name]!)}</${name}>`);
    lines.push('\t</case>');
  }
  lines.push('</structure>');
  return lines.join('\n');
}

function parseTransducer(
  structure: Record<string, unknown>,
  kind: 'mealy' | 'moore',
): MealyMachine | MooreMachine {
  checkKeys(structure, ['type', 'automaton', 'state', 'transition'], kind);
  const node =
    'automaton' in structure ? xmlNode(structure.automaton, `${kind} automaton`) : structure;
  checkKeys(
    node,
    node === structure ? ['type', 'state', 'transition'] : ['state', 'transition'],
    kind,
  );
  const states = xmlElements(node.state, 'state').map((state) => {
    checkKeys(state, ['@_id', '@_name', 'x', 'y', 'initial', 'output'], `${kind} state`);
    const id = xmlText(state['@_id'], 'state id').trim();
    if (!id) throw new JFFParseError('Transducer state missing id');
    const common: TransducerState = {
      id,
      name: xmlText(state['@_name'], 'state name', `q${id}`),
      x: Number(xmlText(state.x, 'x')),
      y: Number(xmlText(state.y, 'y')),
      isInitial: 'initial' in state,
    };
    if (!Number.isFinite(common.x) || !Number.isFinite(common.y))
      throw new JFFParseError('Transducer coordinates must be finite');
    return kind === 'moore' ? { ...common, output: xmlText(state.output, 'state output') } : common;
  });
  if (states.filter((state) => state.isInitial).length !== 1)
    throw new JFFParseError('Transducer requires exactly one initial state');
  const stateIds = new Set(states.map((state) => state.id));
  const transitions = xmlElements(node.transition, 'transition').map((transition, index) => {
    checkKeys(transition, ['from', 'to', 'read', 'transout'], `${kind} transition`);
    const from = xmlText(transition.from, 'from').trim();
    const to = xmlText(transition.to, 'to').trim();
    if (!stateIds.has(from) || !stateIds.has(to))
      throw new JFFParseError('Transducer transition references a missing state');
    const common = { id: `${kind}_t${index}`, from, to, read: xmlText(transition.read, 'read') };
    return kind === 'mealy'
      ? { ...common, output: xmlText(transition.transout, 'transition output') }
      : common;
  });
  return kind === 'mealy'
    ? { kind, states, transitions: transitions as MealyMachine['transitions'] }
    : {
        kind,
        states: states as MooreMachine['states'],
        transitions: transitions as MooreMachine['transitions'],
      };
}

function serializeTransducer(document: MealyMachine | MooreMachine): string {
  if (document.states.filter((state) => state.isInitial).length !== 1)
    throw new JFFSerializeError('Transducer requires exactly one initial state');
  const ids = new Map(document.states.map((state, index) => [state.id, String(index)]));
  if (
    document.transitions.some((transition) => !ids.has(transition.from) || !ids.has(transition.to))
  )
    throw new JFFSerializeError('Transducer transition references a missing state');
  const lines = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    '<!--Created with Jauto.-->',
    '<structure>',
    `\t<type>${document.kind}</type>`,
    '\t<automaton>',
  ];
  for (const state of document.states) {
    lines.push(
      `\t\t<state id="${ids.get(state.id)}" name="${escapeXml(state.name)}">`,
      `\t\t\t<x>${state.x}</x>`,
      `\t\t\t<y>${state.y}</y>`,
    );
    if (state.isInitial) lines.push('\t\t\t<initial/>');
    if ('output' in state) lines.push(`\t\t\t<output>${escapeXml(state.output)}</output>`);
    lines.push('\t\t</state>');
  }
  for (const transition of document.transitions) {
    const target = document.states.find((state) => state.id === transition.to);
    const output: string =
      'output' in transition && typeof transition.output === 'string'
        ? transition.output
        : target && 'output' in target && typeof target.output === 'string'
          ? target.output
          : '';
    lines.push(
      '\t\t<transition>',
      `\t\t\t<from>${ids.get(transition.from)}</from>`,
      `\t\t\t<to>${ids.get(transition.to)}</to>`,
      `\t\t\t<read>${escapeXml(transition.read)}</read>`,
      `\t\t\t<transout>${escapeXml(output)}</transout>`,
      '\t\t</transition>',
    );
  }
  lines.push('\t</automaton>', '</structure>');
  return lines.join('\n');
}
