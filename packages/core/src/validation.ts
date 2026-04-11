import type { AnyAutomaton, AutomatonState, FiniteAutomaton } from './types';
import { getTransitionsFrom } from './graph';

export interface ValidationDiagnostic {
  readonly level: 'error' | 'warning';
  readonly message: string;
  readonly stateId?: string;
}

export function hasInitialState(automaton: AnyAutomaton): boolean {
  return automaton.states.some((s) => s.isInitial);
}

export function getInitialState(automaton: AnyAutomaton): AutomatonState | undefined {
  return automaton.states.find((s) => s.isInitial);
}

export function isDeterministic(automaton: FiniteAutomaton): boolean {
  for (const state of automaton.states) {
    const transitions = getTransitionsFrom(automaton, state.id);
    const readSymbols = transitions.map((t) => t.read);
    const hasEpsilon = readSymbols.some((s) => s === '');
    if (hasEpsilon) return false;
    const uniqueSymbols = new Set(readSymbols);
    if (uniqueSymbols.size !== readSymbols.length) return false;
  }
  return true;
}

export function isComplete(automaton: FiniteAutomaton): boolean {
  const alphabet = new Set<string>();
  for (const t of automaton.transitions) {
    if (t.read !== '') alphabet.add(t.read);
  }

  for (const state of automaton.states) {
    const transitions = getTransitionsFrom(automaton, state.id);
    const covered = new Set(transitions.map((t) => t.read));
    for (const symbol of alphabet) {
      if (!covered.has(symbol)) return false;
    }
  }
  return true;
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

export function validate(automaton: AnyAutomaton): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];

  if (!hasInitialState(automaton)) {
    diagnostics.push({ level: 'error', message: 'No initial state defined' });
  }

  const initialStates = automaton.states.filter((s) => s.isInitial);
  if (initialStates.length > 1) {
    diagnostics.push({ level: 'error', message: 'Multiple initial states defined' });
  }

  if (!automaton.states.some((s) => s.isFinal)) {
    diagnostics.push({ level: 'warning', message: 'No accepting (final) states defined' });
  }

  for (const t of automaton.transitions) {
    if (!automaton.states.some((s) => s.id === t.from)) {
      diagnostics.push({ level: 'error', message: `Transition references missing source state "${t.from}"` });
    }
    if (!automaton.states.some((s) => s.id === t.to)) {
      diagnostics.push({ level: 'error', message: `Transition references missing target state "${t.to}"` });
    }
  }

  if (hasUnreachableStates(automaton)) {
    diagnostics.push({ level: 'warning', message: 'Automaton has unreachable states' });
  }

  return diagnostics;
}
