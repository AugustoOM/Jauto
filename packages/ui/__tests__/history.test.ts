import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { AddStateCommand } from '@jauto/core';
import { useDocumentStore } from '../src/stores/document';
import { useHistoryStore } from '../src/stores/history';

describe('document and command history integration', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('adds, undoes and redoes a state in the visible document', () => {
    const doc = useDocumentStore();
    const history = useHistoryStore();
    doc.newDocument('fa');
    history.dispatch(new AddStateCommand({ id: 'example', name: 'q0', x: 10, y: 20, isInitial: true, isFinal: false }));
    expect(doc.automaton.states).toHaveLength(1);
    expect(doc.isDirty).toBe(true);
    expect(history.canUndo).toBe(true);
    const savedToken = doc.createRevisionToken();
    expect(doc.markSaved(savedToken, 'example.jff')).toBe(true);
    expect(doc.isDirty).toBe(false);
    history.undo();
    expect(doc.automaton.states).toHaveLength(0);
    expect(history.canRedo).toBe(true);
    expect(doc.isDirty).toBe(true);
    history.redo();
    expect(doc.automaton.states[0]?.name).toBe('q0');
    expect(doc.isDirty).toBe(false);
  });

  it('does not clear newer edits or a replacement document after an asynchronous save', () => {
    const doc = useDocumentStore();
    const history = useHistoryStore();
    doc.newDocument('fa');
    const saving = doc.createRevisionToken();
    history.dispatch(new AddStateCommand({ id: 'newer', name: 'q0', x: 0, y: 0, isInitial: true, isFinal: false }));
    expect(doc.markSaved(saving, 'old.jff')).toBe(true);
    expect(doc.isDirty).toBe(true);

    const obsolete = doc.createRevisionToken();
    doc.newDocument('pda');
    expect(doc.markSaved(obsolete, 'wrong.jff')).toBe(false);
    expect(doc.fileName).toBeNull();
  });

  it('restores an unsaved recovery draft and exposes a Resume path', () => {
    const first = useDocumentStore();
    const history = useHistoryStore();
    first.newDocument('fa');
    history.dispatch(new AddStateCommand({ id: 'recovered', name: 'saved from crash', x: 1, y: 2, isInitial: true, isFinal: false }));

    setActivePinia(createPinia());
    const restored = useDocumentStore();
    expect(restored.restoreRecoveryDraft()).toBe(true);
    expect(restored.isDirty).toBe(true);
    expect(restored.canResume).toBe(true);
    expect(restored.currentView).toBe('home');
    restored.resume();
    expect(restored.currentView).toBe('editor');
    expect(restored.automaton.states[0]?.name).toBe('saved from crash');
  });
});
