import type { AnyAutomaton } from '@jauto/core';
import { JFFParseError, parseJFF } from '@jauto/jff';
import type { FileService } from './file-service';

export interface OpenResult {
  automaton: AnyAutomaton;
  fileName: string;
}

export class FileOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileOpenError';
  }
}

export async function openAutomaton(fileService: FileService): Promise<OpenResult | null> {
  const file = await fileService.openFile();
  if (!file) return null;

  try {
    const { automaton } = parseJFF(file.content);
    return { automaton, fileName: file.name };
  } catch (e) {
    if (e instanceof JFFParseError) {
      throw new FileOpenError(`Failed to parse file "${file.name}": ${e.message}`);
    }
    if (e instanceof Error) {
      throw new FileOpenError(`Failed to parse file "${file.name}": ${e.message}`);
    }
    throw new FileOpenError(`Failed to parse file "${file.name}": Unknown error`);
  }
}