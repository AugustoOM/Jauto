import { describe, expect, it, vi } from 'vitest';
import { createEmptyAutomaton } from '@jauto/core';
import { openAutomaton, FileOpenError } from '../src/open';
import { saveAutomaton } from '../src/save';
import type { FileService } from '../src/file-service';

function service(): FileService {
  return { openFile: vi.fn().mockResolvedValue(null), saveFile: vi.fn().mockResolvedValue(true), exportImage: vi.fn().mockResolvedValue(true) };
}

describe('file service boundary', () => {
  it('carries import diagnostics through the platform boundary', async () => {
    const files = service();
    vi.mocked(files.openFile).mockResolvedValue({ name: 'draft.jff', content: '<structure><type>fa</type><automaton/></structure>' });
    const result = await openAutomaton(files);
    expect(result?.warnings[0]?.message).toContain('initial state');
  });
  it('keeps canceled opens distinct from parse failures', async () => {
    const files = service();
    await expect(openAutomaton(files)).resolves.toBeNull();
    vi.mocked(files.openFile).mockResolvedValue({ name: 'broken.jff', content: '<broken>' });
    await expect(openAutomaton(files)).rejects.toBeInstanceOf(FileOpenError);
  });

  it('passes serialized content to the platform and retains cancellation', async () => {
    const files = service();
    vi.mocked(files.saveFile).mockResolvedValue(false);
    await expect(saveAutomaton(files, createEmptyAutomaton('fa'), 'example.jff')).resolves.toBe(false);
    expect(files.saveFile).toHaveBeenCalledWith('example.jff', expect.stringContaining('<type>fa</type>'));
  });

  it('does not hide disk errors', async () => {
    const files = service();
    vi.mocked(files.saveFile).mockRejectedValue(new Error('Disk full'));
    await expect(saveAutomaton(files, createEmptyAutomaton('fa'), 'example.jff')).rejects.toThrow('Disk full');
  });
});
