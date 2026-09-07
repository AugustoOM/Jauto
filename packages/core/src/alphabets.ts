import type { AnyAutomaton, PushdownAutomaton, TuringMachine } from './types';

function addSymbols(target: Set<string>, value: string) {
  for (const symbol of value) target.add(symbol);
}

export function getInputAlphabet(automaton: AnyAutomaton): ReadonlySet<string> {
  const alphabet = new Set<string>();
  for (const transition of automaton.transitions) addSymbols(alphabet, transition.read);
  return alphabet;
}

export function getStackAlphabet(automaton: PushdownAutomaton): ReadonlySet<string> {
  const alphabet = new Set<string>(['Z']);
  for (const transition of automaton.transitions) {
    addSymbols(alphabet, transition.pop);
    addSymbols(alphabet, transition.push);
  }
  return alphabet;
}

export function getTapeAlphabet(automaton: TuringMachine): ReadonlySet<string> {
  const alphabet = new Set<string>(['\u25A1']);
  for (const transition of automaton.transitions) {
    for (const action of transition.tapeActions ?? [transition]) {
      addSymbols(alphabet, action.read || '\u25A1');
      addSymbols(alphabet, action.write || '\u25A1');
    }
  }
  return alphabet;
}
