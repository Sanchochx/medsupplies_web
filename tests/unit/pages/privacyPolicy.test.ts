import { describe, expect, it } from 'vitest';
import PrivacyPolicy from '../../../src/pages/privacy-policy.astro';
import { renderAstro } from '../helpers/renderAstro';

async function renderPage(): Promise<string> {
  return renderAstro(PrivacyPolicy);
}

describe('privacy-policy page', () => {
  it('uses the base layout with the site header and footer', async () => {
    const html = await renderPage();

    expect(html).toContain('<html lang="en"');
    expect(html).toContain(
      '<title>Personal Data Processing Policy | Medsupplies Ingeniería S.A.S.</title>',
    );
    expect(html).toContain('data-site-header');
    expect(html).toMatch(/<main id="main-content"[\s\S]*<\/main>\s*<footer /);
  });

  it('shows only the title and the visible placeholder notice', async () => {
    const html = await renderPage();
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const text = main
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    expect(main).toMatch(/<h1[^>]*>\s*Personal Data Processing Policy\s*<\/h1>/);
    expect(text).toBe(
      'Personal Data Processing Policy Placeholder — the final policy text will be provided by Medsupplies Ingeniería S.A.S.',
    );
  });
});
