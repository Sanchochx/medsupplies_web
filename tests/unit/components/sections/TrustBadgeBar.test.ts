import { describe, expect, it } from 'vitest';
import HeroSection from '../../../../src/components/sections/HeroSection.astro';
import TrustBadgeBar from '../../../../src/components/sections/TrustBadgeBar.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderBar(): Promise<string> {
  return renderAstro(TrustBadgeBar);
}

function items(html: string): string[] {
  return [...html.matchAll(/<li [\s\S]*?<\/li>/g)].map(([item]) => item);
}

describe('TrustBadgeBar', () => {
  it('renders the four badges as a list, in design order, with their icons', async () => {
    const html = await renderBar();
    const badges = items(html).map((item) => [
      /<h2[^>]*>([^<]+)<\/h2>/.exec(item)?.[1],
      /<p[^>]*>([^<]+)<\/p>/.exec(item)?.[1],
    ]);

    expect(html).toMatch(/^<ul /);
    expect(badges).toEqual([
      ['Quality Certifications', 'INVIMA and ISO compliance'],
      ['Cold Chain', 'Temperature control from 2 °C to 8 °C'],
      ['Biomedical Advisory', 'Dedicated clinical specialists'],
      ['Nationwide Coverage', 'Shipping across Colombia'],
    ]);
  });

  it('renders each badge as a white card with a 40px icon tile', async () => {
    for (const item of items(await renderBar())) {
      expect(item).toMatch(
        /class="[^"]*\brounded-xl bg-surface-container-lowest\b[^"]*\bshadow-sm\b/,
      );
      expect(item).toMatch(/<span class="[^"]*\bsize-10\b[^"]*">\s*<svg /);
    }
  });

  it('uses h2 titles, the level right below the hero h1', async () => {
    const html = await renderAstro(HeroSection);
    const levels = [...html.matchAll(/<h([1-6])/g)].map(([, level]) => Number(level));

    expect(levels).toEqual([1, 2, 2, 2, 2]);
  });

  it('uses 2 columns below md and 4 from md, stacking the icon whenever cards are narrow', async () => {
    const html = await renderBar();

    expect(html).toMatch(/^<ul class="[^"]*\bgrid grid-cols-2\b[^"]*\bmd:grid-cols-4\b/);
    for (const item of items(html)) {
      expect(item).toMatch(
        /class="[^"]*\bmin-w-0 flex-col\b[^"]*\bsm:flex-row\b[^"]*\bmd:flex-col\b[^"]*\blg:flex-row\b/,
      );
    }
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderBar());
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
