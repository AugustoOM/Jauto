import { describe, expect, it } from 'vitest';
import { isEditableKeyTarget, shouldHandleGraphKey } from '../src/keyboard';

describe('keyboard shortcut scope', () => {
  it.each(['input', 'textarea', 'select', '[contenteditable="true"]'])('protects editing in %s', (selector) => {
    document.body.innerHTML = selector.startsWith('[') ? `<div ${selector.slice(1, -1)}><span id="target"></span></div>` : `<${selector}><option></option></${selector}>`;
    const target = document.querySelector('#target') ?? document.querySelector(selector)!;
    expect(isEditableKeyTarget(target)).toBe(true);
    expect(shouldHandleGraphKey(new KeyboardEvent('keydown', { bubbles: true }))).toBe(true);
    let handled = true;
    target.addEventListener('keydown', (event) => { handled = shouldHandleGraphKey(event); });
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(handled).toBe(false);
  });

  it('allows graph keys from the canvas and refuses prevented events', () => {
    const canvas = document.createElement('canvas');
    let allowed = false;
    canvas.addEventListener('keydown', (event) => { allowed = shouldHandleGraphKey(event); });
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    expect(allowed).toBe(true);
    const prevented = new KeyboardEvent('keydown', { cancelable: true });
    prevented.preventDefault();
    expect(shouldHandleGraphKey(prevented)).toBe(false);
  });
});
