import type { AnyAutomaton } from '@jauto/core';
import type { SelectedElement } from './stores/document';
import { useCanvasRenderer, readCssVar } from './composables/useCanvasRenderer';

export interface DiagramExportOptions {
  scale?: number;
  padding?: number;
  background?: string | null;
  showGrid?: boolean;
  includeEditingDecorations?: boolean;
  selected?: SelectedElement;
}

export interface DiagramBounds { minX: number; minY: number; maxX: number; maxY: number }

export function getDiagramBounds(automaton: AnyAutomaton, padding = 70): DiagramBounds {
  if (automaton.states.length === 0) return { minX: 0, minY: 0, maxX: 320, maxY: 180 };
  const xs = automaton.states.flatMap((state) => [state.x - (state.isInitial ? 65 : 35), state.x + 35]);
  const ys = automaton.states.flatMap((state) => [state.y - 65, state.y + 40]);
  for (const transition of automaton.transitions) {
    if (typeof transition.controlX === 'number') xs.push(transition.controlX);
    if (typeof transition.controlY === 'number') ys.push(transition.controlY);
  }
  return { minX: Math.min(...xs) - padding, minY: Math.min(...ys) - padding, maxX: Math.max(...xs) + padding, maxY: Math.max(...ys) + padding };
}

export async function exportDiagramPng(automaton: AnyAutomaton, options: DiagramExportOptions = {}): Promise<Blob> {
  const scale = Math.max(0.25, Math.min(options.scale ?? 2, 4));
  const bounds = getDiagramBounds(automaton, options.padding);
  const width = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) * scale));
  const height = Math.max(1, Math.ceil((bounds.maxY - bounds.minY) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable');
  useCanvasRenderer().render(context, width, height, automaton, {
    offsetX: -bounds.minX * scale,
    offsetY: -bounds.minY * scale,
    scale,
    selected: options.includeEditingDecorations ? options.selected ?? null : null,
    background: options.background === undefined ? readCssVar('--color-canvas-bg', '#111111') : options.background,
    showGrid: options.showGrid ?? false,
  });
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error('The canvas could not be encoded as PNG')),
    'image/png',
  ));
}
