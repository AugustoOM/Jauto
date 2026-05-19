import type { AutomatonState, AnyTransition, AnyAutomaton } from '@jauto/core';
import { STATE_RADIUS, TRANSITION_HIT_TOLERANCE } from '../constants';
import {
  getEdgeGeometry,
  getParallelEdgeSiblings,
  getSelfLoopGeometry,
  getSelfLoopSiblings,
} from './transitionGeometry';

export function useHitTesting() {
  function hitTestState(
    x: number,
    y: number,
    states: readonly AutomatonState[],
  ): AutomatonState | null {
    for (let i = states.length - 1; i >= 0; i--) {
      const s = states[i]!;
      const dx = x - s.x;
      const dy = y - s.y;
      if (dx * dx + dy * dy <= STATE_RADIUS * STATE_RADIUS) {
        return s;
      }
    }
    return null;
  }

  function hitTestTransition(
    x: number,
    y: number,
    automaton: AnyAutomaton,
  ): AnyTransition | null {
    for (let i = automaton.transitions.length - 1; i >= 0; i--) {
      const t = automaton.transitions[i]!;
      const from = automaton.states.find((s) => s.id === t.from);
      const to = automaton.states.find((s) => s.id === t.to);
      if (!from || !to) continue;

      if (from.id === to.id) {
        const selfLoopSiblings = getSelfLoopSiblings(automaton.transitions, from.id);
        if (hitTestSelfLoop(x, y, from, t, selfLoopSiblings)) return t;
      } else {
        const parallelSiblings = getParallelEdgeSiblings(automaton.transitions, from.id, to.id);
        if (hitTestEdge(x, y, from, to, t, parallelSiblings)) return t;
      }
    }
    return null;
  }

  function hitTestLine(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return false;

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    const dist = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
    return dist <= TRANSITION_HIT_TOLERANCE;
  }

  function hitTestSelfLoop(
    px: number,
    py: number,
    state: AutomatonState,
    transition: AnyTransition,
    selfLoopSiblings: readonly AnyTransition[],
  ): boolean {
    const geometry = getSelfLoopGeometry(state, selfLoopSiblings, transition);
    const dist = Math.sqrt((px - geometry.cx) ** 2 + (py - geometry.cy) ** 2);
    return Math.abs(dist - geometry.r) <= TRANSITION_HIT_TOLERANCE;
  }

  function hitTestEdge(
    px: number,
    py: number,
    from: AutomatonState,
    to: AutomatonState,
    transition: AnyTransition,
    parallelSiblings: readonly AnyTransition[],
  ): boolean {
    const geometry = getEdgeGeometry(from, to, parallelSiblings, transition);
    if (!geometry) return false;
    if (!geometry.isCurved) {
      return hitTestLine(px, py, geometry.startX, geometry.startY, geometry.endX, geometry.endY);
    }

    let previous = { x: geometry.startX, y: geometry.startY };
    for (let i = 1; i <= 24; i++) {
      const t = i / 24;
      const current = {
        x: quadraticPoint(geometry.startX, geometry.controlX, geometry.endX, t),
        y: quadraticPoint(geometry.startY, geometry.controlY, geometry.endY, t),
      };
      if (hitTestLine(px, py, previous.x, previous.y, current.x, current.y)) return true;
      previous = current;
    }
    return false;
  }

  function quadraticPoint(start: number, control: number, end: number, t: number): number {
    return (1 - t) ** 2 * start + 2 * (1 - t) * t * control + t ** 2 * end;
  }

  return { hitTestState, hitTestTransition, STATE_RADIUS };
}
