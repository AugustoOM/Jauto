import type { PDATransition } from '@jauto/core';
import { escapeXml, serializeLayout } from '../xml';

export function serializePDATransitions(transitions: readonly PDATransition[]): string {
  return transitions
    .map((t) => {
      let inner = '';
      inner += `\t\t\t<from>${escapeXml(t.from)}</from>\n`;
      inner += `\t\t\t<to>${escapeXml(t.to)}</to>\n`;
      inner += `\t\t\t<read>${escapeXml(t.read)}</read>\n`;
      inner += `\t\t\t<pop>${escapeXml(t.pop)}</pop>\n`;
      inner += `\t\t\t<push>${escapeXml(t.push)}</push>\n`;
      inner += serializeLayout(t);
      return `\t\t<transition>\n${inner}\t\t</transition>`;
    })
    .join('\n');
}
