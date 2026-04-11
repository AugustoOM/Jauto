import type { AutomatonState } from '@jauto/core';
import { TAG, ATTR } from '../constants';
import { JFFParseError } from '../errors';

export function parseStates(automatonNode: Record<string, unknown>): AutomatonState[] {
  const raw = automatonNode[TAG.STATE];
  if (!raw) return [];

  const stateNodes = Array.isArray(raw) ? raw : [raw];
  return stateNodes.map((node: Record<string, unknown>) => {
    const id = String(node[ATTR.ID] ?? '');
    if (!id) throw new JFFParseError('State missing id attribute');

    const name = String(node[ATTR.NAME] ?? `q${id}`);
    const x = parseFloat(String(node[TAG.X] ?? '0'));
    const y = parseFloat(String(node[TAG.Y] ?? '0'));
    const isInitial = TAG.INITIAL in node;
    const isFinal = TAG.FINAL in node;
    const label = node[TAG.LABEL] != null ? String(node[TAG.LABEL]) : undefined;

    return { id, name, x, y, isInitial, isFinal, label };
  });
}
