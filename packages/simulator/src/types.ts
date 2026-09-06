export type SimulationStatus = 'running' | 'accepted' | 'rejected' | 'halted' | 'invalid' | 'canceled' | 'incomplete';
export type SimulationRunOutcome = Exclude<SimulationStatus, 'running'>;
export type SimulationIncompleteReason = 'step-limit' | 'configuration-limit';

export interface SimulationBranch<TConfig> {
  /** Stable identity for this configuration within a trace. */
  id: string;
  config: TConfig;
  /** Transition used to create this configuration in the current step. */
  transitionId?: string;
  /** Transition(s) that selected this branch in the current snapshot. */
  path: readonly string[];
}

export interface StepResult<TConfig> {
  config: TConfig;
  configurations: readonly SimulationBranch<TConfig>[];
  /** Exact transitions executed while producing this snapshot. */
  transitionIds: readonly string[];
  /** One complete accepting witness, when the snapshot is accepting. */
  acceptingPath?: readonly string[];
  status: SimulationStatus;
  stepIndex: number;
}

export interface RunResult<TConfig> {
  accepted: boolean;
  outcome: SimulationRunOutcome;
  incompleteReason?: SimulationIncompleteReason;
  steps: StepResult<TConfig>[];
  finalConfig: TConfig;
}

export interface SimulationRunner<TConfig> {
  step(): StepResult<TConfig>;
  run(maxSteps?: number): RunResult<TConfig>;
  reset(): void;
  cancel(): void;
  readonly isHalted: boolean;
  readonly isAccepted: boolean;
  readonly currentConfig: TConfig;
  readonly currentStep: StepResult<TConfig>;
}

export class UnsupportedSimulationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedSimulationError';
  }
}
