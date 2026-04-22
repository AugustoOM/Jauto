<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useDocumentStore } from '../stores/document';
import { useSimulationStore } from '../stores/simulation';
import { useCanvasRenderer } from '../composables/useCanvasRenderer';
import { usePanZoom } from '../composables/usePanZoom';
import { useInteractionManager } from '../composables/useInteractionManager';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const docStore = useDocumentStore();
const simStore = useSimulationStore();
const { render } = useCanvasRenderer();
const panZoom = usePanZoom();
const interaction = useInteractionManager(panZoom.screenToWorld);

let animFrameId = 0;

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  render(ctx, canvas.width, canvas.height, docStore.automaton, {
    offsetX: panZoom.offsetX.value,
    offsetY: panZoom.offsetY.value,
    scale: panZoom.scale.value,
    selected: docStore.selectedElement,
    highlightedStates: simStore.highlightedStates,
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
      ctx.strokeStyle = '#4263eb';
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

function loop() {
  draw();
  animFrameId = requestAnimationFrame(loop);
}

function resize() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const parent = canvas.parentElement;
  if (!parent) return;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
}

function getCanvasRect(): DOMRect {
  return canvasRef.value!.getBoundingClientRect();
}

function handleMouseDown(e: MouseEvent) {
  const pointerType = (e as PointerEvent).pointerType;
  if (e.button === 1 || pointerType === 'touch' || pointerType === 'pen') {
    panZoom.onPanStart(e);
    return;
  }
  interaction.onMouseDown(e, getCanvasRect());
}

function handleMouseMove(e: MouseEvent) {
  panZoom.onPanMove(e);
  interaction.onMouseMove(e, getCanvasRect());
}

function handleMouseUp(e: MouseEvent) {
  panZoom.onPanEnd();
  interaction.onMouseUp(e, getCanvasRect());
}

function handleKeyDown(e: KeyboardEvent) {
  interaction.onKeyDown(e);
  updateModifier(e);
}

function handleKeyUp(e: KeyboardEvent) {
  updateModifier(e);
}

function updateModifier(e: KeyboardEvent) {
  if (e.shiftKey) docStore.heldModifier = 'shift';
  else if (e.ctrlKey || e.metaKey) docStore.heldModifier = 'ctrl';
  else docStore.heldModifier = null;
}

function handleWindowBlur() {
  docStore.heldModifier = null;
}

onMounted(() => {
  resize();
  loop();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleWindowBlur);
});

onUnmounted(() => {
  cancelAnimationFrame(animFrameId);
  window.removeEventListener('resize', resize);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('blur', handleWindowBlur);
  docStore.heldModifier = null;
});

watch(
  () => docStore.automaton.states,
  () => {
    /* triggers redraw on next frame */
  },
);

defineExpose({ panZoom });
</script>

<template>
  <canvas
    ref="canvasRef"
    class="automaton-canvas"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @wheel="panZoom.onWheel"
    @contextmenu.prevent
  />
</template>

<style scoped>
.automaton-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: default;
}
</style>
