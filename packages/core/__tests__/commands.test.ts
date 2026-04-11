import { describe, it, expect } from 'vitest';
import {
  createEmptyAutomaton,
  CommandHistory,
  AddStateCommand,
  RemoveStateCommand,
  MoveStateCommand,
  AddTransitionCommand,
  RemoveTransitionCommand,
  BatchCommand,
  addState,
  addTransition,
} from '../src/index';
import type { AutomatonState, FATransition, FiniteAutomaton, AnyAutomaton } from '../src/index';

function s(id: string, opts: Partial<AutomatonState> = {}): AutomatonState {
  return { id, name: `q${id}`, x: 0, y: 0, isInitial: false, isFinal: false, ...opts };
}

function t(id: string, from: string, to: string, read: string): FATransition {
  return { id, from, to, read };
}

describe('CommandHistory', () => {
  it('executes a command and updates the automaton', () => {
    const history = new CommandHistory();
    const fa = createEmptyAutomaton('fa');
    const state = s('0', { isInitial: true });

    const result = history.execute(new AddStateCommand(state), fa);
    expect(result.states).toHaveLength(1);
    expect(result.states[0]!.id).toBe('0');
  });

  it('undoes a command', () => {
    const history = new CommandHistory();
    let fa: AnyAutomaton = createEmptyAutomaton('fa');
    fa = history.execute(new AddStateCommand(s('0')), fa);
    expect(fa.states).toHaveLength(1);

    const undone = history.undo(fa);
    expect(undone).not.toBeNull();
    expect(undone!.automaton.states).toHaveLength(0);
  });

  it('redoes a command after undo', () => {
    const history = new CommandHistory();
    let fa: AnyAutomaton = createEmptyAutomaton('fa');
    fa = history.execute(new AddStateCommand(s('0')), fa);
    const undone = history.undo(fa)!;
    fa = undone.automaton;

    const redone = history.redo(fa);
    expect(redone).not.toBeNull();
    expect(redone!.automaton.states).toHaveLength(1);
  });

  it('clears redo stack after new command', () => {
    const history = new CommandHistory();
    let fa: AnyAutomaton = createEmptyAutomaton('fa');
    fa = history.execute(new AddStateCommand(s('0')), fa);
    fa = history.undo(fa)!.automaton;

    fa = history.execute(new AddStateCommand(s('1')), fa);
    expect(history.canRedo).toBe(false);
  });

  it('reports canUndo/canRedo correctly', () => {
    const history = new CommandHistory();
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);

    let fa: AnyAutomaton = createEmptyAutomaton('fa');
    fa = history.execute(new AddStateCommand(s('0')), fa);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });

  it('reports undo/redo labels', () => {
    const history = new CommandHistory();
    let fa: AnyAutomaton = createEmptyAutomaton('fa');
    fa = history.execute(new AddStateCommand(s('0', { name: 'q0' })), fa);
    expect(history.undoLabel).toBe('Add state q0');
  });
});

describe('AddStateCommand / RemoveStateCommand round-trip', () => {
  it('undo of add returns original', () => {
    const fa = createEmptyAutomaton('fa');
    const cmd = new AddStateCommand(s('0'));
    const after = cmd.execute(fa);
    const back = cmd.undo(after);
    expect(back.states).toEqual(fa.states);
  });
});

describe('RemoveStateCommand', () => {
  it('restores state and connected transitions on undo', () => {
    let fa: FiniteAutomaton = createEmptyAutomaton('fa');
    const state0 = s('0');
    const state1 = s('1');
    const trans = t('t0', '0', '1', 'a');
    fa = addState(fa, state0);
    fa = addState(fa, state1);
    fa = addTransition(fa, trans);

    const cmd = new RemoveStateCommand(state0, [trans]);
    const after = cmd.execute(fa) as FiniteAutomaton;
    expect(after.states).toHaveLength(1);
    expect(after.transitions).toHaveLength(0);

    const restored = cmd.undo(after) as FiniteAutomaton;
    expect(restored.states).toHaveLength(2);
    expect(restored.transitions).toHaveLength(1);
  });
});

describe('MoveStateCommand', () => {
  it('moves and restores position', () => {
    let fa: AnyAutomaton = createEmptyAutomaton('fa');
    fa = addState(fa, s('0', { x: 10, y: 20 }));

    const cmd = new MoveStateCommand('0', 10, 20, 50, 60);
    const moved = cmd.execute(fa);
    expect(moved.states[0]!.x).toBe(50);
    expect(moved.states[0]!.y).toBe(60);

    const back = cmd.undo(moved);
    expect(back.states[0]!.x).toBe(10);
    expect(back.states[0]!.y).toBe(20);
  });
});

describe('AddTransitionCommand / RemoveTransitionCommand', () => {
  it('round-trips add/undo', () => {
    const fa = createEmptyAutomaton('fa');
    const trans = t('t0', '0', '1', 'a');
    const cmd = new AddTransitionCommand(trans);
    const after = cmd.execute(fa);
    expect(after.transitions).toHaveLength(1);
    const back = cmd.undo(after);
    expect(back.transitions).toHaveLength(0);
  });

  it('round-trips remove/undo', () => {
    let fa: FiniteAutomaton = createEmptyAutomaton('fa');
    const trans = t('t0', '0', '1', 'a');
    fa = addTransition(fa, trans);

    const cmd = new RemoveTransitionCommand(trans);
    const after = cmd.execute(fa);
    expect(after.transitions).toHaveLength(0);
    const back = cmd.undo(after);
    expect(back.transitions).toHaveLength(1);
  });
});

describe('BatchCommand', () => {
  it('applies and reverts multiple commands as one step', () => {
    const fa = createEmptyAutomaton('fa');
    const batch = new BatchCommand('Add two states', [
      new AddStateCommand(s('0')),
      new AddStateCommand(s('1')),
    ]);

    const after = batch.execute(fa);
    expect(after.states).toHaveLength(2);

    const back = batch.undo(after);
    expect(back.states).toHaveLength(0);
  });
});
