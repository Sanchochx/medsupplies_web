import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuoteRequestForm from '../../../src/components/forms/QuoteRequestForm.astro';
import {
  SENDING_LABEL,
  initQuoteForm,
  type QuoteFormController,
} from '../../../src/lib/contact/quoteForm';
import type { SubmitResult } from '../../../src/lib/contact/submitQuoteRequest';
import { renderAstro } from '../helpers/renderAstro';

const { submitQuoteRequest } = vi.hoisted(() => ({ submitQuoteRequest: vi.fn() }));
vi.mock('../../../src/lib/contact/submitQuoteRequest', () => ({ submitQuoteRequest }));

// CTAs that live outside the form, as on the home page.
const PAGE_LINKS = `
  <a id="product-cta" href="/#contact" data-request-type="pharmaceuticals">Browse catalog</a>
  <a id="engineering-cta" href="/#contact" data-request-type="engineering-services">Audit</a>
  <a id="price-list" href="/#contact">Request the full price list</a>`;

let markup: string;
let window: Window;
let document: Document;
let controller: QuoteFormController;

const $ = <T extends Element = HTMLElement>(selector: string): T => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element as unknown as T;
};
const field = (name: string): HTMLInputElement => $<HTMLInputElement>(`[name="${name}"]`);
const select = (): HTMLSelectElement => $<HTMLSelectElement>('select[name="requestType"]');
const consent = (): HTMLInputElement => $<HTMLInputElement>('input[name="consent"]');
const submitButton = (): HTMLButtonElement => $<HTMLButtonElement>('button[type="submit"]');
const status = (): HTMLElement => $('[data-form-status]');
const errorOf = (name: string): HTMLElement => $(`#${name}-error`);

const fire = (element: Element, type: 'input' | 'change'): void => {
  element.dispatchEvent(new window.Event(type, { bubbles: true }) as unknown as Event);
};

function type(name: string, value: string): void {
  const control = field(name);
  control.value = value;
  fire(control, 'input');
}

function fillValidForm(): void {
  type('fullName', 'Dr. Carlos Mendoza');
  type('institution', 'Clínica Central');
  type('email', 'buyer@clinic.com.co');
  type('phone', '+57 300 000 0000');
  select().value = 'medical-devices';
  consent().checked = true;
}

async function submit(): Promise<void> {
  $<HTMLFormElement>('form').requestSubmit();
  await Promise.resolve();
}

/** A promise the test resolves by hand, to observe the "Sending..." state. */
function deferred(): { promise: Promise<SubmitResult>; resolve: (result: SubmitResult) => void } {
  let resolve!: (result: SubmitResult) => void;
  const promise = new Promise<SubmitResult>((done) => (resolve = done));
  return { promise, resolve };
}

beforeEach(async () => {
  markup ??= await renderAstro(QuoteRequestForm);
  window = new Window({ width: 1280, height: 900 });
  document = window.document as unknown as Document;
  document.body.innerHTML = PAGE_LINKS + markup;
  submitQuoteRequest.mockReset();
  const wired = initQuoteForm(document);
  if (!wired) throw new Error('Quote form markup not found');
  controller = wired;
});

afterEach(() => {
  controller.destroy();
  void window.happyDOM.close();
});

