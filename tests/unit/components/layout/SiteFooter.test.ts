import { describe, expect, it } from 'vitest';
import SiteFooter from '../../../../src/components/layout/SiteFooter.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderFooter(): Promise<string> {
  return renderAstro(SiteFooter);
}

/** Markup of the column whose heading has the given text, up to the next column. */
function columnMarkup(html: string, heading: string): string {
  const start = html.lastIndexOf('<', html.search(new RegExp(`>\\s*${heading}\\s*</h2>`)));
  const nextHeading = html.indexOf('<h2', start + 1);
  return html.slice(start, nextHeading === -1 ? html.indexOf('</footer>') : nextHeading);
}

function linksIn(markup: string): string[][] {
  return [...markup.matchAll(/<a href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/g)].map(
    ([, href, label]) => [label ?? '', href ?? ''],
  );
}

describe('SiteFooter', () => {
  it('is a footer landmark with the four column headings, in order', async () => {
    const html = await renderFooter();
    const headings = [...html.matchAll(/<h2[^>]*>\s*([^<]+?)\s*<\/h2>/g)].map(([, text]) => text);

    expect(html).toMatch(/^<footer /);
    expect(headings).toEqual(['Medsupplies', 'Navigation', 'Direct Contact', 'Digital Presence']);
  });

  it('shows the brand description and the compliance badge from the data file', async () => {
    const html = await renderFooter();

    expect(html).toContain(
      'Advanced solutions in biomedical technology, hospital equipment and specialized technical support with high standards of quality and institutional rigor.',
    );
    expect(html).toContain('Operating under INVIMA standards');
    expect(html).toMatch(/<img [^>]*alt="Medsupplies Ingeniería S\.A\.S\."[^>]*width="32"/);
  });

  it('lists the header’s section links under a labelled nav', async () => {
    const html = await renderFooter();
    const nav = columnMarkup(html, 'Navigation');

    expect(html).toContain('<nav aria-labelledby="footer-navigation-heading">');
    expect(nav).toContain('<ul');
    expect(linksIn(nav)).toEqual([
      ['Home', '/#home'],
      ['About', '/#about'],
      ['Products', '/#products'],
      ['Engineering', '/#engineering'],
      ['Why Choose Us', '/#why-us'],
      ['Contact', '/#contact'],
    ]);
  });

  it('shows the address, a tel: link, a mailto: link and the hours, each with an icon', async () => {
    const contact = columnMarkup(await renderFooter(), 'Direct Contact');

    expect(contact).toContain('Main office: Bogotá D.C., Colombia');
    expect(contact).toContain('Monday to Friday: 7:30 AM – 5:30 PM');
    expect(linksIn(contact)).toEqual([
      ['+57 (601) 000-0000', 'tel:+576010000000'],
      ['contact@example.com', 'mailto:contact@example.com'],
    ]);
    expect(contact.match(/<li /g)).toHaveLength(4);
    expect(contact.match(/<svg [^>]*aria-hidden="true"/g)).toHaveLength(4);
  });

  it('renders the social links as named icon links with the brand icons', async () => {
    const social = columnMarkup(await renderFooter(), 'Digital Presence');

    expect(social).toContain(
      'Connect with our technical and engineering team through official channels.',
    );
    expect(social).toMatch(
      /<a href="#" aria-label="Medsupplies on LinkedIn"[^>]*>\s*<svg [^>]*viewBox="0 0 24 24"/,
    );
    expect(social).toMatch(
      /<a href="#" aria-label="Medsupplies on Instagram"[^>]*>\s*<svg [^>]*viewBox="0 0 24 24"/,
    );
  });

  it('shows the copyright with the current year and the legal links', async () => {
    const html = await renderFooter();
    const year = new Date().getFullYear();

    expect(html).toContain(
      `© ${year} Medsupplies Ingeniería S.A.S. All rights reserved. Colombia.`,
    );
    expect(html).toMatch(
      /<a href="\/privacy-policy"[^>]*>\s*Personal Data Processing Policy\s*<\/a>/,
    );
    expect(html).toMatch(/<a href="#"[^>]*>\s*INVIMA Regulatory Compliance\s*<\/a>/);
  });

  it('uses 1, 2 and 4 columns and stacks the bottom bar below md', async () => {
    const html = await renderFooter();

    expect(html).toMatch(/class="[^"]*\bgrid\b[^"]*\bmd:grid-cols-2\b[^"]*\blg:grid-cols-4\b/);
    expect(html).toMatch(/class="flex flex-col [^"]*border-t [^"]*md:flex-row/);
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderFooter());
    const css = await compileTailwind(classes);

    const missing = classes.filter((className) => {
      // CSS-escape the class as Tailwind emits it, then regex-escape that selector text.
      const selector = `.${className.replace(/[:/.[\]()=,]/g, (char) => `\\${char}`)}`;
      const pattern = selector.replace(/[\\^$.*+?()[\]{}|]/g, (char) => `\\${char}`);
      return !new RegExp(`${pattern}[\\s:{,[]`).test(css);
    });
    expect(missing).toEqual([]);
  });
});
