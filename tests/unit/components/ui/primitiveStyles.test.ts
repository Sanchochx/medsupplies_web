import { describe, expect, it } from 'vitest';
import Button from '../../../../src/components/ui/Button.astro';
import Chip from '../../../../src/components/ui/Chip.astro';
import Container from '../../../../src/components/ui/Container.astro';
import IconTile from '../../../../src/components/ui/IconTile.astro';
import SectionHeader from '../../../../src/components/ui/SectionHeader.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

/** Renders every variant of every primitive. */
async function renderAllVariants(): Promise<string> {
  const renders = [
    renderAstro(Container),
    ...(['primary', 'neutral', 'soft', 'link', 'link-inverse'] as const).flatMap((variant) =>
      (['sm', 'md', 'lg'] as const).map((size) =>
        renderAstro(Button, { props: { href: '#', variant, size, fullWidth: true } }),
      ),
    ),
    renderAstro(Button, { props: { disabled: true } }),
    ...(['md', 'lg'] as const).flatMap((size) =>
      (['light', 'solid'] as const).map((tone) =>
        renderAstro(IconTile, { props: { icon: 'build', size, tone } }),
      ),
    ),
    renderAstro(Chip),
    renderAstro(Chip, { props: { variant: 'eyebrow', icon: 'verified' } }),
    renderAstro(Chip, { props: { variant: 'inverse', icon: 'verified' } }),
    ...(['light', 'primary'] as const).flatMap((tone) =>
      (['md', 'lg'] as const).map((leadSize) =>
        renderAstro(SectionHeader, {
          props: { heading: 'H', lead: 'L', tone, leadSize, align: 'center' },
        }),
      ),
    ),
  ];
  return (await Promise.all(renders)).join('\n');
}

describe('UI primitive styles', () => {
  it('only use utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderAllVariants());
    const css = await compileTailwind(classes);

    const missing = classes.filter((className) => {
      const escaped = className.replace(/[:/.[\]()]/g, (char) => `\\\\${char}`);
      return !new RegExp(`\\.${escaped}[\\s:{,]`).test(css);
    });
    expect(missing).toEqual([]);
  });

  it('provide a visible focus ring, with an inverse variant for dark and blue sections', async () => {
    const css = await compileTailwind(['focus-ring-inverse']);

    expect(css).toMatch(
      /:focus-visible \{\s*outline: 2px solid var\(--focus-ring-color, var\(--color-primary\)\);/,
    );
    expect(css).toMatch(
      /\.focus-ring-inverse \{\s*--focus-ring-color: var\(--color-primary-fixed\);/,
    );
  });
});
