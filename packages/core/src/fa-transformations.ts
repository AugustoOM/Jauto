import type { AutomatonState, FATransition, FiniteAutomaton } from './types';
import {
  formatRegularExpression,
  regularExpressionOperations,
  type RegularExpression,
} from './regular-expression';

function characters(value: string): string[] {
  return [...value];
}

function normalizeCharacterTransitions(automaton: FiniteAutomaton): FiniteAutomaton {
  const states = [...automaton.states];
  const transitions: FATransition[] = [];
  for (const transition of automaton.transitions) {
    const symbols = characters(transition.read);
    if (symbols.length <= 1) {
      transitions.push({ ...transition });
      continue;
    }
    let from = transition.from;
    symbols.forEach((symbol, index) => {
      const last = index === symbols.length - 1;
      const to = last ? transition.to : `expand_${transition.id}_${index}`;
      if (!last) states.push({ id: to, name: to, x: 0, y: 0, isInitial: false, isFinal: false });
      transitions.push({ id: `${transition.id}_${index}`, from, to, read: symbol });
      from = to;
    });
  }
  return { ...automaton, states, transitions };
}

/** Subset construction with epsilon closure. Multi-character labels are expanded first. */
export function determinize(automaton: FiniteAutomaton): FiniteAutomaton {
  const normalized = normalizeCharacterTransitions(automaton);
  const initial = normalized.states.find((state) => state.isInitial);
  if (!initial) throw new Error('Cannot determinize an automaton without an initial state');
  const alphabet = [
    ...new Set(normalized.transitions.map((transition) => transition.read).filter(Boolean)),
  ].sort();
  const byFrom = new Map<string, FATransition[]>();
  for (const transition of normalized.transitions)
    byFrom.set(transition.from, [...(byFrom.get(transition.from) ?? []), transition]);
  const closure = (seed: Iterable<string>) => {
    const result = new Set(seed);
    const queue = [...result];
    while (queue.length) {
      const current = queue.shift()!;
      for (const transition of byFrom.get(current) ?? [])
        if (transition.read === '' && !result.has(transition.to)) {
          result.add(transition.to);
          queue.push(transition.to);
        }
    }
    return [...result].sort();
  };
  const key = (ids: readonly string[]) => ids.join('\u0000');
  const subsets: string[][] = [closure([initial.id])];
  const indexes = new Map([[key(subsets[0]!), 0]]);
  const transitions: FATransition[] = [];
  for (let index = 0; index < subsets.length; index++) {
    const subset = subsets[index]!;
    for (const symbol of alphabet) {
      const targets = closure(
        subset.flatMap((id) =>
          (byFrom.get(id) ?? [])
            .filter((transition) => transition.read === symbol)
            .map((transition) => transition.to),
        ),
      );
      if (targets.length === 0) continue;
      const targetKey = key(targets);
      let targetIndex = indexes.get(targetKey);
      if (targetIndex === undefined) {
        targetIndex = subsets.length;
        indexes.set(targetKey, targetIndex);
        subsets.push(targets);
      }
      transitions.push({
        id: `dfa_t${transitions.length}`,
        from: `dfa_s${index}`,
        to: `dfa_s${targetIndex}`,
        read: symbol,
      });
    }
  }
  const sourceStates = new Map(normalized.states.map((state) => [state.id, state]));
  const states = subsets.map(
    (subset, index): AutomatonState => ({
      id: `dfa_s${index}`,
      name: `{${subset.map((id) => sourceStates.get(id)?.name ?? id).join(',')}}`,
      x: 100 + (index % 6) * 130,
      y: 100 + Math.floor(index / 6) * 100,
      isInitial: index === 0,
      isFinal: subset.some((id) => sourceStates.get(id)?.isFinal),
    }),
  );
  return { kind: 'fa', states, transitions };
}

