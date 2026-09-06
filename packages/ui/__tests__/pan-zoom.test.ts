import { describe, expect, it } from 'vitest';
import { usePanZoom } from '../src/composables/usePanZoom';

describe('diagram viewport', () => {
  it('fits imported diagram bounds into the available viewport', () => {
    const viewport = usePanZoom();
    viewport.fitAll([{ x: -100, y: -50 }, { x: 300, y: 150 }], 800, 400);

    const first = viewport.worldToScreen(-100, -50);
    const last = viewport.worldToScreen(300, 150);
    expect(viewport.scale.value).toBeCloseTo(400 / 360);
    expect(first.x).toBeGreaterThan(0);
    expect(first.y).toBeGreaterThan(0);
    expect(last.x).toBeLessThan(800);
    expect(last.y).toBeLessThan(400);
  });

  it('resets an empty diagram and clamps zoom controls', () => {
    const viewport = usePanZoom();
    viewport.fitAll([], 800, 400);
    for (let index = 0; index < 30; index++) viewport.zoomOut();
    expect(viewport.scale.value).toBe(0.1);
    for (let index = 0; index < 40; index++) viewport.zoomIn();
    expect(viewport.scale.value).toBe(5);
  });
});
