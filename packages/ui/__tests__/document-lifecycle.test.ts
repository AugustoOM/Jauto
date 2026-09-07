import { describe, expect, it, vi } from 'vitest';
import { createBeforeUnloadHandler, requestDocumentLifecycleDecision, runProtectedDocumentAction } from '../src/documentLifecycle';

describe('document lifecycle protection', () => {
  it.each([
    [[true], 'save'],
    [[false, true], 'discard'],
    [[false, false], 'cancel'],
  ] as const)('maps confirmation answers to %s', (answers, expected) => {
    const remaining = [...answers];
    const confirm = vi.fn(() => remaining.shift() ?? false);
    expect(requestDocumentLifecycleDecision(confirm)).toBe(expected);
  });

  it('runs immediately for a clean document', async () => {
    const save = vi.fn(async () => true);
    const action = vi.fn();
    expect(await runProtectedDocumentAction({ isDirty: false, save, action })).toBe(true);
    expect(save).not.toHaveBeenCalled();
    expect(action).toHaveBeenCalledOnce();
  });

  it('does not replace the document when save fails or is canceled', async () => {
    const action = vi.fn();
    expect(await runProtectedDocumentAction({
      isDirty: true,
      save: async () => false,
      action,
      confirm: () => true,
    })).toBe(false);
    expect(action).not.toHaveBeenCalled();

    expect(await runProtectedDocumentAction({
      isDirty: true,
      save: async () => true,
      action,
      confirm: () => false,
    })).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });

  it('protects browser reload only while the document is dirty', () => {
    let dirty = false;
    const handler = createBeforeUnloadHandler(() => dirty);
    const cleanEvent = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    handler(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);
    dirty = true;
    const dirtyEvent = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    handler(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);
  });
});