/** Removes unreachable states and merges equivalent DFA states by partition refinement. */
export function minimizeDFA(input: FiniteAutomaton): FiniteAutomaton {
  const automaton = determinize(input);
  const alphabet = [...new Set(automaton.transitions.map((transition) => transition.read))].sort();
  const initial = automaton.states.find((state) => state.isInitial)!;
  const reachable = new Set([initial.id]);
  const queue = [initial.id];
  while (queue.length) {
    const from = queue.shift()!;
    for (const transition of automaton.transitions.filter((item) => item.from === from))
      if (!reachable.has(transition.to)) {
        reachable.add(transition.to);
        queue.push(transition.to);
      }
  }
  const states = automaton.states.filter((state) => reachable.has(state.id));
  const transitionMap = new Map(
    automaton.transitions.map((transition) => [
      `${transition.from}\u0000${transition.read}`,
      transition.to,
    ]),
  );
  let partitions = [
    states.filter((state) => !state.isFinal).map((state) => state.id),
    states.filter((state) => state.isFinal).map((state) => state.id),
  ].filter((group) => group.length);
  let changed = true;
  while (changed) {
    changed = false;
    const groupOf = new Map(
      partitions.flatMap((group, index) => group.map((id) => [id, index] as const)),
    );
    const next: string[][] = [];
    for (const group of partitions) {
      const buckets = new Map<string, string[]>();
      for (const id of group) {
        const signature = alphabet
          .map((symbol) => groupOf.get(transitionMap.get(`${id}\u0000${symbol}`) ?? '') ?? -1)
          .join(',');
        buckets.set(signature, [...(buckets.get(signature) ?? []), id]);
      }
      next.push(...buckets.values());
      if (buckets.size > 1) changed = true;
    }
    partitions = next;
  }
  const groupOf = new Map(
    partitions.flatMap((group, index) => group.map((id) => [id, index] as const)),
  );
  const sourceStates = new Map(states.map((state) => [state.id, state]));
  const minimizedStates = partitions.map(
    (group, index): AutomatonState => ({
      id: `min_s${index}`,
      name: group.map((id) => sourceStates.get(id)?.name ?? id).join(' / '),
      x: 100 + (index % 6) * 130,
      y: 100 + Math.floor(index / 6) * 100,
      isInitial: group.includes(initial.id),
      isFinal: group.some((id) => sourceStates.get(id)?.isFinal),
    }),
  );
  const transitions: FATransition[] = [];
  partitions.forEach((group, fromIndex) => {
    for (const symbol of alphabet) {
      const target = transitionMap.get(`${group[0]}\u0000${symbol}`);
      if (target === undefined) continue;
      transitions.push({
        id: `min_t${transitions.length}`,
        from: `min_s${fromIndex}`,
        to: `min_s${groupOf.get(target)!}`,
        read: symbol,
      });
    }
  });
  return { kind: 'fa', states: minimizedStates, transitions };
}

/** GNFA state elimination. Returns a JFLAP-compatible expression. */
export function finiteAutomatonToRegularExpression(automaton: FiniteAutomaton): string {
  const initials = automaton.states.filter((state) => state.isInitial);
  const finals = automaton.states.filter((state) => state.isFinal);
  if (initials.length !== 1)
    throw new Error('FA-to-RE conversion requires exactly one initial state');
  if (finals.length === 0) return '∅';
  const start = '__gnfa_start';
  const end = '__gnfa_end';
  const ids = [start, ...automaton.states.map((state) => state.id), end];
  const labels = new Map<string, RegularExpression>();
  const mapKey = (from: string, to: string) => `${from}\u0000${to}`;
  const { union, concat, star } = regularExpressionOperations;
  const add = (from: string, to: string, expression: RegularExpression) =>
    labels.set(
      mapKey(from, to),
      union(labels.get(mapKey(from, to)) ?? { kind: 'empty' }, expression),
    );
  add(start, initials[0]!.id, { kind: 'epsilon' });
  for (const final of finals) add(final.id, end, { kind: 'epsilon' });
  for (const transition of automaton.transitions) {
    const expression =
      transition.read === ''
        ? ({ kind: 'epsilon' } as const)
        : concat(
            ...characters(transition.read).map((value) => ({ kind: 'symbol', value }) as const),
          );
    add(transition.from, transition.to, expression);
  }
  for (const remove of automaton.states.map((state) => state.id)) {
    const remaining = ids.filter((id) => id !== remove);
    for (const from of remaining)
      for (const to of remaining) {
        const left = labels.get(mapKey(from, remove));
        const right = labels.get(mapKey(remove, to));
        if (!left || !right) continue;
        const loop = labels.get(mapKey(remove, remove)) ?? { kind: 'epsilon' };
        add(from, to, concat(left, star(loop), right));
      }
    for (const id of ids) {
      labels.delete(mapKey(id, remove));
      labels.delete(mapKey(remove, id));
    }
  }
  return formatRegularExpression(labels.get(mapKey(start, end)) ?? { kind: 'empty' });
}
