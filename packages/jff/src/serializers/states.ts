import type { AutomatonState } from '@jauto/core';

export function serializeStates(states: readonly AutomatonState[]): string {
  return states
    .map((s) => {
      const nameAttr = s.name ? ` name="${escapeXml(s.name)}"` : '';
      let inner = '';
      inner += `\t\t\t<x>${s.x}</x>\n`;
      inner += `\t\t\t<y>${s.y}</y>\n`;
      if (s.label != null) inner += `\t\t\t<label>${escapeXml(s.label)}</label>\n`;
      if (s.isInitial) inner += `\t\t\t<initial/>\n`;
      if (s.isFinal) inner += `\t\t\t<final/>\n`;
      return `\t\t<state id="${escapeXml(s.id)}"${nameAttr}>\n${inner}\t\t</state>`;
    })
    .join('\n');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
