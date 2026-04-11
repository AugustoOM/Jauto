<script setup lang="ts">
import { EditorView } from '@jauto/ui';
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="app-header__brand">Jauto</div>
      <nav class="app-header__nav">
        <span class="app-header__nav-item">File</span>
        <span class="app-header__nav-item">Edit</span>
        <span class="app-header__nav-item">View</span>
        <span class="app-header__nav-item">Simulate</span>
        <span class="app-header__nav-item">Help</span>
      </nav>
    </header>
    <main class="app-main">
      <EditorView />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 16px;
  height: 40px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.app-header__brand {
  font-weight: 700;
  font-size: 15px;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

.app-header__nav {
  display: flex;
  gap: 4px;
}

.app-header__nav-item {
  padding: 4px 10px;
  font-size: 13px;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  user-select: none;
}

.app-header__nav-item:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.app-main {
  flex: 1;
  overflow: hidden;
}
</style>
