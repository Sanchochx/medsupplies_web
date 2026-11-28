import { describe, expect, it } from 'vitest';
import SiteFooter from '../../../../src/components/layout/SiteFooter.astro';
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

  it('shows only the copyright with the current year and the company logo', async () => {
    const html = await renderFooter();
    const year = new Date().getFullYear();

    expect(text(html)).toBe(
      `© ${year} Medsupplies Ingeniería S.A.S. Todos los derechos reservados. Colombia.`,
    );
    expect(html).toMatch(/<img[^>]*alt="Medsupplies Ingeniería S\.A\.S\."/);
    expect(html).toMatch(/<img[^>]*loading="lazy"/);
    expect(html).not.toMatch(/<(?:a|h2|nav|svg)\b/);
  });

  it('stacks below md and spreads copyright and logo on one row from md', async () => {
    expect(await renderFooter()).toMatch(
      /<div class="flex flex-col gap-space-xs py-space-md md:flex-row md:items-center md:justify-between">/,
    );
  });

  it('keeps the stacked logo at its own width instead of stretching it across the column', async () => {
    expect(await renderFooter()).toMatch(/<img [^>]*class="h-10 w-auto self-start md:self-auto"/);
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
