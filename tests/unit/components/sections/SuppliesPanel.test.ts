import { describe, expect, it } from 'vitest';
import DivisionsSection from '../../../../src/components/sections/DivisionsSection.astro';
import { renderAstro } from '../../helpers/renderAstro';

const PANEL_ID = 'division-supplies-panel';

async function renderPanel(): Promise<string> {
  const html = await renderAstro(DivisionsSection);
  const start = html.indexOf(`<div id="${PANEL_ID}"`);
  const end = html.indexOf('</article>', start);
  if (start === -1 || end === -1) throw new Error('Supplies panel not rendered');
  return html.slice(start, end);
}

function tabPanels(html: string): string[] {
  return [
    ...html.matchAll(
      /<div role="tabpanel"[\s\S]*?(?=<div role="tabpanel"|<div [^>]*data-motion="footer")/g,
    ),
  ].map(([panel]) => panel);
}

describe('Supplies division panel', () => {
  it('is a collapsed, labelled region below the supplies banner with two tabs', async () => {
    const html = await renderPanel();

    expect(html).toMatch(
      /^<div id="division-supplies-panel" role="region" aria-labelledby="division-supplies-title" aria-hidden="true" inert/,
    );
    expect(html).toMatch(/<div role="tablist" aria-labelledby="division-supplies-title"/);
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    // Two short pills: the bar keeps its left alignment instead of stretching them.
    expect(html).not.toMatch(/role="tab"[^>]*class="[^"]*\b(flex-1|grow|w-full)\b/);
    expect(html).not.toMatch(/role="tablist"[^>]*class="[^"]*\bjustify-(between|center|evenly)\b/);
  });

  it('numbers the lines 01 and 02 and starts on the first one', async () => {
    const html = await renderPanel();
    const [cleaning, disposables] = tabPanels(html);

    expect(cleaning).toMatch(/>Línea 01<\/span>/);
    expect(disposables).toMatch(/>Línea 02<\/span>/);
    expect(cleaning).not.toMatch(/^<div role="tabpanel"[^>]*\shidden[\s>]/);
    expect(disposables).toMatch(/^<div role="tabpanel"[^>]*\shidden[\s>]/);
    expect(html).toMatch(/Mostrando línea 1 de 2/);
  });

  it('shows the INVIMA badge under the cleaning title and no paragraph there', async () => {
    const [cleaning] = tabPanels(await renderPanel());

    expect(cleaning).toMatch(
      /<\/h3>\s*<span [^>]*>\s*<svg[\s\S]*?<\/svg>\s*Productos certificados y con registro INVIMA\s*<\/span>/,
    );
    expect(cleaning).not.toMatch(/<p\b/);
  });

  it('shows the catalog description as a paragraph only on the disposables line', async () => {
    const [, disposables] = tabPanels(await renderPanel());

    expect(disposables).toMatch(
      /<\/h3>\s*<p class="[^"]*"[^>]*>\s*Provienen de recursos naturales renovables\. Reducen las emisiones de CO2,[^<]*otros envases\.\s*<\/p>/,
    );
    expect(disposables).not.toContain('registro INVIMA');
  });

  it('has its own photo loop with the 7 photos of both lines, outside the tabs', async () => {
    const html = await renderPanel();

    expect(html.match(/data-division-photo data-photo-rotator/g)).toHaveLength(1);
    expect(html.match(/data-slide\b/g)).toHaveLength(7);
    for (const panel of tabPanels(html)) expect(panel).not.toMatch(/<img\b/);
  });

  it('has no quote button, like the hospital panel', async () => {
    expect(await renderPanel()).not.toContain('Solicitar cotización');
  });
});
