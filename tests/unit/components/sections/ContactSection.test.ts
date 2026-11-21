import { experimental_AstroContainer as AstroContainer } from 'astro/container';
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
  it('is the #contact section on the surface background, labelled by its heading', async () => {
    expect(await renderContact()).toMatch(
      /^<section id="contact" aria-labelledby="contact-heading" class="[^"]*\bbg-surface py-space-xl lg:py-24"/,
    );
  });

  it('uses a 12-column grid from lg: info in 5 columns first, form in 7', async () => {
    const html = await renderContact();

    expect(html).toMatch(/<div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">/);
    expect(html.indexOf('lg:col-span-5')).toBeLessThan(html.indexOf('lg:col-span-7'));
  });

  it('renders the section header', async () => {
    const html = await renderContact();

    expect(html).toContain('Institutional Channel');
    expect(html).toMatch(/<h2 id="contact-heading"[^>]*>\s*Contact Us\s*<\/h2>/);
    expect(html).toContain(
      'Personalized service for hospitals, clinics, clinical laboratories and specialized centers across Colombia.',
    );
  });

  it('renders the 4 channel cards with the data-file values', async () => {
    const { address, hours } = getContactChannels();
    const cards = channelCards(await renderContact());

    expect(cards.map((card) => /<h3[^>]*>([^<]+)<\/h3>/.exec(card)?.[1])).toEqual([
      'Operations Address',
      'Phone Lines',
      'Email',
      'Business Hours',
    ]);
    expect(cards[0]).toContain(address.text);
    expect(cards[0]).toMatch(new RegExp(`class="[^"]*\\btext-primary\\b[^"]*">${address.note}<`));
    expect(cards[3]).toContain(hours.text);
    expect(cards[3]).toContain(hours.note);
    for (const card of cards) {
      expect(card).toMatch(/^<li class="[^"]*\brounded-xl bg-surface-container-lowest\b/);
      expect(card).toMatch(/class="[^"]*\bsize-10\b/);
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
    ).toBe('Chat on WhatsApp (opens WhatsApp in a new tab)');
    expect(link).toContain('<span class="sr-only"> (opens WhatsApp in a new tab)</span>');
  });

  it('mounts the content of the "form" slot in the right column', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ContactSection, {
      slots: { form: '<form id="slot-probe"></form>' },
    });

    expect(html).toMatch(/<div class="lg:col-span-7">\s*<form id="slot-probe"><\/form>\s*<\/div>/);
  });

  it('renders exactly one WhatsApp link on the home page: no floating button', async () => {
    const page = await renderAstro(IndexPage);

    expect(page.match(/href="https:\/\/wa\.me\//g)).toHaveLength(1);
    expect(page).toContain('<section id="contact"');
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
