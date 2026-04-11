<script setup lang="ts">
import type { Component } from 'vue';
import type { AutomatonKind } from '@jauto/core';
import { Workflow, Layers, Cpu, FolderOpen } from 'lucide-vue-next';
import ThemeToggle from './ThemeToggle.vue';

const emit = defineEmits<{
  (e: 'new', kind: AutomatonKind): void;
  (e: 'open'): void;
}>();

const automatonTypes: { kind: AutomatonKind; title: string; description: string; icon: Component }[] = [
  {
    kind: 'fa',
    title: 'Finite Automaton',
    description: 'DFA / NFA with epsilon transitions',
    icon: Workflow,
  },
  {
    kind: 'pda',
    title: 'Pushdown Automaton',
    description: 'PDA with stack operations',
    icon: Layers,
  },
  {
    kind: 'turing',
    title: 'Turing Machine',
    description: 'Single-tape Turing machine',
    icon: Cpu,
  },
];
</script>

<template>
  <div class="home">
    <div class="home__theme-toggle">
      <ThemeToggle />
    </div>
    <div class="home__container">
      <header class="home__header">
        <div class="home__logo">J</div>
        <h1 class="home__title">Jauto</h1>
        <p class="home__subtitle">
          A modern, open-source tool for formal languages and automata
        </p>
      </header>

      <section class="home__section">
        <h2 class="home__section-title">Create New</h2>
        <div class="home__cards">
          <button
            v-for="type in automatonTypes"
            :key="type.kind"
            class="home__card"
            @click="emit('new', type.kind)"
          >
            <span class="home__card-icon">
              <component :is="type.icon" :size="22" />
            </span>
            <span class="home__card-body">
              <span class="home__card-title">{{ type.title }}</span>
              <span class="home__card-desc">{{ type.description }}</span>
            </span>
          </button>
        </div>
      </section>

      <div class="home__divider">
        <span class="home__divider-text">or</span>
      </div>

      <section class="home__section">
        <button class="home__open-btn" @click="emit('open')">
          <span class="home__open-icon">
            <FolderOpen :size="24" />
          </span>
          <span class="home__open-body">
            <span class="home__open-title">Open File</span>
            <span class="home__open-desc">Load a .jff file from your computer</span>
          </span>
        </button>
      </section>

      <footer class="home__footer">
        <span>Compatible with JFLAP 7.1 .jff files</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--color-bg);
  overflow-y: auto;
  padding: 40px 20px;
}

.home__theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.home__container {
  max-width: 560px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.home__header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.home__logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--color-primary);
  color: white;
  font-size: 32px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(66, 99, 235, 0.25);
}

.home__title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  margin: 0;
}

.home__subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.home__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.home__section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.home__cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.home__card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.home__card:hover {
  border-color: var(--color-primary);
  background: var(--color-bg);
  box-shadow: 0 2px 8px rgba(66, 99, 235, 0.1);
}

.home__card:active {
  background: rgba(66, 99, 235, 0.05);
}

.home__card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
}

.home__card:hover .home__card-icon {
  background: rgba(66, 99, 235, 0.08);
  border-color: var(--color-primary);
}

.home__card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.home__card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.home__card-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.home__divider {
  display: flex;
  align-items: center;
  gap: 16px;
}

.home__divider::before,
.home__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.home__divider-text {
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.home__open-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
  width: 100%;
}

.home__open-btn:hover {
  border-color: var(--color-primary);
  border-style: solid;
  background: var(--color-bg-secondary);
}

.home__open-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.home__open-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.home__open-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.home__open-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.home__footer {
  text-align: center;
  font-size: 11px;
  color: var(--color-text-muted);
  padding-top: 8px;
}
</style>
