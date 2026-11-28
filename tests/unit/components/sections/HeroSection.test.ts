import { describe, expect, it } from 'vitest';
import HeroSection from '../../../../src/components/sections/HeroSection.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { TYPEWRITER_DEFAULTS } from '../../../../src/lib/typewriter/typewriter';
import { renderAstro } from '../../helpers/renderAstro';

async function renderHero(): Promise<string> {
  return renderAstro(HeroSection);
}

function text(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('HeroSection', () => {
  it('is the #inicio section, labelled by its heading, with the inverse focus ring', async () => {
    const html = await renderHero();

    expect(html).toMatch(
      /^<section id="inicio" aria-labelledby="hero-heading" class="focus-ring-inverse [^"]*\bbg-scrim\b/,
    );
  });

  it('fills the screen from under the header and centers its content vertically', async () => {
    const section = /^<section[^>]*>/.exec(await renderHero())?.[0] ?? '';

    // Starts under the header, so the header's slide-in reveals the hero, not the page background;
    // min-height (not height) so the hero grows instead of clipping on short screens.
    expect(section).toMatch(/\bextend-under-header\b/);
    expect(section).toMatch(/\bpt-under-header-space-xl\b/);
    expect(section).toMatch(/\bflex\b[^"]*\bitems-center\b/);
    expect(section).not.toMatch(/[" ]h-(screen|\[)/);
  });

  it('renders a single light h1 with the company name highlighted', async () => {
    const html = await renderHero();
    const h1 = /<h1[^>]*>[\s\S]*?<\/h1>/.exec(html)?.[0] ?? '';

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(h1).toMatch(/class="[^"]*\btext-hero-title\b/);
    // Centered as a block by the parent, but its lines align to the left edge.
    expect(h1).toMatch(/class="text-start /);
    const brand = /<span class="text-primary-container"[^>]*>([\s\S]*?<\/span>)<\/span>/.exec(
      h1,
    )?.[1];
    expect(brand?.replace(/<[^>]+>/g, '')).toBe('Medsupplies Ingeniería S.A.S');
    expect(
      h1
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    ).toBe(
      'Medsupplies Ingeniería S.A.S soluciones integrales con Dispositivos Médicos, Productos Farmacéuticos e Ingeniería Especializada',
    );
  });

  it('shows the eyebrow and the lead', async () => {
    const page = text(await renderHero());

    expect(page).toContain('Tecnología médica y Farmacéutica en Colombia');
    expect(page).toContain(
      'Distribuimos tecnología médica de vanguardia e insumos hospitalarios en Colombia, con el respaldo de soporte técnico, cumplimiento normativo y excelencia operativa.',
    );
  });

  it('links the CTAs to the contact and products sections, without preselecting a request type', async () => {
    const html = await renderHero();

    expect(html).toMatch(/<a [^>]*href="\/#contacto"[^>]*>[\s\S]*?Solicitar cotización\s*<\/a>/);
    expect(html).toMatch(
      /<a [^>]*href="\/#productos"[^>]*>[\s\S]*?Ver portafolio de productos\s*<\/a>/,
    );
    expect(html).not.toMatch(/href="[^"]*[?&]type=/);
    // Stacked at one shared width on phones, side by side from sm.
    expect(html).toMatch(
      /class="flex w-full max-w-sm flex-col [^"]*\bsm:flex-row sm:flex-wrap\b[^"]*"/,
    );
  });

  it('lists the micro-specs from the data file', async () => {
    const page = text(await renderHero());

    expect(page).toContain('Regulación Sanitaria INVIMA');
    expect(page).toContain('Envíos nacionales a todo Colombia');
    expect(page).not.toContain('Garantía Técnica y Calidad');
    expect(page).not.toContain('Cadena de Custodia');
  });

  it('keeps each micro-spec on a single line', async () => {
    const items = (await renderHero()).match(/<li class="[^"]*\bgap-1\.5\b[^"]*"/g) ?? [];

    expect(items).toHaveLength(2);
    for (const item of items) expect(item).toContain('whitespace-nowrap');
  });

  it('covers the section with a decorative, eagerly loaded placeholder photo under a black veil', async () => {
    const html = await renderHero();
    const img = /<img [^>]*>/.exec(html)?.[0] ?? '';

    expect(img).toMatch(/src="\/(?:@fs|_image)[^"]*hero-laboratory/);
    // Astro renders an empty alt as a bare `alt` attribute, which HTML treats as alt="".
    expect(img).toMatch(/\salt(?:="")?\s/);
    expect(img).toContain('width="1200"');
    expect(img).toContain('height="960"');
    expect(img).toContain('loading="eager"');
    expect(img).toContain('fetchpriority="high"');
    expect(img).toMatch(/class="absolute inset-0 size-full object-cover"/);
    expect(html).toMatch(/<div aria-hidden="true" class="absolute inset-0 bg-scrim\/75">/);
    expect(html.indexOf('<img')).toBeLessThan(html.indexOf('<h1'));
  });

  it('loops a silent, decorative background video over the photo and under the veil', async () => {
    const html = await renderHero();
    const video = /<video [^>]*>/.exec(html)?.[0] ?? '';

    for (const attr of ['autoplay', 'muted', 'loop', 'playsinline']) {
      expect(video).toMatch(new RegExp(`\\s${attr}[\\s>=]`));
    }
    expect(video).toContain('data-looping-video');
    expect(video).toContain('aria-hidden="true"');
    expect(video).toContain('tabindex="-1"');
    // Reduced motion falls back to the still photo underneath.
    expect(video).toMatch(/class="absolute inset-0 size-full object-cover motion-reduce:hidden"/);
    // WebM first, so Firefox on Linux does not fall back to a High-profile H.264 decoder.
    expect(html).toMatch(
      /<video [^>]*>\s*<source src="\/videos\/video_fondo\.webm" type="video\/webm">\s*<source src="\/videos\/video_fondo\.mp4" type="video\/mp4">\s*<\/video>/,
    );
    expect(html.indexOf('<img')).toBeLessThan(html.indexOf('<video'));
    expect(html.indexOf('<video')).toBeLessThan(html.indexOf('bg-scrim/75'));
  });

  it('centers the text block, capped at max-w-4xl', async () => {
    const html = await renderHero();

    expect(html).not.toMatch(/lg:grid-cols-12|lg:col-span-/);
    expect(html).toMatch(
      /<div class="mx-auto flex max-w-4xl flex-col items-center gap-space-md text-center">/,
    );
    expect(html).toMatch(/class="[^"]*\bsm:items-center sm:justify-center\b[^"]*"/);
  });

  describe('load sequence', () => {
    const tag = (html: string, pattern: RegExp): string => pattern.exec(html)?.[0] ?? '';
    const timing = (delay: number, duration: number, y = 0): string =>
      `--intro-delay: ${delay}ms; --intro-duration: ${duration}ms; --intro-ease: cubic-bezier(0.22, 1, 0.36, 1); --intro-x: 0px; --intro-y: ${y}px`;

    it('is an intro sequence that plays on load', async () => {
      const section = tag(await renderHero(), /^<section[^>]*>/);

      expect(section).toContain('data-intro-root data-intro-trigger="load"');
    });

    it('fades the badge in first', async () => {
      const badge = tag(
        await renderHero(),
        /<span class="inline-flex items-center rounded-full[^>]*>/,
      );

      expect(badge).toMatch(/\sdata-intro(="true")?[\s>]/);
      expect(badge).toContain(timing(0, 500));
    });

    it('raises the title in two blocks, word by word so the lines wrap as before', async () => {
      const h1 = tag(await renderHero(), /<h1[^>]*>[\s\S]*?<\/h1>/);
      const words = h1.match(/<span class="inline-block" data-intro>[^<]+<\/span>/g) ?? [];

      expect(words).toHaveLength(13);
      expect(h1).toContain(`<span class="text-primary-container" style="${timing(150, 700, 24)}`);
      expect(h1).toContain(`</span> <span style="${timing(300, 700, 24)}`);
    });

    it('types the lead with the typewriter, starting on load at 700ms', async () => {
      const lead = tag(await renderHero(), /<p [^>]*>/);

      expect(lead).toContain('class="max-w-2xl text-hero-lead text-surface-variant"');
      expect(lead).toMatch(/\sdata-typewriter(="true")?[\s>]/);
      expect(lead).toContain('data-typewriter-delay="700"');
      expect(lead).toContain(`data-typewriter-speed="${TYPEWRITER_DEFAULTS.speed}"`);
      expect(lead).toContain('data-typewriter-trigger="load"');
    });

    it('raises the buttons, 100ms apart, then fades in the micro-specs', async () => {
      const html = await renderHero();

      expect(tag(html, /<a [^>]*href="\/#contacto"[^>]*>/)).toContain(timing(1400, 600, 20));
      expect(tag(html, /<a [^>]*href="\/#productos"[^>]*>/)).toContain(timing(1500, 600, 20));
      const specs = tag(html, /<ul [^>]*>/);
      expect(specs).toMatch(/\sdata-intro[\s>]/);
      expect(specs).toContain(timing(1600, 500));
    });
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderHero());
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
