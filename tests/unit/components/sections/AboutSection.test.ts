import { describe, expect, it } from 'vitest';
import AboutSection from '../../../../src/components/sections/AboutSection.astro';
import { getMissionVision } from '../../../../src/lib/data';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderAbout(): Promise<string> {
  return renderAstro(AboutSection);
}

function statements(html: string): string[] {
  return [...html.matchAll(/<article [\s\S]*?<\/article>/g)].map(([statement]) => statement);
}

describe('AboutSection', () => {
  it('is the #nosotros section on white, with the section padding', async () => {
    const html = await renderAbout();

    expect(html).toMatch(
      /^<section id="nosotros" aria-labelledby="about-heading" class="[^"]*\bbg-surface-container-lowest pt-space-xl pb-margin lg:gap-16 lg:pt-24 lg:pb-16"/,
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

  it('renders mission and vision as two articles with h3 titles, data-file texts and highlight chips', async () => {
    const { mission, vision } = getMissionVision();
    const [missionHalf = '', visionHalf = ''] = statements(await renderAbout());

    expect(missionHalf).toMatch(/<h3[^>]*>\s*Nuestra Misión\s*<\/h3>/);
    expect(missionHalf).toContain(mission);
    expect(missionHalf).toMatch(
      /<span class="[^"]*\brounded-full\b[^"]*\bbg-on-primary\/12\b[^"]*">[\s\S]*Meta 2028: 10 empleos y 8% del mercado regional/,
    );
    expect(visionHalf).toMatch(/<h3[^>]*>\s*Nuestra Visión\s*<\/h3>/);
    expect(visionHalf).toContain(vision);
    expect(visionHalf).toContain('Calidad total a precios competitivos');
  });

  it('places both halves on one full-width blue band, with white text and no title icons', async () => {
    const html = await renderAbout();

    // The band is a direct child of the section (outside any page container); only its content
    // is constrained to the container width.
    expect(html).toMatch(
      /<\/div>\s*<div class="focus-ring-inverse relative isolate w-full overflow-hidden bg-linear-to-br from-primary to-on-primary-fixed-variant [^"]*\btext-on-primary\b[^"]*">\s*<div aria-hidden="true"[\s\S]*?<\/div>\s*<div class="mx-auto w-full max-w-page /,
    );
    expect(html).not.toContain('rounded-3xl');
    for (const half of statements(html)) {
      expect(half).toContain('text-on-primary/90');
      // Only the chip icon remains (no icon tile, no watermark), hidden from assistive tech.
      expect(half.match(/<svg /g)).toHaveLength(1);
      expect(half).toMatch(/<svg [^>]*aria-hidden="true"/);
    }
  });

  it('shows the futuristic logo behind the band, decorative, lazy and under a translucent blue veil', async () => {
    const html = await renderAbout();
    const layers =
      /<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">([\s\S]*?)<div class="mx-auto/.exec(
        html,
      )?.[1] ?? '';

    expect(layers).toMatch(/<img [^>]*src="[^"]*logo_futuristic[^"]*"/);
    expect(layers).toMatch(/<img [^>]*\balt(="")?[\s>]/);
    expect(layers).toMatch(/<img [^>]*loading="lazy"/);
    expect(layers).toMatch(/<img [^>]*class="[^"]*\bobject-cover\b/);
    // The veil comes after the image so it paints on top of it.
    expect(layers).toMatch(
      /<img [\s\S]*<div class="absolute inset-0 bg-linear-to-br from-primary\/92 to-on-primary-fixed-variant\/95"><\/div>/,
    );
  });

  it('stacks the halves below lg and splits them with a divider that turns vertical from lg', async () => {
    const html = await renderAbout();

    expect(html).toMatch(
      /<div class="[^"]*\bmax-w-page\b[^"]*grid-cols-1 gap-8 lg:grid-cols-\[1fr_auto_1fr\]/,
    );
    const divider = /<div aria-hidden="true" class="([^"]*)"><\/div>\s*<article/.exec(html)?.[1];
    expect(divider).toContain('h-px');
    expect(divider).toContain('lg:w-px');
    expect(divider).toContain('via-on-primary/30');
    expect(html.indexOf('Nuestra Misión')).toBeLessThan(html.indexOf('Nuestra Visión'));
  });

  it('keeps the decorative layers out of the accessibility tree', async () => {
    expect(await renderAbout()).toMatch(
      /<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">/,
    );
  });

  it('closes with the integrated policy: a highlighted h3 and a lead with the company name in blue', async () => {
    const html = await renderAbout();
    // Whitespace is normalized because the source paragraph is wrapped by Prettier.
    const policy = html.slice(html.lastIndexOf('</article>')).replace(/\s+/g, ' ');

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
