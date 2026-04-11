import { ref } from 'vue';
import type { AutomatonState } from '@jauto/core';
import {
  AddStateCommand,
  RemoveStateCommand,
  MoveStateCommand,
  AddTransitionCommand,
  RemoveTransitionCommand,
  generateStateId,
  generateTransitionId,
  getTransitionsFrom,
  getTransitionsTo,
  updateState,
} from '@jauto/core';
import type { AnyAutomaton } from '@jauto/core';
import { useDocumentStore } from '../stores/document';
import { useHistoryStore } from '../stores/history';
import { useHitTesting } from './useHitTesting';

export function useInteractionManager(
  screenToWorld: (sx: number, sy: number) => { x: number; y: number },
) {
  const docStore = useDocumentStore();
  const historyStore = useHistoryStore();
  const { hitTestState, hitTestTransition } = useHitTesting();

  const isDragging = ref(false);
  const dragStateId = ref<string | null>(null);
  const dragStartX = ref(0);
  const dragStartY = ref(0);

  const isDrawingTransition = ref(false);
  const transitionSourceId = ref<string | null>(null);
  const transitionPreviewEnd = ref<{ x: number; y: number } | null>(null);

  function toWorld(e: MouseEvent, canvasRect: DOMRect) {
    return screenToWorld(e.clientX - canvasRect.left, e.clientY - canvasRect.top);
  }

  function nextStateName(): string {
    let max = -1;
    for (const s of docStore.automaton.states) {
      const match = /^q(\d+)$/.exec(s.name);
      if (match) {
        const n = parseInt(match[1]!, 10);
        if (n > max) max = n;
      }
    }
    return `q${max + 1}`;
  }

  function addStateAt(x: number, y: number) {
    const name = nextStateName();
    const newState: AutomatonState = {
      id: generateStateId(),
      name,
      x,
      y,
      isInitial: docStore.automaton.states.length === 0,
      isFinal: false,
    };
    historyStore.dispatch(new AddStateCommand(newState));
    docStore.select({ type: 'state', id: newState.id });
  }

  function deleteAt(x: number, y: number) {
    const hitState = hitTestState(x, y, docStore.automaton.states);
    if (hitState) {
      const from = getTransitionsFrom(docStore.automaton, hitState.id);
      const to = getTransitionsTo(docStore.automaton, hitState.id);
      const allConnected = [...from, ...to];
      const unique = [...new Map(allConnected.map((t) => [t.id, t])).values()];
      historyStore.dispatch(new RemoveStateCommand(hitState, unique));
      docStore.clearSelection();
      return;
    }

    const hitTrans = hitTestTransition(x, y, docStore.automaton);
    if (hitTrans) {
      historyStore.dispatch(new RemoveTransitionCommand(hitTrans));
      docStore.clearSelection();
    }
  }

  function onMouseDown(e: MouseEvent, canvasRect: DOMRect) {
    const { x, y } = toWorld(e, canvasRect);

    if (e.button === 2) {
      if (e.ctrlKey || e.metaKey) {
        deleteAt(x, y);
      } else {
        addStateAt(x, y);
      }
      return;
    }

    if (e.button !== 0) return;

    if (e.shiftKey) {
      const hitState = hitTestState(x, y, docStore.automaton.states);
      if (hitState) {
        isDrawingTransition.value = true;
        transitionSourceId.value = hitState.id;
        transitionPreviewEnd.value = { x, y };
      }
      return;
    }

    const hitState = hitTestState(x, y, docStore.automaton.states);
    if (hitState) {
      docStore.select({ type: 'state', id: hitState.id });
      isDragging.value = true;
      dragStateId.value = hitState.id;
      dragStartX.value = hitState.x;
      dragStartY.value = hitState.y;
      return;
    }

    const hitTrans = hitTestTransition(x, y, docStore.automaton);
    if (hitTrans) {
      docStore.select({ type: 'transition', id: hitTrans.id });
      return;
    }

    docStore.clearSelection();
  }

  function onMouseMove(e: MouseEvent, canvasRect: DOMRect) {
    const { x, y } = toWorld(e, canvasRect);

    if (isDragging.value && dragStateId.value) {
      docStore.setAutomaton(
        updateState(docStore.automaton, dragStateId.value, { x, y }) as AnyAutomaton,
      );
    }

    if (isDrawingTransition.value) {
      transitionPreviewEnd.value = { x, y };
    }
  }

  function onMouseUp(e: MouseEvent, canvasRect: DOMRect) {
    if (isDragging.value && dragStateId.value) {
      const stateId = dragStateId.value;
      const current = docStore.automaton.states.find((s) => s.id === stateId);

      if (current && (current.x !== dragStartX.value || current.y !== dragStartY.value)) {
        const finalX = current.x;
        const finalY = current.y;

        docStore.setAutomaton(
          updateState(docStore.automaton, stateId, {
            x: dragStartX.value,
            y: dragStartY.value,
          }) as AnyAutomaton,
        );
        historyStore.dispatch(
          new MoveStateCommand(stateId, dragStartX.value, dragStartY.value, finalX, finalY),
        );
      }
      isDragging.value = false;
      dragStateId.value = null;
    }

    if (isDrawingTransition.value && transitionSourceId.value) {
      const { x, y } = toWorld(e, canvasRect);
      const targetState = hitTestState(x, y, docStore.automaton.states);

      if (targetState) {
        const kind = docStore.automaton.kind;
        const id = generateTransitionId();
        let transition;
        if (kind === 'pda') {
          transition = { id, from: transitionSourceId.value, to: targetState.id, read: '', pop: '', push: '' };
        } else if (kind === 'turing') {
          transition = { id, from: transitionSourceId.value, to: targetState.id, read: '', write: '', move: 'R' as const };
        } else {
          transition = { id, from: transitionSourceId.value, to: targetState.id, read: '' };
        }
        historyStore.dispatch(new AddTransitionCommand(transition));
      }

      isDrawingTransition.value = false;
      transitionSourceId.value = null;
      transitionPreviewEnd.value = null;
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const sel = docStore.selectedElement;
      if (!sel) return;

      if (sel.type === 'state') {
        const state = docStore.automaton.states.find((s) => s.id === sel.id);
        if (state) {
          const from = getTransitionsFrom(docStore.automaton, state.id);
          const to = getTransitionsTo(docStore.automaton, state.id);
          const allConnected = [...from, ...to];
          const unique = [...new Map(allConnected.map((t) => [t.id, t])).values()];
          historyStore.dispatch(new RemoveStateCommand(state, unique));
        }
      } else if (sel.type === 'transition') {
        const trans = docStore.automaton.transitions.find((t) => t.id === sel.id);
        if (trans) {
          historyStore.dispatch(new RemoveTransitionCommand(trans));
        }
      }
      docStore.clearSelection();
    }
  }

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onKeyDown,
    isDrawingTransition,
    transitionSourceId,
    transitionPreviewEnd,
  };
}
