import { describe, expect, it } from 'vitest';
import SiteHeader from '../../../../src/components/layout/SiteHeader.astro';
import {
  SITE_CHROME_INTRO,
  introStepStyle,
  navLinkIntro,
} from '../../../../src/lib/motion/introTimeline';
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

  it('keeps an opaque white background so scrolled content never tints it', async () => {
    const header = (await renderHeader()).match(/<header [^>]*class="([^"]*)"/)?.[1] ?? '';

    expect(header.split(' ')).toContain('bg-surface-container-lowest');
    expect(header).not.toMatch(/bg-surface-container-lowest\/|backdrop-blur/);
  });

  it('links the brand logo to the home section', async () => {
    const html = await renderHeader();
    const brand = html.slice(html.indexOf('<a href="/#inicio"'), html.indexOf('</a>'));

    expect(brand).toMatch(/<img [^>]*alt="Medsupplies Ingeniería S\.A\.S\."[^>]*>/);
    expect(brand).toMatch(/<img [^>]*width="144"[^>]*height="48"/);
    expect(brand).toMatch(/<img [^>]*src="[^"]*logo[^"]*"/);
    expect(brand).toMatch(/<img [^>]*loading="eager"/);
  });

  it('renders the main nav landmark with the five section links, visible from xl', async () => {
    const nav = navMarkup(await renderHeader());
    const links = [...nav.matchAll(/<a href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/g)].map(
      ([, href, label]) => [label, href],
    );

    expect(nav).toMatch(/^<nav aria-label="Principal" class="hidden [^"]*xl:flex/);
    expect(links).toEqual([
      ['Inicio', '/#inicio'],
      ['Nosotros', '/#nosotros'],
      ['Productos', '/#productos'],
      ['Aliados', '/#aliados'],
      ['Contacto', '/#contacto'],
    ]);
  });

  it('plays its own intro on page load: the bar slides down, then logo and links drop in', async () => {
    const html = await renderHeader();
    const header = /<header [^>]*>/.exec(html)?.[0] ?? '';
    const brand = /<a href="\/#inicio"[^>]*>/.exec(html)?.[0] ?? '';
    const links = [...navMarkup(html).matchAll(/<a [^>]*>/g)].map(([tag]) => tag);
    const toggle = /<button [^>]*data-mobile-drawer-toggle[^>]*>/.exec(html)?.[0] ?? '';

    expect(header).toContain('data-intro-root data-intro-trigger="load" data-intro');
    expect(header).toContain(`style="${introStepStyle(SITE_CHROME_INTRO.bar)}"`);
    expect(brand).toContain(`style="${introStepStyle(SITE_CHROME_INTRO.logo)}"`);
    expect(links).toHaveLength(5);
    links.forEach((link, index) => {
      expect(link).toContain('data-intro');
      expect(link).toContain(`style="${introStepStyle(navLinkIntro(index))}"`);
    });
    expect(toggle).toContain(`style="${introStepStyle(SITE_CHROME_INTRO.link)}"`);
  });

  it('keeps the drawer links out of the intro (the drawer is closed on load)', async () => {
    const html = await renderHeader();
    const drawer = html.slice(html.indexOf('<dialog'), html.indexOf('</dialog>'));

    expect(drawer).not.toContain('data-intro');
  });

  it('marks no link as current without JavaScript', async () => {
    expect(navMarkup(await renderHeader())).not.toContain('aria-current');
  });

  it('does not render a quote CTA', async () => {
    expect(await renderHeader()).not.toContain('Solicitar cotización');
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
      const selector = `.${className.replace(/[:/.[\]()=,]/g, (char) => `\\${char}`)}`;
      const pattern = selector.replace(/[\\^$.*+?()[\]{}|]/g, (char) => `\\${char}`);
      return !new RegExp(`${pattern}[\\s:{,[]`).test(css);
    });
    expect(missing).toEqual([]);
    expect(css).toMatch(
      /\[aria-current=["']?true["']?\][^{]*\{\s*background-color: var\(--color-primary-container\)/,
    );
  });
});
