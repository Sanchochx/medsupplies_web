import { describe, expect, it } from 'vitest';
import SectionHeader from '../../../../src/components/ui/SectionHeader.astro';
import { HISTORY_INTRO } from '../../../../src/lib/motion/introTimeline';
import { renderAstro } from '../../helpers/renderAstro';

/** Class list of the first `<tag>` element in the markup. */
function classesOf(html: string, tag: string): string[] {
  const match = new RegExp(`<${tag}\\b[^>]*\\bclass="([^"]*)"`).exec(html);
  return match?.[1]?.split(/\s+/) ?? [];
}

describe('SectionHeader', () => {
  it('renders the h2 heading and lead with the light tone', async () => {
    const html = await renderAstro(SectionHeader, {
      props: {
        heading: 'Commitment to health',
        lead: 'Colombian company…',
        headingId: 'about-title',
      },
    });
    const [lead, ...others] = [...html.matchAll(/<p class="([^"]*)">([^<]*)<\/p>/g)];

    expect(others).toHaveLength(0);
    expect(html).toContain('<h2 id="about-title"');
    expect(classesOf(html, 'h2')).toEqual(
      expect.arrayContaining(['font-heading', 'md:text-headline-xl', 'text-on-surface']),
    );
    expect(html).toContain('Commitment to health');
    expect(lead?.[1]?.split(' ')).toEqual(
      expect.arrayContaining(['text-body-lg', 'text-on-surface-variant']),
    );
    expect(classesOf(html, 'div')).not.toContain('items-center');
  });

  it('wraps the heading text in a primary band when highlighted', async () => {
    const html = await renderAstro(SectionHeader, {
      props: { heading: 'Engineering and supplies', lead: 'Since 2015…', highlight: true },
    });

    expect(classesOf(html, 'h2')).not.toContain('text-on-surface');
    expect(classesOf(html, 'span')).toEqual(
      expect.arrayContaining(['bg-primary', 'text-on-primary', 'box-decoration-clone']),
    );
    expect(html).toMatch(/<span[^>]*>\s*Engineering and supplies\s*<\/span>/);
    expect(classesOf(html, 'p')).toEqual(expect.arrayContaining(['mt-space-lg', 'max-w-3xl']));
    expect(classesOf(html, 'div')).not.toContain('max-w-3xl');
  });

  it('appends heading classes to the heading element', async () => {
    const html = await renderAstro(SectionHeader, {
      props: { heading: 'Engineering and supplies', headingClass: 'lg:whitespace-nowrap' },
    });

    expect(classesOf(html, 'h2')).toEqual(
      expect.arrayContaining(['font-heading', 'lg:whitespace-nowrap']),
    );
  });

  it('appends lead classes to the lead paragraph', async () => {
    const html = await renderAstro(SectionHeader, {
      props: { heading: 'Contact', lead: 'Lead text', leadClass: 'lg:whitespace-nowrap' },
    });

    expect(classesOf(html, 'p')).toEqual(
      expect.arrayContaining(['leading-relaxed', 'lg:whitespace-nowrap']),
    );
  });

  it('renders the lead slot when it needs inline markup', async () => {
    const html = await renderAstro(SectionHeader, {
      props: { heading: 'Integrated policy' },
      slots: { lead: 'For <span class="text-primary">Acme</span>, safety first.' },
    });

    expect(html).toMatch(
      /<p class="[^"]*\btext-body-lg\b[^"]*">\s*For <span class="text-primary">Acme<\/span>, safety first\./,
    );
  });

  it('omits the optional lead', async () => {
    const html = await renderAstro(SectionHeader, { props: { heading: 'Contact us' } });

    expect(html).not.toContain('<p');
  });

  it('supports center alignment, primary tone, md lead and a custom heading level', async () => {
    const html = await renderAstro(SectionHeader, {
      props: {
        heading: 'Biomedical engineering',
        lead: 'We guarantee…',
        as: 'h3',
        align: 'center',
        tone: 'primary',
        leadSize: 'md',
      },
    });

    expect(classesOf(html, 'div')).toEqual(expect.arrayContaining(['items-center', 'text-center']));
    expect(classesOf(html, 'h3')).toContain('text-on-primary');
    expect(html).toMatch(/<p class="[^"]*text-body-md[^"]*\btext-primary-fixed\b/);
  });

  it('with an intro, is a sequence of its own unless it joins the enclosing one', async () => {
    const props = { heading: 'Contáctanos', lead: 'Atención personalizada', intro: HISTORY_INTRO };
    const own = await renderAstro(SectionHeader, { props });
    const joined = await renderAstro(SectionHeader, { props: { ...props, introRoot: false } });

    expect(own).toMatch(/^<div class="[^"]*" data-intro-root data-intro-trigger="view">/);
    expect(joined).not.toContain('data-intro-root');
    // The heading and the typed lead animate either way.
    for (const html of [own, joined]) {
      expect(html).toMatch(/<h2 data-intro style="[^"]*--intro-y: 24px/);
      expect(html).toMatch(/<p [^>]*data-typewriter[^>]*data-typewriter-trigger="view"/);
    }
  });
});
