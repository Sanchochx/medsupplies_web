import { Window } from 'happy-dom';
import { describe, expect, it, vi } from 'vitest';
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

  it('flags JavaScript on the root element before the page paints', async () => {
    const html = await renderLayout();
    const head = /<head>[\s\S]*?<\/head>/.exec(html)?.[0] ?? '';

    expect(head).toMatch(
      /<script>\s*document\.documentElement\.classList\.add\('js'\);?\s*<\/script>/,
    );
    expect(head.indexOf("classList.add('js')")).toBeLessThan(head.indexOf('<link'));
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

  it('lets main fill a body at least one screen tall, so the footer sits at the bottom of short pages', async () => {
    const html = await renderLayout();

    expect(html).toMatch(/<body class="flex min-h-svh flex-col">/);
    expect(html).toMatch(/<main id="main-content" tabindex="-1" class="pt-header flex-1[^"]*">/);
  });

  it('renders the WhatsApp floating button after the footer, on every page', async () => {
    const html = await renderLayout();

    expect(html.indexOf('aria-label="Escríbanos por WhatsApp')).toBeGreaterThan(
      html.indexOf('<footer>'),
    );
  });
});

describe('home page', () => {
  it('hosts the five sections in page order inside the main region', async () => {
    const html = await renderAstro(HomePage);
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const ids = [...main.matchAll(/<section id="([^"]+)"/g)].map(([, id]) => id);

    expect(ids).toEqual(['inicio', 'nosotros', 'productos', 'aliados', 'contacto']);
  });
});

describe('reload to top', () => {
  async function reloadScript(): Promise<string> {
    const head = /<head>[\s\S]*?<\/head>/.exec(await renderLayout())?.[0] ?? '';
    return (
      [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)]
        .map(([, body]) => body ?? '')
        .find((body) => body.includes('scrollRestoration')) ?? ''
    );
  }

  /** Runs the head script in a page opened at `url` by a navigation of `type`. */
  async function run(type: NavigationTimingType, url = 'http://localhost/#productos') {
    const win = new Window({ url });
    const dom = win as unknown as globalThis.Window;
    vi.spyOn(dom.performance, 'getEntriesByType').mockReturnValue([
      { type } as unknown as PerformanceEntry,
    ]);
    const scrollTo = vi.spyOn(dom, 'scrollTo').mockImplementation(() => undefined);
    const script = await reloadScript();
    win.eval(script);
    const result = {
      hash: win.location.hash,
      href: win.location.href,
      restoration: win.history.scrollRestoration,
      scrolledToTop: scrollTo.mock.calls.some((args: unknown[]) => {
        const options = args[0] as ScrollToOptions | undefined;
        return options?.top === 0 && options.behavior === 'instant';
      }),
      // The browser's jump to the anchor (a scroll event) is undone too.
      undoesAnchorJump: (() => {
        scrollTo.mockClear();
        win.dispatchEvent(new win.Event('scroll'));
        return scrollTo.mock.calls.length === 1;
      })(),
      // Once loaded, a scroll is the visitor's own and is left alone.
      scrollAfterLoadKept: (() => {
        win.eval(script);
        win.dispatchEvent(new win.Event('load'));
        scrollTo.mockClear();
        win.dispatchEvent(new win.Event('scroll'));
        return scrollTo.mock.calls.length === 0;
      })(),
    };
    vi.restoreAllMocks();
    await win.happyDOM.close();
    return result;
  }

  it('runs in the head, before the body (and the jump to the #anchor)', async () => {
    const html = await renderLayout();

    expect(html.indexOf('scrollRestoration')).toBeGreaterThan(-1);
    expect(html.indexOf('scrollRestoration')).toBeLessThan(html.indexOf('</head>'));
  });

  it('on reload drops the anchor, stops scroll restoration and starts at the top', async () => {
    const result = await run('reload');

    expect(result.hash).toBe('');
    expect(result.href).toBe('http://localhost/');
    expect(result.restoration).toBe('manual');
    expect(result.scrolledToTop).toBe(true);
    expect(result.undoesAnchorJump).toBe(true);
    expect(result.scrollAfterLoadKept).toBe(true);
  });

  it('keeps the query string of the reloaded page', async () => {
    expect((await run('reload', 'http://localhost/politica-de-privacidad?a=1#x')).href).toBe(
      'http://localhost/politica-de-privacidad?a=1',
    );
  });

  it.each(['navigate', 'back_forward'] as const)(
    'leaves a %s navigation alone: links to a section still land on it',
    async (type) => {
      const result = await run(type);

      expect(result.hash).toBe('#productos');
      expect(result.restoration).toBe('auto');
      expect(result.scrolledToTop).toBe(false);
      expect(result.undoesAnchorJump).toBe(false);
    },
  );
});
