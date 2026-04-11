import type { AnyAutomaton } from '../types';
import type { Command } from './types';
import { updateState } from '../graph';

export class MoveStateCommand implements Command {
  readonly label: string;

  constructor(
    private readonly stateId: string,
    private readonly oldX: number,
    private readonly oldY: number,
    private readonly newX: number,
    private readonly newY: number,
  ) {
    this.label = 'Move state';
  }

  execute(automaton: AnyAutomaton): AnyAutomaton {
    return updateState(automaton, this.stateId, { x: this.newX, y: this.newY }) as AnyAutomaton;
  }

  undo(automaton: AnyAutomaton): AnyAutomaton {
    return updateState(automaton, this.stateId, { x: this.oldX, y: this.oldY }) as AnyAutomaton;
  }
}
