import { describe, expect, it } from 'vitest';
import DivisionsSection from '../../../../src/components/sections/DivisionsSection.astro';
import { getDivisionBanners } from '../../../../src/lib/data';
import { renderAstro } from '../../helpers/renderAstro';

function panels(html: string): string[] {
  return [...html.matchAll(/<div id="division-[a-z-]+-panel"[\s\S]*?Solicitar cotización/g)].map(
    ([panel]) => panel,
  );
}

function lineBlocks(panel: string): string[] {
  return panel.split(/(?=<div class="grid items-start)/).slice(1);
}

describe('getDivisionBanners lines', () => {
  it('gives every division at least one line with unique ids and 6–10 named items', () => {
    const banners = getDivisionBanners();
    const lineIds = banners.flatMap(({ lines }) => lines.map(({ id }) => id));

    expect(new Set(banners.map(({ id }) => id)).size).toBe(banners.length);
    expect(new Set(lineIds).size).toBe(lineIds.length);
    for (const { lines } of banners) {
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line.items.length).toBeGreaterThanOrEqual(6);
        expect(line.items.length).toBeLessThanOrEqual(10);
        expect(line.items.every((item) => item.trim().length > 0)).toBe(true);
      }
    }
  });
});

describe('DivisionPanel', () => {
  it('renders one panel per division with its lines, from siteData, in order', async () => {
    const rendered = panels(await renderAstro(DivisionsSection));
    const banners = getDivisionBanners();

    expect(rendered).toHaveLength(banners.length);
    rendered.forEach((panel, index) => {
      const { lines } = banners[index] ?? { lines: [] };
      const blocks = lineBlocks(panel);

      expect(blocks).toHaveLength(lines.length);
      blocks.forEach((block, lineIndex) => {
        const line = lines[lineIndex];
        if (!line) throw new Error('Missing line');
        expect(block).toMatch(
          new RegExp(`<span class="[^"]*\\buppercase\\b[^"]*">${line.label}</span>`),
        );
        expect(block).toMatch(new RegExp(`<h4 class="[^"]*">\\s*${line.title}\\s*</h4>`));
        const items = [...block.matchAll(/<li [^>]*>[\s\S]*?<span>([^<]*)<\/span>/g)].map(
          ([, name]) => name,
        );
        expect(items).toEqual(line.items);
      });
    });
  });

  it('alternates the photo side from md up, keeping it on top on mobile', async () => {
    const [hospital] = panels(await renderAstro(DivisionsSection));
    const [first, second] = lineBlocks(hospital ?? '');

    const tile = (block = ''): string =>
      /<div class="(relative isolate [^"]*)"/.exec(block)?.[1] ?? '';
    expect(tile(first)).not.toContain('md:order-last');
    expect(tile(second)).toContain('md:order-last');
    expect(tile(first)).toMatch(/\bmd:aspect-square\b/);
  });

  it('shows names only, as a responsive chip grid of a single list per line', async () => {
    for (const panel of panels(await renderAstro(DivisionsSection))) {
      for (const block of lineBlocks(panel)) {
        expect(block.match(/<ul\b/g)).toHaveLength(1);
        expect(block).toMatch(
          /<ul class="grid grid-cols-1 [^"]*\bsm:grid-cols-2\b[^"]*\bxl:grid-cols-3\b/,
        );
        expect(block).not.toMatch(/<p\b/);
      }
    }
  });

  it('serves the line photos as decorative, lazy, contained images', async () => {
    for (const panel of panels(await renderAstro(DivisionsSection))) {
      for (const img of panel.match(/<img [^>]*>/g) ?? []) {
        expect(img).toMatch(/\salt(="")?[\s>]/);
        expect(img).toContain('loading="lazy"');
        expect(img).toMatch(/class="[^"]*\bobject-contain\b/);
        expect(img).toMatch(/\bwidth="\d+"[^>]*\bheight="\d+"|\bheight="\d+"[^>]*\bwidth="\d+"/);
      }
    }
  });

  it('ends with a quote button that links to the contact section', async () => {
    for (const panel of panels(await renderAstro(DivisionsSection))) {
      expect(panel).toMatch(/<a [^>]*href="\/#contacto"[^>]*>\s*Solicitar cotización$/);
    }
  });
});
