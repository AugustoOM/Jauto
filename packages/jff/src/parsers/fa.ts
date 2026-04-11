import type { FATransition } from '@jauto/core';
import { TAG } from '../constants';

let faTransCounter = 0;

export function parseFATransitions(automatonNode: Record<string, unknown>): FATransition[] {
  const raw = automatonNode[TAG.TRANSITION];
  if (!raw) return [];

  const nodes = Array.isArray(raw) ? raw : [raw];
  return nodes.map((node: Record<string, unknown>) => {
    const from = String(node[TAG.FROM] ?? '');
    const to = String(node[TAG.TO] ?? '');
    const read = node[TAG.READ] != null ? String(node[TAG.READ]) : '';

    return { id: `jff_fa_t${faTransCounter++}`, from, to, read };
  });
}

export function resetFACounter(): void {
  faTransCounter = 0;
}
