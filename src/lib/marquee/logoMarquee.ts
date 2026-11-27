/**
 * Endless logo marquee (progressive enhancement). The markup ships the logo set twice and the CSS
 * moves the track by exactly one set, so the loop already works without JavaScript on any screen
 * narrower than one set. This script only:
 * - appends more `aria-hidden` copies when one set is narrower than the marquee (very wide
 *   screens or few logos), so the track never shows a gap at the loop point;
 * - flags the marquee while it is off screen, which lets the CSS pause the animation.
 *
 * Under `prefers-reduced-motion` the copies are hidden by CSS, so no copies are added.
 */

export const MARQUEE_SELECTOR = '[data-marquee]';
export const TRACK_SELECTOR = '[data-marquee-track]';
export const SET_SELECTOR = '[data-marquee-set]';
export const COPY_ATTRIBUTE = 'data-marquee-copy';
export const OFFSCREEN_ATTRIBUTE = 'data-offscreen';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Number of sets the track needs (original included) so that, after shifting by one set, the
 * rest still covers the whole marquee: `n · set ≥ set + viewport`. Never fewer than two.
 */
export function setsNeeded(setWidth: number, viewportWidth: number): number {
  if (setWidth <= 0) return 2;
  return Math.max(2, Math.ceil(viewportWidth / setWidth) + 1);
}

/** Copy of the original set for decoration only: hidden from assistive technology. */
export function createCopy(original: HTMLElement): HTMLElement {
  const copy = original.cloneNode(true) as HTMLElement;
  copy.removeAttribute('id');
  copy.setAttribute('aria-hidden', 'true');
  copy.setAttribute(COPY_ATTRIBUTE, '');
  for (const image of copy.querySelectorAll('img')) image.alt = '';
  return copy;
}

/** Adds or removes copies so the track holds exactly `total` sets. */
export function syncCopies(track: HTMLElement, original: HTMLElement, total: number): void {
  const sets = track.querySelectorAll<HTMLElement>(SET_SELECTOR);
  for (let index = sets.length; index < total; index += 1) track.append(createCopy(original));
  for (let index = sets.length - 1; index >= total; index -= 1) {
    const set = sets[index];
    if (set && set !== original) set.remove();
  }
}

export interface LogoMarqueeController {
  /** Removes every listener and observer; safe to call more than once. */
  destroy(): void;
}

/** Browser APIs the marquee uses; injectable so tests can fake them. */
export interface LogoMarqueeEnvironment {
  matchMedia: (query: string) => MediaQueryList;
  ResizeObserver?: typeof ResizeObserver;
  IntersectionObserver?: typeof IntersectionObserver;
}

export function initLogoMarquee(
  marquee: HTMLElement,
  win: LogoMarqueeEnvironment = window,
): LogoMarqueeController {
  const track = marquee.querySelector<HTMLElement>(TRACK_SELECTOR);
  const original = track?.querySelector<HTMLElement>(`${SET_SELECTOR}:not([${COPY_ATTRIBUTE}])`);
  if (!track || !original) return { destroy: () => undefined };

  const reducedMotion = win.matchMedia(REDUCED_MOTION_QUERY);
  const fill = (): void => {
    if (reducedMotion.matches) return;
    const setWidth = original.getBoundingClientRect().width;
    syncCopies(track, original, setsNeeded(setWidth, marquee.clientWidth));
  };

  const resizeObserver = win.ResizeObserver ? new win.ResizeObserver(fill) : undefined;
  resizeObserver?.observe(marquee);

  const visibilityObserver = win.IntersectionObserver
    ? new win.IntersectionObserver((entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          entry.target.toggleAttribute(OFFSCREEN_ATTRIBUTE, !entry.isIntersecting);
        }
      })
    : undefined;
  visibilityObserver?.observe(marquee);

  reducedMotion.addEventListener('change', fill);
  fill();

  return {
    destroy(): void {
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      reducedMotion.removeEventListener('change', fill);
    },
  };
}

export function initLogoMarquees(root: ParentNode = document): LogoMarqueeController[] {
  return Array.from(root.querySelectorAll<HTMLElement>(MARQUEE_SELECTOR), (marquee) =>
    initLogoMarquee(marquee),
  );
}

/** Largest size that fits `width × height` inside `maxWidth × maxHeight`, never upscaling. */
export function fitWithin(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
