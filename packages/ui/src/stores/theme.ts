import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type Theme = 'light' | 'dark';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('light');

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }

  watch(
    theme,
    (value) => {
      document.documentElement.setAttribute('data-theme', value);
    },
    { immediate: true },
  );

  return { theme, toggle };
});
