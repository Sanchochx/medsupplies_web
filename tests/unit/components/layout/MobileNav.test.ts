import { describe, expect, it } from 'vitest';
import MobileNav from '../../../../src/components/layout/MobileNav.astro';
import SiteHeader from '../../../../src/components/layout/SiteHeader.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderMobileNav(): Promise<string> {
  return renderAstro(MobileNav);
}

function drawerMarkup(html: string): string {
  return html.slice(html.indexOf('<dialog'), html.indexOf('</dialog>'));
}

describe('MobileNav', () => {
  it('renders a 44px menu button wired to the drawer, hidden from xl', async () => {
    const html = await renderMobileNav();
    const button = /<button [^>]*data-mobile-drawer-toggle[^>]*>/.exec(html)?.[0] ?? '';

    expect(button).toContain('type="button"');
    expect(button).toContain('aria-label="Abrir menú"');
    expect(button).toContain('aria-expanded="false"');
    expect(button).toContain('aria-controls="mobile-nav-drawer"');
    expect(button).toMatch(/class="[^"]*\bsize-11\b[^"]*\bxl:hidden\b/);
    expect(html).toMatch(/<dialog id="mobile-nav-drawer"/);
  });

  it('uses the local menu icon, hidden from assistive technology', async () => {
    const html = await renderMobileNav();
    const button = html.slice(html.indexOf('<button'), html.indexOf('</button>'));

    expect(button).toMatch(/<svg [^>]*viewBox="0 -960 960 960"[^>]*aria-hidden="true"/);
  });

  it('renders the drawer as a dialog labelled by its visible title', async () => {
    const drawer = drawerMarkup(await renderMobileNav());

    expect(drawer).toContain('aria-labelledby="mobile-nav-drawer-title"');
    expect(drawer).toMatch(/<p id="mobile-nav-drawer-title"[^>]*>Menú<\/p>/);
  });

  it('contains the close button, the five section links and no quote CTA', async () => {
    const drawer = drawerMarkup(await renderMobileNav());
    const links = [...drawer.matchAll(/<a href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/g)].map(
      ([, href, label]) => [label, href],
    );

    expect(drawer).toMatch(/<button [^>]*data-mobile-drawer-close[^>]*aria-label="Cerrar menú"/);
    expect(drawer).toContain('<nav aria-label="Principal">');
    expect(links).toEqual([
      ['Inicio', '/#inicio'],
      ['Nosotros', '/#nosotros'],
      ['Productos', '/#productos'],
      ['Ingeniería', '/#ingenieria'],
      ['Contacto', '/#contacto'],
    ]);
    expect(drawer).not.toContain('Solicitar cotización');
  });

  it('tracks the section links with the scrollspy and marks none as current without JavaScript', async () => {
    const drawer = drawerMarkup(await renderMobileNav());

    expect(drawer.match(/data-section-link/g)).toHaveLength(5);
    expect(drawer).not.toContain('aria-current');
  });

  it('slides the panel with translate only and respects reduced motion', async () => {
    const drawer = drawerMarkup(await renderMobileNav());

    expect(drawer).toMatch(/\btranslate-x-full\b/);
    expect(drawer).toMatch(/\bopen:translate-x-0\b/);
    expect(drawer).toMatch(/\btransition-\[translate,overlay,display\]/);
    expect(drawer).toMatch(/\bduration-300\b/);
    expect(drawer).toMatch(/\bmotion-reduce:transition-none\b/);
    expect(drawer).toMatch(/\bbackdrop:bg-inverse-surface\/60\b/);
  });

  it('is rendered by the site header, after the nav', async () => {
    const html = await renderAstro(SiteHeader);

    expect(html.indexOf('data-mobile-drawer-toggle')).toBeGreaterThan(html.indexOf('</nav>'));
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderMobileNav());
    const css = await compileTailwind(classes);

    const missing = classes.filter((className) => {
      // CSS-escape the class as Tailwind emits it, then regex-escape that selector text.
      const selector = `.${className.replace(/[:/.[\]()=,]/g, (char) => `\\${char}`)}`;
      const pattern = selector.replace(/[\\^$.*+?()[\]{}|]/g, (char) => `\\${char}`);
      return !new RegExp(`${pattern}[\\s:{,[]`).test(css);
    });
    expect(missing).toEqual([]);
    expect(css).toMatch(/@starting-style/);
    expect(css).toMatch(/::backdrop\s*\{[^}]*background-color:[^}]*--color-inverse-surface/);
  });
});
