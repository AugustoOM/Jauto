import type { AnyAutomaton, AutomatonState, AnyTransition } from '@jauto/core';
import type { SelectedElement } from '../stores/document';
import type { TransitionHighlight } from '../stores/simulation';
import { STATE_RADIUS } from '../constants';
import { getSelfLoopGeometry, getSelfLoopSiblings } from './transitionGeometry';

const ARROW_SIZE = 6;

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
  activeTransition?: TransitionHighlight | null;
}

export function useCanvasRenderer() {
  function render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    automaton: AnyAutomaton,
    options: RenderOptions,
  ) {
    const { offsetX, offsetY, scale, selected, highlightedStates, activeTransition } = options;

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
      const isActiveTransition = activeTransition?.transitionId === t.id;
      drawTransition(ctx, from, to, t, automaton, isSelected, isActiveTransition, fontSans);
    }

    for (const state of automaton.states) {
      const isSelected = selected?.type === 'state' && selected.id === state.id;
      const isHighlighted = highlightedStates?.has(state.id) ?? false;
      const simulationRole = getSimulationStateRole(state.id, activeTransition);
      drawState(ctx, state, isSelected, isHighlighted, simulationRole, fontSans);
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
    automaton: AnyAutomaton,
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
      const selfLoopSiblings = getSelfLoopSiblings(automaton.transitions, from.id);
      drawSelfLoop(
        ctx,
        from,
        transition,
        selfLoopSiblings,
        fontSans,
        isSelected,
        isActiveTransition,
      );
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
    let arrowAngle = Math.atan2(dy, dx);
    if (needsCurve) {
      const cx = (startX + endX) / 2 + (-ny) * 30;
      const cy = (startY + endY) / 2 + nx * 30;
      arrowAngle = Math.atan2(endY - cy, endX - cx);
      const tail = getArrowTailPoint(endX, endY, arrowAngle);
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(cx, cy, tail.x, tail.y);
    } else {
      const tail = getArrowTailPoint(endX, endY, arrowAngle);
      ctx.moveTo(startX, startY);
      ctx.lineTo(tail.x, tail.y);
    }
    ctx.stroke();

    drawArrowHead(ctx, endX, endY, arrowAngle);

    const labelX = (from.x + to.x) / 2 + (needsCurve ? (-ny) * 18 : (-ny) * 14);
    const labelY = (from.y + to.y) / 2 + (needsCurve ? nx * 18 : nx * 14);
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
    activeTransition: TransitionHighlight | null | undefined,
  ) {
    if (!activeTransition) return null;
    const isSource = activeTransition.sourceStateId === stateId;
    const isTarget = activeTransition.targetStateId === stateId;
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
