import { describe, expect, it } from 'vitest';
import ContactSection from '../../../../src/components/sections/ContactSection.astro';
import { getContactChannels, getWhatsAppUrl } from '../../../../src/lib/data';
import IndexPage from '../../../../src/pages/index.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

async function renderContact(): Promise<string> {
  return renderAstro(ContactSection);
}

function channelCards(html: string): string[] {
  return [...html.matchAll(/<li [\s\S]*?<\/li>/g)].map(([card]) => card);
}

function whatsAppLink(html: string): string {
  return /<a [^>]*href="https:\/\/wa\.me\/[^"]*"[^>]*>[\s\S]*?<\/a>/.exec(html)?.[0] ?? '';
}

describe('ContactSection', () => {
  it('is the #contacto section on white, labelled by its heading', async () => {
    expect(await renderContact()).toMatch(
      /^<section id="contacto" aria-labelledby="contact-heading" class="[^"]*\bbg-surface-container-lowest py-space-xl lg:py-24"/,
    );
  });

  it('uses a 12-column grid from lg: header and WhatsApp in 5 columns first, channel cards in 7', async () => {
    const html = await renderContact();

    expect(html).toMatch(/<div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">/);
    expect(html.indexOf('lg:col-span-5')).toBeLessThan(html.indexOf('lg:col-span-7'));
    expect(html).toMatch(
      /<div class="lg:col-span-7">\s*<ul class="grid grid-cols-1 gap-space-md sm:grid-cols-2">/,
    );
    expect(html).not.toContain('<form');
  });

  it('renders the section header', async () => {
    const html = await renderContact();

    expect(html).not.toContain('Canal Institucional');
    expect(html).toMatch(/<h2 id="contact-heading"[^>]*>\s*Contáctenos\s*<\/h2>/);
    expect(html).toContain(
      'Atención personalizada para hospitales, clínicas, laboratorios clínicos y centros especializados en toda Colombia.',
    );
  });

  it('renders the 4 channel cards with the data-file values', async () => {
    const { address, hours } = getContactChannels();
    const cards = channelCards(await renderContact());

    expect(cards.map((card) => /<h3[^>]*>([^<]+)<\/h3>/.exec(card)?.[1])).toEqual([
      'Dirección de Operaciones',
      'Líneas Telefónicas',
      'Correo Electrónico',
      'Horario de Atención',
    ]);
    expect(cards[0]).toContain(address.text);
    expect(cards[0]).toMatch(new RegExp(`class="[^"]*\\btext-primary\\b[^"]*">${address.note}<`));
    expect(cards[3]).toContain(hours.text);
    expect(cards[3]).toContain(hours.note);
    for (const card of cards) {
      expect(card).toMatch(/^<li class="[^"]*\brounded-xl bg-surface-container-low\b/);
      expect(card).toMatch(/class="[^"]*\bsize-10\b/);
      // The lines sit in their own block, spaced below the title instead of touching it.
      expect(card).toMatch(
        /<div class="flex min-w-0 flex-col gap-space-sm pt-2\.5">\s*<h3 class="font-heading text-label-lg text-on-surface">[^<]+<\/h3>\s*<div class="flex flex-col gap-1">/,
      );
    }
  });

  it('links every phone with tel: and every email with mailto:', async () => {
    const { phones, emails } = getContactChannels();
    const [, phoneCard = '', emailCard = ''] = channelCards(await renderContact());
    const hrefs = (card: string): string[] =>
      [...card.matchAll(/<a [^>]*href="([^"]+)"/g)].map(([, href]) => href ?? '');

    expect(hrefs(phoneCard)).toEqual(phones.map(({ href }) => href));
    expect(hrefs(emailCard)).toEqual(emails.map(({ href }) => href));
    expect(hrefs(phoneCard).every((href) => href.startsWith('tel:+'))).toBe(true);
    expect(hrefs(emailCard).every((href) => href.startsWith('mailto:'))).toBe(true);
  });

  it('links the WhatsApp button to the wa.me URL in a new tab, saying so to assistive tech', async () => {
    const link = whatsAppLink(await renderContact());

    expect(link).toContain(`href="${getWhatsAppUrl()}"`);
    expect(getWhatsAppUrl()).toMatch(/^https:\/\/wa\.me\/\d{8,15}$/);
    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener noreferrer"');
    expect(link).toMatch(/<svg [^>]*aria-hidden="true"/);
    expect(
      link
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    ).toBe('Escríbanos por WhatsApp (abre WhatsApp en una pestaña nueva)');
    expect(link).toContain('<span class="sr-only"> (abre WhatsApp en una pestaña nueva)</span>');
  });

  it('links WhatsApp from the contact section and the floating button only', async () => {
    const page = await renderAstro(IndexPage);

    expect(page.match(/href="https:\/\/wa\.me\//g)).toHaveLength(2);
    expect(page.indexOf('wa.me/')).toBeGreaterThan(page.indexOf('<section id="contacto"'));
    expect(page).toContain('<section id="contacto"');
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
