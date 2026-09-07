import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { CommandHistory } from '@jauto/core';
import type { Command } from '@jauto/core';
import { useDocumentStore } from './document';

export const useHistoryStore = defineStore('history', () => {
  const history = new CommandHistory();
  const document = useDocumentStore();
  const version = ref(0);
  const undoRevisions: { before: number; after: number }[] = [];
  const redoRevisions: { before: number; after: number }[] = [];

  function tick() {
    version.value++;
  }

  function dispatch(command: Command) {
    const before = document.revision;
    const result = history.execute(command, document.automaton);
    const after = document.setAutomaton(result);
    undoRevisions.push({ before, after });
    redoRevisions.length = 0;
    tick();
  }

  function undo() {
    document.flushInspectorEdits();
    const result = history.undo(document.automaton);
    if (result) {
      const revisions = undoRevisions.pop();
      if (!revisions) throw new Error('Revision history is out of sync');
      document.restoreAutomaton(result.automaton, revisions.before);
      redoRevisions.push(revisions);
    }
    tick();
  }

  function redo() {
    document.flushInspectorEdits();
    const result = history.redo(document.automaton);
    if (result) {
      const revisions = redoRevisions.pop();
      if (!revisions) throw new Error('Revision history is out of sync');
      document.restoreAutomaton(result.automaton, revisions.after);
      undoRevisions.push(revisions);
    }
    tick();
  }

  function clear() {
    history.clear();
    undoRevisions.length = 0;
    redoRevisions.length = 0;
    tick();
  }

  const canUndo = computed(() => {
    void version.value;
    return history.canUndo;
  });
  const canRedo = computed(() => {
    void version.value;
    return history.canRedo;
  });
  const undoLabel = computed(() => {
    void version.value;
    return history.undoLabel;
  });
  const redoLabel = computed(() => {
    void version.value;
    return history.redoLabel;
  });

  return { dispatch, undo, redo, clear, canUndo, canRedo, undoLabel, redoLabel };
});
