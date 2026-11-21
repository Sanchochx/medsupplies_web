import { describe, expect, it } from 'vitest';
import SectionHeader from '../../../../src/components/ui/SectionHeader.astro';
import { renderAstro } from '../../helpers/renderAstro';

/** Class list of the first `<tag>` element in the markup. */
function classesOf(html: string, tag: string): string[] {
  const match = new RegExp(`<${tag}\\b[^>]*\\bclass="([^"]*)"`).exec(html);
  return match?.[1]?.split(/\s+/) ?? [];
}

describe('SectionHeader', () => {
  it('renders eyebrow, h2 heading and lead with the light tone', async () => {
    const html = await renderAstro(SectionHeader, {
      props: {
        eyebrow: 'About us',
        heading: 'Commitment to health',
        lead: 'Colombian company…',
        headingId: 'about-title',
      },
    });
    const [eyebrow, lead] = [...html.matchAll(/<p class="([^"]*)">([^<]*)<\/p>/g)];

    expect(eyebrow?.[2]).toBe('About us');
    expect(eyebrow?.[1]?.split(' ')).toEqual(
      expect.arrayContaining(['uppercase', 'tracking-widest', 'text-label-md', 'text-primary']),
    );
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

  it('omits the optional eyebrow and lead', async () => {
    const html = await renderAstro(SectionHeader, { props: { heading: 'Contact us' } });

    expect(html).not.toContain('<p');
  });

  it('supports center alignment, dark tone, md lead and a custom heading level', async () => {
    const html = await renderAstro(SectionHeader, {
      props: {
        eyebrow: 'Services',
        heading: 'Biomedical engineering',
        lead: 'We guarantee…',
        as: 'h3',
        align: 'center',
        tone: 'dark',
        leadSize: 'md',
      },
    });

    expect(classesOf(html, 'div')).toEqual(expect.arrayContaining(['items-center', 'text-center']));
    expect(classesOf(html, 'h3')).toContain('text-surface-bright');
    expect(html).toContain('text-primary-fixed');
    expect(html).toMatch(/<p class="[^"]*text-body-md[^"]*text-surface-variant\/80/);
  });
});
