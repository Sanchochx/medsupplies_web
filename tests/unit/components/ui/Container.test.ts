import { describe, expect, it } from 'vitest';
import Container from '../../../../src/components/ui/Container.astro';
import { renderAstro } from '../../helpers/renderAstro';

describe('Container', () => {
  it('centers content with the max page width and responsive horizontal padding', async () => {
    const html = await renderAstro(Container, { slots: { default: 'Content' } });

    expect(html).toMatch(/^<div class="[^"]*\bmax-w-page\b/);
    expect(html).toContain('mx-auto');
    expect(html).toContain('px-margin-mobile');
    expect(html).toContain('lg:px-margin');
    expect(html).toContain('Content');
  });

  it('renders the requested element and merges extra classes and attributes', async () => {
    const html = await renderAstro(Container, {
      props: { as: 'section', class: 'py-space-xl', id: 'about' },
    });

    expect(html).toMatch(/^<section /);
    expect(html).toContain('py-space-xl');
    expect(html).toContain('id="about"');
  });
});
