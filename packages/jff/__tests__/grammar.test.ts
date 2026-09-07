import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { classifyGrammar, recognizeContextFree } from '@jauto/core';
import { parseJFFDocument, serializeJFFDocument } from '../src';

const fixture = fileURLToPath(new URL('./fixtures/official/regGrammarToNFA.jff', import.meta.url));

describe('JFLAP grammar documents', () => {
  it('imports, analyzes and preserves the official right-linear grammar', () => {
    const document = parseJFFDocument(readFileSync(fixture, 'utf8'));
    expect(document.kind).toBe('grammar');
    if (document.kind !== 'grammar') return;
    expect(classifyGrammar(document)).toBe('regular');
    expect(parseJFFDocument(serializeJFFDocument(document))).toEqual(document);
  });

  it('parses epsilon productions for context-free recognition', () => {
    const document = parseJFFDocument(
      '<structure><type>grammar</type><production><left>S</left><right>aSb</right></production><production><left>S</left><right/></production></structure>',
    );
    expect(document.kind === 'grammar' && recognizeContextFree(document, 'aabb')).toBe(true);
  });
});
