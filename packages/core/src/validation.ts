import type {
  AnyAutomaton,
  AutomatonState,
  FiniteAutomaton,
  PushdownAutomaton,
  TuringMachine,
} from './types';
import { getTransitionsFrom } from './graph';
import { getInputAlphabet, getStackAlphabet, getTapeAlphabet } from './alphabets';

export interface ValidationDiagnostic {
  readonly level: 'error' | 'warning';
  readonly message: string;
  readonly stateId?: string;
  readonly transitionId?: string;
}

export function hasInitialState(automaton: AnyAutomaton): boolean {
  return automaton.states.some((s) => s.isInitial);
}

export function getInitialState(automaton: AnyAutomaton): AutomatonState | undefined {
  return automaton.states.find((s) => s.isInitial);
}

export function isDeterministic(automaton: AnyAutomaton): boolean {
  switch (automaton.kind) {
    case 'fa':
      return checkFADeterminism(automaton as FiniteAutomaton);
    case 'pda':
      return checkPDADeterminism(automaton as PushdownAutomaton);
    case 'turing':
      return checkTMDeterminism(automaton as TuringMachine);
  }
}

function checkFADeterminism(automaton: FiniteAutomaton): boolean {
  for (const state of automaton.states) {
    const transitions = getTransitionsFrom(automaton, state.id);
    const readSymbols = transitions.map((t) => t.read);
    if (readSymbols.some((symbol) => symbol === '')) return false;
    for (let i = 0; i < readSymbols.length; i++) {
      for (let j = i + 1; j < readSymbols.length; j++) {
        if (
          readSymbols[i]!.startsWith(readSymbols[j]!) ||
          readSymbols[j]!.startsWith(readSymbols[i]!)
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

function checkPDADeterminism(automaton: PushdownAutomaton): boolean {
  for (const state of automaton.states) {
    const transitions = getTransitionsFrom(automaton, state.id);
    for (let i = 0; i < transitions.length; i++) {
      for (let j = i + 1; j < transitions.length; j++) {
        if (
          prefixesOverlap(transitions[i]!.read, transitions[j]!.read) &&
          prefixesOverlap(transitions[i]!.pop, transitions[j]!.pop)
        )
          return false;
      }
    }
  }
  return true;
}

function prefixesOverlap(left: string, right: string): boolean {
  return left.startsWith(right) || right.startsWith(left);
}

function checkTMDeterminism(automaton: TuringMachine): boolean {
  for (const state of automaton.states) {
    const transitions = getTransitionsFrom(automaton, state.id);
    for (const t of transitions) {
      const read = tmReadKey(t);
      const matches = transitions.filter((other) => other.id !== t.id && tmReadKey(other) === read);
      if (matches.length > 0) return false;
    }
  }
  return true;
}

function tmReadKey(transition: TuringMachine['transitions'][number]): string {
  return (transition.tapeActions ?? [{ read: transition.read }])
    .map((action) => action.read || '\u25A1')
    .join('\u0000');
}

export function isComplete(automaton: AnyAutomaton): boolean {
  switch (automaton.kind) {
    case 'fa':
      return checkFACompleteness(automaton as FiniteAutomaton);
    case 'pda':
      return checkPDACompleteness(automaton as PushdownAutomaton);
    case 'turing':
      return checkTMCompleteness(automaton as TuringMachine);
  }
}

function checkFACompleteness(automaton: FiniteAutomaton): boolean {
  const alphabet = getInputAlphabet(automaton);

  for (const state of automaton.states) {
    const transitions = getTransitionsFrom(automaton, state.id);
    for (const symbol of alphabet) {
      if (!transitions.some((transition) => transition.read.startsWith(symbol))) return false;
    }
  }
  return true;
}

function checkPDACompleteness(automaton: PushdownAutomaton): boolean {
  const inputAlphabet = [...getInputAlphabet(automaton)];
  const stackAlphabet = [...getStackAlphabet(automaton)];
  if (inputAlphabet.length === 0) return false;
  return automaton.states.every((state) => {
    const transitions = getTransitionsFrom(automaton, state.id);
    return inputAlphabet.every((input) =>
      stackAlphabet.every((stack) =>
        transitions.some(
          (transition) =>
            (transition.read === '' || transition.read.startsWith(input)) &&
            (transition.pop === '' || transition.pop.startsWith(stack)),
        ),
      ),
    );
  });
}

function checkTMCompleteness(automaton: TuringMachine): boolean {
  if (automaton.tapes !== 1) return false;
  const tapeAlphabet = getTapeAlphabet(automaton);
  return automaton.states.every((state) => {
    const reads = new Set(
      getTransitionsFrom(automaton, state.id).map((transition) => transition.read || '\u25A1'),
    );
    return [...tapeAlphabet].every((symbol) => reads.has(symbol));
  });
}

export function hasUnreachableStates(automaton: AnyAutomaton): boolean {
  const initial = automaton.states.find((s) => s.isInitial);
  if (!initial) return automaton.states.length > 0;

  const reachable = new Set<string>();
  const queue = [initial.id];

  while (queue.length > 0) {
    const current = queue.pop()!;
    if (reachable.has(current)) continue;
    reachable.add(current);
    for (const t of automaton.transitions) {
      if (t.from === current && !reachable.has(t.to)) {
        queue.push(t.to);
      }
    }
  }

  return automaton.states.some((s) => !reachable.has(s.id));
}

/** Structural errors prevent safe editing/export; incomplete drafts are allowed. */
export function validateStructure(automaton: AnyAutomaton): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];
  const stateIds = new Set<string>();
  for (const state of automaton.states) {
    if (!state.id || stateIds.has(state.id)) {
      diagnostics.push({
        level: 'error',
        message: `Duplicate or empty state ID: "${state.id}"`,
        stateId: state.id,
      });
    }
    stateIds.add(state.id);
    if (!Number.isFinite(state.x) || !Number.isFinite(state.y)) {
      diagnostics.push({
        level: 'error',
        message: 'State coordinates must be finite numbers',
        stateId: state.id,
      });
    }
  }
  if (automaton.states.filter((s) => s.isInitial).length > 1) {
    diagnostics.push({ level: 'error', message: 'Multiple initial states defined' });
  }
  const transitionIds = new Set<string>();
  for (const t of automaton.transitions) {
    if (!t.id || transitionIds.has(t.id)) {
      diagnostics.push({
        level: 'error',
        message: `Duplicate or empty transition ID: "${t.id}"`,
        transitionId: t.id,
      });
    }
    transitionIds.add(t.id);
    for (const [role, id] of [
      ['source', t.from],
      ['target', t.to],
    ]) {
      if (!stateIds.has(id!)) {
        diagnostics.push({
          level: 'error',
          message: `Transition references missing ${role} state "${id}"`,
          transitionId: t.id,
        });
      }
    }
  }
  if (automaton.kind === 'turing') {
    if (!Number.isInteger(automaton.tapes) || automaton.tapes < 1) {
      diagnostics.push({ level: 'error', message: 'Tape count must be a positive integer' });
    }
    for (const t of automaton.transitions) {
      const actions = t.tapeActions ?? [t];
      if (actions.length !== automaton.tapes) {
        diagnostics.push({
          level: 'error',
          message: 'TM transition action count must match the tape count',
          transitionId: t.id,
        });
      }
      if (
        actions[0] &&
        (actions[0].read !== t.read || actions[0].write !== t.write || actions[0].move !== t.move)
      ) {
        diagnostics.push({
          level: 'error',
          message: 'TM primary transition fields must match tape 1',
          transitionId: t.id,
        });
      }
      if (actions.some((action) => !['L', 'R', 'S'].includes(action.move))) {
        diagnostics.push({
          level: 'error',
          message: 'TM movement must be L, R or S',
          transitionId: t.id,
        });
      }
    }
  }
  return diagnostics;
}

export function validate(automaton: AnyAutomaton): ValidationDiagnostic[] {
  const diagnostics = validateStructure(automaton);

  if (!hasInitialState(automaton)) {
    diagnostics.push({ level: 'error', message: 'No initial state defined' });
  }

  if (!automaton.states.some((s) => s.isFinal)) {
    diagnostics.push({ level: 'warning', message: 'No accepting (final) states defined' });
  }

  if (hasUnreachableStates(automaton)) {
    diagnostics.push({ level: 'warning', message: 'Automaton has unreachable states' });
  }

  return diagnostics;
}
