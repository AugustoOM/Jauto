import type { TransitionLayout } from '@jauto/core';
import { JFFParseError, JFFSerializeError } from './errors';

function isXmlCharacter(point: number): boolean {
  return point === 9 || point === 10 || point === 13 ||
    (point >= 0x20 && point <= 0xd7ff) || (point >= 0xe000 && point <= 0xfffd) ||
    (point >= 0x10000 && point <= 0x10ffff);
}

/** Decode XML's five named entities and numeric references exactly once. */
export const xmlEntityDecoder = {
  reset() {},
  setExternalEntities() {},
  addInputEntities() { throw new JFFParseError('Custom XML entities are not supported'); },
  setXmlVersion(version: string | number) {
    if (Number(version) !== 1) throw new JFFParseError('Only XML 1.0 is supported');
  },
  decode(text: string): string {
    const names: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    return text.replace(/&([^;]+);/g, (_match, entity: string) => {
      if (Object.hasOwn(names, entity)) return names[entity]!;
      const decimal = /^#\d+$/.test(entity);
      const hex = /^#x[0-9a-f]+$/i.test(entity);
      const point = decimal ? Number(entity.slice(1)) : hex ? parseInt(entity.slice(2), 16) : NaN;
      if (!Number.isInteger(point) || !isXmlCharacter(point)) throw new JFFParseError(`Invalid XML entity: &${entity};`);
      return String.fromCodePoint(point);
    });
  },
};

export function escapeXml(value: string): string {
  for (const symbol of value) {
    const point = symbol.codePointAt(0)!;
    if (!isXmlCharacter(point)) {
      throw new JFFSerializeError('Text contains a character forbidden by XML 1.0');
    }
  }
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
    .replace(/\r/g, '&#13;').replace(/\n/g, '&#10;').replace(/\t/g, '&#9;');
}

export function xmlNode(value: unknown, context: string): Record<string, unknown> {
  if (value === undefined || (typeof value === 'string' && !value.trim())) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new JFFParseError(`Expected a single <${context}> element`);
  }
  return value as Record<string, unknown>;
}

export function xmlText(value: unknown, context: string, fallback = ''): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string') throw new JFFParseError(`Unsupported or repeated <${context}> content`);
  return value;
}

export function xmlNumber(value: unknown, context: string, fallback = 0): number {
  if (value === undefined) return fallback;
  const text = xmlText(value, context).trim();
  const number = Number(text);
  if (!text || !Number.isFinite(number)) throw new JFFParseError(`<${context}> must contain a finite number`);
  return number;
}

export function checkKeys(node: Record<string, unknown>, allowed: readonly string[], context: string): void {
  for (const key of Object.keys(node)) {
    if (key === '#text' && typeof node[key] === 'string' && !(node[key] as string).trim()) continue;
    if (!allowed.includes(key)) {
      throw new JFFParseError(`Unsupported ${context} field "${key}"; opening it would discard data`);
    }
  }
}

export function xmlElements(value: unknown, context: string): Record<string, unknown>[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).map((entry) => xmlNode(entry, context));
}

export function parseLayout(node: Record<string, unknown>): TransitionLayout {
  return {
    ...(node.controlx === undefined ? {} : { controlX: xmlNumber(node.controlx, 'controlx') }),
    ...(node.controly === undefined ? {} : { controlY: xmlNumber(node.controly, 'controly') }),
  };
}

export function serializeLayout(layout: TransitionLayout): string {
  let text = '';
  for (const [tag, value] of [['controlx', layout.controlX], ['controly', layout.controlY]] as const) {
    if (value === undefined) continue;
    if (!Number.isFinite(value)) throw new JFFSerializeError('Transition control points must be finite');
    text += `\t\t\t<${tag}>${value}</${tag}>\n`;
  }
  return text;
}
