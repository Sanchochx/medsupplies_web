import { describe, expect, it } from 'vitest';
import QuoteRequestForm from '../../../../src/components/forms/QuoteRequestForm.astro';
import { getRequestTypes } from '../../../../src/lib/data';
import IndexPage from '../../../../src/pages/index.astro';
import { compileTailwind, extractClasses } from '../../helpers/compileTailwind';
import { renderAstro } from '../../helpers/renderAstro';

const REQUIRED_FIELDS = ['fullName', 'institution', 'email', 'phone', 'requestType', 'consent'];

async function renderForm(): Promise<string> {
  return renderAstro(QuoteRequestForm);
}

/** Visible text as the browser joins it: tags add no whitespace of their own. */
function text(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The opening tag of the control whose `id` is given. */
function control(html: string, id: string): string {
  return new RegExp(`<(?:input|select|textarea)[^>]*\\bid="${id}"[^>]*>`).exec(html)?.[0] ?? '';
}

function labelFor(html: string, id: string): string {
  return new RegExp(`<label for="${id}"[^>]*>([\\s\\S]*?)</label>`).exec(html)?.[1] ?? '';
}

describe('QuoteRequestForm', () => {
  it('renders the white card with its title and intro', async () => {
    const html = await renderForm();

    expect(html).toMatch(
      /^<div class="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm lg:p-space-xl">/,
    );
    expect(html).toMatch(
      /<h3 id="quote-form-title" class="[^"]*\btext-headline-sm\b[^"]*">\s*Quote &amp; Advisory Request\s*<\/h3>/,
    );
    expect(html).toContain(
      'Fill out the form below and a sales engineer will contact you shortly.',
    );
    expect(html).toMatch(
      /<form id="quote-request-form" method="post" aria-labelledby="quote-form-title"/,
    );
  });

  it('gives every control a visible associated label, in visual order', async () => {
    const html = await renderForm();
    const ids = [...html.matchAll(/<(?:input|select|textarea)[^>]*\bid="([^"]+)"/g)].map(
      ([, id]) => id ?? '',
    );

    expect(ids).toEqual([...REQUIRED_FIELDS.slice(0, 5), 'message', 'consent']);
    for (const id of ids) {
      expect(text(labelFor(html, id)).length).toBeGreaterThan(0);
      expect(control(html, id)).toContain(`name="${id}"`);
    }
  });

  it('marks required fields with required and a decorative asterisk; message stays optional', async () => {
    const html = await renderForm();

    for (const id of REQUIRED_FIELDS) {
      expect(control(html, id)).toMatch(/\srequired[\s>]/);
    }
    for (const id of REQUIRED_FIELDS.slice(0, 5)) {
      expect(labelFor(html, id)).toContain('<span aria-hidden="true"> *</span>');
    }
    expect(control(html, 'message')).not.toContain('required');
    expect(labelFor(html, 'message')).not.toContain('*');
  });

  it('sets the text field labels, types, autocomplete tokens and placeholders', async () => {
    const html = await renderForm();
    const expected = [
      ['fullName', 'Full Name *', 'text', 'name', 'e.g. Dr. Carlos Mendoza'],
      [
        'institution',
        'Healthcare Institution / Company *',
        'text',
        'organization',
        'Clinic, hospital or laboratory',
      ],
      ['email', 'Corporate Email *', 'email', 'email', 'name@institution.com'],
      ['phone', 'Phone / Mobile *', 'tel', 'tel', '+57 300 000 0000'],
    ];

    for (const [id, label, type, autocomplete, placeholder] of expected) {
      const input = control(html, id ?? '');
      expect(text(labelFor(html, id ?? ''))).toBe(label);
      expect(input).toContain(`type="${type}"`);
      expect(input).toContain(`autocomplete="${autocomplete}"`);
      expect(input).toContain(`placeholder="${placeholder}"`);
    }
  });

  it('lists a disabled default and the request types from the data layer', async () => {
    const html = await renderForm();
    const select = /<select[\s\S]*?<\/select>/.exec(html)?.[0] ?? '';
    const options = [...select.matchAll(/<option ([^>]*)>([^<]*)<\/option>/g)];

    expect(text(labelFor(html, 'requestType'))).toBe('Request Type *');
    expect(options[0]?.[1]).toMatch(/value="" disabled selected/);
    expect(options[0]?.[2]).toBe('Select a category');
    expect(
      options
        .slice(1)
        .map(([, attrs, label]) => [/value="([^"]+)"/.exec(attrs ?? '')?.[1], text(label ?? '')]),
    ).toEqual(getRequestTypes().map(({ id, label }) => [id, label]));
  });

  it('renders the optional message as a 4-row, non-resizable textarea', async () => {
    const html = await renderForm();
    const textarea = control(html, 'message');

    expect(text(labelFor(html, 'message'))).toBe('Request Details / Specifications');
    expect(textarea).toContain('rows="4"');
    expect(textarea).toMatch(/class="[^"]*\bresize-none\b/);
    expect(textarea).toContain(
      'placeholder="Indicate references, estimated volumes or specific technical requirements..."',
    );
  });

  it('links the consent label to the placeholder privacy policy page in a new tab', async () => {
    const html = await renderForm();
    const label = labelFor(html, 'consent');

    expect(control(html, 'consent')).toContain('type="checkbox"');
    expect(text(label)).toBe(
      'I accept the processing of my personal data under the Personal Data Processing Policy (opens in a new tab) and authorize Medsupplies Ingeniería S.A.S. to contact me.',
    );
    expect(label).toMatch(
      /<a href="\/privacy-policy" target="_blank"[^>]*>\s*Personal Data Processing Policy/,
    );
  });

  it('styles 44px controls with a visible focus state instead of a bare outline-none', async () => {
    const html = await renderForm();

    for (const id of ['fullName', 'institution', 'email', 'phone', 'requestType']) {
      expect(control(html, id)).toMatch(/class="[^"]*\bh-11\b/);
    }
    for (const id of ['fullName', 'requestType', 'message']) {
      const classes = /class="([^"]*)"/.exec(control(html, id))?.[1] ?? '';
      expect(classes).toMatch(/\brounded-lg\b/);
      expect(classes).toMatch(/\bbg-surface\b/);
      expect(classes).toMatch(/\bfocus:bg-surface-container-lowest\b/);
      expect(classes).toMatch(/\bfocus:border-primary\b/);
      expect(classes).toMatch(/\bfocus:ring-3\b/);
    }
  });

  it('lays out name/institution and email/phone in two columns from sm', async () => {
    const html = await renderForm();
    const rows = [...html.matchAll(/<div class="grid grid-cols-1 gap-space-sm sm:grid-cols-2">/g)];

    expect(rows).toHaveLength(2);
  });

  it('ends with a full-width primary submit button', async () => {
    const html = await renderForm();
    const button = /<button[\s\S]*?<\/button>/.exec(html)?.[0] ?? '';

    expect(html.lastIndexOf('<button')).toBeGreaterThan(html.indexOf('id="consent"'));
    expect(button).toContain('type="submit"');
    expect(button).toMatch(
      /class="[^"]*\bbg-primary\b[^"]*\bw-full\b[^"]*\bactive:scale-\[0\.99\]/,
    );
    expect(button).toMatch(/<svg [^>]*aria-hidden="true"/);
    expect(text(button)).toBe('Send request');
  });

  it('is mounted in the contact section form slot of the home page', async () => {
    const page = await renderAstro(IndexPage);

    expect(page).toMatch(
      /<div class="lg:col-span-7">\s*<div class="rounded-2xl[^"]*">\s*<div class="mb-space-md">/,
    );
    expect(page.match(/<form /g)).toHaveLength(1);
  });

  it('only uses utilities that exist in the design system', async () => {
    const classes = extractClasses(await renderForm());
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
