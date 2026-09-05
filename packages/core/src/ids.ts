let stateCounter = 0;
let transitionCounter = 0;

export function generateStateId(existing: readonly { id: string }[] = []): string {
  const used = new Set(existing.map((item) => item.id));
  let id: string;
  do { id = `s${stateCounter++}`; } while (used.has(id));
  return id;
}

export function generateTransitionId(existing: readonly { id: string }[] = []): string {
  const used = new Set(existing.map((item) => item.id));
  let id: string;
  do { id = `t${transitionCounter++}`; } while (used.has(id));
  return id;
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
