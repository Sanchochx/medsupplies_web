/**
 * Expandable product panels of the "Divisiones" stack: each banner is a disclosure button that
 * opens the panel below it. Only one panel is open at a time.
 *
 * While any panel is open the stack is "locked": its rows size to their content (so the section
 * can grow past one screen) and every banner keeps the height it had when closed, via the
 * `h-division-banner` utility fed by the measured `--divisions-heading-height`. The lock is only
 * released once the closing animation has finished, so banners never stretch mid-transition.
 */

export const DIVISIONS_SELECTOR = '[data-divisions]';
export const DIVISIONS_HEADING_SELECTOR = '[data-divisions-heading]';
export const DIVISIONS_LIST_SELECTOR = '[data-divisions-list]';
export const DIVISION_SELECTOR = '[data-division]';
export const DIVISION_TOGGLE_SELECTOR = '[data-division-toggle]';
export const DIVISION_PANEL_SELECTOR = '[data-division-panel]';
/** Set on the list while a panel is open or still closing. */
export const LOCKED_ATTRIBUTE = 'data-locked';
/** Set for one frame on a panel that must collapse without animating. */
export const INSTANT_ATTRIBUTE = 'data-instant';
export const HEADING_HEIGHT_PROPERTY = '--divisions-heading-height';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export interface DivisionPanelsController {
  /** `data-division` id of the open panel, or `null` when all are closed. */
  readonly openId: string | null;
  toggle(id: string): void;
  /** Removes every listener and timer; safe to call more than once. */
  destroy(): void;
}

interface DivisionParts {
  id: string;
  article: HTMLElement;
  toggle: HTMLButtonElement;
  panel: HTMLElement;
}

/** Panel that should be open after toggling `toggled`: a second click on the open one closes it. */
export function nextOpenId(current: string | null, toggled: string): string | null {
  return current === toggled ? null : toggled;
}

/** Longest `transition-duration` of an element in ms (`"0.35s, 200ms"` → 350). */
export function parseDurationMs(value: string): number {
  return Math.max(
    0,
    ...value.split(',').map((part) => {
      const amount = Number.parseFloat(part);
      if (Number.isNaN(amount)) return 0;
      return part.trim().endsWith('ms') ? amount : amount * 1000;
    }),
  );
}

/** Writes the open/closed state to the DOM: ARIA, the CSS hook and the panel's inertness. */
export function setDivisionState({ article, toggle, panel }: DivisionParts, open: boolean): void {
  article.dataset.state = open ? 'open' : 'closed';
  toggle.setAttribute('aria-expanded', String(open));
  panel.toggleAttribute('inert', !open);
  if (open) panel.removeAttribute('aria-hidden');
  else panel.setAttribute('aria-hidden', 'true');
}

function collectDivisions(list: HTMLElement): DivisionParts[] {
  return [...list.querySelectorAll<HTMLElement>(DIVISION_SELECTOR)].flatMap((article) => {
    const id = article.dataset.division;
    const toggle = article.querySelector<HTMLButtonElement>(DIVISION_TOGGLE_SELECTOR);
    const panel = article.querySelector<HTMLElement>(DIVISION_PANEL_SELECTOR);
    return id && toggle && panel ? [{ id, article, toggle, panel }] : [];
  });
}

/** Wires the divisions stack found in `root`; returns `null` when the page has none. */
export function initDivisionPanels(root: Document = document): DivisionPanelsController | null {
  const section = root.querySelector<HTMLElement>(DIVISIONS_SELECTOR);
  const heading = section?.querySelector<HTMLElement>(DIVISIONS_HEADING_SELECTOR);
  const list = section?.querySelector<HTMLElement>(DIVISIONS_LIST_SELECTOR);
  const view = root.defaultView;
  if (!section || !heading || !list || !view) return null;

  const divisions = collectDivisions(list);
  if (divisions.length === 0) return null;

  const listeners = new AbortController();
  const { signal } = listeners;
  let openId: string | null = null;
  let unlockTimer: number | undefined;

  const prefersReducedMotion = (): boolean => view.matchMedia(REDUCED_MOTION_QUERY).matches;

  const measureHeading = (): void => {
    list.style.setProperty(HEADING_HEIGHT_PROPERTY, `${heading.getBoundingClientRect().height}px`);
  };

  const cancelUnlock = (): void => {
    if (unlockTimer !== undefined) view.clearTimeout(unlockTimer);
    unlockTimer = undefined;
  };

  // Waits for the collapse to finish; a timer instead of `transitionend`, which never fires when
  // the transition is skipped (reduced motion, hidden tab, instant collapse).
  const scheduleUnlock = (panel: HTMLElement): void => {
    cancelUnlock();
    const delay = parseDurationMs(view.getComputedStyle(panel).transitionDuration);
    unlockTimer = view.setTimeout(() => {
      unlockTimer = undefined;
      if (openId === null) list.removeAttribute(LOCKED_ATTRIBUTE);
    }, delay);
  };

  /**
   * Collapses a panel above `anchor` without animating it, then compensates the scroll so
   * `anchor` stays where the visitor saw it (browsers without scroll anchoring would jump).
   */
  const collapseInstantly = (division: DivisionParts, anchor: HTMLElement): void => {
    const before = anchor.getBoundingClientRect().top;
    division.panel.setAttribute(INSTANT_ATTRIBUTE, '');
    setDivisionState(division, false);
    const shift = anchor.getBoundingClientRect().top - before; // Also commits the layout.
    division.panel.removeAttribute(INSTANT_ATTRIBUTE);
    if (shift !== 0) view.scrollTo({ top: view.scrollY + shift, behavior: 'instant' });
  };

  const scrollToBanner = (article: HTMLElement): void => {
    const margin = Number.parseFloat(view.getComputedStyle(article).scrollMarginTop) || 0;
    view.scrollTo({
      top: article.getBoundingClientRect().top + view.scrollY - margin,
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
    });
  };

  const toggle = (id: string): void => {
    const target = divisions.find((division) => division.id === id);
    if (!target) return;
    const nextId = nextOpenId(openId, id);
    const previous = divisions.find((division) => division.id === openId);

    if (nextId === null) {
      openId = null;
      setDivisionState(target, false);
      scheduleUnlock(target.panel);
      return;
    }

    cancelUnlock();
    measureHeading();
    list.setAttribute(LOCKED_ATTRIBUTE, '');
    if (previous) {
      // A panel above the target collapses at once: animating it would move the target while
      // the page scrolls to it. One below the target does not move it, so it animates.
      const isAbove = divisions.indexOf(previous) < divisions.indexOf(target);
      if (isAbove) collapseInstantly(previous, target.article);
      else setDivisionState(previous, false);
    }
    openId = nextId;
    setDivisionState(target, true);
    scrollToBanner(target.article);
  };

  for (const division of divisions) {
    setDivisionState(division, false);
    division.toggle.addEventListener('click', () => toggle(division.id), { signal });
  }

  measureHeading();
  if (typeof view.ResizeObserver === 'function') {
    const observer = new view.ResizeObserver(measureHeading);
    observer.observe(heading);
    signal.addEventListener('abort', () => observer.disconnect());
  }

  return {
    get openId() {
      return openId;
    },
    toggle,
    destroy: () => {
      cancelUnlock();
      listeners.abort();
    },
  };
}
