/**
 * Wires the quote request form: preselection from CTAs, validation with accessible inline errors,
 * and the submitting/success/error states. Rules come from `quoteRequest.ts`; delivery goes only
 * through `submitQuoteRequest()`. Without JavaScript none of this runs and the browser's native
 * `required`/`type` validation still applies.
 */
import { isElement, preselectRequestType, requestTypeFromClick } from './preselection';
import {
  QUOTE_FIELDS,
  validateQuoteField,
  validateQuoteRequest,
  type QuoteField,
  type QuoteFieldErrors,
  type QuoteRequestInput,
} from './quoteRequest';
import { submitQuoteRequest } from './submitQuoteRequest';

export const QUOTE_FORM_SELECTOR = 'form[data-quote-form]';
export const STATUS_SELECTOR = '[data-form-status]';
export const SUBMIT_LABEL_SELECTOR = '[data-submit-label]';
export const SENDING_LABEL = 'Sending...';

type FieldControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type StatusKind = 'success' | 'error';

export interface QuoteFormController {
  /** Removes every listener; used by tests and safe to call more than once. */
  destroy(): void;
}

export const errorIdFor = (field: QuoteField): string => `${field}-error`;

/** Wires the form found in `root`; returns `null` when the page has no quote form. */
export function initQuoteForm(root: Document = document): QuoteFormController | null {
  const form = root.querySelector<HTMLFormElement>(QUOTE_FORM_SELECTOR);
  const status = form?.querySelector<HTMLElement>(STATUS_SELECTOR);
  const submitButton = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  const submitLabel = submitButton?.querySelector<HTMLElement>(SUBMIT_LABEL_SELECTOR);
  if (!form || !status || !submitButton || !submitLabel) return null;

  const listeners = new AbortController();
  const { signal } = listeners;
  const idleLabel = submitLabel.textContent ?? '';
  let submitting = false;

  // Custom messages replace the browser bubbles, which are not announced consistently.
  form.noValidate = true;

  const control = (field: QuoteField): FieldControl | null =>
    form.querySelector<FieldControl>(`[name="${field}"]`);

  const readInput = (): QuoteRequestInput => {
    const value = (field: Exclude<QuoteField, 'consent'>): string => control(field)?.value ?? '';
    return {
      fullName: value('fullName'),
      institution: value('institution'),
      email: value('email'),
      phone: value('phone'),
      requestType: value('requestType'),
      message: value('message'),
      consent: form.querySelector<HTMLInputElement>('input[name="consent"]')?.checked ?? false,
    };
  };

  const showError = (field: QuoteField, message: string | null | undefined): void => {
    const element = control(field);
    const errorElement = root.getElementById(errorIdFor(field));
    if (!element || !errorElement) return;
    errorElement.textContent = message ?? '';
    errorElement.hidden = !message;
    if (message) {
      element.setAttribute('aria-invalid', 'true');
      element.setAttribute('aria-describedby', errorIdFor(field));
    } else {
      element.removeAttribute('aria-invalid');
      element.removeAttribute('aria-describedby');
    }
  };

  const showErrors = (errors: QuoteFieldErrors): void => {
    for (const field of QUOTE_FIELDS) showError(field, errors[field]);
  };

  const showStatus = (kind: StatusKind | null): void => {
    status.replaceChildren();
    if (!kind) return;
    const template = form.querySelector<HTMLTemplateElement>(`template[data-status="${kind}"]`);
    if (template) status.append(template.content.cloneNode(true));
  };

  const setSubmitting = (value: boolean): void => {
    submitting = value;
    submitButton.disabled = value;
    submitLabel.textContent = value ? SENDING_LABEL : idleLabel;
  };

  // Re-validate only fields already flagged, so errors never appear while someone is typing.
  const revalidate = (field: QuoteField): void => {
    if (control(field)?.getAttribute('aria-invalid') !== 'true') return;
    showError(field, validateQuoteField(field, readInput()));
  };

  const onFieldEdit = (event: Event): void => {
    const name = isElement(event.target) ? event.target.getAttribute('name') : null;
    const field = QUOTE_FIELDS.find((candidate) => candidate === name);
    if (field) revalidate(field);
  };

  form.addEventListener('input', onFieldEdit, { signal });
  form.addEventListener('change', onFieldEdit, { signal });

  form.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();
      if (submitting) return;

      const result = validateQuoteRequest(readInput());
      if (!result.ok) {
        showErrors(result.errors);
        showStatus(null);
        const firstInvalid = QUOTE_FIELDS.find((field) => result.errors[field]);
        if (firstInvalid) control(firstInvalid)?.focus();
        return;
      }

      showErrors({});
      showStatus(null);
      setSubmitting(true);
      let succeeded: boolean;
      try {
        succeeded = (await submitQuoteRequest(result.data)).ok;
      } catch {
        succeeded = false;
      }
      setSubmitting(false);

      // On failure the entered data stays, so the visitor can retry or switch to WhatsApp.
      if (succeeded) form.reset();
      showStatus(succeeded ? 'success' : 'error');
    },
    { signal },
  );

  root.addEventListener(
    'click',
    (event) => {
      const requestType = requestTypeFromClick(event.target);
      const select = form.querySelector<HTMLSelectElement>('select[name="requestType"]');
      if (!requestType || !select) return;
      // The default navigation to `/#contact` still runs; this only chooses the option.
      if (preselectRequestType(select, requestType)) revalidate('requestType');
    },
    { signal },
  );

  return { destroy: () => listeners.abort() };
}
