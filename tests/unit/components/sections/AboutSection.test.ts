import { describe, expect, it } from 'vitest';
import AboutSection from '../../../../src/components/sections/AboutSection.astro';
import { getMissionVision } from '../../../../src/lib/data';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderAbout(): Promise<string> {
  return renderAstro(AboutSection);
}

function cards(html: string): string[] {
  return [...html.matchAll(/<li [\s\S]*?<\/li>/g)].map(([card]) => card);
}

describe('AboutSection', () => {
  it('is the #nosotros section on white, with the section padding', async () => {
    const html = await renderAbout();

    expect(html).toMatch(
      /^<section id="nosotros" aria-labelledby="about-heading" class="[^"]*\bbg-surface-container-lowest py-space-xl lg:py-24"/,
    );
  });

  it('renders the section header with its h2 and lead, without an eyebrow', async () => {
    const html = await renderAbout();

    expect(html).not.toContain('Sobre Medsupplies Ingeniería');
    expect(html).toMatch(
      /<h2 id="about-heading"[^>]*>\s*<span[^>]*\bbg-primary\b[^>]*>\s*INGENIERÍA Y SUMINISTROS QUE FACILITAN SU VIDA\s*<\/span>\s*<\/h2>/,
    );
    expect(html).toContain('En 2015 nace FESIQ Ingeniería');
    expect(html).toMatch(/<div class="flex flex-col mx-auto items-center text-center"/);
    expect(html).toMatch(/<h2 id="about-heading" class="[^"]*\blg:whitespace-nowrap\b/);
  });

  it('renders the mission and vision cards with h3 titles, data-file texts and footers', async () => {
    const { mission, vision } = getMissionVision();
    const [missionCard = '', visionCard = ''] = cards(await renderAbout());

    expect(missionCard).toMatch(/<h3[^>]*>Nuestra Misión<\/h3>/);
    expect(missionCard).toContain(mission);
    expect(missionCard).toContain('Meta 2028: 10 empleos y 8% del mercado regional');
    expect(visionCard).toMatch(/<h3[^>]*>Nuestra Visión<\/h3>/);
    expect(visionCard).toContain(vision);
    expect(visionCard).toContain('Calidad total a precios competitivos');
  });

  it('renders tinted rounded cards that lift on hover, with the footer pinned to the bottom', async () => {
    for (const card of cards(await renderAbout())) {
      expect(card).toMatch(
        /^<li class="flex flex-col justify-between rounded-2xl bg-surface-container-low [^"]*shadow-sm [^"]*hover:shadow-md"/,
      );
      expect(card.match(/<svg /g)).toHaveLength(2);
    }
  });

  it('lays the cards out in 1 column below md and 2 from md', async () => {
    expect(await renderAbout()).toMatch(/<ul class="grid grid-cols-1 gap-gutter md:grid-cols-2">/);
  });

  it('closes with the integrated policy: a highlighted h3 and a lead with the company name in blue', async () => {
    const html = await renderAbout();
    // Whitespace is normalized because the source paragraph is wrapped by Prettier.
    const policy = html.slice(html.lastIndexOf('</ul>')).replace(/\s+/g, ' ');

    expect(policy).toMatch(
      /<h3 id="integrated-policy-heading"[^>]*>\s*<span[^>]*\bbg-primary\b[^>]*>\s*POLÍTICA INTEGRADA\s*<\/span>\s*<\/h3>/,
    );
    expect(policy).toMatch(/<div class="flex flex-col mx-auto items-center text-center"/);
    expect(policy).toContain(
      'Para <span class="font-semibold text-primary">Medsupplies &amp; Ingeniería S.A.S.</span>, la',
    );
    expect(policy).toContain('satisfacción de los clientes, colaboradores y proveedores.');
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderAbout());
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
