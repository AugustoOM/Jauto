import type { AutomatonState, FATransition, FiniteAutomaton } from './types';

export type RegularExpression =
  | { readonly kind: 'empty' }
  | { readonly kind: 'epsilon' }
  | { readonly kind: 'symbol'; readonly value: string }
  | { readonly kind: 'union'; readonly alternatives: readonly RegularExpression[] }
  | { readonly kind: 'concat'; readonly factors: readonly RegularExpression[] }
  | { readonly kind: 'star'; readonly expression: RegularExpression };

export class RegularExpressionSyntaxError extends Error {
  constructor(
    message: string,
    readonly offset: number,
  ) {
    super(`${message} at position ${offset + 1}`);
    this.name = 'RegularExpressionSyntaxError';
  }
}

export function parseRegularExpression(source: string): RegularExpression {
  let offset = 0;
  const chars = [...source];
  const peek = () => chars[offset];
  const parseUnion = (): RegularExpression => {
    const alternatives = [parseConcat()];
    while (peek() === '+') {
      offset++;
      alternatives.push(parseConcat());
    }
    return union(...alternatives);
  };
  const parseConcat = (): RegularExpression => {
    const factors: RegularExpression[] = [];
    while (offset < chars.length && peek() !== ')' && peek() !== '+') factors.push(parseStar());
    return concat(...factors);
  };
  const parseStar = (): RegularExpression => {
    let expression = parseAtom();
    while (peek() === '*') {
      offset++;
      expression = star(expression);
    }
    return expression;
  };
  const parseAtom = (): RegularExpression => {
    const token = peek();
    if (token === undefined)
      throw new RegularExpressionSyntaxError('Expected an expression', offset);
    if (token === '(') {
      offset++;
      const expression = parseUnion();
      if (peek() !== ')')
        throw new RegularExpressionSyntaxError('Missing closing parenthesis', offset);
      offset++;
      return expression;
    }
    if (token === '\\') {
      offset++;
      const escaped = peek();
      if (escaped === undefined)
        throw new RegularExpressionSyntaxError('Missing escaped symbol', offset);
      offset++;
      return { kind: 'symbol', value: escaped };
    }
    if (token === '*' || token === ')')
      throw new RegularExpressionSyntaxError(`Unexpected "${token}"`, offset);
    offset++;
    if (token === '!') return { kind: 'epsilon' };
    if (token === '∅') return { kind: 'empty' };
    return { kind: 'symbol', value: token };
  };

  if (source === '') return { kind: 'epsilon' };
  const expression = parseUnion();
  if (offset !== chars.length)
    throw new RegularExpressionSyntaxError(`Unexpected "${peek()}"`, offset);
  return expression;
}

export function formatRegularExpression(expression: RegularExpression): string {
  const format = (node: RegularExpression, precedence: number): string => {
    if (node.kind === 'empty') return '∅';
    if (node.kind === 'epsilon') return '!';
    if (node.kind === 'symbol')
      return /[+*()!∅\\]/u.test(node.value) ? `\\${node.value}` : node.value;
    if (node.kind === 'star') {
      const value = `${format(node.expression, 3)}*`;
      return precedence > 3 ? `(${value})` : value;
    }
    if (node.kind === 'concat') {
      const value = node.factors.map((factor) => format(factor, 2)).join('');
      return precedence > 2 ? `(${value})` : value;
    }
    const value = node.alternatives.map((alternative) => format(alternative, 1)).join('+');
    return precedence > 1 ? `(${value})` : value;
  };
  return format(expression, 0);
}

function union(...items: RegularExpression[]): RegularExpression {
  const alternatives = items
    .flatMap((item) => (item.kind === 'union' ? item.alternatives : [item]))
    .filter((item) => item.kind !== 'empty');
  const unique = [
    ...new Map(alternatives.map((item) => [formatRegularExpression(item), item])).values(),
  ];
  if (unique.length === 0) return { kind: 'empty' };
  if (unique.length === 1) return unique[0]!;
  return { kind: 'union', alternatives: unique };
}

function concat(...items: RegularExpression[]): RegularExpression {
  const factors = items.flatMap((item) => (item.kind === 'concat' ? item.factors : [item]));
  if (factors.some((item) => item.kind === 'empty')) return { kind: 'empty' };
  const meaningful = factors.filter((item) => item.kind !== 'epsilon');
  if (meaningful.length === 0) return { kind: 'epsilon' };
  if (meaningful.length === 1) return meaningful[0]!;
  return { kind: 'concat', factors: meaningful };
}

function star(expression: RegularExpression): RegularExpression {
  if (expression.kind === 'empty' || expression.kind === 'epsilon') return { kind: 'epsilon' };
  if (expression.kind === 'star') return expression;
  return { kind: 'star', expression };
}

/** Thompson construction using JFLAP's `+`, `*`, implicit concatenation, and `!` syntax. */
export function regularExpressionToNFA(source: string | RegularExpression): FiniteAutomaton {
  const expression = typeof source === 'string' ? parseRegularExpression(source) : source;
  const states: AutomatonState[] = [];
  const transitions: FATransition[] = [];
  const makeState = () => {
    const index = states.length;
    const state = {
      id: `re_s${index}`,
      name: `q${index}`,
      x: 100 + (index % 6) * 110,
      y: 100 + Math.floor(index / 6) * 90,
      isInitial: false,
      isFinal: false,
    };
    states.push(state);
    return state.id;
  };
  const edge = (from: string, to: string, read = '') =>
    transitions.push({ id: `re_t${transitions.length}`, from, to, read });
  const build = (node: RegularExpression): [string, string] => {
    const start = makeState();
    const end = makeState();
    if (node.kind === 'empty') return [start, end];
    if (node.kind === 'epsilon') edge(start, end);
    if (node.kind === 'symbol') edge(start, end, node.value);
    if (node.kind === 'concat') {
      let current = start;
      for (const factor of node.factors) {
        const [childStart, childEnd] = build(factor);
        edge(current, childStart);
        current = childEnd;
      }
      edge(current, end);
    }
    if (node.kind === 'union') {
      for (const alternative of node.alternatives) {
        const [childStart, childEnd] = build(alternative);
        edge(start, childStart);
        edge(childEnd, end);
      }
    }
    if (node.kind === 'star') {
      const [childStart, childEnd] = build(node.expression);
      edge(start, end);
      edge(start, childStart);
      edge(childEnd, childStart);
      edge(childEnd, end);
    }
    return [start, end];
  };
  const [initial, final] = build(expression);
  return {
    kind: 'fa',
    states: states.map((state) => ({
      ...state,
      isInitial: state.id === initial,
      isFinal: state.id === final,
    })),
    transitions,
    meta: { comment: `Generated from regular expression ${formatRegularExpression(expression)}` },
  };
}

export const regularExpressionOperations = { union, concat, star };
