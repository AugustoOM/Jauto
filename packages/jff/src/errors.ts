export class JFFParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JFFParseError';
  }
}

export class JFFValidationWarning {
  constructor(
    public readonly message: string,
    public readonly context?: string,
  ) {}
}
