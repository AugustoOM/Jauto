import type { AutomatonState } from '@jauto/core';
import { TAG, ATTR } from '../constants';
import { JFFParseError } from '../errors';
import { xmlElements, xmlText, xmlNumber, checkKeys } from '../xml';

export function parseStates(automatonNode: Record<string, unknown>): AutomatonState[] {
  const raw = automatonNode[TAG.STATE];
  if (!raw) return [];

  const stateNodes = xmlElements(raw, 'state');
  return stateNodes.map((node: Record<string, unknown>) => {
    checkKeys(node, [ATTR.ID, ATTR.NAME, TAG.X, TAG.Y, TAG.INITIAL, TAG.FINAL, TAG.LABEL], 'state');
    const id = xmlText(node[ATTR.ID], 'state id').trim();
    if (!id) throw new JFFParseError('State missing id attribute');

    const name = xmlText(node[ATTR.NAME], 'state name', `q${id}`);
    const x = xmlNumber(node[TAG.X], TAG.X);
    const y = xmlNumber(node[TAG.Y], TAG.Y);
    const isInitial = TAG.INITIAL in node;
    const isFinal = TAG.FINAL in node;
    const label = node[TAG.LABEL] != null ? xmlText(node[TAG.LABEL], TAG.LABEL) : undefined;

    return { id, name, x, y, isInitial, isFinal, label };
  });
}
