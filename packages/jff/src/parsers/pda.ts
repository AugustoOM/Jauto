import type { PDATransition } from '@jauto/core';
import { TAG } from '../constants';

class PDATransitionIdGenerator {
  private counter = 0;

  nextId(): string {
    return `jff_pda_t${this.counter++}`;
  }

  reset(): void {
    this.counter = 0;
  }
}

const globalGenerator = new PDATransitionIdGenerator();

export function parsePDATransitions(automatonNode: Record<string, unknown>): PDATransition[] {
  const raw = automatonNode[TAG.TRANSITION];
  if (!raw) return [];

  const nodes = Array.isArray(raw) ? raw : [raw];
  return nodes.map((node: Record<string, unknown>) => {
    const from = String(node[TAG.FROM] ?? '');
    const to = String(node[TAG.TO] ?? '');
    const read = node[TAG.READ] != null ? String(node[TAG.READ]) : '';
    const pop = node[TAG.POP] != null ? String(node[TAG.POP]) : '';
    const push = node[TAG.PUSH] != null ? String(node[TAG.PUSH]) : '';

    return { id: globalGenerator.nextId(), from, to, read, pop, push };
  });
}

export function resetPDACounter(): void {
  globalGenerator.reset();
}

export function createIdGenerator() {
  return new PDATransitionIdGenerator();
}