import { describe, expect, it } from 'vitest';
import {
  MESSAGE_MAX_LENGTH,
  QUOTE_FIELDS,
  validateQuoteField,
  validateQuoteRequest,
  type QuoteField,
  type QuoteRequestInput,
} from '../../../src/lib/contact/quoteRequest';
import { getRequestTypes } from '../../../src/lib/data';

const VALID: QuoteRequestInput = {
  fullName: '  Dr. Carlos Mendoza ',
  institution: 'Clínica Central',
  email: ' buyer@clinic.com.co ',
  phone: '+57 (300) 000-0000',
  requestType: 'pharmaceuticals',
  message: '  200 units  ',
  consent: true,
};

function errorsFor(overrides: Partial<QuoteRequestInput>): QuoteField[] {
  const result = validateQuoteRequest({ ...VALID, ...overrides });
  return result.ok ? [] : QUOTE_FIELDS.filter((field) => result.errors[field]);
}

describe('validateQuoteRequest', () => {
  it('accepts a valid request and returns it trimmed', () => {
    expect(validateQuoteRequest(VALID)).toEqual({
      ok: true,
      data: {
        fullName: 'Dr. Carlos Mendoza',
        institution: 'Clínica Central',
        email: 'buyer@clinic.com.co',
        phone: '+57 (300) 000-0000',
        requestType: 'pharmaceuticals',
        message: '200 units',
        consent: true,
      },
    });
  });

  it('accepts an empty message: it is optional', () => {
    expect(errorsFor({ message: '' })).toEqual([]);
  });

  it('accepts every request type from the data layer', () => {
    for (const { id } of getRequestTypes()) expect(errorsFor({ requestType: id })).toEqual([]);
  });

  it.each(['fullName', 'institution', 'email', 'phone'] as const)(
    'requires %s, also when it is only whitespace',
    (field) => {
      expect(errorsFor({ [field]: '' })).toEqual([field]);
      expect(errorsFor({ [field]: '   ' })).toEqual([field]);
    },
  );

  it.each(['buyer', 'buyer@clinic', 'buyer @clinic.com', '@clinic.com', 'a@b@c.com'])(
    'rejects the malformed email %j',
    (email) => {
      expect(errorsFor({ email })).toEqual(['email']);
    },
  );

  it.each(['3000000', '+57 300 000 0000', '(601) 745-9000', '123456789012345'])(
    'accepts the phone %j',
    (phone) => {
      expect(errorsFor({ phone })).toEqual([]);
    },
  );

  it.each([
    ['too few digits', '300 000'],
    ['too many digits', '1234567890123456'],
    ['letters', '300-ABC-0000'],
    ['a + that is not leading', '57+3000000000'],
  ])('rejects a phone with %s', (_case, phone) => {
    expect(errorsFor({ phone })).toEqual(['phone']);
  });

  it('requires a request type from the list', () => {
    expect(errorsFor({ requestType: '' })).toEqual(['requestType']);
    expect(errorsFor({ requestType: 'not-a-type' })).toEqual(['requestType']);
  });

  it(`limits the message to ${MESSAGE_MAX_LENGTH} characters`, () => {
    expect(errorsFor({ message: 'x'.repeat(MESSAGE_MAX_LENGTH) })).toEqual([]);
    expect(errorsFor({ message: 'x'.repeat(MESSAGE_MAX_LENGTH + 1) })).toEqual(['message']);
  });

  it('requires consent', () => {
    expect(errorsFor({ consent: false })).toEqual(['consent']);
  });

  it('reports every invalid field at once, with a message for each', () => {
    const result = validateQuoteRequest({
      fullName: '',
      institution: '',
      email: 'x',
      phone: '1',
      requestType: '',
      message: '',
      consent: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors)).toEqual([
      'fullName',
      'institution',
      'email',
      'phone',
      'requestType',
      'consent',
    ]);
    for (const message of Object.values(result.errors)) expect(message).toMatch(/\.$/);
  });
});

describe('validateQuoteField', () => {
  it('validates a single field against the whole input', () => {
    expect(validateQuoteField('email', { ...VALID, email: 'x' })).toBe(
      'Enter a valid email, e.g. name@institution.com.',
    );
    expect(validateQuoteField('email', VALID)).toBeNull();
  });
});
