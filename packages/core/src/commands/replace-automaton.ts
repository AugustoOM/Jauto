import type { AnyAutomaton } from '../types';
import type { Command } from './types';

export class ReplaceAutomatonCommand implements Command {
  constructor(
    readonly label: string,
    private readonly replacement: AnyAutomaton,
  ) {}

  execute(automaton: AnyAutomaton): AnyAutomaton {
    this.previous = automaton;
    return this.replacement;
  }

  undo(): AnyAutomaton {
    if (!this.previous) throw new Error('Cannot undo a replacement before it executes');
    return this.previous;
  }

  private previous?: AnyAutomaton;
}
