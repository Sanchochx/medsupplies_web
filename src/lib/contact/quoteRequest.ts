/**
 * Quote request model and its validation schema. The rules live here, not in the template, so the
 * form UI only renders what this module decides. It runs in the browser, so it reads the request
 * types from the site data module directly (the data layer's barrel also pulls in content
 * collections, which only exist at build time).
 */
import { getRequestTypes } from '../data/site';
import type { RequestTypeId } from '../data/siteData';

export const QUOTE_FIELDS = [
  'fullName',
  'institution',
  'email',
  'phone',
  'requestType',
  'message',
  'consent',
] as const;

export type QuoteField = (typeof QUOTE_FIELDS)[number];

/** Raw form values, as read from the controls. */
export interface QuoteRequestInput {
  fullName: string;
  institution: string;
  email: string;
  phone: string;
  requestType: string;
  message: string;
  consent: boolean;
}

/** A validated, trimmed request: what `submitQuoteRequest()` receives. */
export interface QuoteRequest {
  fullName: string;
  institution: string;
  email: string;
  phone: string;
  requestType: RequestTypeId;
  message: string;
  consent: true;
}

export type QuoteFieldErrors = Partial<Record<QuoteField, string>>;

export type QuoteValidationResult =
  { ok: true; data: QuoteRequest } | { ok: false; errors: QuoteFieldErrors };

export const MESSAGE_MAX_LENGTH = 2000;
const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;

// One `@`, no spaces, and a dot in the domain: strict enough to catch typos without rejecting
// valid addresses (the server-side check comes with the endpoint, D-15).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits with optional separators, and `+` only as the first character.
const PHONE_PATTERN = /^\+?[\d\s()-]+$/;

type FieldRule = (input: QuoteRequestInput) => string | null;

const required =
  (field: Exclude<QuoteField, 'consent'>, message: string): FieldRule =>
  (input) =>
    input[field].trim() === '' ? message : null;

export const QUOTE_REQUEST_SCHEMA: Record<QuoteField, FieldRule> = {
  fullName: required('fullName', 'Enter your full name.'),
  institution: required('institution', 'Enter your healthcare institution or company.'),
  email: (input) => {
    const email = input.email.trim();
    if (email === '') return 'Enter your corporate email.';
    return EMAIL_PATTERN.test(email) ? null : 'Enter a valid email, e.g. name@institution.com.';
  },
  phone: (input) => {
    const phone = input.phone.trim();
    if (phone === '') return 'Enter a phone number.';
    const digits = phone.replace(/\D/g, '').length;
    const valid =
      PHONE_PATTERN.test(phone) && digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS;
    return valid
      ? null
      : `Enter a phone number with ${PHONE_MIN_DIGITS} to ${PHONE_MAX_DIGITS} digits.`;
  },
  requestType: (input) =>
    isRequestTypeId(input.requestType) ? null : 'Select the type of request.',
  message: (input) =>
    input.message.trim().length <= MESSAGE_MAX_LENGTH
      ? null
      : `Keep the details under ${MESSAGE_MAX_LENGTH.toLocaleString('en-US')} characters.`,
  consent: (input) =>
    input.consent ? null : 'Accept the personal data processing policy to continue.',
};

export function isRequestTypeId(value: string): value is RequestTypeId {
  return getRequestTypes().some(({ id }) => id === value);
}

/** Error message for one field, or `null` when it is valid. */
export function validateQuoteField(field: QuoteField, input: QuoteRequestInput): string | null {
  return QUOTE_REQUEST_SCHEMA[field](input);
}

export function validateQuoteRequest(input: QuoteRequestInput): QuoteValidationResult {
  const errors: QuoteFieldErrors = {};
  for (const field of QUOTE_FIELDS) {
    const error = validateQuoteField(field, input);
    if (error) errors[field] = error;
  }

  // The last two checks repeat the schema so TypeScript can narrow `requestType` and `consent`.
  if (Object.keys(errors).length > 0 || !isRequestTypeId(input.requestType) || !input.consent) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    data: {
      fullName: input.fullName.trim(),
      institution: input.institution.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      requestType: input.requestType,
      message: input.message.trim(),
      consent: true,
    },
  };
}
