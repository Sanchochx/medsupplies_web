import { describe, expect, it } from 'vitest';
import HeroSection from '../../../../src/components/sections/HeroSection.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
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
  it('is the #home section, labelled by its heading, on the surface background', async () => {
    const html = await renderHero();

    expect(html).toMatch(
      /^<section id="home" aria-labelledby="hero-heading" class="[^"]*\bbg-surface\b/,
    );
    expect(html).toMatch(
      /<div aria-hidden="true" class="[^"]*\bbg-radial-\[at_20%_20%\] from-primary-container\/8/,
    );
  });

  it('renders a single h1 with "Medical Devices" highlighted in primary', async () => {
    const html = await renderHero();
    const h1 = /<h1[^>]*>[\s\S]*?<\/h1>/.exec(html)?.[0] ?? '';

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(h1).toMatch(/class="[^"]*\btext-headline-xl\b[^"]*\blg:text-display-lg\b/);
    expect(h1).toContain('<span class="text-primary">Medical Devices</span>');
    // Tags are dropped without a space here, so "Medical Devices</span>," keeps its comma.
    expect(
      h1
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    ).toBe(
      'Integrated Solutions in Medical Devices, Pharmaceutical Products and Specialized Engineering',
    );
  });

  it('shows the eyebrow and the lead', async () => {
    const page = text(await renderHero());

    expect(page).toContain('Biomedical & Pharmaceutical Technology in Colombia');
    expect(page).toContain(
      'We distribute cutting-edge medical technology and hospital supplies in Colombia, backed by technical support, regulatory compliance and operational excellence.',
    );
  });

  it('links the CTAs to the contact and products sections, without preselecting a request type', async () => {
    const html = await renderHero();

    expect(html).toMatch(/<a [^>]*href="\/#contact"[^>]*>[\s\S]*?Request a quote\s*<\/a>/);
    expect(html).toMatch(/<a [^>]*href="\/#products"[^>]*>[\s\S]*?View product portfolio\s*<\/a>/);
    expect(html).not.toMatch(/href="[^"]*[?&]type=/);
    expect(html).toMatch(/class="flex flex-wrap [^"]*"/);
  });

  it('lists the micro-specs and the two floating badges from the data file', async () => {
    const page = text(await renderHero());

    expect(page).toContain('INVIMA Health Regulation');
    expect(page).toContain('Traceability & Cold Chain');
    expect(page).toContain('Technical Warranty & Quality Certified metrology protocols');
    expect(page).toContain('Chain of Custody Continuous temperature monitoring');
  });

  it('serves a local, eagerly loaded image with reserved dimensions', async () => {
    const html = await renderHero();
    const img = /<img [^>]*>/.exec(html)?.[0] ?? '';

    expect(img).toMatch(/src="\/(?:@fs|_image)[^"]*hero-laboratory/);
    expect(img).not.toMatch(/https?:\/\//);
    expect(img).toContain('width="1200"');
    expect(img).toContain('height="960"');
    expect(img).toContain('loading="eager"');
    expect(img).toContain('fetchpriority="high"');
    expect(img).toMatch(/alt="[^"]{20,}"/);
    expect(img).toMatch(/class="[^"]*\bh-105\b[^"]*\bobject-cover\b[^"]*\blg:h-120\b/);
  });

  it('uses a 12-column grid from lg with the text in 7 columns and the image in 5', async () => {
    const html = await renderHero();

    expect(html).toMatch(/class="grid grid-cols-1 [^"]*lg:grid-cols-12"/);
    expect(html.indexOf('lg:col-span-7')).toBeLessThan(html.indexOf('lg:col-span-5'));
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
