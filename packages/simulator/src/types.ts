export type SimulationStatus = 'running' | 'accepted' | 'rejected' | 'halted';

export interface StepResult<TConfig> {
  config: TConfig;
  status: SimulationStatus;
  stepIndex: number;
}

export interface RunResult<TConfig> {
  accepted: boolean;
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
