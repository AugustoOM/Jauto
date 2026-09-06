export function validateRunBudget(maxSteps: number): void {
  if (!Number.isInteger(maxSteps) || maxSteps < 0) {
    throw new RangeError('maxSteps must be a non-negative integer');
  }
}
