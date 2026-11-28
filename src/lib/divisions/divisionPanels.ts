/**
 * Expandable product panels of the "Divisiones" stack: each banner is a disclosure button that
 * opens the panel below it. Only one panel is open at a time.
 *
 * While any panel is open the stack is "locked": its rows size to their content (so the section
 * can grow past one screen) and every banner keeps the height it had when closed, via the
 * `h-division-banner` utility. The lock is only
 * released once the closing animation has finished, so banners never stretch mid-transition.
 *
 * Opening a banner while another panel is open closes that panel (animated) and opens the new one
 * at once; the page scrolls to the clicked banner only after the close has finished, when its
 * final position is known, so it ends just below the fixed header without a mid-way jump.
 *
 * Each open replays the content's entrance and each close fades it out (panelMotion.ts).
 */
import { createPanelMotion, type PanelMotion } from './panelMotion';

export const DIVISIONS_SELECTOR = '[data-divisions]';
export const DIVISIONS_LIST_SELECTOR = '[data-divisions-list]';
export const DIVISION_SELECTOR = '[data-division]';
export const DIVISION_TOGGLE_SELECTOR = '[data-division-toggle]';
export const DIVISION_PANEL_SELECTOR = '[data-division-panel]';
/** Set on the list while a panel is open or still closing. */
export const LOCKED_ATTRIBUTE = 'data-locked';

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
  const list = section?.querySelector<HTMLElement>(DIVISIONS_LIST_SELECTOR);
  const view = root.defaultView;
  if (!section || !list || !view) return null;

  const divisions = collectDivisions(list);
  if (divisions.length === 0) return null;
  const motions = new Map<string, PanelMotion>(
    divisions.map((division) => [division.id, createPanelMotion(division.panel, view)]),
  );

  /** The state attributes and the content motion, together. */
  const applyState = (division: DivisionParts, open: boolean): void => {
    setDivisionState(division, open);
    const motion = motions.get(division.id);
    if (open) motion?.open();
    else motion?.close();
  };

  const listeners = new AbortController();
  const { signal } = listeners;
  let openId: string | null = null;
  let unlockTimer: number | undefined;
  let scrollTimer: number | undefined;
  let pinFrame: number | undefined;

  const prefersReducedMotion = (): boolean => view.matchMedia(REDUCED_MOTION_QUERY).matches;

  const cancelUnlock = (): void => {
    if (unlockTimer !== undefined) view.clearTimeout(unlockTimer);
    unlockTimer = undefined;
  };

  const cancelScroll = (): void => {
    if (scrollTimer !== undefined) view.clearTimeout(scrollTimer);
    if (pinFrame !== undefined) view.cancelAnimationFrame(pinFrame);
    scrollTimer = undefined;
    pinFrame = undefined;
  };

  /**
   * Keeps `article` where the visitor clicked it while a panel above it collapses: every frame the
   * page scrolls by however much the article moved. Scroll anchoring cannot do this, because the
   * browser tends to anchor to content inside the collapsing panel and lets the banner fly off.
   */
  const pinInPlace = (article: HTMLElement): void => {
    const pinnedTop = article.getBoundingClientRect().top;
    const step = (): void => {
      const shift = article.getBoundingClientRect().top - pinnedTop;
      if (shift !== 0) view.scrollBy({ top: shift, behavior: 'instant' });
      pinFrame = view.requestAnimationFrame(step);
    };
    pinFrame = view.requestAnimationFrame(step);
  };

  const transitionMs = (panel: HTMLElement): number =>
    parseDurationMs(view.getComputedStyle(panel).transitionDuration);

  // Waits for the collapse to finish; a timer instead of `transitionend`, which never fires when
  // the transition is skipped (reduced motion, hidden tab).
  const scheduleUnlock = (panel: HTMLElement): void => {
    cancelUnlock();
    const delay = transitionMs(panel);
    unlockTimer = view.setTimeout(() => {
      unlockTimer = undefined;
      if (openId === null) list.removeAttribute(LOCKED_ATTRIBUTE);
    }, delay);
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

    cancelScroll();
    if (nextId === null) {
      openId = null;
      applyState(target, false);
      scheduleUnlock(target.panel);
      return;
    }

    cancelUnlock();
    list.setAttribute(LOCKED_ATTRIBUTE, '');
    const closingMs = previous ? transitionMs(previous.panel) : 0;
    if (closingMs > 0) pinInPlace(target.article);
    if (previous) applyState(previous, false);
    openId = nextId;
    applyState(target, true);

    if (closingMs === 0) {
      scrollToBanner(target.article);
      return;
    }
    // Scroll only once the other panel has closed, when the banner's final position is known.
    scrollTimer = view.setTimeout(() => {
      cancelScroll();
      scrollToBanner(target.article);
    }, closingMs);
  };

  for (const division of divisions) {
    setDivisionState(division, false);
    division.toggle.addEventListener('click', () => toggle(division.id), { signal });
  }

  return {
    get openId() {
      return openId;
    },
    toggle,
    destroy: () => {
      cancelUnlock();
      cancelScroll();
      motions.forEach((motion) => motion.destroy());
      listeners.abort();
    },
  };
}
