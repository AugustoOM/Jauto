import { describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createEmptyAutomaton } from '@jauto/core';
import EditorView from '../src/components/EditorView.vue';
import { useDocumentStore } from '../src/stores/document';

describe('import notices', () => {
  it('shows diagnostics to the user and clears them for a new document', () => {
    setActivePinia(createPinia());
    const doc = useDocumentStore();
    doc.loadAutomaton(createEmptyAutomaton('fa'), 'draft.jff', [{ message: 'No initial state found' }]);
    const wrapper = mount(EditorView, { global: { stubs: { Toolbar: true, AutomatonCanvas: true, InspectorPanel: true, SimulationControls: true } } });
    expect(wrapper.get('[role="status"]').text()).toContain('No initial state found');
    doc.newDocument('pda');
    expect(doc.importWarnings).toEqual([]);
    wrapper.unmount();
  });
});
