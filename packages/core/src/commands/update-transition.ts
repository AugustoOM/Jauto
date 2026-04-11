import type { AnyAutomaton, AnyTransition } from '../types';
import type { Command } from './types';
import { updateTransition } from '../graph';

export class UpdateTransitionCommand implements Command {
  readonly label: string;

  constructor(
    private readonly transitionId: string,
    private readonly oldProps: Partial<Omit<AnyTransition, 'id'>>,
    private readonly newProps: Partial<Omit<AnyTransition, 'id'>>,
  ) {
    this.label = 'Update transition';
  }

  execute(automaton: AnyAutomaton): AnyAutomaton {
    return updateTransition(automaton, this.transitionId, this.newProps) as AnyAutomaton;
  }

  undo(automaton: AnyAutomaton): AnyAutomaton {
    return updateTransition(automaton, this.transitionId, this.oldProps) as AnyAutomaton;
  }
}
