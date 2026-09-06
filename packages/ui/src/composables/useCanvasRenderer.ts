import type { AnyAutomaton, AutomatonState, AnyTransition } from '@jauto/core';
import type { SelectedElement } from '../stores/document';
import type { TransitionHighlight } from '../stores/simulation';
import { STATE_RADIUS } from '../constants';
import {
  getEdgeGeometry,
  getSelfLoopGeometry,
} from './transitionGeometry';
import { buildRenderIndex, transitionGroupKey } from './renderIndex';

const ARROW_SIZE = 6;
let frameCssCache: Map<string, string> | null = null;

export function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const cached = frameCssCache?.get(name);
  if (cached) return cached;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = v || fallback;
  frameCssCache?.set(name, value);
  return value;
}

export interface RenderOptions {
  offsetX: number;
  offsetY: number;
  scale: number;
  selected: SelectedElement;
  highlightedStates?: ReadonlySet<string>;
  activeTransitions?: readonly TransitionHighlight[];
  background?: string | null;
  showGrid?: boolean;
}

export function useCanvasRenderer() {
  function render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    automaton: AnyAutomaton,
    options: RenderOptions,
  ) {
    frameCssCache = new Map();
    const { offsetX, offsetY, scale, selected, highlightedStates, activeTransitions = [] } = options;

    const canvasBg = options.background === undefined ? readCssVar('--color-canvas-bg', '#111111') : options.background;
    const gridColor = readCssVar('--color-canvas-grid', '#1a1a1a');
    const fontSans = readCssVar('--font-family', 'DM Sans, system-ui, sans-serif');

    ctx.clearRect(0, 0, width, height);
    if (canvasBg !== null) {
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, width, height);
    }

    if (options.showGrid !== false) drawGrid(ctx, width, height, offsetX, offsetY, scale, gridColor);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const { statesById, transitionGroups } = buildRenderIndex(automaton);
    const margin = 100 / scale;
    const visible = {
      minX: (-offsetX / scale) - margin,
      minY: (-offsetY / scale) - margin,
      maxX: ((width - offsetX) / scale) + margin,
      maxY: ((height - offsetY) / scale) + margin,
    };

    for (const t of automaton.transitions) {
      const from = statesById.get(t.from);
      const to = statesById.get(t.to);
      if (!from || !to) continue;
      const controlX = typeof t.controlX === 'number' ? t.controlX : (from.x + to.x) / 2;
      const controlY = typeof t.controlY === 'number' ? t.controlY : (from.y + to.y) / 2;
      if (!boundsIntersectViewport([from.x, to.x, controlX], [from.y, to.y, controlY], visible)) continue;

      const isSelected = selected?.type === 'transition' && selected.id === t.id;
      const isActiveTransition = activeTransitions.some((active) => active.transitionId === t.id);
      const groupKey = transitionGroupKey(t.from, t.to);
      drawTransition(ctx, from, to, t, transitionGroups.get(groupKey) ?? [t], isSelected, isActiveTransition, fontSans);
    }

    for (const state of automaton.states) {
      if (state.x < visible.minX || state.x > visible.maxX || state.y < visible.minY || state.y > visible.maxY) continue;
      const isSelected = selected?.type === 'state' && selected.id === state.id;
      const isHighlighted = highlightedStates?.has(state.id) ?? false;
      const simulationRole = getSimulationStateRole(state.id, activeTransitions);
      drawState(ctx, state, isSelected, isHighlighted, simulationRole, fontSans);
    }

    if (automaton.states.length === 0) {
      ctx.restore();
      ctx.fillStyle = readCssVar('--color-empty-hint', '#666');
      ctx.font = `14px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Right-click the canvas to add a state', width / 2, height / 2);
      frameCssCache = null;
      return;
    }

    ctx.restore();
    frameCssCache = null;
  }

  function boundsIntersectViewport(
    xs: readonly number[],
    ys: readonly number[],
    viewport: { minX: number; minY: number; maxX: number; maxY: number },
  ) {
    return Math.max(...xs) >= viewport.minX && Math.min(...xs) <= viewport.maxX &&
      Math.max(...ys) >= viewport.minY && Math.min(...ys) <= viewport.maxY;
  }

  function drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    offsetX: number,
    offsetY: number,
    scale: number,
    gridColor: string,
  ) {
    const gridSize = 40 * scale;
    if (gridSize < 8) return;

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    const startX = offsetX % gridSize;
    for (let x = startX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    const startY = offsetY % gridSize;
    for (let y = startY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }

    ctx.stroke();
  }

  function drawState(
    ctx: CanvasRenderingContext2D,
    state: AutomatonState,
    isSelected: boolean,
    isHighlighted: boolean,
    simulationRole: 'source' | 'target' | 'both' | null,
    fontSans: string,
  ) {
    const { x, y } = state;

    const accent = readCssVar('--color-primary', '#4263eb');
    const glowStrong = readCssVar('--color-state-highlight-glow', 'rgba(66, 99, 235, 0.3)');
    const hlFill = readCssVar('--color-state-highlight-fill', 'rgba(66, 99, 235, 0.14)');
    const stateFill = readCssVar('--color-state-fill', 'rgba(255,255,255,0.08)');
    const strokeMain = readCssVar('--color-state-stroke', '#f0f0f0');
    const strokeMuted = readCssVar('--color-state-stroke-muted', '#aaa');
    const labelColor = readCssVar('--color-label-text', '#fff');
    const sourceColor = readCssVar('--color-simulation-source', '#228be6');
    const targetColor = readCssVar('--color-simulation-target', '#fa5252');
    const edgeColor = readCssVar('--color-simulation-edge', '#ae3ec9');

    const roleColor =
      simulationRole === 'source'
        ? sourceColor
        : simulationRole === 'target'
          ? targetColor
          : simulationRole === 'both'
            ? edgeColor
            : null;

    if (isHighlighted || roleColor) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, STATE_RADIUS + 6, 0, Math.PI * 2);
      ctx.fillStyle = roleColor ? colorWithAlpha(roleColor, 0.28) : glowStrong;
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(x, y, STATE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = roleColor ? colorWithAlpha(roleColor, 0.16) : isHighlighted ? hlFill : stateFill;
    ctx.fill();
    ctx.strokeStyle = roleColor ?? (isHighlighted || isSelected ? accent : strokeMain);
    ctx.lineWidth = roleColor ? 3.5 : isHighlighted ? 3 : isSelected ? 2.5 : 1.5;
    ctx.stroke();

    if (state.isFinal) {
      ctx.beginPath();
      ctx.arc(x, y, STATE_RADIUS - 4, 0, Math.PI * 2);
      ctx.strokeStyle = isSelected ? accent : strokeMuted;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (state.isInitial) {
      drawInitialArrow(ctx, state);
    }

    ctx.fillStyle = labelColor;
    ctx.font = `13px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.name, x, y);
  }

  function drawInitialArrow(ctx: CanvasRenderingContext2D, state: AutomatonState) {
    const startX = state.x - STATE_RADIUS - 30;
    const endX = state.x - STATE_RADIUS;
    const arrowAngle = 0;
    const y = state.y;
    const tail = getArrowTailPoint(endX, y, arrowAngle);

    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(tail.x, tail.y);
    const arrowColor = readCssVar('--color-initial-arrow', '#aaa');
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, y);
    ctx.lineTo(endX - ARROW_SIZE, y - ARROW_SIZE / 2);
    ctx.lineTo(endX - ARROW_SIZE, y + ARROW_SIZE / 2);
    ctx.closePath();
    ctx.fillStyle = arrowColor;
    ctx.fill();
  }

  function drawTransition(
    ctx: CanvasRenderingContext2D,
    from: AutomatonState,
    to: AutomatonState,
    transition: AnyTransition,
    siblings: readonly AnyTransition[],
    isSelected: boolean,
    isActiveTransition: boolean,
    fontSans: string,
  ) {
    const accent = readCssVar('--color-primary', '#4263eb');
    const strokeDefault = readCssVar('--color-transition-stroke', '#aaa');
    const simulationEdge = readCssVar('--color-simulation-edge', '#ae3ec9');
    ctx.strokeStyle = isActiveTransition ? simulationEdge : isSelected ? accent : strokeDefault;
    ctx.lineWidth = isActiveTransition ? 3 : isSelected ? 2 : 1.5;
    ctx.fillStyle = isActiveTransition ? simulationEdge : isSelected ? accent : strokeDefault;

    if (from.id === to.id) {
      drawSelfLoop(
        ctx,
        from,
        transition,
        siblings,
        fontSans,
        isSelected,
        isActiveTransition,
      );
      return;
    }

    const geometry = getEdgeGeometry(from, to, siblings, transition);
    if (!geometry) return;
    const tail = getArrowTailPoint(geometry.endX, geometry.endY, geometry.arrowAngle);

    ctx.beginPath();
    if (geometry.isCurved) {
      ctx.moveTo(geometry.startX, geometry.startY);
      ctx.quadraticCurveTo(geometry.controlX, geometry.controlY, tail.x, tail.y);
    } else {
      ctx.moveTo(geometry.startX, geometry.startY);
      ctx.lineTo(tail.x, tail.y);
    }
    ctx.stroke();

    drawArrowHead(ctx, geometry.endX, geometry.endY, geometry.arrowAngle);

    const label = getTransitionLabel(transition);

    const labelText = isActiveTransition
      ? simulationEdge
      : isSelected
        ? accent
        : readCssVar('--color-label-text', '#fff');
    ctx.fillStyle = labelText;
    ctx.font = `12px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(label);
    const padding = 3;
    ctx.save();
    ctx.fillStyle = readCssVar('--color-label-chip-bg', 'rgba(255,255,255,0.06)');
    ctx.fillRect(
      geometry.labelX - metrics.width / 2 - padding,
      geometry.labelY - 7 - padding,
      metrics.width + padding * 2,
      14 + padding * 2,
    );
    ctx.restore();

    ctx.fillStyle = labelText;
    ctx.fillText(label, geometry.labelX, geometry.labelY);
  }

  function drawSelfLoop(
    ctx: CanvasRenderingContext2D,
    state: AutomatonState,
    transition: AnyTransition,
    selfLoopSiblings: readonly AnyTransition[],
    fontSans: string,
    isSelected: boolean,
    isActiveTransition: boolean,
  ) {
    const geometry = getSelfLoopGeometry(state, selfLoopSiblings, transition);
    const endAngle = geometry.endAngle - ARROW_SIZE / geometry.r;
    const tail = {
      x: geometry.cx + Math.cos(endAngle) * geometry.r,
      y: geometry.cy + Math.sin(endAngle) * geometry.r,
    };
    const arrowAngle = Math.atan2(geometry.arrowY - tail.y, geometry.arrowX - tail.x);

    ctx.beginPath();
    ctx.arc(geometry.cx, geometry.cy, geometry.r, geometry.startAngle, endAngle);
    ctx.stroke();

    drawArrowHead(ctx, geometry.arrowX, geometry.arrowY, arrowAngle);

    const label = getTransitionLabel(transition);
    const accent = readCssVar('--color-primary', '#4263eb');
    const simulationEdge = readCssVar('--color-simulation-edge', '#ae3ec9');
    ctx.fillStyle = isActiveTransition
      ? simulationEdge
      : isSelected
        ? accent
        : readCssVar('--color-label-text', '#fff');
    ctx.font = `12px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, geometry.labelX, geometry.labelY);
  }

  function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    const fillColor = ctx.fillStyle;
    const outlineColor = readCssVar('--color-state-fill', 'rgba(174, 167, 167, 0.08)');

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-ARROW_SIZE, -ARROW_SIZE / 2);
    ctx.lineTo(-ARROW_SIZE, ARROW_SIZE / 2);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.restore();
  }

  function getArrowTailPoint(x: number, y: number, angle: number) {
    return {
      x: x - Math.cos(angle) * ARROW_SIZE,
      y: y - Math.sin(angle) * ARROW_SIZE,
    };
  }

  function getSimulationStateRole(
    stateId: string,
    activeTransitions: readonly TransitionHighlight[],
  ) {
    const isSource = activeTransitions.some((transition) => transition.sourceStateId === stateId);
    const isTarget = activeTransitions.some((transition) => transition.targetStateId === stateId);
    if (isSource && isTarget) return 'both';
    if (isSource) return 'source';
    if (isTarget) return 'target';
    return null;
  }

  function colorWithAlpha(color: string, alpha: number): string {
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
      const hex =
        color.length === 4
          ? color
              .slice(1)
              .split('')
              .map((char) => char + char)
              .join('')
          : color.slice(1);
      const value = Number.parseInt(hex, 16);
      const r = (value >> 16) & 255;
      const g = (value >> 8) & 255;
      const b = value & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  function getTransitionLabel(t: AnyTransition): string {
    const read = t.read || '\u03B5';
    if ('pop' in t && 'push' in t) {
      const pop = t.pop || '\u03B5';
      const push = t.push || '\u03B5';
      return `${read}, ${pop} \u2192 ${push}`;
    }
    if ('write' in t && 'move' in t) {
      const write = t.write || '\u25A1';
      return `${read} \u2192 ${write}, ${t.move}`;
    }
    return read;
  }

  return { render, STATE_RADIUS };
}
