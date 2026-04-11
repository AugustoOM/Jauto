<script setup lang="ts">
import { ref, onMounted } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    draw(ctx, canvas.width, canvas.height);
  };

  resize();
  window.addEventListener('resize', resize);
});

function draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#6c757d';
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Jauto — Automaton Canvas', width / 2, height / 2);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#adb5bd';
  ctx.fillText('The graph editor will render here', width / 2, height / 2 + 28);
}
</script>

<template>
  <canvas ref="canvasRef" class="automaton-canvas" />
</template>

<style scoped>
.automaton-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
