import { onMounted, onUnmounted } from 'vue';
import { useHistoryStore } from '@jauto/ui';

export function useKeyboardShortcuts() {
  const historyStore = useHistoryStore();

  function handler(e: KeyboardEvent) {
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      historyStore.undo();
    }

    if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      historyStore.redo();
    }
  }

  onMounted(() => window.addEventListener('keydown', handler));
  onUnmounted(() => window.removeEventListener('keydown', handler));
}
