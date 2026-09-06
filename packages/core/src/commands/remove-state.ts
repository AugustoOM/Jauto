import type { AnyAutomaton, AutomatonState, AnyTransition } from '../types';
import type { Command } from './types';
import { removeState } from '../graph';

export class RemoveStateCommand implements Command {
  readonly label: string;
  private removedTransitions: readonly AnyTransition[] = [];
  private stateIndex = -1;
  private transitionIndices = new Map<string, number>();

  constructor(
    private readonly state: AutomatonState,
    private readonly connectedTransitions: readonly AnyTransition[],
  ) {
    this.label = `Remove state ${state.name}`;
    this.removedTransitions = connectedTransitions;
  }

  execute(automaton: AnyAutomaton): AnyAutomaton {
    if (this.stateIndex < 0) {
      this.stateIndex = automaton.states.findIndex((state) => state.id === this.state.id);
      this.transitionIndices = new Map(
        automaton.transitions.map((transition, index) => [transition.id, index]),
      );
    }
    return removeState(automaton, this.state.id) as AnyAutomaton;
  }

  undo(automaton: AnyAutomaton): AnyAutomaton {
    const states = [...automaton.states];
    states.splice(Math.max(0, this.stateIndex), 0, this.state);
    const transitions = [...automaton.transitions];
    for (const transition of this.removedTransitions) {
      const index = this.transitionIndices.get(transition.id) ?? transitions.length;
      transitions.splice(Math.min(index, transitions.length), 0, transition);
    }
    return { ...automaton, states, transitions } as AnyAutomaton;
  }
}
