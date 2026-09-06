export type SimulationStatus = 'running' | 'accepted' | 'rejected' | 'halted' | 'invalid' | 'canceled' | 'incomplete';
export type SimulationRunOutcome = Exclude<SimulationStatus, 'running'>;
export type SimulationIncompleteReason = 'step-limit' | 'configuration-limit';

export interface StepResult<TConfig> {
  config: TConfig;
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
  readonly isHalted: boolean;
  readonly isAccepted: boolean;
  readonly currentConfig: TConfig;
}
