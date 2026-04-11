import type { AnyAutomaton, AutomatonState } from '../types';
import type { Command } from './types';
import { addState, removeState } from '../graph';

export class AddStateCommand implements Command {
  readonly label: string;

  constructor(private readonly state: AutomatonState) {
    this.label = `Add state ${state.name}`;
  }

  execute(automaton: AnyAutomaton): AnyAutomaton {
    return addState(automaton, this.state) as AnyAutomaton;
  }

  undo(automaton: AnyAutomaton): AnyAutomaton {
    return removeState(automaton, this.state.id) as AnyAutomaton;
  }
}
