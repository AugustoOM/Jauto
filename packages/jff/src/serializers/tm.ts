import type { TMTransition } from '@jauto/core';
import { escapeXml, serializeLayout } from '../xml';

export function serializeTMTransitions(transitions: readonly TMTransition[]): string {
  return transitions
    .map((t) => {
      let inner = '';
      inner += `\t\t\t<from>${escapeXml(t.from)}</from>\n`;
      inner += `\t\t\t<to>${escapeXml(t.to)}</to>\n`;
      inner += `\t\t\t<read>${escapeXml(t.read)}</read>\n`;
      inner += `\t\t\t<write>${escapeXml(t.write)}</write>\n`;
      inner += `\t\t\t<move>${escapeXml(t.move)}</move>\n`;
      inner += serializeLayout(t);
      return `\t\t<transition>\n${inner}\t\t</transition>`;
    })
    .join('\n');
}
