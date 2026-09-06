import type { FATransition } from '@jauto/core';
import { TAG } from '../constants';
import { checkKeys, xmlElements, xmlText, parseLayout } from '../xml';

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

  const nodes = xmlElements(raw, 'transition');
  return nodes.map((node: Record<string, unknown>) => {
    checkKeys(node, ['from', 'to', 'read', 'controlx', 'controly'], 'FA transition');
    const from = xmlText(node[TAG.FROM], TAG.FROM).trim();
    const to = xmlText(node[TAG.TO], TAG.TO).trim();
    const read = xmlText(node[TAG.READ], TAG.READ);

    return { id: globalGenerator.nextId(), from, to, read, ...parseLayout(node) };
  });
}

export function resetFACounter(): void {
  globalGenerator.reset();
}

export function createIdGenerator() {
  return new FATransitionIdGenerator();
}
