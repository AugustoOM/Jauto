export type {
  AutomatonKind,
  AutomatonState,
  FATransition,
  PDATransition,
  TMTransition,
  Automaton,
  FiniteAutomaton,
  PushdownAutomaton,
  TuringMachine,
  AnyAutomaton,
  AnyTransition,
} from './types';

export { createEmptyAutomaton } from './types';

export {
  addState,
  removeState,
  updateState,
  addTransition,
  removeTransition,
  updateTransition,
  findState,
  getStateById,
  getTransitionsFrom,
  getTransitionsTo,
  getAlphabet,
} from './graph';

export {
  isDeterministic,
  hasInitialState,
  isComplete,
  hasUnreachableStates,
  validate,
} from './validation';

export { generateStateId, generateTransitionId } from './ids';

export type { Command } from './commands/types';
export { CommandHistory } from './commands/history';
export { AddStateCommand } from './commands/add-state';
export { RemoveStateCommand } from './commands/remove-state';
export { MoveStateCommand } from './commands/move-state';
export { UpdateStateCommand } from './commands/update-state';
export { AddTransitionCommand } from './commands/add-transition';
export { RemoveTransitionCommand } from './commands/remove-transition';
export { UpdateTransitionCommand } from './commands/update-transition';
export { BatchCommand } from './commands/batch';
