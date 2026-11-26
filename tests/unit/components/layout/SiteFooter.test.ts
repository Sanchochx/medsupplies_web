import { describe, expect, it } from 'vitest';
import SiteFooter from '../../../../src/components/layout/SiteFooter.astro';
import { getLegalLinks } from '../../../../src/lib/data';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderFooter(): Promise<string> {
  return renderAstro(SiteFooter);
}

function text(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('SiteFooter', () => {
  it('is a brand-blue footer landmark with white text and the inverse focus ring', async () => {
    expect(await renderFooter()).toMatch(
      /^<footer class="focus-ring-inverse bg-primary text-body-sm text-on-primary">/,
    );
  });

  it('shows only the copyright with the current year and the legal links', async () => {
    const html = await renderFooter();
    const year = new Date().getFullYear();
    const links = [...html.matchAll(/<a href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/g)].map(
      ([, href, label]) => [label, href],
    );

    expect(text(html)).toBe(
      `© ${year} Medsupplies Ingeniería S.A.S. Todos los derechos reservados. Colombia. ` +
        'Política de Tratamiento de Datos Personales Cumplimiento Normativo INVIMA',
    );
    expect(links).toEqual(getLegalLinks().map(({ label, href }) => [label, href]));
    expect(links).toContainEqual([
      'Política de Tratamiento de Datos Personales',
      '/politica-de-privacidad',
    ]);
    expect(html).not.toMatch(/<(?:h2|nav|img|svg)\b/);
  });

  it('stacks below md and spreads copyright and links on one row from md', async () => {
    expect(await renderFooter()).toMatch(
      /<div class="flex flex-col gap-space-sm py-space-lg md:flex-row md:items-center md:justify-between">/,
    );
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderFooter());
    const css = await compileTailwind(classes);

    const missing = classes.filter((className) => {
      // CSS-escape the class as Tailwind emits it, then regex-escape that selector text.
      const selector = `.${className.replace(/[:/.[\]()=,%]/g, (char) => `\\${char}`)}`;
      const pattern = selector.replace(/[\\^$.*+?()[\]{}|]/g, (char) => `\\${char}`);
      return !new RegExp(`${pattern}[\\s:{,[]`).test(css);
    });
    expect(missing).toEqual([]);
  });
});
