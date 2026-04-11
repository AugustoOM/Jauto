import type { AutomatonState, AnyTransition, AnyAutomaton } from '@jauto/core';

const STATE_RADIUS = 28;
const TRANSITION_HIT_TOLERANCE = 8;

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
        if (hitTestSelfLoop(x, y, from)) return t;
      } else {
        if (hitTestLine(x, y, from.x, from.y, to.x, to.y)) return t;
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
  ): boolean {
    const cx = state.x;
    const cy = state.y - STATE_RADIUS - 20;
    const r = 18;
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    return Math.abs(dist - r) <= TRANSITION_HIT_TOLERANCE;
  }

  return { hitTestState, hitTestTransition, STATE_RADIUS };
}
