import type { AnyAutomaton, AnyTransition } from '../types';
import type { Command } from './types';
import { addTransition, removeTransition } from '../graph';

export class AddTransitionCommand implements Command {
  readonly label: string;

  constructor(private readonly transition: AnyTransition) {
    this.label = `Add transition ${transition.from} → ${transition.to}`;
  }

  execute(automaton: AnyAutomaton): AnyAutomaton {
    return addTransition(automaton, this.transition) as AnyAutomaton;
  }

  undo(automaton: AnyAutomaton): AnyAutomaton {
    return removeTransition(automaton, this.transition.id) as AnyAutomaton;
  }
}
