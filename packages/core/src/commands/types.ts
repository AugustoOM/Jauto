import type { AnyAutomaton } from '../types';

export interface Command {
  readonly label: string;
  execute(automaton: AnyAutomaton): AnyAutomaton;
  undo(automaton: AnyAutomaton): AnyAutomaton;
}
