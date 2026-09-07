export interface GrammarProduction {
  readonly left: string;
  readonly right: string;
}

export interface Grammar {
  readonly startSymbol: string;
  readonly productions: readonly GrammarProduction[];
}

export type GrammarClassification =
  | 'regular'
  | 'context-free'
  | 'context-sensitive'
  | 'unrestricted';

export function classifyGrammar(grammar: Grammar): GrammarClassification {
  if (grammar.productions.some((production) => production.left.length === 0)) return 'unrestricted';
  const contextFree = grammar.productions.every(
    (production) => [...production.left].length === 1 && /[A-Z]/u.test(production.left),
  );
  if (!contextFree) {
    return grammar.productions.every(
      (production) => production.right.length >= production.left.length || production.right === '',
    )
      ? 'context-sensitive'
      : 'unrestricted';
  }
  const variables = new Set(grammar.productions.map((production) => production.left));
  const regular = grammar.productions.every((production) => {
    if (production.right === '') return true;
    const tokens = tokenizeRight(production.right, variables);
    const variableIndexes = tokens.flatMap((token, index) => (variables.has(token) ? [index] : []));
    return (
      variableIndexes.length <= 1 &&
      (variableIndexes.length === 0 || variableIndexes[0] === tokens.length - 1)
    );
  });
  return regular ? 'regular' : 'context-free';
}

function tokenizeRight(right: string, variables: ReadonlySet<string>): string[] {
  const names = [...variables].sort((a, b) => b.length - a.length);
  const tokens: string[] = [];
  for (let offset = 0; offset < right.length; ) {
    const variable = names.find((name) => right.startsWith(name, offset));
    if (variable) {
      tokens.push(variable);
      offset += variable.length;
      continue;
    }
    const [symbol] = [...right.slice(offset)];
    tokens.push(symbol!);
    offset += symbol!.length;
  }
  return tokens;
}

interface EarleyItem {
  readonly left: string;
  readonly right: readonly string[];
  readonly dot: number;
  readonly origin: number;
}

/** Earley recognition for character-oriented JFLAP context-free grammars, including epsilon rules. */
export function recognizeContextFree(grammar: Grammar, input: string, maxItems = 100_000): boolean {
  if (
    classifyGrammar(grammar) === 'unrestricted' ||
    grammar.productions.some((production) => [...production.left].length !== 1)
  ) {
    throw new Error('Earley parsing requires a context-free grammar');
  }
  if (!Number.isInteger(maxItems) || maxItems < 1)
    throw new RangeError('maxItems must be a positive integer');
  const variables = new Set(grammar.productions.map((production) => production.left));
  const rules = grammar.productions.map((production) => ({
    left: production.left,
    right: tokenizeRight(production.right, variables),
  }));
  const augmented = '__START__';
  const symbols = [...input];
  const chart: Map<string, EarleyItem>[] = Array.from(
    { length: symbols.length + 1 },
    () => new Map(),
  );
  let itemCount = 0;
  const add = (index: number, item: EarleyItem) => {
    const key = `${item.left}\u0001${item.right.join('\u0001')}\u0001${item.dot}\u0001${item.origin}`;
    if (!chart[index]!.has(key)) {
      chart[index]!.set(key, item);
      itemCount++;
      if (itemCount > maxItems) throw new Error(`Parser item limit of ${maxItems} exceeded`);
      return true;
    }
    return false;
  };
  add(0, { left: augmented, right: [grammar.startSymbol], dot: 0, origin: 0 });
  for (let index = 0; index <= symbols.length; index++) {
    const agenda = [...chart[index]!.values()];
    for (let cursor = 0; cursor < agenda.length; cursor++) {
      const item = agenda[cursor]!;
      const next = item.right[item.dot];
      if (next && variables.has(next)) {
        for (const rule of rules.filter((rule) => rule.left === next)) {
          const candidate = { left: rule.left, right: rule.right, dot: 0, origin: index };
          if (add(index, candidate)) agenda.push(candidate);
        }
      } else if (next) {
        if (symbols[index] === next) add(index + 1, { ...item, dot: item.dot + 1 });
      } else {
        const waiting = [...chart[item.origin]!.values()];
        for (const parent of waiting)
          if (parent.right[parent.dot] === item.left) {
            const candidate = { ...parent, dot: parent.dot + 1 };
            if (add(index, candidate)) agenda.push(candidate);
          }
      }
    }
  }
  return [...chart[symbols.length]!.values()].some(
    (item) => item.left === augmented && item.dot === 1 && item.origin === 0,
  );
}

/** CYK recognition. Rules must be A→BC, A→a, plus an optional start-symbol epsilon rule. */
export function recognizeCYK(grammar: Grammar, input: string): boolean {
  const variables = new Set(grammar.productions.map((production) => production.left));
  const unary = new Map<string, Set<string>>();
  const binary = new Map<string, Set<string>>();
  let startEpsilon = false;
  for (const production of grammar.productions) {
    const tokens = tokenizeRight(production.right, variables);
    if (tokens.length === 0 && production.left === grammar.startSymbol) {
      startEpsilon = true;
      continue;
    }
    if (tokens.length === 1 && !variables.has(tokens[0]!))
      unary.set(tokens[0]!, new Set([...(unary.get(tokens[0]!) ?? []), production.left]));
    else if (tokens.length === 2 && tokens.every((token) => variables.has(token)))
      binary.set(
        tokens.join('\u0000'),
        new Set([...(binary.get(tokens.join('\u0000')) ?? []), production.left]),
      );
    else throw new Error('CYK requires Chomsky normal form');
  }
  const symbols = [...input];
  if (symbols.length === 0) return startEpsilon;
  const table: Set<string>[][] = Array.from({ length: symbols.length }, () =>
    Array.from({ length: symbols.length + 1 }, () => new Set()),
  );
  symbols.forEach((symbol, index) => (table[index]![1] = new Set(unary.get(symbol) ?? [])));
  for (let length = 2; length <= symbols.length; length++)
    for (let start = 0; start + length <= symbols.length; start++)
      for (let split = 1; split < length; split++) {
        for (const left of table[start]![split]!)
          for (const right of table[start + split]![length - split]!)
            for (const variable of binary.get(`${left}\u0000${right}`) ?? [])
              table[start]![length]!.add(variable);
      }
  return table[0]![symbols.length]!.has(grammar.startSymbol);
}
