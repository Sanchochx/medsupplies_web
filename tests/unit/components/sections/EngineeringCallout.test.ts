import { describe, expect, it } from 'vitest';
import EngineeringCallout from '../../../../src/components/sections/EngineeringCallout.astro';
import EngineeringSection from '../../../../src/components/sections/EngineeringSection.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderCallout(): Promise<string> {
  return renderAstro(EngineeringCallout);
}

function button(html: string): string {
  return /<a [^>]*>[\s\S]*?<\/a>/.exec(html)?.[0] ?? '';
}

describe('EngineeringCallout', () => {
  it('renders a rounded primary banner with the inverse focus ring', async () => {
    expect(await renderCallout()).toMatch(
      /^<div class="focus-ring-inverse [^"]*\brounded-2xl bg-primary\b/,
    );
  });

  it('shows a round white icon next to the light title and text', async () => {
    const html = await renderCallout();

    expect(html).toMatch(
      /<span class="[^"]*\brounded-full bg-surface-container-lowest text-primary"[^>]*>\s*<svg /,
    );
    expect(html).toMatch(
      /<h3 class="[^"]*\btext-headline-sm\b[^"]*\btext-on-primary">\s*¿Necesita un diagnóstico para sus equipos biomédicos\?\s*<\/h3>/,
    );
    expect(html).toContain(
      'Nuestros ingenieros en Colombia evalúan sus equipos según los protocolos normativos.',
    );
  });

  it('links the white button to /#contacto', async () => {
    const cta = button(await renderCallout());

    expect(cta).toMatch(/href="\/#contacto"/);
    expect(cta).toContain('Solicitar auditoría técnica');
    expect(cta).toMatch(/class="[^"]*\bbg-surface-container-lowest\b/);
  });

  it('stacks centered below sm and splits text and button from sm, never wrapping the button', async () => {
    const html = await renderCallout();

    expect(html).toMatch(
      /^<div class="focus-ring-inverse flex flex-col items-center justify-between [^"]*\btext-center\b[^"]*\bsm:flex-row sm:text-start"/,
    );
    expect(button(html)).toMatch(/class="[^"]*\bshrink-0 whitespace-nowrap\b/);
  });

  it('is rendered at the end of the engineering section', async () => {
    const html = await renderAstro(EngineeringSection);

    expect(html.lastIndexOf('</ul>')).toBeLessThan(html.indexOf('Solicitar auditoría técnica'));
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderCallout());
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
