import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import ContactSection from '../../../../src/components/sections/ContactSection.astro';
import { getContactChannels, getMapEmbedUrl, getWhatsAppUrl } from '../../../../src/lib/data';
import IndexPage from '../../../../src/pages/index.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

const WHATSAPP_ICON_PATH = /\bd="[^"]+"/.exec(
  readFileSync(new URL('../../../../src/assets/icons/whatsapp.svg', import.meta.url), 'utf8'),
)?.[0];

async function renderContact(): Promise<string> {
  return renderAstro(ContactSection);
}

function contactRows(html: string): string[] {
  return [...html.matchAll(/<li [\s\S]*?<\/li>/g)].map(([row]) => row);
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/<a [^>]*href="([^"]+)"/g)].map(([, href]) => href ?? '');
}

function whatsAppLink(html: string): string {
  return /<a [^>]*href="https:\/\/wa\.me\/[^"]*"[^>]*>[\s\S]*?<\/a>/.exec(html)?.[0] ?? '';
}

function iframe(html: string): string {
  return /<iframe [^>]*>/.exec(html)?.[0] ?? '';
}

describe('ContactSection', () => {
  it('is the #contacto section on a light background, labelled by its heading', async () => {
    expect(await renderContact()).toMatch(
      /^<section id="contacto" aria-labelledby="contact-heading" class="[^"]*\bbg-surface-container-low\b/,
    );
  });

  it('puts the generic photo behind the section as a decorative, veiled background', async () => {
    const html = await renderContact();

    expect(html).toMatch(/^<section [^>]*class="relative isolate /);
    expect(html).toMatch(
      /<img [^>]*src="[^"]*image_generica[^"]*"[^>]* alt(="")? [^>]*class="absolute inset-0 -z-10 size-full object-cover"/,
    );
    expect(html).toMatch(
      /<div aria-hidden="true" class="absolute inset-0 -z-10 bg-surface-container-low\/80"/,
    );
  });

  it('uses the shared highlighted, centered section heading', async () => {
    const html = await renderContact();

    expect(html).toMatch(/<h2 id="contact-heading" class="[^"]*\buppercase\b[^"]*">/);
    expect(html).toMatch(/<span class="[^"]*\bbg-primary\b[^"]*">Contáctenos<\/span>/);
    expect(html).not.toContain('<form');
  });

  it('keeps the lead on a single line from lg', async () => {
    expect(await renderContact()).toMatch(
      /<p class="[^"]*\blg:max-w-none lg:whitespace-nowrap\b[^"]*">\s*Atención personalizada/,
    );
  });

  it('renders the card before the map, and moves the map to the left column from lg', async () => {
    const html = await renderContact();

    expect(html.indexOf('<ul')).toBeLessThan(html.indexOf('<iframe'));
    expect(html).toMatch(/<div class="[^"]*\blg:order-first lg:col-span-6\b[^"]*">\s*<iframe/);
  });

  it('renders the phone, email and address rows from the data layer', async () => {
    const { phones, emails, address } = getContactChannels();
    const [phoneRow = '', emailRow = '', addressRow = ''] = contactRows(await renderContact());

    expect(contactRows(await renderContact())).toHaveLength(3);
    expect(hrefs(phoneRow)).toEqual(phones.map(({ href }) => href));
    expect(hrefs(emailRow)).toEqual(emails.map(({ href }) => href));
    expect(hrefs(phoneRow).every((href) => href.startsWith('tel:+'))).toBe(true);
    expect(hrefs(emailRow).every((href) => href.startsWith('mailto:'))).toBe(true);
    for (const { label } of [...phones, ...emails]) {
      expect(phoneRow + emailRow).toContain(`>${label}</a>`);
    }
    expect(addressRow).toMatch(/<address [^>]*>[\s\S]*?<\/address>/);
    expect(/<address [\s\S]*?<\/address>/.exec(addressRow)?.[0]).toContain(address.text);
    expect(addressRow).toContain(address.note);
    expect(addressRow).not.toMatch(/Lunes a viernes|24\/7/);
  });

  it('shows each row without a title, with a decorative circular brand-blue icon badge', async () => {
    const rows = contactRows(await renderContact());

    expect(rows.join('')).not.toMatch(/<h3\b/);
    for (const row of rows) {
      expect(row).toMatch(/class="[^"]*\bsize-14 rounded-full bg-primary text-on-primary\b/);
      expect(row).toMatch(/<svg [^>]*aria-hidden="true"/);
    }
  });

  it('keeps every contact link at least 44px tall', async () => {
    const html = await renderContact();
    const links = [...html.matchAll(/<a [^>]*href="(?:tel|mailto):[^>]*>/g)].map(([a]) => a);

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toMatch(/class="[^"]*\bmin-h-11\b/);
  });

  it('embeds the keyless Google Map of the configured query, lazily and with a title', async () => {
    const { mapQuery } = getContactChannels();
    const map = iframe(await renderContact());

    expect(map).toContain(`src="${getMapEmbedUrl(mapQuery).replaceAll('&', '&amp;')}"`);
    expect(map).toContain(
      `title="Mapa de ubicación de Medsupplies Ingeniería S.A.S. en ${mapQuery}"`,
    );
    expect(map).toContain('loading="lazy"');
    expect(map).toContain('referrerpolicy="no-referrer-when-downgrade"');
    expect(map).toContain('allowfullscreen');
    expect(map).toMatch(/class="absolute inset-0 size-full border-0"/);
  });

  it('reserves the map height so loading it causes no layout shift', async () => {
    expect(await renderContact()).toMatch(
      /<div class="relative h-80 [^"]*\boverflow-hidden rounded-2xl bg-surface-container-high\b[^"]*\blg:min-h-90\b[^"]*">\s*<iframe/,
    );
  });

  it('links the full-width primary WhatsApp button to wa.me in a new tab, saying so', async () => {
    const link = whatsAppLink(await renderContact());

    expect(link).toContain(`href="${getWhatsAppUrl()}"`);
    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener noreferrer"');
    expect(link).toMatch(/class="[^"]*\bbg-primary text-on-primary\b[^"]*\bw-full\b/);
    expect(link).toMatch(/<svg [^>]*aria-hidden="true"/);
    expect(link).toContain(WHATSAPP_ICON_PATH);
    expect(
      link
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    ).toBe('Escríbanos por WhatsApp (abre WhatsApp en una pestaña nueva)');
  });

  it('is the last section of the page and links WhatsApp from it and the floating button only', async () => {
    const page = await renderAstro(IndexPage);
    const contactStart = page.indexOf('<section id="contacto"');

    expect(contactStart).toBeGreaterThan(-1);
    expect(page.lastIndexOf('<section ')).toBe(contactStart);
    expect(page.match(/href="https:\/\/wa\.me\//g)).toHaveLength(2);
    expect(page.indexOf('wa.me/')).toBeGreaterThan(contactStart);
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderContact());
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
