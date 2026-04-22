import type { AnyAutomaton, AutomatonState, AnyTransition } from '@jauto/core';
import type { SelectedElement } from '../stores/document';
import { STATE_RADIUS } from '../constants';
import { SELF_LOOP_RADIUS, SELF_LOOP_OFFSET } from '../constants';

const ARROW_SIZE = 10;

export function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export interface RenderOptions {
  offsetX: number;
  offsetY: number;
  scale: number;
  selected: SelectedElement;
  highlightedStates?: ReadonlySet<string>;
}

export function useCanvasRenderer() {
  function render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    automaton: AnyAutomaton,
    options: RenderOptions,
  ) {
    const { offsetX, offsetY, scale, selected, highlightedStates } = options;

    const canvasBg = readCssVar('--color-canvas-bg', '#111111');
    const gridColor = readCssVar('--color-canvas-grid', '#1a1a1a');
    const fontSans = readCssVar('--font-family', 'DM Sans, system-ui, sans-serif');

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, width, height, offsetX, offsetY, scale, gridColor);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    for (const t of automaton.transitions) {
      const from = automaton.states.find((s) => s.id === t.from);
      const to = automaton.states.find((s) => s.id === t.to);
      if (!from || !to) continue;

      const isSelected = selected?.type === 'transition' && selected.id === t.id;
      drawTransition(ctx, from, to, t, automaton, isSelected, fontSans);
    }

    for (const state of automaton.states) {
      const isSelected = selected?.type === 'state' && selected.id === state.id;
      const isHighlighted = highlightedStates?.has(state.id) ?? false;
      drawState(ctx, state, isSelected, isHighlighted, fontSans);
    }

    if (automaton.states.length === 0) {
      ctx.restore();
      ctx.fillStyle = readCssVar('--color-empty-hint', '#666');
      ctx.font = `14px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Right-click the canvas to add a state', width / 2, height / 2);
      return;
    }

    ctx.restore();
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
    fontSans: string,
  ) {
    const { x, y } = state;

    const accent = readCssVar('--color-primary', '#ff3b30');
    const glowStrong = readCssVar('--color-state-highlight-glow', 'rgba(255, 59, 48, 0.3)');
    const hlFill = readCssVar('--color-state-highlight-fill', 'rgba(255, 59, 48, 0.14)');
    const stateFill = readCssVar('--color-state-fill', 'rgba(255,255,255,0.08)');
    const strokeMain = readCssVar('--color-state-stroke', '#f0f0f0');
    const strokeMuted = readCssVar('--color-state-stroke-muted', '#aaa');
    const labelColor = readCssVar('--color-label-text', '#fff');

    if (isHighlighted) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, STATE_RADIUS + 6, 0, Math.PI * 2);
      ctx.fillStyle = glowStrong;
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(x, y, STATE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isHighlighted ? hlFill : stateFill;
    ctx.fill();
    ctx.strokeStyle = isHighlighted || isSelected ? accent : strokeMain;
    ctx.lineWidth = isHighlighted ? 3 : isSelected ? 2.5 : 1.5;
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
    const y = state.y;

    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
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
    automaton: AnyAutomaton,
    isSelected: boolean,
    fontSans: string,
  ) {
    const accent = readCssVar('--color-primary', '#ff3b30');
    const strokeDefault = readCssVar('--color-transition-stroke', '#aaa');
    ctx.strokeStyle = isSelected ? accent : strokeDefault;
    ctx.lineWidth = isSelected ? 2 : 1.5;
    ctx.fillStyle = isSelected ? accent : strokeDefault;

    if (from.id === to.id) {
      drawSelfLoop(ctx, from, transition, fontSans, isSelected);
      return;
    }

    const parallelCount = automaton.transitions.filter(
      (t) =>
        (t.from === from.id && t.to === to.id) || (t.from === to.id && t.to === from.id),
    ).length;
    const needsCurve = parallelCount > 1;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;

    const startX = from.x + nx * STATE_RADIUS;
    const startY = from.y + ny * STATE_RADIUS;
    const endX = to.x - nx * STATE_RADIUS;
    const endY = to.y - ny * STATE_RADIUS;

    ctx.beginPath();
    if (needsCurve) {
      const cx = (startX + endX) / 2 + (-ny) * 30;
      const cy = (startY + endY) / 2 + nx * 30;
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(cx, cy, endX, endY);
    } else {
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    }
    ctx.stroke();

    drawArrowHead(ctx, endX, endY, Math.atan2(dy, dx));

    const labelX = (from.x + to.x) / 2 + (needsCurve ? (-ny) * 18 : (-ny) * 14);
    const labelY = (from.y + to.y) / 2 + (needsCurve ? nx * 18 : nx * 14);
    const label = getTransitionLabel(transition);

    const labelText = isSelected ? accent : readCssVar('--color-label-text', '#fff');
    ctx.fillStyle = labelText;
    ctx.font = `12px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(label);
    const padding = 3;
    ctx.save();
    ctx.fillStyle = readCssVar('--color-label-chip-bg', 'rgba(255,255,255,0.06)');
    ctx.fillRect(
      labelX - metrics.width / 2 - padding,
      labelY - 7 - padding,
      metrics.width + padding * 2,
      14 + padding * 2,
    );
    ctx.restore();

    ctx.fillStyle = labelText;
    ctx.fillText(label, labelX, labelY);
  }

  function drawSelfLoop(
    ctx: CanvasRenderingContext2D,
    state: AutomatonState,
    transition: AnyTransition,
    fontSans: string,
    isSelected: boolean,
  ) {
    const cx = state.x;
    const cy = state.y - STATE_RADIUS - SELF_LOOP_OFFSET;
    const r = SELF_LOOP_RADIUS;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0.3, Math.PI * 2 - 0.3);
    ctx.stroke();

    const arrowAngle = Math.PI * 2 - 0.3;
    const ax = cx + Math.cos(arrowAngle) * r;
    const ay = cy + Math.sin(arrowAngle) * r;
    drawArrowHead(ctx, ax, ay, Math.PI / 2 + 0.5);

    const label = getTransitionLabel(transition);
    const accent = readCssVar('--color-primary', '#ff3b30');
    ctx.fillStyle = isSelected ? accent : readCssVar('--color-label-text', '#fff');
    ctx.font = `12px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, cx, cy - r - 4);
  }

  function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-ARROW_SIZE, -ARROW_SIZE / 2);
    ctx.lineTo(-ARROW_SIZE, ARROW_SIZE / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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
