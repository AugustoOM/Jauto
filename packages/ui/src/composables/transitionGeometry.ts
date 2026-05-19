import type { AutomatonState, AnyTransition } from '@jauto/core';
import { SELF_LOOP_OFFSET, SELF_LOOP_RADIUS, STATE_RADIUS } from '../constants';

const SELF_LOOP_SPACING = SELF_LOOP_RADIUS * 2 + 12;
const SELF_LOOP_VERTICAL_STAGGER = 8;
const SELF_LOOP_END_ANGLE = Math.PI * 2 - 0.3;

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
  const centerIndex = (siblings.length - 1) / 2;
  const slot = index - centerIndex;
  const cx = state.x + slot * SELF_LOOP_SPACING;
  const cy =
    state.y -
    STATE_RADIUS -
    SELF_LOOP_OFFSET -
    Math.abs(slot) * SELF_LOOP_VERTICAL_STAGGER;
  const r = SELF_LOOP_RADIUS;
  const arrowX = cx + Math.cos(SELF_LOOP_END_ANGLE) * r;
  const arrowY = cy + Math.sin(SELF_LOOP_END_ANGLE) * r;

  return {
    cx,
    cy,
    r,
    labelX: cx,
    labelY: cy - r - 4,
    arrowX,
    arrowY,
    arrowAngle: Math.PI / 2 + 0.5,
    startAngle: 0.3,
    endAngle: SELF_LOOP_END_ANGLE,
  };
}
