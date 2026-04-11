import type { AnyAutomaton, AutomatonState } from '../types';
import type { Command } from './types';
import { updateState } from '../graph';

export class UpdateStateCommand implements Command {
  readonly label: string;

  constructor(
    private readonly stateId: string,
    private readonly oldProps: Partial<Omit<AutomatonState, 'id'>>,
    private readonly newProps: Partial<Omit<AutomatonState, 'id'>>,
  ) {
    this.label = 'Update state';
  }

  execute(automaton: AnyAutomaton): AnyAutomaton {
    return updateState(automaton, this.stateId, this.newProps) as AnyAutomaton;
  }

  undo(automaton: AnyAutomaton): AnyAutomaton {
    return updateState(automaton, this.stateId, this.oldProps) as AnyAutomaton;
  }
}
