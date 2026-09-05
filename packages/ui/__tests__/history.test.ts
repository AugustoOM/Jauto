import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { AddStateCommand } from '@jauto/core';
import { useDocumentStore } from '../src/stores/document';
import { useHistoryStore } from '../src/stores/history';

describe('document and command history integration', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('adds, undoes and redoes a state in the visible document', () => {
    const doc = useDocumentStore();
    const history = useHistoryStore();
    doc.newDocument('fa');
    history.dispatch(new AddStateCommand({ id: 'example', name: 'q0', x: 10, y: 20, isInitial: true, isFinal: false }));
    expect(doc.automaton.states).toHaveLength(1);
    expect(doc.isDirty).toBe(true);
    expect(history.canUndo).toBe(true);
    history.undo();
    expect(doc.automaton.states).toHaveLength(0);
    expect(history.canRedo).toBe(true);
    history.redo();
    expect(doc.automaton.states[0]?.name).toBe('q0');
  });
});
