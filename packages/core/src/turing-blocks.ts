import type { AutomatonState, TMTransition } from './types';

export interface TuringBlockState extends AutomatonState {
  readonly block?: { readonly tag: string; readonly machine: TuringBlockMachine };
}

export interface TuringBlockTransition extends TMTransition {
  readonly blockEdge?: boolean;
}

export interface TuringBlockMachine {
  readonly kind: 'turing-blocks';
  readonly tapes: 1;
  readonly states: readonly TuringBlockState[];
  readonly transitions: readonly TuringBlockTransition[];
}
