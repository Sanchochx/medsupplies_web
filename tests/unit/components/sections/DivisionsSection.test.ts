import { describe, expect, it } from 'vitest';
import DivisionsSection from '../../../../src/components/sections/DivisionsSection.astro';
import { getDivisionBanners } from '../../../../src/lib/data';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderSection(): Promise<string> {
  return renderAstro(DivisionsSection);
}

function cards(html: string): string[] {
  return [...html.matchAll(/<article [\s\S]*?<\/article>/g)].map(([card]) => card);
}

describe('getDivisionBanners', () => {
  it('returns the three divisions in order, only the second with its text on the right', () => {
    const banners = getDivisionBanners();

    expect(banners.map(({ title }) => title)).toEqual([
      'División Hospitalaria',
      'División Suministros',
      'División Ingeniería',
    ]);
    expect(banners.map(({ textSide }) => textSide)).toEqual(['left', 'right', 'left']);
  });
});

describe('DivisionsSection', () => {
  it('is the #productos section, named by its highlighted, centered h2 title', async () => {
    const html = await renderSection();

    expect(html).toMatch(/^<section id="productos" aria-labelledby="divisions-heading"/);
    expect(html).toMatch(
      /<h2 id="divisions-heading" class="[^"]*\buppercase\b[^"]*">\s*<span[^>]*\bbg-primary\b[^>]*\btext-on-primary\b[^>]*>\s*Organización Integral de Servicios\s*<\/span>\s*<\/h2>/,
    );
    expect(html.match(/<h2\b/g)).toHaveLength(1);
  });

  it('shows only the title above the banners: no lead, division cards or background photo', async () => {
    const html = await renderSection();
    const header = html.slice(0, html.indexOf('<ul '));

    expect(header).not.toMatch(/<p\b|<img\b/);
    expect(html).not.toContain('image_generica');
    expect(html).not.toContain('Arquitectura operativa');
    const banners = getDivisionBanners();
    const lineCount = banners.reduce((total, { lines }) => total + lines.length, 0);
    expect(html.match(/<img\b/g)).toHaveLength(banners.length + lineCount);
  });

  it('renders one article per banner from siteData, in order, with its h3 title', async () => {
    const rendered = cards(await renderSection());
    const banners = getDivisionBanners();

    expect(rendered).toHaveLength(banners.length);
    rendered.forEach((card, index) => {
      const banner = banners[index];
      expect(card).toMatch(
        new RegExp(
          `<h3 id="division-${banner?.id}-title"[^>]*>\\s*<button[^>]*>\\s*${banner?.title}\\s*</button>\\s*</h3>`,
        ),
      );
    });
  });

  it('shows only the title on the banner: no label pill, description or extra words', async () => {
    const html = await renderSection();

    expect(html).not.toContain('Explorar');
    expect(html).not.toContain('DIVISIÓN 0');
    for (const card of cards(html)) {
      const banner = card.slice(0, card.indexOf('data-division-panel'));
      expect(banner).not.toMatch(/<p\b|<a\b/);
      expect(banner.match(/<button\b/g)).toHaveLength(1);
    }
  });

  it('makes each banner a collapsed disclosure button for its panel region', async () => {
    for (const card of cards(await renderSection())) {
      const button = /<button [^>]*>/.exec(card)?.[0] ?? '';
      const panelId = /aria-controls="([^"]+)"/.exec(button)?.[1];
      const titleId = /<h3 id="([^"]+)"/.exec(card)?.[1];

      expect(button).toContain('type="button"');
      expect(button).toContain('aria-expanded="false"');
      expect(card).toMatch(/<article [^>]*data-state="closed"/);
      // The button's ::after covers the banner, so the whole banner is the target.
      expect(button).toMatch(/\bafter:absolute\b[^"]*\bafter:inset-0\b/);
      expect(button).toMatch(/focus-visible:after:outline-on-primary/);

      const panel = new RegExp(`<div id="${panelId}"[^>]*>`).exec(card)?.[0] ?? '';
      expect(panel).toContain('role="region"');
      expect(panel).toContain(`aria-labelledby="${titleId}"`);
      expect(panel).toContain('aria-hidden="true"');
      expect(panel).toMatch(/\sinert[\s>=]/);
      expect(panel).toMatch(/\bgrid-rows-\[0fr\]/);
    }
  });

  it('adds a decorative chevron, on the left only for the right-aligned banner', async () => {
    const [first, second, third] = cards(await renderSection());

    for (const card of [first, second, third]) {
      const chevron =
        /<div aria-hidden="true" class="pointer-events-none absolute inset-0">[\s\S]*?<\/svg>/.exec(
          card ?? '',
        )?.[0] ?? '';
      expect(chevron).toMatch(/\bsize-11\b/);
      expect(chevron).toMatch(/group-data-\[state=open\]\/division:rotate-180/);
    }
    expect(first).toMatch(
      /pointer-events-none absolute inset-0">\s*<div class="[^"]*\bjustify-end\b/,
    );
    expect(second).toMatch(
      /pointer-events-none absolute inset-0">\s*<div class="[^"]*\bjustify-start\b/,
    );
  });

  it('serves decorative, lazy, responsive cover images', async () => {
    const banners = getDivisionBanners();

    for (const [index, card] of cards(await renderSection()).entries()) {
      const img = /<img [^>]*>/.exec(card)?.[0] ?? '';

      // Astro renders an empty `alt` as the bare attribute, which is equivalent to `alt=""`.
      expect(img).toMatch(/\salt(="")?[\s>]/);
      expect(img).toContain('loading="lazy"');
      expect(img).toMatch(/\bsrcset="/);
      expect(img).toMatch(/\bsizes="/);
      expect(img).toMatch(/class="[^"]*\bobject-cover\b/);
      expect(img).toContain(`object-position: ${banners[index]?.imagePosition}`);
    }
  });

  it('puts the second banner text and its darkest overlay on the right, the others on the left', async () => {
    const [first, second, third] = cards(await renderSection());

    for (const card of [first, third]) {
      expect(card).toMatch(/class="[^"]*\bbg-linear-to-r\b/);
      expect(card).toMatch(/class="[^"]*\bitems-start text-left\b/);
    }
    expect(second).toMatch(/class="[^"]*\bbg-linear-to-l\b/);
    expect(second).toMatch(/class="[^"]*\bitems-end text-right\b/);
  });

  it('fills one screen below the header with three equal, full-bleed rows', async () => {
    const html = await renderSection();

    expect(html).toMatch(
      /^<section [^>]*class="flex min-h-screen-below-header w-full flex-col bg-surface-container-lowest"/,
    );
    expect(html).toMatch(
      /<ul class="group\/divisions grid flex-1 grid-rows-divisions gap-space-sm data-locked:grid-rows-none"/,
    );
    for (const card of cards(html)) {
      expect(card).toMatch(/^<article [^>]*class="group\/division flex w-full flex-col"/);
      const bannerClass = /<div class="(group\/banner [^"]*)"/.exec(card)?.[1]?.split(' ') ?? [];
      expect(bannerClass).toContain('flex-1');
      // While a panel is open the banners keep their closed height.
      expect(bannerClass).toContain('group-data-locked/divisions:h-division-banner');
      expect(bannerClass.some((name) => name.startsWith('rounded'))).toBe(false);
    }
  });

  it('aligns the text to the page container while the image stays full width', async () => {
    for (const card of cards(await renderSection())) {
      expect(card).toMatch(/<div class="mx-auto w-full max-w-page px-margin-mobile lg:px-margin /);
      expect(/<img [^>]*>/.exec(card)?.[0]).toContain('sizes="100vw"');
    }
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderSection());
    const css = await compileTailwind(classes);

    const missing = classes.filter((className) => {
      const selector = `.${className.replace(/[:/.[\]()=,%]/g, (char) => `\\${char}`)}`;
      const pattern = selector.replace(/[\\^$.*+?()[\]{}|]/g, (char) => `\\${char}`);
      return !new RegExp(`${pattern}[\\s:{,[)]`).test(css);
    });
    expect(missing).toEqual([]);
  });
});
