import type { AnyAutomaton, AutomatonState, AnyTransition } from '../types';
import type { Command } from './types';
import { addState, removeState, addTransition } from '../graph';

export class RemoveStateCommand implements Command {
  readonly label: string;
  private removedTransitions: readonly AnyTransition[] = [];

  constructor(
    private readonly state: AutomatonState,
    private readonly connectedTransitions: readonly AnyTransition[],
  ) {
    this.label = `Remove state ${state.name}`;
    this.removedTransitions = connectedTransitions;
  }

  execute(automaton: AnyAutomaton): AnyAutomaton {
    return removeState(automaton, this.state.id) as AnyAutomaton;
  }

  undo(automaton: AnyAutomaton): AnyAutomaton {
    let result = addState(automaton, this.state) as AnyAutomaton;
    for (const t of this.removedTransitions) {
      result = addTransition(result, t) as AnyAutomaton;
    }
    return result;
  }
}
