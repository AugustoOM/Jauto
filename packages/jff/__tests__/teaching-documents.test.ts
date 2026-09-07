import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { deriveLSystem } from '@jauto/core';
import { parseJFFDocument, serializeJFFDocument } from '../src';

const fixture = (name: string) =>
  readFileSync(fileURLToPath(new URL(`./fixtures/official/${name}`, import.meta.url)), 'utf8');

describe('JFLAP teaching documents', () => {
  it('derives and preserves the official L-system', () => {
    const system = parseJFFDocument(fixture('lsystem1.jff'));
    expect(system.kind).toBe('l-system');
    if (system.kind !== 'l-system') return;
    expect(deriveLSystem(system, 2)).toEqual('g g g g g g X + g + g'.split(' '));
    expect(parseJFFDocument(serializeJFFDocument(system))).toEqual(system);
  });

  it.each(['regUserFirst.jff', 'cfUserFirst.jff'])(
    'preserves the official pumping activity %s',
    (name) => {
      const activity = parseJFFDocument(fixture(name));
      expect(activity.kind).toBe('pumping-lemma');
      expect(parseJFFDocument(serializeJFFDocument(activity))).toEqual(activity);
    },
  );
});
