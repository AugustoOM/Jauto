import type { AutomatonState, AnyTransition } from '@jauto/core';
import { SELF_LOOP_RADIUS, STATE_RADIUS } from '../constants';

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

export function getSelfLoopSiblings(
  transitions: readonly AnyTransition[],
  stateId: string,
): readonly AnyTransition[] {
  return transitions.filter((t) => t.from === stateId && t.to === stateId);
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
