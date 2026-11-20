import { describe, expect, it } from 'vitest';
import TokenSample from './fixtures/TokenSample.astro';
import { compileTailwind, extractClasses } from './helpers/compileTailwind';
import { renderAstro } from './helpers/renderAstro';

/** Returns the body of the generated rule for a utility class, or undefined if it was not built. */
function ruleFor(css: string, className: string): string | undefined {
  const match = css.match(new RegExp(`\\.${className} \\{([^}]*)\\}`));
  return match?.[1];
}

describe('design tokens', () => {
  it('builds every token utility used by a rendered component', async () => {
    const html = await renderAstro(TokenSample);
    const classes = extractClasses(html);
    const css = await compileTailwind(classes);

    expect(classes).toContain('bg-primary');
    expect(classes).toContain('text-headline-xl');
    for (const className of classes) {
      expect(ruleFor(css, className), `utility "${className}" was not generated`).toBeDefined();
    }
  });

  it('resolves utilities to the design token values', async () => {
    const css = await compileTailwind(['bg-primary', 'text-headline-xl', 'shadow-sm']);

    expect(css).toContain('--color-primary: #0057cd');
    expect(ruleFor(css, 'bg-primary')).toContain('var(--color-primary)');
    expect(css).toContain('--text-headline-xl: 2.5rem');
    expect(css).toContain('--text-headline-xl--font-weight: 700');
    expect(ruleFor(css, 'text-headline-xl')).toContain('var(--text-headline-xl--line-height)');
    // Tailwind v4 inlines shadow tokens into the utility instead of emitting a variable.
    expect(ruleFor(css, 'shadow-sm')).toContain(
      '0 1px 2px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.05))',
    );
  });

  it('does not generate utilities from the default Tailwind palette', async () => {
    const css = await compileTailwind(['bg-blue-500', 'text-gray-900']);

    expect(ruleFor(css, 'bg-blue-500')).toBeUndefined();
    expect(ruleFor(css, 'text-gray-900')).toBeUndefined();
  });
});
