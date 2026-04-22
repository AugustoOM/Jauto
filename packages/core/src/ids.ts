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

export interface IdGenerator {
  nextStateId(): string;
  nextTransitionId(): string;
  reset(): void;
}

class IncrementingIdGenerator implements IdGenerator {
  private stateCounter = 0;
  private transitionCounter = 0;

  nextStateId(): string {
    return `s${this.stateCounter++}`;
  }

  nextTransitionId(): string {
    return `t${this.transitionCounter++}`;
  }

  reset(): void {
    this.stateCounter = 0;
    this.transitionCounter = 0;
  }
}

export function createIdGenerator(): IdGenerator {
  return new IncrementingIdGenerator();
}