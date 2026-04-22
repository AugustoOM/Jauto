import { ref } from 'vue';

export function usePanZoom() {
  const offsetX = ref(0);
  const offsetY = ref(0);
  const scale = ref(1);

  let isPanning = false;
  let lastX = 0;
  let lastY = 0;

  function screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - offsetX.value) / scale.value,
      y: (sy - offsetY.value) / scale.value,
    };
  }

  function worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: wx * scale.value + offsetX.value,
      y: wy * scale.value + offsetY.value,
    };
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale.value * zoomFactor));

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    offsetX.value = mx - ((mx - offsetX.value) / scale.value) * newScale;
    offsetY.value = my - ((my - offsetY.value) / scale.value) * newScale;
    scale.value = newScale;
  }

  function onPanStart(e: MouseEvent) {
    const pointerType = (e as PointerEvent).pointerType;
    if (e.button === 1 || e.buttons > 1 || pointerType === 'touch' || pointerType === 'pen') {
      isPanning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      e.preventDefault();
    }
  }

  function onPanMove(e: MouseEvent) {
    if (!isPanning) return;
    offsetX.value += e.clientX - lastX;
    offsetY.value += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function onPanEnd() {
    isPanning = false;
  }

  function fitAll(states: { x: number; y: number }[], canvasWidth: number, canvasHeight: number) {
    if (states.length === 0) {
      offsetX.value = 0;
      offsetY.value = 0;
      scale.value = 1;
      return;
    }

    const padding = 80;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of states) {
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.y > maxY) maxY = s.y;
    }

    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const newScale = Math.min(canvasWidth / contentW, canvasHeight / contentH, 2);
    scale.value = newScale;
    offsetX.value = (canvasWidth - contentW * newScale) / 2 - (minX - padding) * newScale;
    offsetY.value = (canvasHeight - contentH * newScale) / 2 - (minY - padding) * newScale;
  }

  function zoomIn() {
    scale.value = Math.min(5, scale.value * 1.2);
  }

  function zoomOut() {
    scale.value = Math.max(0.1, scale.value / 1.2);
  }

  return {
    offsetX,
    offsetY,
    scale,
    screenToWorld,
    worldToScreen,
    onWheel,
    onPanStart,
    onPanMove,
    onPanEnd,
    fitAll,
    zoomIn,
    zoomOut,
  };
}
