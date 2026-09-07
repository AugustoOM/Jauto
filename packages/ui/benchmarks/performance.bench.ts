import { bench, describe } from 'vitest';
import type { FiniteAutomaton } from '@jauto/core';
import { createDFARunner } from '@jauto/simulator';
import { buildRenderIndex } from '../src/composables/renderIndex';
import { useCanvasRenderer } from '../src/composables/useCanvasRenderer';

const states = Array.from({ length: 500 }, (_, index) => ({
  id: `q${index}`, name: `q${index}`, x: (index % 25) * 100, y: Math.floor(index / 25) * 100,
  isInitial: index === 0, isFinal: index === 499,
}));
const largeDiagram: FiniteAutomaton = {
  kind: 'fa', states,
  transitions: Array.from({ length: 4000 }, (_, index) => ({
    id: `t${index}`, from: `q${index % 500}`, to: `q${(index * 17 + 1) % 500}`, read: String(index % 2),
  })),
};
const longRun: FiniteAutomaton = {
  kind: 'fa',
  states: [{ id: 'q0', name: 'q0', x: 0, y: 0, isInitial: true, isFinal: true }],
  transitions: [{ id: 'loop', from: 'q0', to: 'q0', read: 'a' }],
};
const context = new Proxy({ measureText: () => ({ width: 12 }) }, {
  get(target, property) { return property in target ? target[property as keyof typeof target] : () => undefined; },
}) as unknown as CanvasRenderingContext2D;
const renderer = useCanvasRenderer();

describe('representative editor workloads', () => {
  bench('index 500 states and 4,000 transitions', () => buildRenderIndex(largeDiagram));
  bench('render 500 states and 4,000 transitions', () => renderer.render(context, 1920, 1080, largeDiagram, {
    offsetX: 0, offsetY: 0, scale: 1, selected: null, showGrid: false,
  }));
  bench('execute a 10,000-step DFA batch item', () => {
    const runner = createDFARunner(longRun, 'a'.repeat(10000));
    let result = runner.currentStep;
    while (result.status === 'running') result = runner.step();
  });
});
