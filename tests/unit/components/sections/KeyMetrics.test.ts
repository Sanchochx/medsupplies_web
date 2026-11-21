import { describe, expect, it } from 'vitest';
import AboutSection from '../../../../src/components/sections/AboutSection.astro';
import KeyMetrics from '../../../../src/components/sections/KeyMetrics.astro';
import { getMetrics } from '../../../../src/lib/data';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderMetrics(): Promise<string> {
  return renderAstro(KeyMetrics);
}

function pairs(html: string): string[][] {
  return [...html.matchAll(/<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>\s*([^<]+?)\s*<\/dd>/g)].map(
    ([, label, value]) => [value ?? '', label ?? ''],
  );
}

describe('KeyMetrics', () => {
  it('renders the four metrics from the data source, in order', async () => {
    const metrics = getMetrics();

    expect(metrics).toHaveLength(4);
    expect(pairs(await renderMetrics())).toEqual(metrics.map(({ value, label }) => [value, label]));
  });

  it('shows the expected placeholder labels', async () => {
    expect(pairs(await renderMetrics()).map(([, label]) => label)).toEqual([
      'years of experience in the healthcare sector',
      'medical device and supply references',
      'cold chain and delivery effectiveness',
      'technical support and engineering backup',
    ]);
  });

  it('pairs each value with its label in a description list, value shown first', async () => {
    const html = await renderMetrics();
    const groups = [...html.matchAll(/<div class="([^"]*)">\s*<dt/g)].map(([, classes]) => classes);

    expect(html).toMatch(/^<dl /);
    expect(groups).toHaveLength(4);
    for (const classes of groups) {
      expect(classes).toMatch(
        /\bflex-col-reverse justify-end rounded-xl bg-surface-container-lowest\b.*\bshadow-sm\b/,
      );
    }
  });

  it('styles the value as a bold primary headline and the label as muted body text', async () => {
    const html = await renderMetrics();

    expect(html).toMatch(/<dd class="[^"]*\bfont-bold text-primary sm:text-headline-xl"/);
    expect(html).toMatch(/<dt class="[^"]*\btext-body-sm text-on-surface-variant"/);
  });

  it('uses 2 columns below lg and 4 from lg', async () => {
    expect(await renderMetrics()).toMatch(/^<dl class="grid grid-cols-2 [^"]*lg:grid-cols-4"/);
  });

  it('is rendered at the end of the About section', async () => {
    const html = await renderAstro(AboutSection);

    expect(html.indexOf('<dl')).toBeGreaterThan(html.indexOf('Our Vision'));
    expect(html.indexOf('</dl>')).toBeLessThan(html.indexOf('</section>'));
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderMetrics());
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
