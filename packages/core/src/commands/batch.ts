import type { AnyAutomaton } from '../types';
import type { Command } from './types';

export class BatchCommand implements Command {
  readonly label: string;

  constructor(
    label: string,
    private readonly commands: readonly Command[],
  ) {
    this.label = label;
  }

  execute(automaton: AnyAutomaton): AnyAutomaton {
    let result = automaton;
    for (const cmd of this.commands) {
      result = cmd.execute(result);
    }
    return result;
  }

  undo(automaton: AnyAutomaton): AnyAutomaton {
    let result = automaton;
    for (let i = this.commands.length - 1; i >= 0; i--) {
      result = this.commands[i]!.undo(result);
    }
    return result;
  }
}
