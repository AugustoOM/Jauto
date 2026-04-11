import type { AnyAutomaton } from '../types';
import type { Command } from './types';

export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  execute(command: Command, automaton: AnyAutomaton): AnyAutomaton {
    const result = command.execute(automaton);
    this.undoStack.push(command);
    this.redoStack = [];
    return result;
  }

  undo(automaton: AnyAutomaton): { automaton: AnyAutomaton; command: Command } | null {
    const command = this.undoStack.pop();
    if (!command) return null;
    const result = command.undo(automaton);
    this.redoStack.push(command);
    return { automaton: result, command };
  }

  redo(automaton: AnyAutomaton): { automaton: AnyAutomaton; command: Command } | null {
    const command = this.redoStack.pop();
    if (!command) return null;
    const result = command.execute(automaton);
    this.undoStack.push(command);
    return { automaton: result, command };
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoLabel(): string | undefined {
    return this.undoStack.at(-1)?.label;
  }

  get redoLabel(): string | undefined {
    return this.redoStack.at(-1)?.label;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
