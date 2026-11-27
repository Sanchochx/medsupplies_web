import { describe, expect, it } from 'vitest';
import BaseLayout from '../../../src/layouts/BaseLayout.astro';
import HomePage from '../../../src/pages/index.astro';
import { renderAstro } from '../helpers/renderAstro';

const FOCUSABLE = /<(a|button|input|select|textarea)\b[^>]*>/g;

async function renderLayout(): Promise<string> {
  return renderAstro(BaseLayout, {
    props: { title: 'Test title' },
    slots: {
      header: '<header><a href="/#inicio">Logo</a></header>',
      default: '<p>Page content</p>',
      footer: '<footer>Footer</footer>',
    },
  });
}

describe('BaseLayout', () => {
  it('renders a Spanish document with the given title', async () => {
    const html = await renderLayout();

    expect(html).toContain('<html lang="es" class="data-scroll-locked:overflow-hidden">');
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('<title>Test title</title>');
  });

  it('links the round logo as favicon and Apple touch icon', async () => {
    const html = await renderLayout();

    expect(html).toMatch(
      /<link rel="icon" type="image\/png" sizes="32x32" href="[^"]*logo_redondo[^"]*"/,
    );
    expect(html).toMatch(
      /<link rel="apple-touch-icon" sizes="180x180" href="[^"]*logo_redondo[^"]*"/,
    );
  });

  it('keeps the favicon transparent and flattens only the Apple touch icon onto white', async () => {
    const html = await renderLayout();
    const href = (rel: string): string =>
      decodeURIComponent(
        new RegExp(`<link rel="${rel}"[^>]*href="([^"]*)"`).exec(html)?.[1] ?? '',
      ).replace(/&amp;/g, '&');

    // A `background` makes Astro flatten the PNG, and a transparent flatten turns it black.
    expect(href('icon')).not.toMatch(/[?&]background=/);
    expect(href('apple-touch-icon')).toMatch(/[?&]background=white\b/);
  });

  it('renders the skip link as the first focusable element, pointing to the main content', async () => {
    const html = await renderLayout();
    const body = html.slice(html.indexOf('<body'));
    const [firstFocusable] = body.match(FOCUSABLE) ?? [];

    expect(firstFocusable).toContain('href="#main-content"');
    expect(body).toMatch(/<a href="#main-content"[^>]*>\s*Saltar al contenido\s*<\/a>/);
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

  it('renders the WhatsApp floating button after the footer, on every page', async () => {
    const html = await renderLayout();

    expect(html.indexOf('aria-label="Escríbanos por WhatsApp')).toBeGreaterThan(
      html.indexOf('<footer>'),
    );
  });
});

describe('home page', () => {
  it('hosts the seven sections in page order inside the main region', async () => {
    const html = await renderAstro(HomePage);
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const ids = [...main.matchAll(/<section id="([^"]+)"/g)].map(([, id]) => id);

    expect(ids).toEqual([
      'inicio',
      'nosotros',
      'organizacion',
      'productos',
      'ingenieria',
      'por-que-elegirnos',
      'contacto',
    ]);
  });
});
