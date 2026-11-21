/**
 * Request-type preselection (D-13): CTAs that carry `data-request-type` (product cards, the
 * engineering callout) choose the matching option of the quote form. The links keep their
 * `/#contact` href, so without JavaScript they still take the visitor to the form.
 */
import { isRequestTypeId } from './quoteRequest';
import type { RequestTypeId } from '../data/siteData';

export const REQUEST_TYPE_ATTRIBUTE = 'data-request-type';

/** Duck-typed so it also works for nodes of another window (e.g. a test DOM). */
export function isElement(target: EventTarget | null): target is Element {
  return typeof (target as Element | null)?.closest === 'function';
}

/** The request type a click should preselect, or `null` when the click is not on such a link. */
export function requestTypeFromClick(target: EventTarget | null): RequestTypeId | null {
  if (!isElement(target)) return null;
  const value = target
    .closest(`a[${REQUEST_TYPE_ATTRIBUTE}]`)
    ?.getAttribute(REQUEST_TYPE_ATTRIBUTE);
  return value && isRequestTypeId(value) ? value : null;
}

/** Selects `requestType` in `select`; returns whether the selection changed. */
export function preselectRequestType(
  select: HTMLSelectElement,
  requestType: RequestTypeId,
): boolean {
  if (select.value === requestType) return false;
  const option = [...select.options].find(({ value }) => value === requestType);
  if (!option) return false;
  select.value = requestType;
  return true;
}
