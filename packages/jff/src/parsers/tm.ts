import type { TMTransition } from '@jauto/core';
import { TAG } from '../constants';

let tmTransCounter = 0;

function parseMove(value: unknown): 'L' | 'R' | 'S' {
  const s = String(value ?? 'R').toUpperCase();
  if (s === 'L' || s === 'R' || s === 'S') return s;
  return 'R';
}

export function parseTMTransitions(automatonNode: Record<string, unknown>): TMTransition[] {
  const raw = automatonNode[TAG.TRANSITION];
  if (!raw) return [];

  const nodes = Array.isArray(raw) ? raw : [raw];
  return nodes.map((node: Record<string, unknown>) => {
    const from = String(node[TAG.FROM] ?? '');
    const to = String(node[TAG.TO] ?? '');
    const read = node[TAG.READ] != null ? String(node[TAG.READ]) : '';
    const write = node[TAG.WRITE] != null ? String(node[TAG.WRITE]) : '';
    const move = parseMove(node[TAG.MOVE]);

    return { id: `jff_tm_t${tmTransCounter++}`, from, to, read, write, move };
  });
}

export function resetTMCounter(): void {
  tmTransCounter = 0;
}
