import type { AnyAutomaton } from '@jauto/core';
import { serializeJFF } from '@jauto/jff';
import type { FileService } from './file-service';

export async function saveAutomaton(
  fileService: FileService,
  automaton: AnyAutomaton,
  name: string,
): Promise<boolean> {
  const xml = serializeJFF(automaton);
  return fileService.saveFile(name, xml);
}
