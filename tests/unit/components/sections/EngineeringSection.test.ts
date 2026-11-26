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
  it('is the #ingenieria section on white', async () => {
    const html = await renderEngineering();

    expect(html).toMatch(
      /^<section id="ingenieria" aria-labelledby="engineering-heading" class="w-full bg-surface-container-lowest py-space-xl lg:py-24"/,
    );
  });

  it('renders the light-tone section header', async () => {
    const html = await renderEngineering();

    expect(html).not.toContain('Servicios Técnicos Especializados');
    expect(html).toMatch(
      /<h2 id="engineering-heading" class="[^"]*\btext-on-surface\b[^"]*">\s*Ingeniería Biomédica y Soporte Clínico\s*<\/h2>/,
    );
    expect(html).toContain(
      'Garantizamos la seguridad del paciente y la máxima continuidad operativa de la infraestructura hospitalaria',
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
      expect(card).toMatch(new RegExp(`text-primary"[^>]*>[\\s\\S]*?${service?.highlight}`));
    });
  });

  it('renders tinted cards with a solid icon tile and a check icon', async () => {
    for (const card of cards(await renderEngineering())) {
      expect(card).toMatch(
        /^<article class="[^"]*\brounded-2xl bg-surface-container-low [^"]*\bhover:bg-surface-container"/,
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
