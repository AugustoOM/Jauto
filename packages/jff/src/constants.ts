export const TAG = {
  STRUCTURE: 'structure',
  TYPE: 'type',
  AUTOMATON: 'automaton',
  STATE: 'state',
  TRANSITION: 'transition',
  FROM: 'from',
  TO: 'to',
  READ: 'read',
  POP: 'pop',
  PUSH: 'push',
  WRITE: 'write',
  MOVE: 'move',
  INITIAL: 'initial',
  FINAL: 'final',
  X: 'x',
  Y: 'y',
  TAPES: 'tapes',
  LABEL: 'label',
} as const;

export const ATTR = {
  ID: '@_id',
  NAME: '@_name',
} as const;
