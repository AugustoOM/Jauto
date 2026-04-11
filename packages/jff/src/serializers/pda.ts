import type { PDATransition } from '@jauto/core';

export function serializePDATransitions(transitions: readonly PDATransition[]): string {
  return transitions
    .map((t) => {
      let inner = '';
      inner += `\t\t\t<from>${t.from}</from>\n`;
      inner += `\t\t\t<to>${t.to}</to>\n`;
      inner += `\t\t\t<read>${t.read}</read>\n`;
      inner += `\t\t\t<pop>${t.pop}</pop>\n`;
      inner += `\t\t\t<push>${t.push}</push>\n`;
      return `\t\t<transition>\n${inner}\t\t</transition>`;
    })
    .join('\n');
}
