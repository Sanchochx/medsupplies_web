import { describe, expect, it } from 'vitest';
import SiteHeader from '../../../../src/components/layout/SiteHeader.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderHeader(): Promise<string> {
  return renderAstro(SiteHeader);
}

function navMarkup(html: string): string {
  return html.slice(html.indexOf('<nav'), html.indexOf('</nav>'));
}

describe('SiteHeader', () => {
  it('is a fixed, full-width header above the content', async () => {
    const html = await renderHeader();

    expect(html).toMatch(/<header data-site-header class="fixed inset-x-0 top-0 z-50 [^"]*"/);
    expect(html).toContain('h-header');
  });

  it('links the logo placeholder and wordmark to the home section', async () => {
    const html = await renderHeader();
    const brand = html.slice(html.indexOf('<a href="/#home"'), html.indexOf('</a>'));

    expect(brand).toMatch(/<img [^>]*alt="Medsupplies Ingeniería S\.A\.S\."[^>]*>/);
    expect(brand).toMatch(/<img [^>]*width="32"[^>]*height="32"/);
    expect(brand).toContain('Medsupplies');
    expect(brand).toContain('Ingeniería S.A.S.');
  });

  it('renders the main nav landmark with the six section links, visible from xl', async () => {
    const nav = navMarkup(await renderHeader());
    const links = [...nav.matchAll(/<a href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/g)].map(
      ([, href, label]) => [label, href],
    );

    expect(nav).toMatch(/^<nav aria-label="Main" class="hidden [^"]*xl:flex/);
    expect(links).toEqual([
      ['Home', '/#home'],
      ['About', '/#about'],
      ['Products', '/#products'],
      ['Engineering', '/#engineering'],
      ['Why Choose Us', '/#why-us'],
      ['Contact', '/#contact'],
    ]);
  });

  it('marks no link as current without JavaScript', async () => {
    expect(navMarkup(await renderHeader())).not.toContain('aria-current');
  });

  it('renders the quote CTA, hidden below sm, after the nav', async () => {
    const html = await renderHeader();
    const cta = html.search(/<div class="hidden sm:flex">\s*<a [^>]*href="\/#contact"/);

    expect(cta).toBeGreaterThan(html.indexOf('</nav>'));
    expect(html).toMatch(/<a [^>]*href="\/#contact"[^>]*>\s*Request a quote\s*<\/a>/);
  });

  it('does not render the design’s person icon (D-06)', async () => {
    const html = await renderHeader();

    expect(html).not.toMatch(/person/i);
    expect(html).not.toContain('rounded-full');
  });

  it('only uses utilities that exist in the design system, including the active-link style', async () => {
    const classes = extractClasses(await renderHeader());
    const css = await compileTailwind(classes);

    const missing = classes.filter((className) => {
      // CSS-escape the class as Tailwind emits it, then regex-escape that selector text.
      const selector = `.${className.replace(/[:/.[\]()=]/g, (char) => `\\${char}`)}`;
      const pattern = selector.replace(/[\\^$.*+?()[\]{}|]/g, (char) => `\\${char}`);
      return !new RegExp(`${pattern}[\\s:{,[]`).test(css);
    });
    expect(missing).toEqual([]);
    expect(css).toMatch(
      /\[aria-current=["']?true["']?\][^{]*\{\s*background-color: var\(--color-primary-container\)/,
    );
  });
});
