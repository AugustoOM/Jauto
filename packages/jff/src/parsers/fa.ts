import type { FATransition } from '@jauto/core';
import { TAG } from '../constants';

class FATransitionIdGenerator {
  private counter = 0;

  nextId(): string {
    return `jff_fa_t${this.counter++}`;
  }

  reset(): void {
    this.counter = 0;
  }
}

const globalGenerator = new FATransitionIdGenerator();

export function parseFATransitions(automatonNode: Record<string, unknown>): FATransition[] {
  const raw = automatonNode[TAG.TRANSITION];
  if (!raw) return [];

  const nodes = Array.isArray(raw) ? raw : [raw];
  return nodes.map((node: Record<string, unknown>) => {
    const from = String(node[TAG.FROM] ?? '');
    const to = String(node[TAG.TO] ?? '');
    const read = node[TAG.READ] != null ? String(node[TAG.READ]) : '';

    return { id: globalGenerator.nextId(), from, to, read };
  });
}

export function resetFACounter(): void {
  globalGenerator.reset();
}

export function createIdGenerator() {
  return new FATransitionIdGenerator();
}