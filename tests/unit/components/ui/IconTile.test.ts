import { describe, expect, it } from 'vitest';
import IconTile from '../../../../src/components/ui/IconTile.astro';
import { renderAstro } from '../../helpers/renderAstro';

describe('IconTile', () => {
  it('renders a 40px light tile by default', async () => {
    const html = await renderAstro(IconTile, { props: { icon: 'verified' } });

    expect(html).toContain('size-10');
    expect(html).toContain('rounded-lg');
    expect(html).toContain('bg-surface-container-high');
    expect(html).toContain('text-primary');
    expect(html).toContain('width="22"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders the 48px solid variant', async () => {
    const html = await renderAstro(IconTile, {
      props: { icon: 'build', size: 'lg', tone: 'solid' },
    });

    expect(html).toContain('size-12');
    expect(html).toContain('rounded-xl');
    expect(html).toContain('bg-primary-container');
    expect(html).toContain('text-on-primary');
    expect(html).toContain('width="24"');
  });
});
