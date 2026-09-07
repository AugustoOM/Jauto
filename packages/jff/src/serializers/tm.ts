import type { TMTransition } from '@jauto/core';
import { escapeXml, serializeLayout } from '../xml';

export function serializeTMTransitions(
  transitions: readonly TMTransition[],
  tapeCount = 1,
): string {
  return transitions
    .map((t) => {
      let inner = '';
      inner += `\t\t\t<from>${escapeXml(t.from)}</from>\n`;
      inner += `\t\t\t<to>${escapeXml(t.to)}</to>\n`;
      const actions = t.tapeActions ?? [t];
      if (actions.length !== tapeCount)
        throw new Error('TM transition action count must match tape count');
      for (const [index, action] of actions.entries()) {
        const attr = tapeCount > 1 ? ` tape="${index + 1}"` : '';
        inner += `\t\t\t<read${attr}>${escapeXml(action.read)}</read>\n`;
        inner += `\t\t\t<write${attr}>${escapeXml(action.write)}</write>\n`;
        inner += `\t\t\t<move${attr}>${escapeXml(action.move)}</move>\n`;
      }
      inner += serializeLayout(t);
      return `\t\t<transition>\n${inner}\t\t</transition>`;
    })
    .join('\n');
}
