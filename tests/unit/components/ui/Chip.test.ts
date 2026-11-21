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

  it('renders the eyebrow pill with an icon and uppercase label', async () => {
    const html = await renderAstro(Chip, {
      props: { variant: 'eyebrow', icon: 'verified-user' },
      slots: { default: 'Biomedical technology' },
    });

    expect(html).toContain('uppercase');
    expect(html).toContain('text-primary');
    expect(html).toMatch(/<svg [^>]*aria-hidden="true"/);
    expect(html.indexOf('<svg')).toBeLessThan(html.indexOf('Biomedical technology'));
  });
});
