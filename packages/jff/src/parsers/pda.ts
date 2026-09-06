import type { PDATransition } from '@jauto/core';
import { TAG } from '../constants';
import { checkKeys, xmlElements, xmlText, parseLayout } from '../xml';

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

  const nodes = xmlElements(raw, 'transition');
  return nodes.map((node: Record<string, unknown>) => {
    checkKeys(node, ['from', 'to', 'read', 'pop', 'push', 'controlx', 'controly'], 'PDA transition');
    const from = xmlText(node[TAG.FROM], TAG.FROM).trim();
    const to = xmlText(node[TAG.TO], TAG.TO).trim();
    const read = xmlText(node[TAG.READ], TAG.READ);
    const pop = xmlText(node[TAG.POP], TAG.POP);
    const push = xmlText(node[TAG.PUSH], TAG.PUSH);

    return { id: globalGenerator.nextId(), from, to, read, pop, push, ...parseLayout(node) };
  });
}

export function resetPDACounter(): void {
  globalGenerator.reset();
}

export function createIdGenerator() {
  return new PDATransitionIdGenerator();
}
