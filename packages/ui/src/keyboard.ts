export function isEditableKeyTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
}

export function shouldHandleGraphKey(event: KeyboardEvent): boolean {
  return !event.defaultPrevented && !event.isComposing && !isEditableKeyTarget(event.target);
}
