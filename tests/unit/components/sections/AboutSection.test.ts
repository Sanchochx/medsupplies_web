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
      /<h2 id="about-heading"[^>]*>\s*Comprometidos con la salud y el rigor en la ingeniería biomédica\s*<\/h2>/,
    );
    expect(html).toContain('Empresa colombiana dedicada a elevar los estándares');
  });

  it('renders the mission and vision cards with h3 titles, data-file texts and footers', async () => {
    const { mission, vision } = getMissionVision();
    const [missionCard = '', visionCard = ''] = cards(await renderAbout());

    expect(missionCard).toMatch(/<h3[^>]*>Nuestra Misión<\/h3>/);
    expect(missionCard).toContain(mission);
    expect(missionCard).toContain('Estándares de bioseguridad clínica');
    expect(visionCard).toMatch(/<h3[^>]*>Nuestra Visión<\/h3>/);
    expect(visionCard).toContain(vision);
    expect(visionCard).toContain('Liderazgo en gestión de tecnología hospitalaria');
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
