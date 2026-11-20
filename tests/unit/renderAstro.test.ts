import { describe, expect, it } from 'vitest';
import SampleGreeting from './fixtures/SampleGreeting.astro';
import { renderAstro } from './helpers/renderAstro';

describe('renderAstro', () => {
  it('renders an Astro component with its props', async () => {
    const html = await renderAstro(SampleGreeting, { props: { name: 'Medsupplies' } });

    expect(html).toContain('<p class="text-lg">Hello, Medsupplies</p>');
  });
});
