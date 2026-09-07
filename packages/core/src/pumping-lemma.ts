export interface RegularPumpingDecomposition {
  readonly x: string;
  readonly y: string;
  readonly z: string;
}
export interface ContextFreePumpingDecomposition {
  readonly u: string;
  readonly v: string;
  readonly x: string;
  readonly y: string;
  readonly z: string;
}

export function validateRegularPumping(
  word: string,
  pumpingLength: number,
  parts: RegularPumpingDecomposition,
): boolean {
  return (
    Number.isInteger(pumpingLength) &&
    pumpingLength > 0 &&
    parts.x + parts.y + parts.z === word &&
    [...(parts.x + parts.y)].length <= pumpingLength &&
    [...parts.y].length > 0
  );
}

export function pumpRegular(parts: RegularPumpingDecomposition, exponent: number): string {
  if (!Number.isInteger(exponent) || exponent < 0)
    throw new RangeError('exponent must be a non-negative integer');
  return parts.x + parts.y.repeat(exponent) + parts.z;
}

export function validateContextFreePumping(
  word: string,
  pumpingLength: number,
  parts: ContextFreePumpingDecomposition,
): boolean {
  return (
    Number.isInteger(pumpingLength) &&
    pumpingLength > 0 &&
    parts.u + parts.v + parts.x + parts.y + parts.z === word &&
    [...(parts.v + parts.x + parts.y)].length <= pumpingLength &&
    [...(parts.v + parts.y)].length > 0
  );
}

export function pumpContextFree(parts: ContextFreePumpingDecomposition, exponent: number): string {
  if (!Number.isInteger(exponent) || exponent < 0)
    throw new RangeError('exponent must be a non-negative integer');
  return parts.u + parts.v.repeat(exponent) + parts.x + parts.y.repeat(exponent) + parts.z;
}
