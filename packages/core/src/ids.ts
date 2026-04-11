let stateCounter = 0;
let transitionCounter = 0;

export function generateStateId(): string {
  return `s${stateCounter++}`;
}

export function generateTransitionId(): string {
  return `t${transitionCounter++}`;
}

export function resetIdCounters(): void {
  stateCounter = 0;
  transitionCounter = 0;
}
