import type { AnyAutomaton, AnyTransition } from '@jauto/core';
import { validateStructure } from '@jauto/core';
import { JFFSerializeError } from './errors';
import { escapeXml } from './xml';
import { serializeStates } from './serializers/states';
import { serializeFATransitions } from './serializers/fa';
import { serializePDATransitions } from './serializers/pda';
import { serializeTMTransitions } from './serializers/tm';

export function serializeJFF(automaton: AnyAutomaton): string {
  const errors = validateStructure(automaton);
  if (errors.length) throw new JFFSerializeError(errors.map((error) => error.message).join('; '));
  const ids = new Map<string, string>();
  const used = new Set<string>();
  for (const state of automaton.states) {
    if (/^(0|[1-9]\d*)$/.test(state.id) && Number(state.id) <= 2147483647) {
      ids.set(state.id, state.id);
      used.add(state.id);
    }
  }
  let next = 0;
  for (const state of automaton.states) {
    if (ids.has(state.id)) continue;
    while (used.has(String(next))) next++;
    ids.set(state.id, String(next));
    used.add(String(next++));
  }
  function mapTransitions<T extends AnyTransition>(transitions: readonly T[]): T[] {
    return transitions.map((t) => ({ ...t, from: ids.get(t.from)!, to: ids.get(t.to)! }));
  }
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
  lines.push('<!--Created with Jauto.-->');
  lines.push('<structure>');
  lines.push(`\t<type>${automaton.kind}</type>`);
  if (automaton.kind === 'turing') lines.push(`\t<tapes>${automaton.tapes}</tapes>`);
  lines.push('\t<automaton>');

  const statesXml = serializeStates(automaton.states.map((s) => ({ ...s, id: ids.get(s.id)! })));
  if (statesXml) lines.push(statesXml);

  let transitionsXml = '';
  switch (automaton.kind) {
    case 'fa':
      transitionsXml = serializeFATransitions(mapTransitions(automaton.transitions));
      break;
    case 'pda':
      transitionsXml = serializePDATransitions(mapTransitions(automaton.transitions));
      break;
    case 'turing':
      transitionsXml = serializeTMTransitions(
        mapTransitions(automaton.transitions),
        automaton.tapes,
      );
      break;
  }
  if (transitionsXml) lines.push(transitionsXml);
  for (const note of automaton.meta?.notes ?? []) {
    if (!Number.isFinite(note.x) || !Number.isFinite(note.y))
      throw new JFFSerializeError('Note coordinates must be finite');
    lines.push(
      `\t\t<note><text>${escapeXml(note.text)}</text><x>${note.x}</x><y>${note.y}</y></note>`,
    );
  }

  lines.push('\t</automaton>');
  lines.push('</structure>');
  return lines.join('\n');
}
