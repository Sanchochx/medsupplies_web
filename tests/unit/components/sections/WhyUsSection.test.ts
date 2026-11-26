import { describe, expect, it } from 'vitest';
import WhyUsSection from '../../../../src/components/sections/WhyUsSection.astro';
import { getWhyUsPillars } from '../../../../src/lib/data';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderWhyUs(): Promise<string> {
  return renderAstro(WhyUsSection);
}

function cards(html: string): string[] {
  return [...html.matchAll(/<li [\s\S]*?<\/li>/g)].map(([card]) => card);
}

describe('WhyUsSection', () => {
  it('is the #por-que-elegirnos section on the primary background, labelled by its heading', async () => {
    expect(await renderWhyUs()).toMatch(
      /^<section id="por-que-elegirnos" aria-labelledby="why-us-heading" class="[^"]*\bbg-primary py-space-xl lg:py-24"/,
    );
  });

  it('renders a centered section header', async () => {
    const html = await renderWhyUs();

    expect(html).toMatch(/<div class="[^"]*\bmx-auto items-center text-center\b/);
    expect(html).not.toContain('Diferenciadores Clave');
    expect(html).toMatch(
      /<h2 id="why-us-heading"[^>]*>\s*¿Por qué elegir a Medsupplies Ingeniería\?\s*<\/h2>/,
    );
    expect(html).toContain(
      'Respaldo operativo, solvencia técnica y estricto apego a los lineamientos de salud pública de Colombia.',
    );
  });

  it('renders the 4 pillar titles, in order', async () => {
    const titles = cards(await renderWhyUs()).map(
      (card) => /<h3[^>]*>([^<]+)<\/h3>/.exec(card)?.[1],
    );

    expect(titles).toEqual([
      'Calidad Rigurosa',
      'Cumplimiento Normativo',
      'Eficiencia Logística',
      'Soporte Técnico Continuo',
    ]);
  });

  it('reads the pillar texts and icons from the site data file', async () => {
    const pillars = getWhyUsPillars();
    const rendered = cards(await renderWhyUs());

    expect(rendered).toHaveLength(pillars.length);
    rendered.forEach((card, index) => {
      expect(card).toContain(pillars[index]?.text);
      expect(card).toMatch(/<svg /);
    });
    expect(rendered[0]).toContain('ISO 13485, CE y FDA');
    expect(rendered[1]).toContain('INVIMA');
  });

  it('renders white rounded cards that lift 4px on hover, only when motion is allowed', async () => {
    for (const card of cards(await renderWhyUs())) {
      expect(card).toMatch(
        /^<li class="[^"]*\brounded-2xl bg-surface-container-lowest [^"]*\bshadow-sm transition-transform duration-200 motion-safe:hover:-translate-y-1"/,
      );
    }
  });

  it('lays the cards out in 1 column, 2 from md and 4 from lg', async () => {
    expect(await renderWhyUs()).toMatch(
      /<ul class="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">/,
    );
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderWhyUs());
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
