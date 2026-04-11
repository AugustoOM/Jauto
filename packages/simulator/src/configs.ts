export interface DFAConfig {
  currentState: string;
  remainingInput: string;
  inputIndex: number;
}

export interface NFAConfig {
  activeStates: ReadonlySet<string>;
  remainingInput: string;
  inputIndex: number;
}

export interface PDAConfig {
  currentState: string;
  remainingInput: string;
  inputIndex: number;
  stack: readonly string[];
}

export interface TMConfig {
  currentState: string;
  tape: readonly string[];
  headPosition: number;
  stepCount: number;
}
