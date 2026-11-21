import { describe, expect, it } from 'vitest';
import EngineeringCallout from '../../../../src/components/sections/EngineeringCallout.astro';
import EngineeringSection from '../../../../src/components/sections/EngineeringSection.astro';
import { getRequestTypes } from '../../../../src/lib/data';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderCallout(): Promise<string> {
  return renderAstro(EngineeringCallout);
}

function button(html: string): string {
  return /<a [^>]*>[\s\S]*?<\/a>/.exec(html)?.[0] ?? '';
}

describe('EngineeringCallout', () => {
  it('renders a translucent, blurred, rounded banner', async () => {
    expect(await renderCallout()).toMatch(
      /^<div class="[^"]*\brounded-2xl bg-surface-container-lowest\/5 [^"]*\bbackdrop-blur-sm\b/,
    );
  });

  it('shows a round primary icon next to the title and text', async () => {
    const html = await renderCallout();

    expect(html).toMatch(
      /<span class="[^"]*\brounded-full bg-primary text-on-primary"[^>]*>\s*<svg /,
    );
    expect(html).toMatch(
      /<h3 class="[^"]*\btext-headline-sm\b[^"]*">\s*Need a diagnostic for your biomedical equipment\?\s*<\/h3>/,
    );
    expect(html).toContain(
      'Our engineers in Colombia assess your equipment according to regulatory protocols.',
    );
  });

  it('links the primary button to /#contact, preselecting engineering services', async () => {
    const cta = button(await renderCallout());
    const requestType = /data-request-type="([^"]+)"/.exec(cta)?.[1];

    expect(cta).toMatch(/href="\/#contact"/);
    expect(cta).toContain('Request a technical audit');
    expect(cta).toMatch(/class="[^"]*\bbg-primary\b/);
    expect(requestType).toBe('engineering-services');
    expect(getRequestTypes().find(({ id }) => id === requestType)?.label).toBe(
      'Biomedical Engineering & Calibration Services',
    );
  });

  it('stacks centered below sm and splits text and button from sm, never wrapping the button', async () => {
    const html = await renderCallout();

    expect(html).toMatch(
      /^<div class="flex flex-col items-center justify-between [^"]*\btext-center\b[^"]*\bsm:flex-row sm:text-start"/,
    );
    expect(button(html)).toMatch(/class="[^"]*\bshrink-0 whitespace-nowrap\b/);
  });

  it('is rendered at the end of the engineering section', async () => {
    const html = await renderAstro(EngineeringSection);

    expect(html.lastIndexOf('</ul>')).toBeLessThan(html.indexOf('Request a technical audit'));
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
