/**
 * Crossfading photo loop of a division panel (2+ images). One image shows at a time; every
 * INTERVAL it fades to the next, in an endless loop. There are no visible controls.
 *
 * The loop only runs while nothing blocks it: the photo must be on screen (which also means its
 * panel is open, since a collapsed panel has no visible area), the browser tab visible and the
 * pointer outside the photo (hovering pauses it). With `prefers-reduced-motion` it never starts:
 * the first image stays.
 *
 * Slide states drive the CSS: `active` is shown; `next` is displayed at opacity 0, so only the
 * upcoming image lazy-loads; `leaving` fades out; `idle` is `display: none` and is not loaded.
 */

export const ROTATOR_SELECTOR = '[data-photo-rotator]';
export const SLIDE_SELECTOR = '[data-slide]';

export const INTERVAL_MS = 4500;
/** Matches the slides' `duration-600` class. */
export const FADE_MS = 600;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const VISIBLE_RATIO = 0.25;

export type SlideState = 'active' | 'next' | 'leaving' | 'idle';
export type RotationBlocker = 'offscreen' | 'page-hidden' | 'hover';

export interface Timers {
  setTimeout(callback: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

export interface RotationOptions {
  count: number;
  intervalMs?: number;
  /** `false` under reduced motion: the first image stays. */
  autoplay: boolean;
  onChange(index: number, previous: number): void;
  timers: Timers;
}

export interface Rotation {
  readonly index: number;
  readonly running: boolean;
  block(blocker: RotationBlocker, blocked: boolean): void;
  destroy(): void;
}

export function nextSlideIndex(index: number, count: number): number {
  return count > 0 ? (index + 1) % count : 0;
}

/** State of every slide when `index` shows and `leaving` (if any) is still fading out. */
export function slideStates(
  index: number,
  count: number,
  leaving: number | null = null,
): SlideState[] {
  const next = nextSlideIndex(index, count);
  return Array.from({ length: count }, (_, position): SlideState => {
    if (position === index) return 'active';
    if (position === leaving) return 'leaving';
    if (position === next) return 'next';
    return 'idle';
  });
}

/** Timer-driven core, independent of the DOM. */
export function createRotation({
  count,
  intervalMs = INTERVAL_MS,
  autoplay,
  onChange,
  timers,
}: RotationOptions): Rotation {
  const blockers = new Set<RotationBlocker>();
  let index = 0;
  let timer: number | undefined;
  let destroyed = false;

  const canRun = (): boolean => !destroyed && autoplay && count > 1 && blockers.size === 0;

  const stop = (): void => {
    if (timer !== undefined) timers.clearTimeout(timer);
    timer = undefined;
  };

  const schedule = (): void => {
    stop();
    timer = timers.setTimeout(() => {
      timer = undefined;
      const previous = index;
      index = nextSlideIndex(index, count);
      onChange(index, previous);
      if (canRun()) schedule();
    }, intervalMs);
  };

  const sync = (): void => {
    if (!canRun()) stop();
    else if (timer === undefined) schedule();
  };

  sync();

  return {
    get index() {
      return index;
    },
    get running() {
      return canRun();
    },
    block(blocker, blocked) {
      if (blocked) blockers.add(blocker);
      else blockers.delete(blocker);
      sync();
    },
    destroy() {
      destroyed = true;
      stop();
    },
  };
}

export interface PhotoRotatorController {
  readonly rotation: Rotation;
  destroy(): void;
}

function initOne(container: HTMLElement): PhotoRotatorController | null {
  const view = container.ownerDocument.defaultView;
  const slides = [...container.querySelectorAll<HTMLElement>(SLIDE_SELECTOR)];
  if (!view || slides.length < 2) return null;

  const document = container.ownerDocument;
  const listeners = new AbortController();
  const { signal } = listeners;
  const count = slides.length;
  let fadeTimer: number | undefined;

  const render = (index: number, leaving: number | null): void => {
    const states = slideStates(index, count, leaving);
    slides.forEach((slide, position) => {
      slide.dataset.state = states[position];
    });
  };

  const rotation = createRotation({
    count,
    autoplay: !view.matchMedia(REDUCED_MOTION_QUERY).matches,
    timers: {
      setTimeout: (callback, ms) => view.setTimeout(callback, ms),
      clearTimeout: (id) => view.clearTimeout(id),
    },
    onChange: (index, previous) => {
      if (fadeTimer !== undefined) view.clearTimeout(fadeTimer);
      render(index, previous);
      fadeTimer = view.setTimeout(() => {
        fadeTimer = undefined;
        render(rotation.index, null);
      }, FADE_MS);
    },
  });

  container.addEventListener('mouseenter', () => rotation.block('hover', true), { signal });
  container.addEventListener('mouseleave', () => rotation.block('hover', false), { signal });

  const syncPageVisibility = (): void =>
    rotation.block('page-hidden', document.visibilityState === 'hidden');
  document.addEventListener('visibilitychange', syncPageVisibility, { signal });
  syncPageVisibility();

  // Starts blocked until the observer reports the photo on screen. Without IntersectionObserver
  // support it counts as visible.
  if (typeof view.IntersectionObserver === 'function') {
    rotation.block('offscreen', true);
    const observer = new view.IntersectionObserver(
      ([entry]) => {
        const onScreen =
          entry !== undefined &&
          entry.isIntersecting &&
          entry.intersectionRatio >= VISIBLE_RATIO &&
          container.closest('[inert]') === null;
        rotation.block('offscreen', !onScreen);
      },
      { threshold: [0, VISIBLE_RATIO] },
    );
    observer.observe(container);
    signal.addEventListener('abort', () => observer.disconnect());
  }

  render(0, null);

  return {
    rotation,
    destroy: () => {
      if (fadeTimer !== undefined) view.clearTimeout(fadeTimer);
      rotation.destroy();
      listeners.abort();
    },
  };
}

/** Wires every rotating photo loop in `root`. */
export function initPhotoRotators(root: ParentNode = document): PhotoRotatorController[] {
  return [...root.querySelectorAll<HTMLElement>(ROTATOR_SELECTOR)].flatMap((container) => {
    const controller = initOne(container);
    return controller ? [controller] : [];
  });
}
