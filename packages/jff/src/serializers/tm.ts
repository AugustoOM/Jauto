import type { TMTransition } from '@jauto/core';

export function serializeTMTransitions(transitions: readonly TMTransition[]): string {
  return transitions
    .map((t) => {
      let inner = '';
      inner += `\t\t\t<from>${t.from}</from>\n`;
      inner += `\t\t\t<to>${t.to}</to>\n`;
      inner += `\t\t\t<read>${t.read}</read>\n`;
      inner += `\t\t\t<write>${t.write}</write>\n`;
      inner += `\t\t\t<move>${t.move}</move>\n`;
      return `\t\t<transition>\n${inner}\t\t</transition>`;
    })
    .join('\n');
}
