import type { AutomatonState, AnyTransition } from '@jauto/core';
import { SELF_LOOP_RADIUS, STATE_RADIUS } from '../constants';

const PARALLEL_EDGE_SPACING = 42;
const SELF_LOOP_RADIUS_STEP = 12;
const SELF_LOOP_START_NODE_ANGLE = -2.2;
const SELF_LOOP_END_NODE_ANGLE = -0.94;
const SELF_LOOP_CONTACT_STEP = 0.26;

export interface SelfLoopGeometry {
  cx: number;
  cy: number;
  r: number;
  labelX: number;
  labelY: number;
  arrowX: number;
  arrowY: number;
  arrowAngle: number;
  startAngle: number;
  endAngle: number;
}

export interface EdgeGeometry {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX: number;
  controlY: number;
  labelX: number;
  labelY: number;
  arrowAngle: number;
  isCurved: boolean;
}

export function getSelfLoopSiblings(
  transitions: readonly AnyTransition[],
  stateId: string,
): readonly AnyTransition[] {
  return transitions.filter((t) => t.from === stateId && t.to === stateId);
}

export function getParallelEdgeSiblings(
  transitions: readonly AnyTransition[],
  fromId: string,
  toId: string,
): readonly AnyTransition[] {
  return transitions.filter(
    (t) => (t.from === fromId && t.to === toId) || (t.from === toId && t.to === fromId),
  );
}

export function getEdgeGeometry(
  from: AutomatonState,
  to: AutomatonState,
  siblings: readonly AnyTransition[],
  transition: AnyTransition,
): EdgeGeometry | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return null;

  const nx = dx / dist;
  const ny = dy / dist;
  const startX = from.x + nx * STATE_RADIUS;
  const startY = from.y + ny * STATE_RADIUS;
  const endX = to.x - nx * STATE_RADIUS;
  const endY = to.y - ny * STATE_RADIUS;
  const index = Math.max(0, siblings.findIndex((t) => t.id === transition.id));
  const isCurved = siblings.length > 1;

  if (!isCurved) {
    const labelX = (from.x + to.x) / 2 + -ny * 14;
    const labelY = (from.y + to.y) / 2 + nx * 14;
    return {
      startX,
      startY,
      endX,
      endY,
      controlX: (startX + endX) / 2,
      controlY: (startY + endY) / 2,
      labelX,
      labelY,
      arrowAngle: Math.atan2(dy, dx),
      isCurved,
    };
  }

  const slot = getParallelEdgeSlot(index);
  const direction = from.id <= to.id ? 1 : -1;
  const offset = slot * direction * PARALLEL_EDGE_SPACING;
  const controlX = (startX + endX) / 2 + -ny * offset;
  const controlY = (startY + endY) / 2 + nx * offset;
  const labelX = quadraticPoint(startX, controlX, endX, 0.5);
  const labelY = quadraticPoint(startY, controlY, endY, 0.5);

  return {
    startX,
    startY,
    endX,
    endY,
    controlX,
    controlY,
    labelX,
    labelY,
    arrowAngle: Math.atan2(endY - controlY, endX - controlX),
    isCurved,
  };
}

function getParallelEdgeSlot(index: number): number {
  const magnitude = Math.floor(index / 2) + 1;
  return index % 2 === 0 ? magnitude : -magnitude;
}

function quadraticPoint(start: number, control: number, end: number, t: number): number {
  return (1 - t) ** 2 * start + 2 * (1 - t) * t * control + t ** 2 * end;
}

export function getSelfLoopGeometry(
  state: AutomatonState,
  siblings: readonly AnyTransition[],
  transition: AnyTransition,
): SelfLoopGeometry {
  const index = Math.max(0, siblings.findIndex((t) => t.id === transition.id));
  const startContactAngle = SELF_LOOP_START_NODE_ANGLE - index * SELF_LOOP_CONTACT_STEP;
  const endContactAngle = SELF_LOOP_END_NODE_ANGLE + index * SELF_LOOP_CONTACT_STEP;
  const startX = state.x + Math.cos(startContactAngle) * STATE_RADIUS;
  const startY = state.y + Math.sin(startContactAngle) * STATE_RADIUS;
  const endX = state.x + Math.cos(endContactAngle) * STATE_RADIUS;
  const endY = state.y + Math.sin(endContactAngle) * STATE_RADIUS;
  const chordX = endX - startX;
  const chordY = endY - startY;
  const chordLength = Math.sqrt(chordX * chordX + chordY * chordY);
  const r = Math.max(SELF_LOOP_RADIUS + index * SELF_LOOP_RADIUS_STEP, chordLength / 2 + 1);
  const midpointX = (startX + endX) / 2;
  const midpointY = (startY + endY) / 2;
  const centerDistance = Math.sqrt(r * r - (chordLength / 2) ** 2);
  const normalX = -chordY / chordLength;
  const normalY = chordX / chordLength;
  const centerA = {
    x: midpointX + normalX * centerDistance,
    y: midpointY + normalY * centerDistance,
  };
  const centerB = {
    x: midpointX - normalX * centerDistance,
    y: midpointY - normalY * centerDistance,
  };
  const center = centerA.y < centerB.y ? centerA : centerB;
  const startAngle = Math.atan2(startY - center.y, startX - center.x);
  const endAngle = Math.atan2(endY - center.y, endX - center.x);

  return {
    cx: center.x,
    cy: center.y,
    r,
    labelX: center.x,
    labelY: center.y - r - 4,
    arrowX: endX,
    arrowY: endY,
    arrowAngle: endAngle + Math.PI / 2,
    startAngle,
    endAngle,
  };
}
