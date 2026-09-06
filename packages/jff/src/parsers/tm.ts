import type { TMTransition } from '@jauto/core';
import { TAG } from '../constants';
import { checkKeys, xmlElements, xmlText, xmlNode, parseLayout } from '../xml';
import { JFFParseError } from '../errors';

class TMTransitionIdGenerator {
  private counter = 0;

  nextId(): string {
    return `jff_tm_t${this.counter++}`;
  }

  reset(): void {
    this.counter = 0;
  }
}

const globalGenerator = new TMTransitionIdGenerator();

function parseMove(value: unknown): 'L' | 'R' | 'S' {
  const s = tapeText(value, TAG.MOVE).trim();
  if (s === 'L' || s === 'R' || s === 'S') return s;
  throw new JFFParseError('TM movement must be L, R or S');
}

function tapeText(value: unknown, tag: string): string {
  if (value && typeof value === 'object') {
    const node = xmlNode(value, tag);
    checkKeys(node, ['@_tape', '#text'], tag);
    if (xmlText(node['@_tape'], 'tape', '1').trim() !== '1') {
      throw new JFFParseError('Multi-tape transitions are not supported');
    }
    return xmlText(node['#text'], tag);
  }
  return xmlText(value, tag);
}

export function parseTMTransitions(automatonNode: Record<string, unknown>): TMTransition[] {
  const raw = automatonNode[TAG.TRANSITION];
  if (!raw) return [];

  const nodes = xmlElements(raw, 'transition');
  return nodes.map((node: Record<string, unknown>) => {
    checkKeys(node, ['from', 'to', 'read', 'write', 'move', 'controlx', 'controly'], 'TM transition');
    const from = xmlText(node[TAG.FROM], TAG.FROM).trim();
    const to = xmlText(node[TAG.TO], TAG.TO).trim();
    const read = tapeText(node[TAG.READ], TAG.READ);
    const write = tapeText(node[TAG.WRITE], TAG.WRITE);
    const move = parseMove(node[TAG.MOVE]);

    return { id: globalGenerator.nextId(), from, to, read, write, move, ...parseLayout(node) };
  });
}

export function resetTMCounter(): void {
  globalGenerator.reset();
}

export function createIdGenerator() {
  return new TMTransitionIdGenerator();
}
