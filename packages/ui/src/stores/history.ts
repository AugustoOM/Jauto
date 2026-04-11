import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { CommandHistory } from '@jauto/core';
import type { Command } from '@jauto/core';
import { useDocumentStore } from './document';

export const useHistoryStore = defineStore('history', () => {
  const history = new CommandHistory();
  const document = useDocumentStore();
  const version = ref(0);

  function tick() {
    version.value++;
  }

  function dispatch(command: Command) {
    const result = history.execute(command, document.automaton);
    document.setAutomaton(result);
    tick();
  }

  function undo() {
    const result = history.undo(document.automaton);
    if (result) {
      document.setAutomaton(result.automaton);
    }
    tick();
  }

  function redo() {
    const result = history.redo(document.automaton);
    if (result) {
      document.setAutomaton(result.automaton);
    }
    tick();
  }

  function clear() {
    history.clear();
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
