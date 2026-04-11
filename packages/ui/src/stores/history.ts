import { defineStore } from 'pinia';
import { computed } from 'vue';
import { CommandHistory } from '@jauto/core';
import type { Command } from '@jauto/core';
import { useDocumentStore } from './document';

export const useHistoryStore = defineStore('history', () => {
  const history = new CommandHistory();
  const document = useDocumentStore();

  function dispatch(command: Command) {
    const result = history.execute(command, document.automaton);
    document.setAutomaton(result);
  }

  function undo() {
    const result = history.undo(document.automaton);
    if (result) {
      document.setAutomaton(result.automaton);
    }
  }

  function redo() {
    const result = history.redo(document.automaton);
    if (result) {
      document.setAutomaton(result.automaton);
    }
  }

  function clear() {
    history.clear();
  }

  const canUndo = computed(() => history.canUndo);
  const canRedo = computed(() => history.canRedo);
  const undoLabel = computed(() => history.undoLabel);
  const redoLabel = computed(() => history.redoLabel);

  return { dispatch, undo, redo, clear, canUndo, canRedo, undoLabel, redoLabel };
});
