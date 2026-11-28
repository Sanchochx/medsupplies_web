import { describe, expect, it } from 'vitest';
import DivisionsSection from '../../../../src/components/sections/DivisionsSection.astro';
import { getDivisionBanners } from '../../../../src/lib/data';
import {
  DIVISION_BANNER_INTRO,
  divisionBannerIntro,
  introStepStyle,
} from '../../../../src/lib/motion/introTimeline';
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
  it('is the #productos section, named for assistive tech, with no visible section title', async () => {
    const html = await renderSection();

    expect(html).toMatch(/^<section id="productos" aria-label="Divisiones"/);
    expect(html).not.toContain('Organización Integral de Servicios');
    // The section starts straight with the banner list: no heading, lead or background photo.
    expect(html).toMatch(/^<section [^>]*>\s*<ul /);
    expect(html).not.toContain('image_generica');
    expect(html).not.toContain('Arquitectura operativa');
    const banners = getDivisionBanners();
    expect(html.match(/<h2\b/g)).toHaveLength(banners.length);
    // Every division photo is in the markup (the loop renders all its slides), plus one faint
    // background photo per panel.
    const photoCount = banners.reduce((total, { panel }) => total + (panel?.images.length ?? 0), 0);
    const panelCount = banners.filter(({ panel }) => panel).length;
    expect(html.match(/<img\b/g)).toHaveLength(banners.length + photoCount + panelCount);
  });

  it('renders one article per banner from siteData, in order, with its h2 title', async () => {
    const rendered = cards(await renderSection());
    const banners = getDivisionBanners();

    expect(rendered).toHaveLength(banners.length);
    rendered.forEach((card, index) => {
      const banner = banners[index];
      expect(card).toMatch(
        new RegExp(
          `<h2 id="division-${banner?.id}-title"[^>]*>\\s*(<button[^>]*>\\s*)?<span class="block"[^>]*>\\s*${banner?.title}\\s*</span>\\s*(</button>\\s*)?</h2>`,
        ),
      );
    });
  });

  it('shows only the title on the banner: no label pill, description or extra words', async () => {
    const html = await renderSection();

    expect(html).not.toContain('Explorar');
    expect(html).not.toContain('DIVISIÓN 0');
    for (const card of cards(html)) {
      const panelStart = card.indexOf('data-division-panel');
      const banner = panelStart === -1 ? card : card.slice(0, panelStart);
      expect(banner).not.toMatch(/<p\b|<a\b/);
      expect(banner.match(/<button\b/g)?.length ?? 0).toBeLessThanOrEqual(1);
    }
  });

  it('makes the hospital and supplies banners collapsed disclosure buttons for their panels', async () => {
    const [hospital, supplies] = cards(await renderSection());
    for (const card of [hospital ?? '', supplies ?? '']) {
      const button = /<button [^>]*>/.exec(card)?.[0] ?? '';
      const panelId = /aria-controls="([^"]+)"/.exec(button)?.[1];
      const titleId = /<h2 id="([^"]+)"/.exec(card)?.[1];

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

  it('keeps the engineering banner static: no button, chevron, panel or hover', async () => {
    const [, , engineering] = cards(await renderSection());

    expect(engineering).toMatch(
      /<h2 id="division-engineering-title"[^>]*>\s*<span class="block"[^>]*>\s*División Ingeniería\s*<\/span>\s*<\/h2>/,
    );
    expect(engineering).not.toMatch(/<button\b|data-division-panel|<svg\b|aria-controls/);
    expect(engineering).not.toContain('group-hover/banner:brightness-115');
    expect(engineering).not.toContain('Cerrar panel');
  });

  it('adds a decorative chevron on the right of the hospital banner that flips when open', async () => {
    const [hospital] = cards(await renderSection());
    const cue =
      /<div aria-hidden="true" class="pointer-events-none absolute inset-0">[\s\S]*?<\/svg>/.exec(
        hospital ?? '',
      )?.[0] ?? '';

    expect(cue).toMatch(/\bsize-11\b/);
    expect(cue).toMatch(/group-data-\[state=open\]\/division:rotate-180/);
    expect(hospital).toMatch(
      /pointer-events-none absolute inset-0">\s*<div class="[^"]*\bjustify-end\b/,
    );
  });

  it('mirrors the supplies chevron to the left edge of the banner', async () => {
    const [, supplies] = cards(await renderSection());
    const cue =
      /<div aria-hidden="true" class="pointer-events-none absolute inset-0">[\s\S]*?<\/svg>/.exec(
        supplies ?? '',
      )?.[0] ?? '';

    expect(cue).toMatch(
      /pointer-events-none absolute inset-0">\s*<div class="[^"]*\bjustify-start\b/,
    );
    expect(cue).toMatch(/group-data-\[state=open\]\/division:rotate-180/);
  });

  it('shows only the chevron as the open/close cue, with no "Cerrar panel" label', async () => {
    const [hospital, supplies] = cards(await renderSection());

    for (const card of [hospital, supplies]) {
      expect(card).not.toContain('Cerrar panel');
    }
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

describe('division banner entrance', () => {
  it('maps the wipe and title direction from the text side: 1 and 3 right to left, 2 left to right', () => {
    const intros = getDivisionBanners().map(({ textSide }) => divisionBannerIntro(textSide));

    expect(intros.map(({ wipe }) => wipe)).toEqual(['wipe', 'wipe-ltr', 'wipe']);
    expect(intros.map(({ title }) => title.x)).toEqual([-32, 32, -32]);
  });

  it('makes each article a view sequence of a staggered list, clipping only the banner', async () => {
    const html = await renderSection();

    expect(html).toMatch(
      new RegExp(
        `<ul [^>]*data-divisions-list data-intro-group data-intro-stagger="${DIVISION_BANNER_INTRO.stagger}"`,
      ),
    );
    for (const [index, card] of cards(html).entries()) {
      const { wipe, title } = divisionBannerIntro(getDivisionBanners()[index]?.textSide ?? 'left');
      expect(card).toMatch(/^<article [^>]*data-intro-root data-intro-trigger="view"/);
      // The wipe sits on the banner (the article's first child), never on the panel.
      expect(card).toMatch(
        new RegExp(`^<article [^>]*>\\s*<div class="group/banner[^"]*" data-intro="${wipe}"`),
      );
      expect(card.match(/data-intro="wipe/g)).toHaveLength(1);
      expect(card).toContain(`<span class="block" data-intro style="${introStepStyle(title)}">`);
    }
  });

  it('settles the photo without fading it and pops in the chevron after the title', async () => {
    const [hospital] = cards(await renderSection());

    expect(hospital).toMatch(
      /<img [^>]*data-intro(="true")? style="object-position: [^;"]+; [^"]*--intro-opacity: 1; --intro-scale: 1.06"/,
    );
    expect(hospital).toContain(`style="${introStepStyle(DIVISION_BANNER_INTRO.chevron)}"`);
    expect(DIVISION_BANNER_INTRO.chevron.delay).toBeGreaterThan(DIVISION_BANNER_INTRO.title.delay);
  });
});
