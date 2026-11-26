import { describe, expect, it } from 'vitest';
import Button from '../../../../src/components/ui/Button.astro';
import { renderAstro } from '../../helpers/renderAstro';

const slots = { default: 'Solicitar cotización' };

describe('Button', () => {
  it('renders an anchor when href is passed', async () => {
    const html = await renderAstro(Button, { props: { href: '#contacto' }, slots });

    expect(html).toMatch(/^<a /);
    expect(html).toContain('href="#contacto"');
    expect(html).toContain('Solicitar cotización');
    expect(html).not.toContain('type="button"');
  });

  it('renders a non-submitting button when no href is passed', async () => {
    const html = await renderAstro(Button, { slots });

    expect(html).toMatch(/^<button /);
    expect(html).toContain('type="button"');
  });

  it('lets a native button override its type', async () => {
    const html = await renderAstro(Button, { props: { type: 'submit' }, slots });

    expect(html).toContain('type="submit"');
    expect(html).not.toContain('type="button"');
  });

  it.each([
    ['primary', ['bg-primary', 'hover:bg-secondary', 'active:scale-95']],
    ['neutral', ['bg-surface-container-lowest', 'shadow-sm', 'hover:bg-surface-container-high']],
    ['soft', ['bg-surface-container-high', 'text-primary', 'hover:bg-primary']],
    ['link', ['text-primary', 'hover:text-secondary', 'hover:underline']],
    ['link-inverse', ['text-on-primary', 'hover:text-primary-fixed', 'hover:underline']],
  ] as const)('applies the %s variant styles', async (variant, expected) => {
    const html = await renderAstro(Button, { props: { href: '#', variant }, slots });

    for (const className of expected) expect(html).toContain(className);
  });

  it('renders leading and trailing icons and the full-width option', async () => {
    const html = await renderAstro(Button, {
      props: { href: '#', iconStart: 'assignment', iconEnd: 'chevron-right', fullWidth: true },
      slots,
    });

    expect(html.match(/<svg /g)).toHaveLength(2);
    expect(html.indexOf('<svg')).toBeLessThan(html.indexOf('Solicitar cotización'));
    expect(html.lastIndexOf('<svg')).toBeGreaterThan(html.indexOf('Solicitar cotización'));
    expect(html).toContain('w-full');
  });

  it('adds a trailing arrow to the link variant and no padding', async () => {
    const html = await renderAstro(Button, { props: { href: '#', variant: 'link' }, slots });

    expect(html.match(/<svg /g)).toHaveLength(1);
    expect(html.lastIndexOf('<svg')).toBeGreaterThan(html.indexOf('Solicitar cotización'));
    expect(html).not.toContain('px-space-lg');
  });
});
