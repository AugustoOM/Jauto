import type { AnyAutomaton } from '@jauto/core';
import { parseJFF } from '@jauto/jff';
import type { FileService } from './file-service';

export interface OpenResult {
  automaton: AnyAutomaton;
  fileName: string;
}

export async function openAutomaton(fileService: FileService): Promise<OpenResult | null> {
  const file = await fileService.openFile();
  if (!file) return null;

  const { automaton } = parseJFF(file.content);
  return { automaton, fileName: file.name };
}
