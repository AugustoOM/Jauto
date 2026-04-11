import type { AnyAutomaton } from '@jauto/core';
import { JFFParseError, JFFValidationWarning } from './errors';

export interface ParseResult {
  automaton: AnyAutomaton;
  warnings: JFFValidationWarning[];
}

export function parseJFF(_xml: string): ParseResult {
  throw new JFFParseError('parseJFF not yet implemented');
}
