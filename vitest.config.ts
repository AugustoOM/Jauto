import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/core', 'packages/jff', 'packages/simulator', 'packages/file-io', 'packages/ui/vitest.config.ts'],
  },
});
