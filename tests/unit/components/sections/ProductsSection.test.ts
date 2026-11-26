import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductsSection from '../../../../src/components/sections/ProductsSection.astro';
import type { ProductLine } from '../../../../src/lib/data';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

const { getProductLines } = vi.hoisted(() => ({ getProductLines: vi.fn() }));
vi.mock('../../../../src/lib/data', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/lib/data')>()),
  getProductLines,
}));

const IMAGE = { src: '/placeholder.webp', width: 800, height: 448, format: 'webp' } as const;

function mockLine(id: string, order: number): ProductLine {
  return {
    id,
    title: `Mock title ${order}`,
    lineBadge: `Mock badge ${order}`,
    description: `Mock description ${order}`,
    tags: [`Tag ${order}a`, `Tag ${order}b`],
    ctaLabel: `Mock CTA ${order}`,
    image: IMAGE,
    imageAlt: `Mock image description for line ${order}`,
    order,
  };
}

const MOCK_LINES: ProductLine[] = [
  mockLine('medical-devices', 1),
  mockLine('pharmaceuticals', 2),
  mockLine('surgical-supplies', 3),
];

async function renderProducts(): Promise<string> {
  return renderAstro(ProductsSection);
}

function cards(html: string): string[] {
  return [...html.matchAll(/<article [\s\S]*?<\/article>/g)].map(([card]) => card);
}

beforeEach(() => {
  getProductLines.mockReset().mockResolvedValue(MOCK_LINES);
});

describe('ProductsSection', () => {
  it('is the #productos section on the primary background, labelled by its heading', async () => {
    const html = await renderProducts();

    expect(html).toMatch(
      /^<section id="productos" aria-labelledby="products-heading" class="[^"]*\bbg-primary py-space-xl lg:py-24"/,
    );
    expect(html).toMatch(/<h2 id="products-heading"[^>]*>\s*Portafolio de Productos\s*<\/h2>/);
  });

  it('renders the primary-tone header and a light price list link', async () => {
    const html = await renderProducts();

    expect(html).not.toContain('Suministro Hospitalario Certificado');
    expect(html).toContain(
      'Una cadena de suministro clínico sujeta a estrictos controles de trazabilidad, calificación de proveedores y registros sanitarios vigentes.',
    );
    const priceLink =
      /<a [^>]*>\s*Solicitar lista de precios completa[\s\S]*?<\/a>/.exec(html)?.[0] ?? '';
    expect(priceLink).toMatch(/href="\/#contacto"/);
    expect(priceLink).toMatch(/<svg /);
    expect(priceLink).toMatch(/class="[^"]*\btext-on-primary\b/);
    expect(html).toMatch(/<h2 id="products-heading" class="[^"]*\btext-on-primary\b/);
    expect(html).toMatch(
      /class="focus-ring-inverse flex flex-col justify-between gap-space-md md:flex-row md:items-end"/,
    );
  });

  it('renders one card per product line from the data layer, in order', async () => {
    const rendered = cards(await renderProducts());

    expect(getProductLines).toHaveBeenCalledOnce();
    expect(rendered).toHaveLength(3);
    rendered.forEach((card, index) => {
      const line = MOCK_LINES[index];
      expect(card).toMatch(new RegExp(`<h3[^>]*>${line?.title}</h3>`));
      expect(card).toContain(line?.lineBadge);
      expect(card).toContain(line?.description);
      for (const tag of line?.tags ?? []) expect(card).toContain(tag);
    });
  });

  it('links every CTA to /#contacto', async () => {
    const ctas = cards(await renderProducts()).map(
      (card) => /<a [^>]*>[\s\S]*?<\/a>/.exec(card)?.[0] ?? '',
    );

    expect(ctas.map((cta) => /href="([^"]+)"/.exec(cta)?.[1])).toEqual([
      '/#contacto',
      '/#contacto',
      '/#contacto',
    ]);
    ctas.forEach((cta, index) => {
      expect(cta).toContain(MOCK_LINES[index]?.ctaLabel);
      expect(cta).toMatch(/class="[^"]*\bw-full\b/);
    });
  });

  it('serves lazy local images with reserved dimensions and descriptive alt text', async () => {
    for (const [index, card] of cards(await renderProducts()).entries()) {
      const img = /<img [^>]*>/.exec(card)?.[0] ?? '';

      expect(img).not.toMatch(/https?:\/\//);
      expect(img).toContain('width="800"');
      expect(img).toContain('height="448"');
      expect(img).toContain('loading="lazy"');
      expect(img).toContain(`alt="${MOCK_LINES[index]?.imageAlt}"`);
      expect(img).toMatch(/class="[^"]*\bgroup-hover:scale-105\b/);
      expect(img).toMatch(/class="[^"]*\btransition-transform\b/);
    }
  });

  it('renders white rounded cards that lift on hover, with the CTA pinned to the bottom', async () => {
    for (const card of cards(await renderProducts())) {
      expect(card).toMatch(
        /^<article class="group flex h-full flex-col [^"]*rounded-2xl bg-surface-container-lowest shadow-sm [^"]*hover:shadow-md"/,
      );
      expect(card).toMatch(/<div class="flex flex-1 flex-col /);
      expect(card).toMatch(/<div class="relative h-56 w-full overflow-hidden/);
    }
  });

  it('lays the cards out in 1 column below lg and 3 from lg', async () => {
    expect(await renderProducts()).toMatch(
      /<ul class="grid grid-cols-1 gap-gutter lg:grid-cols-3">/,
    );
  });

  it('only uses utilities that exist in the design system', async () => {
    // `group` is a marker for `group-hover:*` and generates no CSS of its own.
    const classes = extractClasses(await renderProducts()).filter((name) => name !== 'group');
    const css = await compileTailwind(classes);

    const missing = classes.filter((className) => {
      // CSS-escape the class as Tailwind emits it, then regex-escape that selector text.
      const selector = `.${className.replace(/[:/.[\]()=,%]/g, (char) => `\\${char}`)}`;
      const pattern = selector.replace(/[\\^$.*+?()[\]{}|]/g, (char) => `\\${char}`);
      // `)` closes group variants, emitted as `:is(:where(.group):hover .group-hover\:x)`.
      return !new RegExp(`${pattern}[\\s:{,[)]`).test(css);
    });
    expect(missing).toEqual([]);
  });
});
