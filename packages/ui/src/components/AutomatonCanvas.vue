<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { Focus, Minus, Plus } from '@lucide/vue';
import { useDocumentStore } from '../stores/document';
import { useSimulationStore } from '../stores/simulation';
import { useCanvasRenderer, readCssVar } from '../composables/useCanvasRenderer';
import { usePanZoom } from '../composables/usePanZoom';
import { useInteractionManager } from '../composables/useInteractionManager';
import { isEditableKeyTarget, shouldHandleGraphKey } from '../keyboard';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const spaceHeldForPan = ref(false);
const docStore = useDocumentStore();
const simStore = useSimulationStore();
const { render } = useCanvasRenderer();
const panZoom = usePanZoom();
const interaction = useInteractionManager(panZoom.screenToWorld);
const zoomPercent = computed(() => Math.round(panZoom.scale.value * 100));

let animFrameId = 0;
let resizeObserver: ResizeObserver | null = null;

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  render(ctx, width, height, docStore.automaton, {
    offsetX: panZoom.offsetX.value,
    offsetY: panZoom.offsetY.value,
    scale: panZoom.scale.value,
    selected: docStore.selectedElement,
    highlightedStates: simStore.highlightedStates,
    activeTransitions: simStore.transitionHighlights,
  });

  if (interaction.isDrawingTransition.value && interaction.transitionSourceId.value) {
    const source = docStore.automaton.states.find(
      (s) => s.id === interaction.transitionSourceId.value,
    );
    const end = interaction.transitionPreviewEnd.value;
    if (source && end) {
      ctx.save();
      ctx.translate(panZoom.offsetX.value, panZoom.offsetY.value);
      ctx.scale(panZoom.scale.value, panZoom.scale.value);
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = readCssVar('--color-primary', '#4263eb');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}

function requestDraw() {
  cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(draw);
}

function resize() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const parent = canvas.parentElement;
  if (!parent) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(parent.clientWidth * dpr));
  canvas.height = Math.max(1, Math.round(parent.clientHeight * dpr));
  requestDraw();
}

function fitAll() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  panZoom.fitAll(docStore.automaton.states, canvas.clientWidth, canvas.clientHeight);
}

function getCanvasRect(): DOMRect {
  return canvasRef.value!.getBoundingClientRect();
}

function handlePointerDown(e: PointerEvent) {
  const pointerType = e.pointerType;
  canvasRef.value?.setPointerCapture(e.pointerId);
  if (spaceHeldForPan.value && e.button === 0) {
    panZoom.onPanStart(e, { fromPrimaryWithSpace: true });
    return;
  }
  if (e.button === 1 || pointerType === 'touch' || pointerType === 'pen') {
    panZoom.onPanStart(e);
    return;
  }
  interaction.onPointerDown(e, getCanvasRect());
}

function handlePointerMove(e: PointerEvent) {
  panZoom.onPanMove(e);
  interaction.onPointerMove(e, getCanvasRect());
}

function handlePointerUp(e: PointerEvent) {
  panZoom.onPanEnd();
  interaction.onPointerUp(e, getCanvasRect());
  if (canvasRef.value?.hasPointerCapture(e.pointerId)) canvasRef.value.releasePointerCapture(e.pointerId);
}

function cancelPointerGesture() {
  panZoom.onPanEnd();
  interaction.cancelGesture();
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' && !isEditableKeyTarget(e.target)) {
    e.preventDefault();
    spaceHeldForPan.value = true;
  }
  if (shouldHandleGraphKey(e)) interaction.onKeyDown(e);
  updateModifier(e);
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') {
    spaceHeldForPan.value = false;
    panZoom.onPanEnd();
  }
  updateModifier(e);
}

function updateModifier(e: KeyboardEvent) {
  if (e.shiftKey) docStore.heldModifier = 'shift';
  else if (e.ctrlKey || e.metaKey) docStore.heldModifier = 'ctrl';
  else docStore.heldModifier = null;
}

function handleWindowBlur() {
  docStore.heldModifier = null;
  spaceHeldForPan.value = false;
  cancelPointerGesture();
}

watch(() => docStore.documentId, async () => {
  cancelPointerGesture();
  await nextTick();
  fitAll();
});

watch(
  [
    () => docStore.automaton,
    () => docStore.selectedElement,
    () => simStore.highlightedStates,
    () => simStore.transitionHighlights,
    panZoom.offsetX,
    panZoom.offsetY,
    panZoom.scale,
    interaction.isDrawingTransition,
    interaction.transitionPreviewEnd,
  ],
  requestDraw,
  { deep: true },
);

onMounted(() => {
  resize();
  resizeObserver = new ResizeObserver(resize);
  if (canvasRef.value?.parentElement) resizeObserver.observe(canvasRef.value.parentElement);
  fitAll();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleWindowBlur);
});

onUnmounted(() => {
  cancelAnimationFrame(animFrameId);
  resizeObserver?.disconnect();
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('blur', handleWindowBlur);
  docStore.heldModifier = null;
  spaceHeldForPan.value = false;
});

defineExpose({ panZoom });
</script>

<template>
  <div class="canvas-surface">
    <canvas
      ref="canvasRef"
      class="automaton-canvas"
      :class="{ 'automaton-canvas--space-pan': spaceHeldForPan }"
      aria-label="Automaton diagram"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="cancelPointerGesture"
      @lostpointercapture="cancelPointerGesture"
      @wheel="panZoom.onWheel"
      @contextmenu.prevent
    />
    <div class="canvas-zoom" role="group" aria-label="Diagram zoom">
      <button type="button" title="Zoom out" aria-label="Zoom out" @click="panZoom.zoomOut"><Minus :size="15" /></button>
      <span aria-live="polite">{{ zoomPercent }}%</span>
      <button type="button" title="Zoom in" aria-label="Zoom in" @click="panZoom.zoomIn"><Plus :size="15" /></button>
      <button type="button" title="Fit diagram" aria-label="Fit diagram" @click="fitAll"><Focus :size="15" /></button>
    </div>
  </div>
</template>

<style scoped>
.canvas-surface {
  position: relative;
  width: 100%;
  height: 100%;
}

.automaton-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: default;
  touch-action: none;
}

.canvas-zoom {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  box-shadow: var(--shadow-sm);
}

.canvas-zoom button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.canvas-zoom button:hover,
.canvas-zoom button:focus-visible {
  outline: 2px solid var(--color-primary);
  background: var(--color-bg-tertiary);
}

.canvas-zoom span {
  min-width: 42px;
  color: var(--color-text-secondary);
  font: 11px var(--font-mono);
  text-align: center;
}

.automaton-canvas--space-pan {
  cursor: grab;
}
</style>
