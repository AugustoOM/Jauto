import type { FATransition } from '@jauto/core';

export function serializeFATransitions(transitions: readonly FATransition[]): string {
  return transitions
    .map((t) => {
      let inner = '';
      inner += `\t\t\t<from>${t.from}</from>\n`;
      inner += `\t\t\t<to>${t.to}</to>\n`;
      inner += `\t\t\t<read>${t.read}</read>\n`;
      return `\t\t<transition>\n${inner}\t\t</transition>`;
    })
    .join('\n');
}
