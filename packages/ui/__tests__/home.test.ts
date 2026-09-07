import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import HomePage from '../src/components/HomePage.vue';

describe('home document entry points', () => {
  it('dispatches the selected machine kind and open action', async () => {
    const wrapper = mount(HomePage, { global: { stubs: { ThemeToggle: true } } });
    const cards = wrapper.findAll('.home__card');
    for (const card of cards) await card.trigger('click');
    expect(wrapper.emitted('new')).toEqual([['fa'], ['pda'], ['turing']]);
    await wrapper.get('.home__open-btn').trigger('click');
    expect(wrapper.emitted('open')).toHaveLength(1);
    wrapper.unmount();
  });
});
