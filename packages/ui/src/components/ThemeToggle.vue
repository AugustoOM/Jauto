<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next';
import { useThemeStore } from '../stores/theme';

const themeStore = useThemeStore();
</script>

<template>
  <button
    class="theme-toggle"
    :title="themeStore.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
    @click="themeStore.toggle()"
  >
    <Transition name="theme-toggle__fade" mode="out-in">
      <Sun v-if="themeStore.theme === 'light'" :size="16" key="sun" />
      <Moon v-else :size="16" key="moon" />
    </Transition>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  border-color: var(--color-text-muted);
}

.theme-toggle__fade-enter-active,
.theme-toggle__fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.theme-toggle__fade-enter-from {
  opacity: 0;
  transform: rotate(-30deg) scale(0.8);
}

.theme-toggle__fade-leave-to {
  opacity: 0;
  transform: rotate(30deg) scale(0.8);
}
</style>
