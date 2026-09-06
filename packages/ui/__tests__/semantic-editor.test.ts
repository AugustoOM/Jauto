import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SemanticDiagramPanel from '../src/components/SemanticDiagramPanel.vue';
import { useDocumentStore } from '../src/stores/document';

describe('accessible diagram editor', () => {
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
  });

  it('creates and selects states and transitions with native controls', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const document = useDocumentStore();
    document.newDocument('fa');
    const wrapper = mount(SemanticDiagramPanel, { global: { plugins: [pinia] } });

    const addState = wrapper.get('button');
    await addState.trigger('click');
    await addState.trigger('click');
    expect(document.automaton.states.map((state) => state.name)).toEqual(['q0', 'q1']);

    const selects = wrapper.findAll('select');
    await selects[0]!.setValue(document.automaton.states[0]!.id);
    await selects[1]!.setValue(document.automaton.states[1]!.id);
    await wrapper.get('form').trigger('submit');
    expect(document.automaton.transitions).toHaveLength(1);
    expect(document.selectedElement).toEqual({ type: 'transition', id: document.automaton.transitions[0]!.id });
    wrapper.unmount();
  });
});
