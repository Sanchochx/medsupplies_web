import { describe, expect, it } from 'vitest';
import Chip from '../../../../src/components/ui/Chip.astro';
import { renderAstro } from '../../helpers/renderAstro';

describe('Chip', () => {
  it('renders a fully rounded tag by default', async () => {
    const html = await renderAstro(Chip, { slots: { default: 'After-sales support' } });

    expect(html).toContain('rounded-full');
    expect(html).toContain('bg-surface-container-high');
    expect(html).toContain('text-label-sm');
    expect(html).toContain('text-on-surface-variant');
    expect(html).toContain('After-sales support');
    expect(html).not.toContain('<svg');
  });

  it('renders the eyebrow as a solid primary pill with white text, an icon and an uppercase label', async () => {
    const html = await renderAstro(Chip, {
      props: { variant: 'eyebrow', icon: 'verified-user' },
      slots: { default: 'Biomedical technology' },
    });

    expect(html).toContain('uppercase');
    expect(html).toMatch(/class="[^"]*\bbg-primary\b[^"]*\btext-on-primary\b/);
    expect(html).not.toContain('bg-surface-container-high');
    expect(html).toMatch(/<svg [^>]*aria-hidden="true"/);
    expect(html.indexOf('<svg')).toBeLessThan(html.indexOf('Biomedical technology'));
  });

  it('renders the inverse variant as a translucent white pill with white text and an icon', async () => {
    const html = await renderAstro(Chip, {
      props: { variant: 'inverse', icon: 'verified' },
      slots: { default: 'Total quality' },
    });

    expect(html).toMatch(/class="[^"]*\bborder-on-primary\/25\b[^"]*\bbg-on-primary\/12\b/);
    expect(html).toContain('text-label-lg');
    expect(html).toContain('text-on-primary');
    expect(html).not.toContain('text-label-sm');
    expect(html).toMatch(/<svg [^>]*aria-hidden="true"/);
  });
  it('forwards extra attributes to the pill', async () => {
    const html = await renderAstro(Chip, {
      props: { 'data-intro': true, style: '--intro-delay: 0ms' },
      slots: { default: 'Label' },
    });

    expect(html).toMatch(
      /^<span class="inline-flex[^"]*" data-intro(="true")? style="--intro-delay: 0ms">/,
    );
  });
});
