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
  it('is the #about section on surface-container-low, with the section padding', async () => {
    const html = await renderAbout();

    expect(html).toMatch(
      /^<section id="about" aria-labelledby="about-heading" class="[^"]*\bbg-surface-container-low py-space-xl lg:py-24"/,
    );
  });

  it('renders the section header with its eyebrow, h2 and lead', async () => {
    const html = await renderAbout();

    expect(html).toContain('About Medsupplies Ingeniería');
    expect(html).toMatch(
      /<h2 id="about-heading"[^>]*>\s*Committed to health and rigor in biomedical engineering\s*<\/h2>/,
    );
    expect(html).toContain('A Colombian company dedicated to raising the standards');
  });

  it('renders the mission and vision cards with h3 titles, data-file texts and footers', async () => {
    const { mission, vision } = getMissionVision();
    const [missionCard = '', visionCard = ''] = cards(await renderAbout());

    expect(missionCard).toMatch(/<h3[^>]*>Our Mission<\/h3>/);
    expect(missionCard).toContain(mission);
    expect(missionCard).toContain('Clinical biosafety standards');
    expect(visionCard).toMatch(/<h3[^>]*>Our Vision<\/h3>/);
    expect(visionCard).toContain(vision);
    expect(visionCard).toContain('Leadership in hospital technology management');
  });

  it('renders white rounded cards that lift on hover, with the footer pinned to the bottom', async () => {
    for (const card of cards(await renderAbout())) {
      expect(card).toMatch(
        /^<li class="flex flex-col justify-between rounded-2xl bg-surface-container-lowest [^"]*shadow-sm [^"]*hover:shadow-md"/,
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
