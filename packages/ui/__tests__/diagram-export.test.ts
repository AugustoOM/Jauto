import { describe, expect, it } from 'vitest';
import type { FiniteAutomaton } from '@jauto/core';
import { getDiagramBounds } from '../src/diagramExport';

describe('diagram export bounds', () => {
  it('includes negative positions, initial arrows, and transition control points', () => {
    const automaton: FiniteAutomaton = {
      kind: 'fa',
      states: [
        { id: 'a', name: 'a', x: -100, y: 20, isInitial: true, isFinal: false },
        { id: 'b', name: 'b', x: 200, y: 80, isInitial: false, isFinal: true },
      ],
      transitions: [{ id: 'curve', from: 'a', to: 'b', read: 'x', controlX: 50, controlY: -200 }],
    };
    const bounds = getDiagramBounds(automaton, 20);
    expect(bounds.minX).toBeLessThan(-165);
    expect(bounds.minY).toBe(-220);
    expect(bounds.maxX).toBeGreaterThan(234);
    expect(bounds.maxY).toBeGreaterThan(119);
  });
});
