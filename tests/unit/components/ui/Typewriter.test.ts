import { describe, expect, it } from 'vitest';
import Typewriter from '../../../../src/components/ui/Typewriter.astro';
import { TYPEWRITER_DEFAULTS } from '../../../../src/lib/typewriter/typewriter';
import { renderAstro } from '../../helpers/renderAstro';

const TEXT = 'Hola, mundo médico';

async function render(props: Record<string, unknown> = {}): Promise<string> {
  return renderAstro(Typewriter, { props: { text: TEXT, ...props } });
}

describe('Typewriter', () => {
  it('renders a paragraph with the default options as data attributes', async () => {
    const html = await render();

    expect(html).toMatch(/^<p [^>]*data-typewriter\b/);
    expect(html).toContain(`data-typewriter-speed="${TYPEWRITER_DEFAULTS.speed}"`);
    expect(html).toContain('data-typewriter-delay="0"');
    expect(html).toContain('data-typewriter-trigger="load"');
    expect(html).toContain('data-typewriter-caret');
  });

  it('passes custom options, tag and classes', async () => {
    const html = await render({
      as: 'div',
      speed: 40,
      delay: 300,
      trigger: 'view',
      caret: false,
      class: 'text-body-md',
    });

    expect(html).toMatch(/^<div class="text-body-md"/);
    expect(html).toContain('data-typewriter-speed="40"');
    expect(html).toContain('data-typewriter-delay="300"');
    expect(html).toContain('data-typewriter-trigger="view"');
    expect(html).not.toContain('data-typewriter-caret');
  });

  it('chains after another typewriter and lets words break only when asked', async () => {
    const html = await render({ after: 'previous-text', breakWords: true });

    expect(html).toContain('data-typewriter-after="previous-text"');
    expect(html).toMatch(/ data-typewriter-break[ >]/);
    // A caret would move the mid-word breaks while typing.
    expect(html).not.toContain('data-typewriter-caret');
    expect(await render()).not.toMatch(/data-typewriter-(after|break)/);
  });

  it('exposes the full text once to assistive technology, without aria-live', async () => {
    const html = await render();

    expect(html).toContain(`<span class="sr-only">${TEXT}</span>`);
    expect(html).toMatch(/<span aria-hidden="true"><span data-typewriter-word>/);
    expect(html).not.toContain('aria-live');
  });

  it('renders every character up front, one span each, grouped per word', async () => {
    const html = await render();
    const visible = /<span aria-hidden="true">([\s\S]*)<\/span><\/p>/.exec(html)?.[1] ?? '';

    expect(visible.match(/data-typewriter-char/g)).toHaveLength(TEXT.length);
    expect(visible.match(/data-typewriter-word/g)).toHaveLength(3);
    // No whitespace between the spans, so the painted text is exactly the original.
    expect(visible.replace(/<[^>]+>/g, '')).toBe(TEXT);
  });
});
