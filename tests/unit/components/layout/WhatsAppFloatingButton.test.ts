import { describe, expect, it } from 'vitest';
import WhatsAppFloatingButton from '../../../../src/components/layout/WhatsAppFloatingButton.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderButton(): Promise<string> {
  return renderAstro(WhatsAppFloatingButton);
}

function classesOf(html: string): string[] {
  return (/class="([^"]+)"/.exec(html)?.[1] ?? '').split(' ');
}

describe('WhatsAppFloatingButton', () => {
  it('opens the WhatsApp chat with the configured number in a new tab', async () => {
    const html = await renderButton();

    expect(html).toMatch(
      /^<a href="https:\/\/wa\.me\/573114472353" target="_blank" rel="noopener noreferrer"/,
    );
  });

  it('is named for assistive tech and draws the WhatsApp logo as a decorative icon', async () => {
    const html = await renderButton();

    expect(html).toContain(
      'aria-label="Escríbanos por WhatsApp (abre WhatsApp en una pestaña nueva)"',
    );
    const svg = /<svg [^>]*>/.exec(html)?.[0] ?? '';
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('viewBox="0 0 24 24"');
  });

  it('is a green round button fixed to the bottom right corner', async () => {
    expect(classesOf(await renderButton())).toEqual(
      expect.arrayContaining([
        'fixed',
        'right-space-md',
        'bottom-space-md',
        'z-40',
        'size-14',
        'rounded-full',
        'bg-whatsapp',
        'text-on-primary',
        'hover:bg-whatsapp-hover',
      ]),
    );
  });

  it('floats only when motion is allowed, and pauses on hover', async () => {
    const classes = classesOf(await renderButton());

    expect(classes).toContain('motion-safe:animate-float');
    expect(classes).not.toContain('animate-float');
    expect(classes).toContain('hover:[animation-play-state:paused]');
  });

  it('defines the float keyframes with transform only', async () => {
    const css = await compileTailwind(['motion-safe:animate-float']);

    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)/);
    expect(css).toMatch(/animation: var\(--animate-float\)/);
    expect(css).toMatch(/@keyframes float \{[^@]*translateY\(-6px\)/);
    expect(css).not.toMatch(/@keyframes float \{[^@]*\b(?:top|bottom|margin)\b/);
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderButton());
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
