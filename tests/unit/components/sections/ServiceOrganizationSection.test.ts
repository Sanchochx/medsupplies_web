import { describe, expect, it } from 'vitest';
import DivisionCard from '../../../../src/components/sections/DivisionCard.astro';
import DivisionItem from '../../../../src/components/sections/DivisionItem.astro';
import ServiceOrganizationSection from '../../../../src/components/sections/ServiceOrganizationSection.astro';
import { getServiceOrganization, type ServiceDivision } from '../../../../src/lib/data';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderSection(): Promise<string> {
  return renderAstro(ServiceOrganizationSection);
}

function divisionAt(index: number): ServiceDivision {
  const division = getServiceOrganization().divisions[index];
  if (!division) throw new Error(`No division at index ${index}`);
  return division;
}

function cards(html: string): string[] {
  return [...html.matchAll(/<article [\s\S]*?<\/article>/g)].map(([card]) => card);
}

describe('getServiceOrganization', () => {
  it('returns the three divisions in order, each linking to the contact section', () => {
    const { divisions } = getServiceOrganization();

    expect(divisions.map(({ label, title }) => `${label} ${title}`)).toEqual([
      'DIVISIÓN 01 Ingeniería',
      'DIVISIÓN 02 Hospitalaria',
      'DIVISIÓN 03 Suministros',
    ]);
    expect(new Set(divisions.map(({ href }) => href))).toEqual(new Set(['/#contacto']));
    expect(new Set(divisions.map(({ footerLabel }) => footerLabel))).toEqual(
      new Set(['Línea de productos']),
    );
  });
});

describe('ServiceOrganizationSection', () => {
  it('is the #organizacion section on light blue, labelled by its highlighted centered h2', async () => {
    const html = await renderSection();

    expect(html).toMatch(
      /^<section id="organizacion" aria-labelledby="service-organization-heading" class="[^"]*\bbg-surface-container-low py-space-xl lg:py-24"/,
    );
    // Same highlighted band as the "POLÍTICA INTEGRADA" heading.
    expect(html).toMatch(
      /<h2 id="service-organization-heading" class="[^"]*\buppercase\b[^"]*">\s*<span[^>]*\bbg-primary\b[^>]*\btext-on-primary\b[^>]*>\s*Organización Integral de Servicios\s*<\/span>\s*<\/h2>/,
    );
    expect(html).toContain(
      'Arquitectura operativa articulada para responder a las exigencias industriales, asistenciales e institucionales con rigor técnico y certificación.',
    );
  });

  it('renders only the division cards below the header, with no org-chart node or connector', async () => {
    const html = await renderSection();

    // The only image is the decorative section background.
    expect(html.match(/<img\b/g)).toHaveLength(1);
    expect(html).not.toContain('border-dashed');
    expect(cards(html)).toHaveLength(3);
  });

  it('puts the generic photo behind the section under a translucent veil, hidden from assistive tech', async () => {
    const html = await renderSection();

    expect(html).toMatch(
      /<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10"><img [^>]*image_generica[^>]*\balt\b(?!=)[^>]*loading="lazy"[^>]*class="absolute inset-0 size-full object-cover">/,
    );
    expect(html).toContain('<div class="absolute inset-0 bg-surface-container-low/75"></div>');
    // Cards are only slightly translucent so the photo hints through without hurting legibility.
    expect(html.match(/<article class="[^"]*\bbg-surface-container-lowest\/90\b/g)).toHaveLength(3);
  });

  it('keeps heading levels in order: one h2, an h3 per card and h4 sub-items', async () => {
    const html = await renderSection();

    expect(html.match(/<h2\b/g)).toHaveLength(1);
    expect(html.match(/<h3\b/g)).toHaveLength(3);
    expect(html.match(/<h4\b/g)).toHaveLength(7);
  });

  it('lays out the cards in 1, 2 and (from xl) 3 columns, with the odd last card spanning the tablet row', async () => {
    const html = await renderSection();

    expect(html).toMatch(
      /<ul class="[^"]*\bgrid w-full grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3"/,
    );
    expect(html.match(/md:col-span-2 xl:col-span-1/g)).toHaveLength(1);
    const [first = '', second = '', third = ''] = cards(html);
    expect(first).toContain('Ingeniería');
    expect(second).toContain('Hospitalaria');
    expect(third).toContain('Suministros');
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderSection());
    const css = await compileTailwind(classes);

    const missing = classes.filter((className) => {
      const selector = `.${className.replace(/[:/.[\]()=,%@]/g, (char) => `\\${char}`)}`;
      const pattern = selector.replace(/[\\^$.*+?()[\]{}|]/g, (char) => `\\${char}`);
      return !new RegExp(`${pattern}[\\s:{,[]`).test(css);
    });
    expect(missing).toEqual([]);
  });
});

