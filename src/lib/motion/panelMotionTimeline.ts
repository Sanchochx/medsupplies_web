/**
 * Choreography of the content inside an expandable division panel (DivisionPanel): the one place
 * for its durations, delays, distances and easings. Unlike the intros (introTimeline.ts) it replays
 * on every open, and a line change plays a shorter version of it. Components write the values as
 * CSS custom properties (`--motion-*`, read by the rules in global.css) and the scripts
 * (lib/divisions/panelMotion.ts, lineMotion.ts) use the same numbers for their timers. Times in ms,
 * distances in px.
 */
import { INTRO_EASINGS } from './introTimeline';

/** A staggered group: the first element starts at `delay`, each next one `stagger` ms later. */
export interface StaggerStep {
  delay: number;
  stagger: number;
  /** Longest total stagger, so long lists never drag on. */
  cap: number;
}

export const DIVISION_PANEL_MOTION = {
  /** The entrance starts this long after the panel's height expansion. */
  openOffset: 100,
  duration: 450,
  /** Rise of the fade-and-rise steps. */
  rise: 12,
  /** Horizontal slide of the photo tile on open (and of the chips on a line change). */
  shift: 24,
  photoScale: 0.97,
  /** Delays from the entrance start (after `openOffset`). */
  open: {
    tabs: { delay: 0, stagger: 30, cap: 400 },
    photo: 120,
    pill: 180,
    title: 240,
    chips: { delay: 300, stagger: 35, cap: 450 },
    /** The footer starts this long after the last chip. */
    footerGap: 80,
  },
  /** Content fade-out on close and before a line change (no stagger, no movement). */
  leave: 150,
  /**
   * A line change: delays from the moment the incoming line is shown. The photo tile is shared by
   * every line and stays put, so its loop goes on undisturbed.
   */
  line: {
    duration: 350,
    pill: 0,
    title: 60,
    chips: { delay: 60, stagger: 25, cap: 300 },
  },
  /** Height change of the line area when the incoming line is taller or shorter. */
  resize: 300,
  /** Selected tab: colors and a slight scale-up. */
  tab: { duration: 200, scale: 0.96 },
} as const satisfies {
  openOffset: number;
  duration: number;
  rise: number;
  shift: number;
  photoScale: number;
  open: {
    tabs: StaggerStep;
    photo: number;
    pill: number;
    title: number;
    chips: StaggerStep;
    footerGap: number;
  };
  leave: number;
  line: { duration: number; pill: number; title: number; chips: StaggerStep };
  resize: number;
  tab: { duration: number; scale: number };
};

const { openOffset, open, line } = DIVISION_PANEL_MOTION;

/** Delay of the `index`-th element of a staggered group; the stagger never exceeds `cap`. */
export function staggerDelay(index: number, { delay, stagger, cap }: StaggerStep): number {
  return delay + Math.min(Math.max(index, 0) * stagger, cap);
}

/** When an element starts on panel open and, if it re-enters on a line change, on that. */
export interface PanelMotionDelays {
  open: number;
  line?: number;
}

export const PANEL_MOTION_DELAYS = {
  tab: (index: number): PanelMotionDelays => ({
    open: openOffset + staggerDelay(index, open.tabs),
  }),
  photo: (): PanelMotionDelays => ({ open: openOffset + open.photo }),
  pill: (): PanelMotionDelays => ({ open: openOffset + open.pill, line: line.pill }),
  /** The line title and what follows it (badge, description). */
  title: (): PanelMotionDelays => ({ open: openOffset + open.title, line: line.title }),
  chip: (index: number): PanelMotionDelays => ({
    open: openOffset + staggerDelay(index, open.chips),
    line: staggerDelay(index, line.chips),
  }),
} as const;

/** The footer comes last: after the last chip of the line shown when the panel opens. */
export function panelFooterDelay(chipCount: number): number {
  return openOffset + staggerDelay(chipCount - 1, open.chips) + open.footerGap;
}

/** Time from the open until every element of the entrance has finished. */
export function panelEntranceTotal(chipCount: number): number {
  return panelFooterDelay(chipCount) + DIVISION_PANEL_MOTION.duration;
}

/** Time from showing the incoming line until its entrance (and the height change) has finished. */
export function lineEntranceTotal(chipCount: number): number {
  const lastStart = Math.max(line.pill, line.title, staggerDelay(chipCount - 1, line.chips));
  return Math.max(lastStart + line.duration, DIVISION_PANEL_MOTION.resize);
}

/** Custom property the panel script sets for the footer, which depends on the line shown. */
export const FOOTER_DELAY_PROPERTY = '--motion-footer-delay';

/** Inline `style` of the panel root: the shared durations, distances and easings. */
export function divisionPanelMotionStyle(): string {
  const { duration, rise, shift, photoScale, leave, resize, tab } = DIVISION_PANEL_MOTION;
  return [
    `--motion-duration: ${duration}ms`,
    `--motion-line-duration: ${line.duration}ms`,
    `--motion-leave-duration: ${leave}ms`,
    `--motion-resize-duration: ${resize}ms`,
    `--motion-tab-duration: ${tab.duration}ms`,
    `--motion-ease: ${INTRO_EASINGS.out}`,
    `--motion-leave-ease: ${INTRO_EASINGS.inOut}`,
    `--motion-rise: ${rise}px`,
    `--motion-shift: ${shift}px`,
    `--motion-photo-scale: ${photoScale}`,
    `--motion-tab-scale: ${tab.scale}`,
  ].join('; ');
}

/** Inline `style` of an animated element (`[data-motion]`). */
export function panelMotionDelayStyle({
  open: openDelay,
  line: lineDelay,
}: PanelMotionDelays): string {
  return [
    `--motion-open-delay: ${openDelay}ms`,
    ...(lineDelay === undefined ? [] : [`--motion-line-delay: ${lineDelay}ms`]),
  ].join('; ');
}
