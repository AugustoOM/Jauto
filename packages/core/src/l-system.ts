export interface LSystemProduction {
  readonly left: string;
  readonly replacements: readonly string[];
}
export interface LSystem {
  readonly axiom: string;
  readonly productions: readonly LSystemProduction[];
  readonly parameters?: Readonly<Record<string, string>>;
}

export function tokenizeLSystem(value: string): string[] {
  return value.trim() ? value.trim().split(/\s+/u) : [];
}

/** Applies every matching rule in parallel. The chooser makes stochastic systems reproducible. */
export function deriveLSystem(
  system: LSystem,
  iterations: number,
  chooser: (alternatives: readonly string[], symbol: string, iteration: number) => number = () => 0,
): string[] {
  if (!Number.isInteger(iterations) || iterations < 0)
    throw new RangeError('iterations must be a non-negative integer');
  const rules = new Map(
    system.productions.map((production) => [production.left.trim(), production.replacements]),
  );
  let symbols = tokenizeLSystem(system.axiom);
  for (let iteration = 0; iteration < iterations; iteration++) {
    symbols = symbols.flatMap((symbol) => {
      const alternatives = rules.get(symbol);
      if (!alternatives?.length) return [symbol];
      const index = chooser(alternatives, symbol, iteration);
      if (!Number.isInteger(index) || index < 0 || index >= alternatives.length)
        throw new RangeError('L-system chooser returned an invalid alternative');
      return tokenizeLSystem(alternatives[index]!);
    });
  }
  return symbols;
}
