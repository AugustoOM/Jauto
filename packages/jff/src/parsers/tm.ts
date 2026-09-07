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

function parseMove(value: string): 'L' | 'R' | 'S' {
  const move = value.trim();
  if (move === 'L' || move === 'R' || move === 'S') return move;
  throw new JFFParseError('TM movement must be L, R or S');
}

function tapeValues(value: unknown, tag: string, tapeCount: number): string[] {
  const entries = Array.isArray(value) ? value : [value];
  const values = Array.from({ length: tapeCount }, () => '');
  const seen = new Set<number>();
  for (const entry of entries) {
    if (typeof entry === 'string' || entry === undefined) {
      if (entries.length > 1 || tapeCount > 1)
        throw new JFFParseError(`<${tag}> must identify its tape`);
      values[0] = xmlText(entry, tag);
      seen.add(0);
      continue;
    }
    const node = xmlNode(entry, tag);
    checkKeys(node, ['@_tape', '#text'], tag);
    const tape = Number(xmlText(node['@_tape'], 'tape', '1')) - 1;
    if (!Number.isInteger(tape) || tape < 0 || tape >= tapeCount || seen.has(tape)) {
      throw new JFFParseError(`Invalid or duplicate tape number on <${tag}>`);
    }
    values[tape] = xmlText(node['#text'], tag);
    seen.add(tape);
  }
  if (seen.size !== tapeCount)
    throw new JFFParseError(`TM transition must define <${tag}> for every tape`);
  return values;
}

export function parseTMTransitions(
  automatonNode: Record<string, unknown>,
  tapeCount = 1,
): TMTransition[] {
  const raw = automatonNode[TAG.TRANSITION];
  if (!raw) return [];
  return xmlElements(raw, 'transition').map((node) => {
    checkKeys(
      node,
      ['from', 'to', 'read', 'write', 'move', 'controlx', 'controly'],
      'TM transition',
    );
    const from = xmlText(node[TAG.FROM], TAG.FROM).trim();
    const to = xmlText(node[TAG.TO], TAG.TO).trim();
    const reads = tapeValues(node[TAG.READ], TAG.READ, tapeCount);
    const writes = tapeValues(node[TAG.WRITE], TAG.WRITE, tapeCount);
    const moves = tapeValues(node[TAG.MOVE], TAG.MOVE, tapeCount).map(parseMove);
    const tapeActions = reads.map((read, index) => ({
      read,
      write: writes[index]!,
      move: moves[index]!,
    }));
    return {
      id: globalGenerator.nextId(),
      from,
      to,
      ...tapeActions[0]!,
      ...(tapeCount > 1 ? { tapeActions } : {}),
      ...parseLayout(node),
    };
  });
}

export function resetTMCounter(): void {
  globalGenerator.reset();
}
export function createIdGenerator() {
  return new TMTransitionIdGenerator();
}
