import { readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import type { IconProps } from '../../../../src/components/ui/Icon.astro';
import Icon from '../../../../src/components/ui/Icon.astro';
import { ICON_NAMES } from '../../../../src/components/ui/iconNames';
import { renderAstro } from '../../helpers/renderAstro';

const ICONS_DIR = new URL('../../../../src/assets/icons/', import.meta.url);

describe('Icon', () => {
  it('inlines the local SVG as a decorative icon using currentColor', async () => {
    const html = await renderAstro(Icon, { props: { name: 'check-circle' } });

    expect(html).toMatch(/^<svg /);
    expect(html).toContain('viewBox="0 -960 960 960"');
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width="24"');
    expect(html).toContain('<path d="m421-298');
    expect(html).not.toContain('role="img"');
  });

  it('applies the size prop and extra classes', async () => {
    const html = await renderAstro(Icon, {
      props: { name: 'mail', size: 18, class: 'text-primary' },
    });

    expect(html).toContain('width="18"');
    expect(html).toContain('height="18"');
    expect(html).toContain('text-primary');
  });

  it('exposes an accessible name when a label is given', async () => {
    const html = await renderAstro(Icon, { props: { name: 'verified', label: 'Verified' } });

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Verified"');
    expect(html).not.toContain('aria-hidden');
  });

  it('keeps the generated icon names in sync with the SVG files', async () => {
    const files = (await readdir(ICONS_DIR))
      .filter((file) => file.endsWith('.svg'))
      .map((file) => file.replace(/\.svg$/, ''))
      .sort();

    expect([...ICON_NAMES]).toEqual(files);
  });

  it('rejects unknown icon names at type level', () => {
    // @ts-expect-error — 'not-an-icon' is not part of the generated IconName union.
    const invalid: IconProps['name'] = 'not-an-icon';
    expect(ICON_NAMES).not.toContain(invalid);
  });
});
