/**
 * Line change inside an open division panel: the shown line fades out, the incoming line is
 * swapped in at its start pose and then enters, sliding from the side it comes from, while the line
 * area's height animates between the two lines. The tab bar, the footer and the photo tile (shared
 * by every line, its loop goes on untouched) do not move. lineTabs.ts updates the tabs at once and hands the tab panels to this module.
 *
 * Markup and CSS contract (global.css): `data-line-motion` on the `[data-line-tabs]` root is
 * `idle | leaving | preparing | entering`, and `data-direction` is `next | prev`.
 * `[data-line-viewport]` is the element whose height animates (`data-resizing` while it does).
 *
 * The latest selection always wins: a change during the fade-out just retargets it, and a change
 * during the entrance fades out from wherever the content is. When the panel is not fully open, or under reduced motion, lines swap instantly.
 */
import { DIVISION_PANEL_MOTION, lineEntranceTotal } from '../motion/panelMotionTimeline';
import { PANEL_MOTION_ATTRIBUTE } from './panelMotion';

export type LineMotionPhase = 'idle' | 'leaving' | 'preparing' | 'entering';
export type LineDirection = 'next' | 'prev';

export const LINE_MOTION_ATTRIBUTE = 'data-line-motion';
export const LINE_DIRECTION_ATTRIBUTE = 'data-direction';
export const LINE_VIEWPORT_SELECTOR = '[data-line-viewport]';
export const RESIZING_ATTRIBUTE = 'data-resizing';
const PANEL_SELECTOR = '[data-division-panel]';
const CHIP_SELECTOR = '[data-motion="chip"]';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
/** Height differences below this are rounding, not a change of line height. */
const MIN_RESIZE_PX = 0.5;

/** A later line comes in from the right (`next`), an earlier one from the left (`prev`). */
export function lineDirection(from: number, to: number): LineDirection {
  return to < from ? 'prev' : 'next';
}

export interface LineMotion {
  readonly phase: LineMotionPhase;
  /** Index of the tab panel currently displayed (it trails the selection while fading out). */
  readonly shownIndex: number;
  show(index: number, direction: LineDirection): void;
  /** Drops pending timers and shows the selected line; safe to call more than once. */
  destroy(): void;
}

export function createLineMotion(
  root: HTMLElement,
  panels: readonly HTMLElement[],
  initial: number,
): LineMotion {
  const view = root.ownerDocument.defaultView;
  const viewport = root.querySelector<HTMLElement>(LINE_VIEWPORT_SELECTOR);
  const region = root.closest<HTMLElement>(PANEL_SELECTOR);

  let phase: LineMotionPhase = 'idle';
  let shown = initial;
  let target = initial;
  let timer: number | undefined;
  // Bumped by every new change, so a superseded step that resolves late does nothing.
  let token = 0;

  const canAnimate = (): boolean =>
    view !== null &&
    !view.matchMedia(REDUCED_MOTION_QUERY).matches &&
    region?.getAttribute(PANEL_MOTION_ATTRIBUTE) === 'open';

  const setPhase = (next: LineMotionPhase): void => {
    phase = next;
    root.setAttribute(LINE_MOTION_ATTRIBUTE, next);
  };

  const cancelTimer = (): void => {
    if (timer !== undefined) view?.clearTimeout(timer);
    timer = undefined;
  };

  const clearResize = (): void => {
    if (!viewport) return;
    viewport.style.removeProperty('height');
    viewport.removeAttribute(RESIZING_ATTRIBUTE);
  };

  const swap = (index: number): void => {
    panels.forEach((panel, position) => {
      panel.hidden = position !== index;
    });
    shown = index;
  };

  /** Instant: the selected line, at rest, with nothing pending. */
  const settle = (): void => {
    token += 1;
    cancelTimer();
    swap(target);
    clearResize();
    setPhase('idle');
  };

  const enter = (current: number): void => {
    if (!view) return;
    const from = viewport?.getBoundingClientRect().height ?? 0;
    clearResize();
    swap(target);
    setPhase('preparing');
    const to = viewport?.getBoundingClientRect().height ?? 0;
    if (viewport && Math.abs(to - from) > MIN_RESIZE_PX) {
      viewport.style.height = `${from}px`;
      viewport.setAttribute(RESIZING_ATTRIBUTE, '');
    }
    // Commit the start pose (and the start height) so the next change transitions from them.
    void root.offsetWidth;
    if (viewport?.hasAttribute(RESIZING_ATTRIBUTE)) viewport.style.height = `${to}px`;
    setPhase('entering');

    const chips = panels[shown]?.querySelectorAll(CHIP_SELECTOR).length ?? 0;
    timer = view.setTimeout(() => {
      timer = undefined;
      if (current !== token) return;
      clearResize();
      setPhase('idle');
    }, lineEntranceTotal(chips));
  };

  const show = (index: number, direction: LineDirection): void => {
    if (index < 0 || index >= panels.length || index === target) return;
    target = index;
    root.setAttribute(LINE_DIRECTION_ATTRIBUTE, direction);
    if (!view || !canAnimate()) {
      settle();
      return;
    }
    // Already fading out: the fade ends on the latest target.
    if (phase === 'leaving') return;

    token += 1;
    const current = token;
    cancelTimer();
    setPhase('leaving');
    timer = view.setTimeout(() => {
      timer = undefined;
      if (current !== token) return;
      if (canAnimate()) enter(current);
      else settle();
    }, DIVISION_PANEL_MOTION.leave);
  };

  swap(initial);
  setPhase('idle');

  return {
    get phase() {
      return phase;
    },
    get shownIndex() {
      return shown;
    },
    show,
    destroy: settle,
  };
}
