import { describe, expect, it } from 'vitest';
import BaseLayout from '../../../src/layouts/BaseLayout.astro';
import HomePage from '../../../src/pages/index.astro';
import { renderAstro } from '../helpers/renderAstro';

const FOCUSABLE = /<(a|button|input|select|textarea)\b[^>]*>/g;

async function renderLayout(): Promise<string> {
  return renderAstro(BaseLayout, {
    props: { title: 'Test title' },
    slots: {
      header: '<header><a href="/#home">Logo</a></header>',
      default: '<p>Page content</p>',
      footer: '<footer>Footer</footer>',
    },
  });
}

describe('BaseLayout', () => {
  it('renders an English document with the given title', async () => {
    const html = await renderLayout();

    expect(html).toContain('<html lang="en" class="data-scroll-locked:overflow-hidden">');
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('<title>Test title</title>');
  });

  it('renders the skip link as the first focusable element, pointing to the main content', async () => {
    const html = await renderLayout();
    const body = html.slice(html.indexOf('<body'));
    const [firstFocusable] = body.match(FOCUSABLE) ?? [];

    expect(firstFocusable).toContain('href="#main-content"');
    expect(body).toMatch(/<a href="#main-content"[^>]*>\s*Skip to content\s*<\/a>/);
  });

  it('renders the header slot, a focusable main region offset by the header, and the footer slot in order', async () => {
    const html = await renderLayout();
    const header = html.indexOf('<header>');
    const main = html.search(/<main id="main-content" tabindex="-1" class="pt-header[^"]*">/);
    const content = html.indexOf('<p>Page content</p>');
    const footer = html.indexOf('<footer>');

    expect(header).toBeGreaterThan(-1);
    expect(main).toBeGreaterThan(header);
    expect(content).toBeGreaterThan(main);
    expect(footer).toBeGreaterThan(content);
  });
});

describe('home page', () => {
  it('hosts the six sections in page order inside the main region', async () => {
    const html = await renderAstro(HomePage);
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const ids = [...main.matchAll(/<section id="([^"]+)"/g)].map(([, id]) => id);

    expect(ids).toEqual(['home', 'about', 'products', 'engineering', 'why-us', 'contact']);
  });
});
