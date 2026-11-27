import { describe, expect, it } from 'vitest';
import DivisionsSection from '../../../../src/components/sections/DivisionsSection.astro';
import { getDivisionBanners, type DivisionPanel } from '../../../../src/lib/data';
import { renderAstro } from '../../helpers/renderAstro';

const PANEL_ID = 'division-hospital-panel';

async function renderPanel(): Promise<string> {
  const html = await renderAstro(DivisionsSection);
  const start = html.indexOf(`<div id="${PANEL_ID}"`);
  const end = html.indexOf('</article>', start);
  if (start === -1 || end === -1) throw new Error('Hospital panel not rendered');
  return html.slice(start, end);
}

function hospitalPanel(): DivisionPanel {
  const panel = getDivisionBanners()[0]?.panel;
  if (!panel) throw new Error('The hospital division has no panel');
  return panel;
}

function tabs(html: string): string[] {
  return [...html.matchAll(/<button [^>]*role="tab"[^>]*>[\s\S]*?<\/button>/g)].map(([tab]) => tab);
}

/** Each tab panel, up to the next one (or the footer). */
function tabPanels(html: string): string[] {
  return [
    ...html.matchAll(
      /<div role="tabpanel"[\s\S]*?(?=<div role="tabpanel"|<div class="flex flex-col gap-space-md border-t)/g,
    ),
  ].map(([panel]) => panel);
}

describe('DivisionPanel', () => {
  it('renders for the hospital and supplies divisions only', async () => {
    const html = await renderAstro(DivisionsSection);

    expect(html.match(/data-division-panel/g)).toHaveLength(2);
    expect(html).toContain(`<div id="${PANEL_ID}"`);
    expect(html).toContain('<div id="division-supplies-panel"');
  });

  it('attaches to the banner with no blue line between them', async () => {
    const html = await renderPanel();

    expect(html).toMatch(/<div class="bg-surface-container-low py-space-lg/);
    expect(html).not.toMatch(/\bborder-t-2\b|\bborder-primary\b/);
  });

  it('renders a tab list named by the division title, one tab per line, the first selected', async () => {
    const html = await renderPanel();
    const { lines } = hospitalPanel();
    const rendered = tabs(html);

    expect(html).toMatch(/<div role="tablist" aria-labelledby="division-hospital-title"/);
    expect(rendered).toHaveLength(lines.length);
    rendered.forEach((tab, index) => {
      const line = lines[index];
      expect(tab).toContain('type="button"');
      expect(tab).toContain(`id="${PANEL_ID}-tab-${line?.id}"`);
      expect(tab).toContain(`aria-controls="${PANEL_ID}-line-${line?.id}"`);
      expect(tab).toContain(`aria-selected="${index === 0}"`);
      expect(tab).toContain(`tabindex="${index === 0 ? 0 : -1}"`);
      expect(tab).toMatch(new RegExp(`>\\s*${line?.tabLabel}\\s*</button>$`));
      expect(tab).toMatch(/\bmin-h-11\b/); // 44px tap target.
    });
  });

  it('renders every line as a tab panel labelled by its tab; only the first is shown', async () => {
    const panels = tabPanels(await renderPanel());
    const { lines } = hospitalPanel();

    expect(panels).toHaveLength(lines.length);
    panels.forEach((panel, index) => {
      const line = lines[index];
      const open = /<div role="tabpanel"[^>]*>/.exec(panel)?.[0] ?? '';
      expect(open).toContain(`id="${PANEL_ID}-line-${line?.id}"`);
      expect(open).toContain(`aria-labelledby="${PANEL_ID}-tab-${line?.id}"`);
      expect(open).toContain('tabindex="0"');
      expect(/\shidden[\s>]/.test(open)).toBe(index !== 0);
    });
  });

  it('shows the "Línea NN" pill, the title and every item as a chip, in data order', async () => {
    const panels = tabPanels(await renderPanel());

    hospitalPanel().lines.forEach((line, index) => {
      const panel = panels[index] ?? '';
      const number = String(index + 1).padStart(2, '0');
      const names = line.kind === 'products' ? line.items : line.items.map(({ name }) => name);

      expect(panel).toMatch(
        new RegExp(`<span class="[^"]*\\buppercase\\b[^"]*">Línea ${number}</span>`),
      );
      expect(panel).toMatch(new RegExp(`<h3 class="[^"]*">\\s*${line.title}\\s*</h3>`));
      const chips = [...panel.matchAll(/<li [^>]*>[\s\S]*?<span>([^<]*)<\/span>\s*<\/li>/g)].map(
        ([, name]) => name,
      );
      expect(chips).toEqual(names);
    });
  });

  it('never truncates chip names: no ellipsis or line clamp', async () => {
    const html = await renderPanel();

    expect(html).not.toMatch(/\b(truncate|line-clamp-\d|text-ellipsis)\b/);
    expect(html).not.toContain('…');
  });

  it('shows one photo loop for the whole division, beside the lines and outside every tab', async () => {
    const html = await renderPanel();
    const count = hospitalPanel().images.length;

    expect(html.match(/data-division-photo/g)).toHaveLength(1);
    expect(html).toMatch(/data-division-photo data-photo-rotator/);
    for (const panel of tabPanels(html)) expect(panel).not.toMatch(/<img\b/);
    // The loop comes before the tab panels: on top on small screens, on the left from md.
    expect(html.indexOf('data-division-photo')).toBeLessThan(html.indexOf('role="tabpanel"'));
    expect(html.match(/<img\b/g)).toHaveLength(count);
    expect(html.match(/data-slide\b/g)).toHaveLength(count);
    const states = [...html.matchAll(/data-state="([a-z]+)"/g)].map(([, state]) => state);
    expect(states.slice(0, 3)).toEqual(['active', 'next', 'idle']);
  });

  it('shows just the photos: no frame, halo, placeholder, dots or pause button', async () => {
    const html = await renderPanel();
    const loop =
      /<div class="[^"]*" data-division-photo[\s\S]*?(?=<div class="md:col-span)/.exec(html)?.[0] ??
      '';

    expect(loop).not.toMatch(/\b(bg-surface-container-lowest|shadow-md|bg-radial|rounded-2xl)\b/);
    expect(loop).not.toMatch(/<button\b|data-slide-dot|data-rotation-toggle|placeholder/);
    for (const img of loop.match(/<img [^>]*>/g) ?? []) {
      expect(img).toMatch(/\salt(="")?[\s>]/);
      expect(img).toContain('loading="lazy"');
      expect(img).toMatch(/\bobject-contain\b/);
      expect(img).toMatch(/\bmix-blend-multiply\b/);
    }
  });

  it('adds no invented copy: no captions or descriptions from the design mockup', async () => {
    const html = await renderPanel();

    expect(html).not.toMatch(/<p\b(?![^>]*data-line-counter)/);
    expect(html).not.toMatch(/Administración parenteral|venoclisis|alta rotación/i);
  });

  it('ends with the line counter, prev/next arrows (prev disabled) and the quote button', async () => {
    const html = await renderPanel();
    const count = hospitalPanel().lines.length;

    expect(html).toMatch(
      new RegExp(
        `<p data-line-counter aria-live="polite"[^>]*>\\s*Mostrando línea 1 de ${count}\\s*</p>`,
      ),
    );
    const prev = /<button [^>]*data-line-prev[^>]*>/.exec(html)?.[0] ?? '';
    const next = /<button [^>]*data-line-next[^>]*>/.exec(html)?.[0] ?? '';
    expect(prev).toContain('aria-label="Línea anterior"');
    expect(prev).toMatch(/\sdisabled[\s>]/);
    expect(next).toContain('aria-label="Línea siguiente"');
    expect(next).not.toMatch(/\sdisabled[\s>]/);
    for (const arrow of [prev, next]) expect(arrow).toMatch(/\bsize-11\b/);
    expect(html).toMatch(/<a [^>]*href="\/#contacto"[^>]*>\s*Solicitar cotización/);
  });
});
