import type { QuoteRequest } from './quoteRequest';

export type SubmitResult = { ok: true } | { ok: false; reason: 'network' | 'server' };

/** Simulated round trip, so the "Sending..." state is visible like a real request. */
export const SIMULATED_DELAY_MS = 800;

/**
 * Sends a quote request. The form UI depends only on this signature.
 *
 * TODO(D-15): STUB. It makes no network call and sends no email: it only waits and reports
 * success. Replace the body with a `fetch` to the serverless endpoint (`src/pages/api/`), which
 * will validate the request again and deliver it with Resend (`src/lib/email/`).
 */
export async function submitQuoteRequest(request: QuoteRequest): Promise<SubmitResult> {
  void request;
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
  return { ok: true };
}
