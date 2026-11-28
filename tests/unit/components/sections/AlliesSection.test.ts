import { describe, expect, it } from 'vitest';
import AlliesSection from '../../../../src/components/sections/AlliesSection.astro';
import { getAllies } from '../../../../src/lib/data';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderAllies(): Promise<string> {
  return renderAstro(AlliesSection);
}

function sets(html: string): string[] {
  return [...html.matchAll(/<ul data-marquee-set\b[\s\S]*?<\/ul>/g)].map(([set]) => set);
}

function openingTag(html: string, attribute: string): string {
  return new RegExp(`<[a-z]+ ${attribute}\\b[^>]*>`).exec(html)?.[0] ?? '';
}

function images(html: string): string[] {
  return [...html.matchAll(/<img [^>]*>/g)].map(([img]) => img);
}

describe('AlliesSection', () => {
  it('is the #aliados section on white, clipping the horizontal overflow', async () => {
    const html = await renderAllies();

    expect(html).toMatch(/^<section id="aliados" aria-labelledby="allies-heading" class="/);
    expect(html).toMatch(
      /^<section [^>]*class="[^"]*\boverflow-x-clip bg-surface-container-lowest\b/,
    );
    expect(html).not.toContain('data-reveal');
  });

  it('keeps the heading on a primary band like "POLÍTICA INTEGRADA"', async () => {
    const html = await renderAllies();

    expect(html).toMatch(
      /<h2 id="allies-heading" class="[^"]*\buppercase\b[^"]*"><span class="[^"]*\bbg-primary\b[^"]*\btext-on-primary\b[^"]*">\s*Nuestros Aliados\s*<\/span><\/h2>/,
    );
    expect(html).not.toMatch(/<p\b/);
  });

  it('lists every ally once for assistive technology, in order, with meaningful alt text', async () => {
    const [original] = sets(await renderAllies());
    const allies = getAllies();

    expect(original).not.toContain('aria-hidden');
    expect(images(original ?? '').map((img) => /alt="([^"]*)"/.exec(img)?.[1])).toEqual(
      allies.map((_ally, index) => `Logo del aliado ${index + 1}`),
    );
  });

  it('repeats the set once more as an aria-hidden copy with empty alt text', async () => {
    const rendered = sets(await renderAllies());

    expect(rendered).toHaveLength(2);
    const copy = rendered[1] ?? '';
    expect(copy).toMatch(/^<ul data-marquee-set data-marquee-copy aria-hidden="true"/);
    expect(images(copy)).toHaveLength(getAllies().length);
    // Astro serialises an empty `alt` as the bare attribute, which HTML reads as `alt=""`.
    for (const img of images(copy)) expect(img).toMatch(/\balt(="")?[\s>]/);
  });

  it('has no buttons, links or other controls', async () => {
    const html = await renderAllies();

    expect(html).not.toMatch(/<(button|a|input|select)\b/);
    expect(html).not.toMatch(/\brole="(button|tab|tablist|slider)"|\btabindex=/);
  });

  it('shows only the bare logos: no card, border or shadow, and no color filter', async () => {
    const html = await renderAllies();
    // The heading band is rounded on purpose; only the carousel must be bare.
    const marquee = html.slice(html.indexOf('<div data-marquee'));

    expect(marquee).not.toMatch(/\b(shadow|border|rounded|bg)-/);
    expect(html).not.toContain('bg-surface-container-low ');
    for (const img of images(marquee)) {
      expect(img).toMatch(/\bwidth="\d+"/);
      expect(img).toMatch(/\bheight="\d+"/);
      expect(img).toContain('loading="lazy"');
      expect(img).toContain('decoding="async"');
      expect(img).toContain('object-contain');
      expect(img).not.toMatch(/grayscale|filter|brightness|invert/);
    }
  });

  it('animates the track only when motion is allowed, keeping it moving on hover and pausing on focus and off screen', async () => {
    const html = await renderAllies();
    const marquee = openingTag(html, 'data-marquee');
    const track = openingTag(html, 'data-marquee-track');

    expect(marquee).toContain(`style="--marquee-count: ${getAllies().length}"`);
    expect(marquee).toMatch(/\bgroup\b[^"]*\boverflow-hidden\b[^"]*\bmask-x-from-91%/);
    expect(track).toContain('motion-safe:animate-marquee');
    expect(track).not.toMatch(/[" ]animate-marquee\b/);
    expect(track).not.toContain('group-hover:');
    expect(track).toContain('group-focus-within:[animation-play-state:paused]');
    expect(track).toContain('group-data-offscreen:[animation-play-state:paused]');
  });

  it('falls back to a static, centered, wrapped single set under reduced motion', async () => {
    const html = await renderAllies();
    const [original, copy] = sets(html).map((set) => /^<ul [^>]*>/.exec(set)?.[0] ?? '');

    expect(openingTag(html, 'data-marquee')).toContain('motion-reduce:mask-none');
    expect(original).toMatch(/motion-reduce:flex-wrap motion-reduce:justify-center/);
    expect(original).not.toContain('motion-reduce:hidden');
    expect(copy).toContain('motion-reduce:hidden');

    const css = await compileTailwind(['motion-safe:animate-marquee', 'motion-reduce:hidden']);
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[^}]*display: none/);
  });

  it('moves the track with transform only, by the shift and in the direction variables', async () => {
    const css = await compileTailwind(['motion-safe:animate-marquee']);

    expect(css).toMatch(
      /animation: marquee var\(--marquee-duration\) linear infinite var\(--marquee-direction\)/,
    );
    expect(css).toMatch(
      /@keyframes marquee \{[^@]*translateX\(calc\(-1 \* var\(--marquee-shift\)\)\)/,
    );
    expect(css).not.toMatch(/@keyframes marquee \{[^@]*\b(?:left|right|margin)\b/);
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderAllies());
    const css = await compileTailwind(classes);

    // `group` is a marker class that Tailwind never emits on its own.
    const missing = classes
      .filter((className) => className !== 'group')
      .filter((className) => {
        // CSS-escape the class as Tailwind emits it, then regex-escape that selector text.
        const selector = `.${className.replace(/[:/.[\]()=,%]/g, (char) => `\\${char}`)}`;
        const pattern = selector.replace(/[\\^$.*+?()[\]{}|]/g, (char) => `\\${char}`);
        // Group variants end inside `:is(… .class)`.
        return !new RegExp(`${pattern}[\\s:{,[)]`).test(css);
      });
    expect(missing).toEqual([]);
  });
});
