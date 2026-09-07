import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createTMRunner } from '@jauto/simulator';
import { parseJFF, serializeJFF } from '../src';

const fixture = readFileSync(
  fileURLToPath(new URL('./fixtures/official/turingAnBnCnMulti.jff', import.meta.url)),
  'utf8',
);

describe('official JFLAP multi-tape Turing machine', () => {
  it('imports every tape action and preserves it through export', () => {
    const parsed = parseJFF(fixture).automaton;
    expect(parsed.kind).toBe('turing');
    if (parsed.kind !== 'turing') return;
    expect(parsed.tapes).toBe(3);
    expect(parsed.transitions.every((transition) => transition.tapeActions?.length === 3)).toBe(
      true,
    );
    const reopened = parseJFF(serializeJFF(parsed)).automaton;
    expect({
      ...reopened,
      transitions: reopened.transitions.map(({ id: _id, ...transition }) => transition),
    }).toEqual({
      ...parsed,
      transitions: parsed.transitions.map(({ id: _id, ...transition }) => transition),
    });
  });

  it('executes the published a^n b^n c^n machine on all tapes', () => {
    const machine = parseJFF(fixture).automaton;
    if (machine.kind !== 'turing') throw new Error('Expected a Turing machine');
    expect(createTMRunner(machine, 'aabbcc').run().outcome).toBe('accepted');
    expect(createTMRunner(machine, 'abc').run().outcome).toBe('accepted');
    expect(createTMRunner(machine, 'aabcc').run().outcome).not.toBe('accepted');
    const result = createTMRunner(machine, 'abc').run();
    expect(result.finalConfig.tapes).toHaveLength(3);
    expect(result.finalConfig.headPositions).toHaveLength(3);
  });
});
