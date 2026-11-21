import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuoteRequest } from '../../../src/lib/contact/quoteRequest';
import {
  SIMULATED_DELAY_MS,
  submitQuoteRequest,
} from '../../../src/lib/contact/submitQuoteRequest';

const REQUEST: QuoteRequest = {
  fullName: 'Dr. Carlos Mendoza',
  institution: 'Clínica Central',
  email: 'buyer@clinic.com.co',
  phone: '+57 300 000 0000',
  requestType: 'medical-devices',
  message: '',
  consent: true,
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('submitQuoteRequest (stub, D-15)', () => {
  it('resolves with success only after the simulated delay', async () => {
    vi.useFakeTimers();
    let settled = false;
    const pending = submitQuoteRequest(REQUEST).then((result) => {
      settled = true;
      return result;
    });

    await vi.advanceTimersByTimeAsync(SIMULATED_DELAY_MS - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toEqual({ ok: true });
  });

  it('makes no network call', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const pending = submitQuoteRequest(REQUEST);
    await vi.runAllTimersAsync();
    await pending;

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