describe('division grid rows (xl)', () => {
  it('derives the shared rows from the busiest division: header, description, item slots, footer', async () => {
    const html = await renderSection();
    const slots = Math.max(...getServiceOrganization().divisions.map(({ items }) => items.length));

    expect(html).toContain(`style="--division-items: ${slots}; --division-rows: ${slots + 3};"`);
  });

  it('makes each list item and card a subgrid spanning those rows, with the items on their own rows', async () => {
    const html = await renderSection();
    const subgrid = /xl:row-span-\(--division-rows\) xl:grid xl:grid-rows-subgrid xl:gap-y-0/;

    for (const card of cards(html)) {
      expect(card).toMatch(new RegExp(`^<article class="[^"]*${subgrid.source}`));
      expect(card).toMatch(
        /<ul class="[^"]*\bxl:grid xl:grid-rows-subgrid xl:row-span-\(--division-items\)"/,
      );
    }
    expect(html.match(/<li class="xl:row-span-\(--division-rows\)/g)).toHaveLength(3);
  });

  it('never stretches items to fill leftover space', async () => {
    expect(await renderSection()).not.toMatch(/\bflex-1\b/);
  });
});

describe('DivisionCard', () => {
  async function renderCard(index: number): Promise<string> {
    return renderAstro(DivisionCard, {
      props: { division: divisionAt(index), linkHint: '(ir a contacto)' },
    });
  }

  it('renders the header, description, items and a footer link to #contacto', async () => {
    const html = await renderCard(0);

    expect(html).toContain('DIVISIÓN 01');
    expect(html).toMatch(/<h3[^>]*>Ingeniería<\/h3>/);
    expect(html).toContain(
      'Optimización y gestión técnica especializada orientada al sector productivo y normas de calidad.',
    );
    expect(html.match(/<li\b/g)).toHaveLength(3);
    expect(html).toMatch(
      /<footer class="mt-auto[^"]*">\s*<a href="\/#contacto"[^>]*>\s*<span>\s*Línea de productos\s*<span class="sr-only"> \(ir a contacto\)<\/span>/,
    );
  });

  it.each([0, 1, 2])(
    'gives card %i the same light border and light icon tile as the others',
    async (index) => {
      const html = await renderCard(index);

      expect(html).toMatch(/^<article class="[^"]*\bborder border-surface-variant\b/);
      expect(html).not.toMatch(/\bborder-primary\b/);
      expect(html).toContain('bg-surface-container-high text-primary');
      expect(html).not.toContain('bg-primary-container');
    },
  );

  it('lifts on hover only when motion is allowed', async () => {
    expect(await renderCard(2)).toMatch(/hover:shadow-md motion-safe:hover:-translate-y-1/);
  });
});

describe('DivisionItem', () => {
  it('renders a decorative icon, the title as h4 and the text', async () => {
    const html = await renderAstro(DivisionItem, {
      props: { item: { icon: 'build', title: 'Mantenimiento Industrial', text: 'Rutinas' } },
    });

    expect(html).toMatch(/^<li class="flex items-start [^"]*\bbg-surface-container-low\b/);
    expect(html).toMatch(/<svg [^>]*aria-hidden="true"/);
    expect(html).toMatch(/<h4[^>]*>Mantenimiento Industrial<\/h4>/);
    expect(html).toMatch(/<p[^>]*>Rutinas<\/p>/);
  });
});

describe('Mantenimiento Biomédico', () => {
  it('shows an icon like every other item, with no BIOMEDICAL wordmark', async () => {
    const html = await renderSection();
    const item =
      [...html.matchAll(/<li class="flex items-start[\s\S]*?<\/li>/g)]
        .map(([li]) => li)
        .find((li) => li.includes('Mantenimiento Biomédico')) ?? '';

    expect(item).toMatch(/<svg [^>]*aria-hidden="true"/);
    expect(html).not.toContain('BIOMEDICAL');
  });
});
