import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseJFFDocument, serializeJFFDocument } from '../src';

const fixture = fileURLToPath(new URL('./fixtures/official/regExprToNfa.jff', import.meta.url));

describe('JFLAP regular-expression documents', () => {
  it('imports the official expression and preserves it on export', () => {
    const document = parseJFFDocument(readFileSync(fixture, 'utf8'));
    expect(document).toEqual({ kind: 'regular-expression', expression: 'a*b(a+b)' });
    expect(parseJFFDocument(serializeJFFDocument(document))).toEqual(document);
  });

  it('preserves meaningful whitespace and XML metacharacters', () => {
    const document = { kind: 'regular-expression', expression: ' a\\+b&' } as const;
    expect(parseJFFDocument(serializeJFFDocument(document))).toEqual(document);
  });

  it('rejects invalid expressions and unknown content', () => {
    expect(() =>
      parseJFFDocument('<structure><type>re</type><expression>(a</expression></structure>'),
    ).toThrow('Missing closing parenthesis');
    expect(() => parseJFFDocument('<structure><type>re</type><unexpected/></structure>')).toThrow(
      'Unsupported regular expression field',
    );
  });
});
