export type {
  AutomatonKind,
  AutomatonState,
  AutomatonNote,
  TransitionLayout,
  FATransition,
  PDATransition,
  TMTransition,
  TMTapeAction,
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
  getInitialState,
  isComplete,
  hasUnreachableStates,
  validate,
  validateStructure,
} from './validation';
export type { ValidationDiagnostic } from './validation';

export { generateStateId, generateTransitionId, createIdGenerator, resetIdCounters } from './ids';
export { getInputAlphabet, getStackAlphabet, getTapeAlphabet } from './alphabets';
export type { IdGenerator } from './ids';
export {
  parseRegularExpression,
  formatRegularExpression,
  regularExpressionToNFA,
  RegularExpressionSyntaxError,
} from './regular-expression';
export type { RegularExpression } from './regular-expression';
export { determinize, minimizeDFA, finiteAutomatonToRegularExpression } from './fa-transformations';
export { classifyGrammar, recognizeContextFree, recognizeCYK } from './grammar';
export type { Grammar, GrammarProduction, GrammarClassification } from './grammar';

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
