import type { TuringBlockMachine, TuringBlockState, TuringBlockTransition } from '@jauto/core';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { JFFParseError, JFFSerializeError } from './errors';
import {
  checkKeys,
  escapeXml,
  xmlElements,
  xmlEntityDecoder,
  xmlNode,
  xmlNumber,
  xmlText,
} from './xml';

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  entityDecoder: xmlEntityDecoder,
  isArray: (name) => ['state', 'block', 'transition'].includes(name),
});

export function parseTuringBlockJFF(xml: string): TuringBlockMachine {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new JFFParseError('DTD and custom XML entities are not supported');
  const valid = XMLValidator.validate(xml);
  if (valid !== true) throw new JFFParseError(`Invalid XML: ${valid.err.msg}`);
  const document = xmlNode(parser.parse(xml), 'document');
  checkKeys(document, ['?xml', 'structure'], 'document');
  const structure = xmlNode(document.structure, 'structure');
  checkKeys(structure, ['type', 'automaton'], 'building-block structure');
  if (xmlText(structure.type, 'type').trim() !== 'turing')
    throw new JFFParseError('Building blocks require a Turing document');
  return parseMachine(xmlNode(structure.automaton, 'automaton'), new Set());
}

function parseMachine(node: Record<string, unknown>, ancestors: Set<string>): TuringBlockMachine {
  const blockNodes = xmlElements(node.block, 'block');
  const tags = blockNodes.map((block) => xmlText(block.tag, 'block tag'));
  checkKeys(node, ['state', 'block', 'transition', ...tags], 'building-block automaton');
  const states: TuringBlockState[] = xmlElements(node.state, 'state').map((state) => {
    checkKeys(state, ['@_id', '@_name', 'x', 'y', 'initial', 'final', 'label'], 'state');
    const id = xmlText(state['@_id'], 'state id').trim();
    return {
      id,
      name: xmlText(state['@_name'], 'state name', `q${id}`),
      x: xmlNumber(state.x, 'x'),
      y: xmlNumber(state.y, 'y'),
      isInitial: 'initial' in state,
      isFinal: 'final' in state,
      ...(state.label === undefined ? {} : { label: xmlText(state.label, 'label') }),
    };
  });
  for (const block of blockNodes) {
    checkKeys(block, ['@_id', '@_name', 'tag', 'x', 'y', 'initial', 'final'], 'block');
    const tag = xmlText(block.tag, 'block tag');
    if (!/^[A-Za-z_][\w.-]*$/u.test(tag))
      throw new JFFParseError(`Invalid building-block tag "${tag}"`);
    if (ancestors.has(tag))
      throw new JFFParseError(`Recursive building block "${tag}" is not supported`);
    if (!(tag in node)) throw new JFFParseError(`Missing embedded machine for block "${tag}"`);
    const nestedAncestors = new Set(ancestors).add(tag);
    const id = xmlText(block['@_id'], 'block id').trim();
    states.push({
      id,
      name: xmlText(block['@_name'], 'block name', tag),
      x: xmlNumber(block.x, 'x'),
      y: xmlNumber(block.y, 'y'),
      isInitial: 'initial' in block,
      isFinal: 'final' in block,
      block: { tag, machine: parseMachine(xmlNode(node[tag], tag), nestedAncestors) },
    });
  }
  const ids = new Set(states.map((state) => state.id));
  if (states.filter((state) => state.isInitial).length !== 1)
    throw new JFFParseError('Every building-block machine requires exactly one initial state');
  const transitions: TuringBlockTransition[] = xmlElements(node.transition, 'transition').map(
    (transition, index) => {
      checkKeys(
        transition,
        ['@_block', 'from', 'to', 'read', 'write', 'move'],
        'building-block transition',
      );
      const from = xmlText(transition.from, 'from').trim();
      const to = xmlText(transition.to, 'to').trim();
      if (!ids.has(from) || !ids.has(to))
        throw new JFFParseError('Building-block transition references a missing state');
      const blockEdge =
        String(transition['@_block'] ?? '') === 'true' ||
        (!('write' in transition) && !('move' in transition));
      const move = blockEdge ? 'S' : (xmlText(transition.move, 'move') as 'L' | 'R' | 'S');
      if (!['L', 'R', 'S'].includes(move))
        throw new JFFParseError('Building-block transition movement must be L, R or S');
      return {
        id: `block_t${index}`,
        from,
        to,
        read: xmlText(transition.read, 'read'),
        write: blockEdge ? '~' : xmlText(transition.write, 'write'),
        move,
        ...(blockEdge ? { blockEdge: true } : {}),
      };
    },
  );
  return { kind: 'turing-blocks', tapes: 1, states, transitions };
}

export function serializeTuringBlockJFF(machine: TuringBlockMachine): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    '<!--Created with Jauto.-->',
    '<structure>',
    '\t<type>turing</type>',
    '\t<automaton>',
  ];
  serializeMachine(machine, lines, 2);
  lines.push('\t</automaton>', '</structure>');
  return lines.join('\n');
}

function serializeMachine(machine: TuringBlockMachine, lines: string[], depth: number): void {
  if (machine.states.filter((state) => state.isInitial).length !== 1)
    throw new JFFSerializeError('Every building-block machine requires exactly one initial state');
  const indent = '\t'.repeat(depth);
  const ids = new Map(machine.states.map((state, index) => [state.id, String(index)]));
  const nested = new Map<string, TuringBlockMachine>();
  for (const state of machine.states) {
    const tag = state.block?.tag;
    if (tag && !/^[A-Za-z_][\w.-]*$/u.test(tag))
      throw new JFFSerializeError(`Invalid building-block tag "${tag}"`);
    lines.push(
      `${indent}<${state.block ? 'block' : 'state'} id="${ids.get(state.id)}" name="${escapeXml(state.name)}">`,
    );
    if (state.block) {
      lines.push(`${indent}\t<tag>${escapeXml(state.block.tag)}</tag>`);
      nested.set(state.block.tag, state.block.machine);
    }
    lines.push(`${indent}\t<x>${state.x}</x>`, `${indent}\t<y>${state.y}</y>`);
    if (state.label) lines.push(`${indent}\t<label>${escapeXml(state.label)}</label>`);
    if (state.isInitial) lines.push(`${indent}\t<initial/>`);
    if (state.isFinal) lines.push(`${indent}\t<final/>`);
    lines.push(`${indent}</${state.block ? 'block' : 'state'}>`);
  }
  for (const transition of machine.transitions) {
    if (!ids.has(transition.from) || !ids.has(transition.to))
      throw new JFFSerializeError('Building-block transition references a missing state');
    lines.push(
      `${indent}<transition${transition.blockEdge ? ' block="true"' : ''}>`,
      `${indent}\t<from>${ids.get(transition.from)}</from>`,
      `${indent}\t<to>${ids.get(transition.to)}</to>`,
      `${indent}\t<read>${escapeXml(transition.read)}</read>`,
    );
    if (!transition.blockEdge)
      lines.push(
        `${indent}\t<write>${escapeXml(transition.write)}</write>`,
        `${indent}\t<move>${transition.move}</move>`,
      );
    lines.push(`${indent}</transition>`);
  }
  for (const [tag, child] of nested) {
    lines.push(`${indent}<${tag}>`);
    serializeMachine(child, lines, depth + 1);
    lines.push(`${indent}</${tag}>`);
  }
}
