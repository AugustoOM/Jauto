import type { AnyAutomaton, AnyTransition } from '../types';
import type { Command } from './types';
import { removeTransition } from '../graph';

export class RemoveTransitionCommand implements Command {
  readonly label: string;
  private transitionIndex = -1;

  constructor(private readonly transition: AnyTransition) {
    this.label = `Remove transition ${transition.from} → ${transition.to}`;
  }

  execute(automaton: AnyAutomaton): AnyAutomaton {
    if (this.transitionIndex < 0) {
      this.transitionIndex = automaton.transitions.findIndex((item) => item.id === this.transition.id);
    }
    return removeTransition(automaton, this.transition.id) as AnyAutomaton;
  }

  undo(automaton: AnyAutomaton): AnyAutomaton {
    const transitions = [...automaton.transitions];
    transitions.splice(Math.max(0, this.transitionIndex), 0, this.transition);
    return { ...automaton, transitions } as AnyAutomaton;
  }
}
