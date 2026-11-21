import { beforeEach, describe, expect, it, vi } from 'vitest';
import EngineeringSection from '../../../../src/components/sections/EngineeringSection.astro';
import type { EngineeringService } from '../../../../src/lib/data';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

const { getEngineeringServices } = vi.hoisted(() => ({ getEngineeringServices: vi.fn() }));
vi.mock('../../../../src/lib/data', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/lib/data')>()),
  getEngineeringServices,
}));

const MOCK_SERVICES: EngineeringService[] = (
  [
    ['maintenance', 'build'],
    ['calibration', 'square-foot'],
    ['advisory', 'query-stats'],
    ['training', 'school'],
  ] as const
).map(([id, icon], index) => ({
  id,
  icon,
  title: `Mock service ${index + 1}`,
  description: `Mock description ${index + 1}`,
  highlight: `Mock highlight ${index + 1}`,
  order: index + 1,
}));

async function renderEngineering(): Promise<string> {
  return renderAstro(EngineeringSection);
}

function cards(html: string): string[] {
  return [...html.matchAll(/<article [\s\S]*?<\/article>/g)].map(([card]) => card);
}

beforeEach(() => {
  getEngineeringServices.mockReset().mockResolvedValue(MOCK_SERVICES);
});

describe('EngineeringSection', () => {
  it('is the #engineering section on the navy background, with the inverse focus ring', async () => {
    const html = await renderEngineering();

    expect(html).toMatch(
      /^<section id="engineering" aria-labelledby="engineering-heading" class="focus-ring-inverse [^"]*\bbg-inverse-surface\b[^"]*\btext-inverse-on-surface\b/,
    );
  });

  it('draws a decorative dot grid at 10% opacity, hidden from assistive tech', async () => {
    const html = await renderEngineering();

    expect(html).toMatch(
      /<div aria-hidden="true" class="pointer-events-none absolute inset-0 bg-\[radial-gradient\(var\(--color-primary-fixed-dim\)_1px,transparent_1px\)\] bg-size-\[24px_24px\] opacity-10">/,
    );
  });

  it('renders the dark-tone section header', async () => {
    const html = await renderEngineering();

    expect(html).toMatch(
      /<p class="[^"]*\btext-primary-fixed\b[^"]*">Specialized Technical Services/,
    );
    expect(html).toMatch(
      /<h2 id="engineering-heading" class="[^"]*\btext-surface-bright\b[^"]*">\s*Biomedical Engineering &amp; Clinical Support\s*<\/h2>/,
    );
    expect(html).toContain(
      'We ensure patient safety and maximum operational continuity of hospital infrastructure',
    );
  });

  it('renders the 4 service cards from the data layer, in order', async () => {
    const rendered = cards(await renderEngineering());

    expect(getEngineeringServices).toHaveBeenCalledOnce();
    expect(rendered).toHaveLength(4);
    rendered.forEach((card, index) => {
      const service = MOCK_SERVICES[index];
      expect(card).toMatch(new RegExp(`<h3[^>]*>${service?.title}</h3>`));
      expect(card).toContain(service?.description);
      expect(card).toMatch(new RegExp(`text-primary-fixed[^>]*>[\\s\\S]*?${service?.highlight}`));
    });
  });

  it('renders translucent blurred cards with a solid icon tile and a check icon', async () => {
    for (const card of cards(await renderEngineering())) {
      expect(card).toMatch(
        /^<article class="[^"]*\brounded-2xl bg-surface-container-lowest\/10 [^"]*\bbackdrop-blur-sm\b[^"]*\bhover:bg-surface-container-lowest\/15"/,
      );
      expect(card).toMatch(/class="[^"]*\bbg-primary-container text-on-primary\b/);
      expect(card.match(/<svg /g)).toHaveLength(2);
    }
  });

  it('lays the cards out in 1 column, 2 from md and 4 from lg', async () => {
    expect(await renderEngineering()).toMatch(
      /<ul class="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">/,
    );
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderEngineering());
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
