import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { FileService } from '@jauto/file-io';
import { useApplicationCommands } from '../src/applicationCommands';
import { useDocumentStore } from '../src/stores/document';

function service(): FileService {
  return {
    openFile: vi.fn().mockResolvedValue({
      name: 'opened.jff',
      path: 'C:/opened.jff',
      content:
        '<?xml version="1.0"?><structure><type>fa</type><automaton><state id="0" name="q0"><x>0</x><y>0</y><initial/></state></automaton></structure>',
    }),
    saveFile: vi.fn().mockResolvedValue({ name: 'saved.jff', path: 'C:/saved.jff' }),
    exportImage: vi.fn().mockResolvedValue(true),
  };
}

describe('shared application commands', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('uses the same open, save, and native-menu command behavior', async () => {
    const fileService = service();
    const commands = useApplicationCommands(fileService, vi.fn());
    const document = useDocumentStore();
    await commands.openDocument();
    expect(document.filePath).toBe('C:/opened.jff');
    document.setAutomaton({ ...document.automaton, meta: { comment: 'changed' } });
    await commands.handleMenuCommand('menu:save');
    expect(fileService.saveFile).toHaveBeenCalledWith(
      'opened.jff',
      expect.any(String),
      'C:/opened.jff',
    );
    expect(document.fileName).toBe('saved.jff');
    expect(document.isDirty).toBe(false);
  });

  it('routes machine creation and rejects unknown menu commands', async () => {
    const commands = useApplicationCommands(service(), vi.fn());
    expect(await commands.handleMenuCommand('menu:new-pda')).toBe(true);
    expect(useDocumentStore().automaton.kind).toBe('pda');
    expect(await commands.handleMenuCommand('menu:unknown')).toBe(false);
  });

  it('does not ask to save on first creation but protects leaving the editor', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const commands = useApplicationCommands(service(), vi.fn());
    const document = useDocumentStore();

    document.setAutomaton({ ...document.automaton, meta: { comment: 'stale placeholder' } });
    expect(document.currentView).toBe('home');
    expect(await commands.newDocument('fa')).toBe(true);
    expect(confirm).not.toHaveBeenCalled();

    document.setAutomaton({ ...document.automaton, meta: { comment: 'edited document' } });
    confirm.mockReturnValueOnce(true);
    expect(await commands.goHome()).toBe(true);
    expect(confirm).toHaveBeenCalledWith('Save changes before continuing?');
    expect(document.currentView).toBe('home');
  });
});