describe('initQuoteForm', () => {
  it('returns null on pages without the form', () => {
    document.body.innerHTML = '<main></main>';

    expect(initQuoteForm(document)).toBeNull();
  });

  it('takes over validation from the browser (native validation stays without JS)', () => {
    expect($<HTMLFormElement>('form').noValidate).toBe(true);
    expect(markup).not.toContain('novalidate');
  });

  describe('validation', () => {
    it('blocks an invalid submission and flags each invalid field accessibly', async () => {
      await submit();

      expect(submitQuoteRequest).not.toHaveBeenCalled();
      for (const name of ['fullName', 'institution', 'email', 'phone', 'requestType', 'consent']) {
        const control = $(`[name="${name}"]`);
        expect(control.getAttribute('aria-invalid')).toBe('true');
        expect(control.getAttribute('aria-describedby')).toBe(`${name}-error`);
        expect(errorOf(name).hidden).toBe(false);
        expect(errorOf(name).textContent).not.toBe('');
      }
      expect(errorOf('message').hidden).toBe(true);
      expect(field('message').hasAttribute('aria-invalid')).toBe(false);
    });

    it('moves focus to the first invalid field', async () => {
      type('fullName', 'Dr. Carlos Mendoza');
      type('institution', 'Clínica Central');

      await submit();

      expect(document.activeElement).toBe(field('email'));
    });

    it('re-validates a flagged field as it changes and clears the error once fixed', async () => {
      await submit();

      type('email', 'buyer@');
      expect(errorOf('email').textContent).toBe('Enter a valid email, e.g. name@institution.com.');

      type('email', 'buyer@clinic.com.co');
      expect(errorOf('email').hidden).toBe(true);
      expect(field('email').hasAttribute('aria-invalid')).toBe(false);
      expect(field('email').hasAttribute('aria-describedby')).toBe(false);

      consent().checked = true;
      fire(consent(), 'change');
      expect(errorOf('consent').hidden).toBe(true);
    });

    it('does not show errors while typing in a field that was never flagged', () => {
      type('email', 'b');

      expect(errorOf('email').hidden).toBe(true);
    });
  });

  describe('submission', () => {
    it('disables the button and shows "Sending..." until the request settles', async () => {
      const request = deferred();
      submitQuoteRequest.mockReturnValue(request.promise);
      fillValidForm();

      await submit();
      expect(submitButton().disabled).toBe(true);
      expect(submitButton().textContent).toContain(SENDING_LABEL);

      await submit();
      expect(submitQuoteRequest).toHaveBeenCalledOnce();

      request.resolve({ ok: true });
      await vi.waitFor(() => expect(submitButton().disabled).toBe(false));
      expect(submitButton().textContent).toContain('Send request');
    });

    it('sends the trimmed request through submitQuoteRequest only', async () => {
      submitQuoteRequest.mockResolvedValue({ ok: true });
      fillValidForm();
      type('fullName', '  Dr. Carlos Mendoza  ');

      await submit();

      expect(submitQuoteRequest).toHaveBeenCalledWith({
        fullName: 'Dr. Carlos Mendoza',
        institution: 'Clínica Central',
        email: 'buyer@clinic.com.co',
        phone: '+57 300 000 0000',
        requestType: 'medical-devices',
        message: '',
        consent: true,
      });
    });

    it('announces success in the live region and resets the form', async () => {
      submitQuoteRequest.mockResolvedValue({ ok: true });
      fillValidForm();

      await submit();

      await vi.waitFor(() =>
        expect(status().textContent).toContain('Request sent! A specialist will contact you soon.'),
      );
      expect(status().getAttribute('aria-live')).toBe('polite');
      expect(status().querySelector('svg')).not.toBeNull();
      expect(field('fullName').value).toBe('');
      expect(select().value).toBe('');
      expect(consent().checked).toBe(false);
    });

    it.each([
      [
        'reports a failure',
        () => submitQuoteRequest.mockResolvedValue({ ok: false, reason: 'server' }),
      ],
      ['throws', () => submitQuoteRequest.mockRejectedValue(new Error('offline'))],
    ])(
      'keeps the data and offers a retry and WhatsApp when the request %s',
      async (_case, arrange) => {
        arrange();
        fillValidForm();

        await submit();

        await vi.waitFor(() =>
          expect(status().textContent).toContain("couldn't send your request"),
        );
        expect(status().textContent).toContain('try again');
        expect(status().querySelector('a[href^="https://wa.me/"]')).not.toBeNull();
        expect(field('fullName').value).toBe('Dr. Carlos Mendoza');
        expect(select().value).toBe('medical-devices');
        expect(consent().checked).toBe(true);
        expect(submitButton().disabled).toBe(false);
      },
    );

    it('clears the previous status on a new attempt', async () => {
      submitQuoteRequest.mockResolvedValue({ ok: false, reason: 'network' });
      fillValidForm();
      await submit();
      await vi.waitFor(() => expect(status().textContent).not.toBe(''));

      type('fullName', '');
      await submit();

      expect(status().textContent).toBe('');
    });
  });

  describe('request-type preselection (D-13)', () => {
    it('selects the type of the clicked CTA', () => {
      $('#product-cta').click();
      expect(select().value).toBe('pharmaceuticals');

      $('#engineering-cta').click();
      expect(select().value).toBe('engineering-services');
    });

    it('keeps the link navigation to #contact', () => {
      const event = new window.MouseEvent('click', { bubbles: true, cancelable: true });
      $('#product-cta').dispatchEvent(event as unknown as Event);

      expect(event.defaultPrevented).toBe(false);
      expect($('#product-cta').getAttribute('href')).toBe('/#contact');
    });

    it('leaves the select unchanged for links without a request type', () => {
      $('#product-cta').click();
      $('#price-list').click();

      expect(select().value).toBe('pharmaceuticals');
    });

    it('clears a request-type error when a CTA fills it in', async () => {
      await submit();
      expect(errorOf('requestType').hidden).toBe(false);

      $('#engineering-cta').click();

      expect(errorOf('requestType').hidden).toBe(true);
    });
  });
});
