/**
 * Entrance and exit of a division panel's content, replayed on every open. The panel's height
 * transition is separate (divisionPanels.ts); this only drives `data-motion-state` on the panel,
 * which the CSS in global.css turns into opacity/transform transitions of its `[data-motion]`
 * elements, with the timings of panelMotionTimeline.ts:
 *
 * - `closed`: content held at its start pose (hidden; the panel is also inert and aria-hidden).
 * - `entering`: content moves to its rest pose, staggered.
 * - `open`: no rule applies, so the content is the untouched design (no `will-change` left).
 * - `leaving`: a quick fade-out while the height collapses, then `closed`.
 *
 * The latest call always wins: a timer that has not fired yet is dropped, and since transitions
 * start from the current value, reversing mid-way never jumps or flickers. Under reduced motion
 * the state goes straight to `open` or `closed`.
 */
import {
  DIVISION_PANEL_MOTION,
  FOOTER_DELAY_PROPERTY,
  panelEntranceTotal,
  panelFooterDelay,
} from '../motion/panelMotionTimeline';

export type PanelMotionState = 'closed' | 'entering' | 'open' | 'leaving';

export const PANEL_MOTION_ATTRIBUTE = 'data-motion-state';
/** Chips of the line shown, which set how long the open sequence lasts. */
export const VISIBLE_CHIP_SELECTOR = '[role="tabpanel"]:not([hidden]) [data-motion="chip"]';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export interface PanelMotion {
  readonly state: PanelMotionState;
  open(): void;
  close(): void;
  /** Drops the pending timer; safe to call more than once. */
  destroy(): void;
}

export function createPanelMotion(panel: HTMLElement, view: Window): PanelMotion {
  let state: PanelMotionState = 'closed';
  let timer: number | undefined;

  const reducedMotion = (): boolean => view.matchMedia(REDUCED_MOTION_QUERY).matches;

  const setState = (next: PanelMotionState): void => {
    state = next;
    panel.setAttribute(PANEL_MOTION_ATTRIBUTE, next);
  };

  const cancel = (): void => {
    if (timer !== undefined) view.clearTimeout(timer);
    timer = undefined;
  };

  const settleAfter = (ms: number, next: PanelMotionState): void => {
    timer = view.setTimeout(() => {
      timer = undefined;
      setState(next);
    }, ms);
  };

  setState('closed');

  return {
    get state() {
      return state;
    },
    open() {
      if (state === 'open' || state === 'entering') return;
      cancel();
      if (reducedMotion()) {
        setState('open');
        return;
      }
      const chips = panel.querySelectorAll(VISIBLE_CHIP_SELECTOR).length;
      panel.style.setProperty(FOOTER_DELAY_PROPERTY, `${panelFooterDelay(chips)}ms`);
      // Commit the start pose first, so the entrance runs even if `closed` was set this frame.
      if (state === 'closed') void panel.offsetWidth;
      setState('entering');
      settleAfter(panelEntranceTotal(chips), 'open');
    },
    close() {
      if (state === 'closed' || state === 'leaving') return;
      cancel();
      if (reducedMotion()) {
        setState('closed');
        return;
      }
      setState('leaving');
      settleAfter(DIVISION_PANEL_MOTION.leave, 'closed');
    },
    destroy: cancel,
  };
}
