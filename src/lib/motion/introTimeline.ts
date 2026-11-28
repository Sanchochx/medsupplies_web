/**
 * Entrance choreography: the one place for durations, delays, distances and easings of every
 * intro sequence (see introSequence.ts). Components write a step as CSS custom properties
 * (`--intro-*`, read by the keyframes in global.css) and pass the typewriter values as props, so
 * neither the CSS nor the scripts hold any timing. Times in ms from the sequence start, px for
 * distances.
 */
import type { BannerTextSide } from '../data';
import { TYPEWRITER_DEFAULTS } from '../typewriter/typewriter';

export const INTRO_EASINGS = {
  /** Ease-out (quint): fast start, soft landing. Entrances. */
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Ease-in-out (cubic). Wipes. */
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  /** Ease-out with a slight overshoot. Pop-ins. */
  pop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export type IntroEasing = keyof typeof INTRO_EASINGS;

export interface IntroStep {
  delay: number;
  duration: number;
  easing?: IntroEasing;
  /** Start offset; the element moves from there to its place. */
  x?: number;
  y?: number;
  /** Start scale (1 = none). */
  scale?: number;
  /** Start opacity (default 0: fades in). 1 moves or scales the element without fading it. */
  opacity?: number;
  /** Start offset from the `lg` breakpoint (side-by-side layouts), if different. */
  lg?: { x?: number; y?: number };
}

export interface TypewriterStep {
  delay: number;
  speed: number;
}

/** Matches Tailwind's `lg`: the layouts that switch from stacked to side by side. */
export const SIDE_BY_SIDE_MEDIA = '(min-width: 64rem)';

const TYPING_SPEED = TYPEWRITER_DEFAULTS.speed;

/** Hero, on load. */
export const HERO_INTRO_STEPS = {
  badge: { delay: 0, duration: 500 },
  titleBrand: { delay: 150, duration: 700, y: 24 },
  titleRest: { delay: 300, duration: 700, y: 24 },
  primaryCta: { delay: 1400, duration: 600, y: 20 },
  secondaryCta: { delay: 1500, duration: 600, y: 20 },
  microSpecs: { delay: 1600, duration: 500 },
} as const satisfies Record<string, IntroStep>;

/** The tallest `--spacing-header` (5rem, from lg): the header bar starts just above the viewport. */
const HEADER_HEIGHT = 80;
const NAV_SHIFT = -12;

/**
 * Site chrome, on every page load (F5 included), alongside the hero: the header bar slides down,
 * its logo and then each link drop into place one after the other, and the WhatsApp button pops
 * in once the hero title is up. Each is its own load-triggered sequence.
 */
export const SITE_CHROME_INTRO = {
  bar: { delay: 0, duration: 600, y: -HEADER_HEIGHT, opacity: 1 },
  logo: { delay: 200, duration: 500, y: NAV_SHIFT },
  /** The first link (and the mobile menu toggle); each next link follows `linkStagger` ms later. */
  link: { delay: 300, duration: 450, y: NAV_SHIFT },
  linkStagger: 70,
  whatsApp: { delay: 900, duration: 600, easing: 'pop', scale: 0.4 },
} as const satisfies {
  bar: IntroStep;
  logo: IntroStep;
  link: IntroStep;
  linkStagger: number;
  whatsApp: IntroStep;
};

/** The step of the header nav link at `index` (0-based). */
export function navLinkIntro(index: number): IntroStep {
  const { link, linkStagger } = SITE_CHROME_INTRO;
  return { ...link, delay: link.delay + index * linkStagger };
}

/** The hero lead is typed, not faded; it does not hold back the buttons. */
export const HERO_LEAD_TYPEWRITER: TypewriterStep = { delay: 700, speed: TYPING_SPEED };

/** A highlighted section heading with a typed lead, on entering the viewport. */
export interface HeaderIntro {
  heading: IntroStep;
  lead: TypewriterStep;
}

const HEADER_HEADING_STEP: IntroStep = { delay: 0, duration: 700, y: 24 };

/** "Ingeniería y suministros que facilitan su vida". */
export const HISTORY_INTRO: HeaderIntro = {
  heading: HEADER_HEADING_STEP,
  lead: { delay: 300, speed: TYPING_SPEED },
};

/** "Política integrada". */
export const POLICY_INTRO: HeaderIntro = {
  heading: HEADER_HEADING_STEP,
  lead: { delay: 300, speed: TYPING_SPEED },
};

/**
 * Mission and vision band. The band wipes in from the right; each half (title, typed text, chip)
 * starts with the band when side by side, or on its own entry once the band has started when
 * stacked. Titles slide in horizontally side by side and rise when stacked.
 */
export const MISSION_VISION_INTRO = {
  band: { delay: 0, duration: 900, easing: 'inOut' },
  titles: [
    { delay: 600, duration: 600, y: 24, lg: { x: -32, y: 0 } },
    { delay: 720, duration: 600, y: 24, lg: { x: 32, y: 0 } },
  ],
  texts: [
    { delay: 1100, speed: TYPING_SPEED },
    { delay: 1250, speed: TYPING_SPEED },
  ],
  /** Plays when its half's text finishes typing. */
  highlight: { delay: 0, duration: 400, scale: 0.95 },
} as const satisfies {
  band: IntroStep;
  titles: readonly [IntroStep, IntroStep];
  texts: readonly [TypewriterStep, TypewriterStep];
  highlight: IntroStep;
};

/** `data-intro` value of a clip-path wipe, named by the direction it reveals the element in. */
export const INTRO_WIPES = {
  rightToLeft: 'wipe',
  leftToRight: 'wipe-ltr',
} as const;

export type IntroWipe = (typeof INTRO_WIPES)[keyof typeof INTRO_WIPES];

const DIVISION_TITLE_SHIFT = 32;

/**
 * Division banners ("Divisiones"). Each banner is its own sequence; banners entering the viewport
 * together start in DOM order, `stagger` ms apart (see introStagger.ts). The banner wipes in like
 * the mission band while its photo settles, then the title slides in from its own side and the
 * chevron pops in.
 */
export const DIVISION_BANNER_INTRO = {
  stagger: 250,
  wipe: MISSION_VISION_INTRO.band,
  image: { delay: 0, duration: 900, easing: 'inOut', scale: 1.06, opacity: 1 },
  title: { delay: 500, duration: 600 },
  chevron: { delay: 900, duration: 400, scale: 0.9 },
} as const satisfies {
  stagger: number;
  wipe: IntroStep;
  image: IntroStep;
  title: IntroStep;
  chevron: IntroStep;
};

export interface DivisionBannerIntro {
  wipe: IntroWipe;
  title: IntroStep;
}

/**
 * Direction of a banner's entrance, from the side its text sits on: the wipe sweeps toward the
 * text (banners 1 and 3, text on the left: right to left; banner 2, text on the right: left to
 * right) and the title slides in from its own edge.
 */
export function divisionBannerIntro(textSide: BannerTextSide): DivisionBannerIntro {
  const isRight = textSide === 'right';
  return {
    wipe: isRight ? INTRO_WIPES.leftToRight : INTRO_WIPES.rightToLeft,
    title: {
      ...DIVISION_BANNER_INTRO.title,
      x: isRight ? DIVISION_TITLE_SHIFT : -DIVISION_TITLE_SHIFT,
    },
  };
}

const CONTACT_SHIFT = 32;

/**
 * "Contáctanos". The section is the sequence: the heading rises and the lead types while the
 * background photo fades in. The map (from the left) and the card (from the right) start with the
 * section when side by side, or each on its own entry when stacked (card first, map below). Inside
 * the card a chain runs row by row: the badge pops in, then its text types; each row starts when
 * the previous text has finished typing (see `contactCardChain`), and the WhatsApp button closes it.
 */
export const CONTACT_INTRO = {
  header: { heading: HEADER_HEADING_STEP, lead: { delay: 300, speed: 21 } },
  photo: { delay: 0, duration: 1200 },
  map: { delay: 400, duration: 700, x: -CONTACT_SHIFT, scale: 0.98 },
  card: { delay: 500, duration: 700, x: CONTACT_SHIFT },
  /** The first badge, from the start of the card's sequence. */
  chainStart: 900,
  badge: { delay: 0, duration: 350, scale: 0.8 },
  /** A row's text starts typing this long after its badge starts popping in. */
  typingGap: 250,
  rowSpeed: TYPING_SPEED,
  button: { delay: 0, duration: 400, y: 12 },
  /** The button label starts typing this long after the button starts fading in. */
  buttonLabelGap: 150,
} as const satisfies {
  header: HeaderIntro;
  photo: IntroStep;
  map: IntroStep;
  card: IntroStep;
  chainStart: number;
  badge: IntroStep;
  typingGap: number;
  rowSpeed: number;
  button: IntroStep;
  buttonLabelGap: number;
};

/** A typed text of a chain: it follows the typewriter `after`, or the sequence start without one. */
export interface ChainedTyping extends TypewriterStep {
  id: string;
  after?: string;
}

export interface ChainedRow {
  badge: IntroStep;
  /** The typewriter the badge waits for (`data-intro-after`); none for the first row. */
  badgeAfter?: string;
  lines: ChainedTyping[];
}

export interface ContactCardChain {
  rows: ChainedRow[];
  button: IntroStep;
  /** The typewriter the button (and its label) waits for: the last text of the rows. */
  buttonAfter?: string;
  label: TypewriterStep;
}

/**
 * The contact card's chain, from the typewriter ids of each row (one per line). Every badge but
 * the first, and every text, waits for the text before it, so a row never starts until the
 * previous one is fully typed.
 */
export function contactCardChain(rowIds: readonly (readonly string[])[]): ContactCardChain {
  const { chainStart, badge, typingGap, rowSpeed, button, buttonLabelGap } = CONTACT_INTRO;
  let previous: string | undefined;
  const rows = rowIds.map((ids): ChainedRow => {
    const badgeAfter = previous;
    const badgeDelay = badgeAfter ? 0 : chainStart;
    const lines = ids.map((id, index): ChainedTyping => {
      const after = previous;
      previous = id;
      const delay = index === 0 ? badgeDelay + typingGap : 0;
      return { id, delay, speed: rowSpeed, ...(after ? { after } : {}) };
    });
    return { badge: { ...badge, delay: badgeDelay }, lines, ...(badgeAfter ? { badgeAfter } : {}) };
  });
  return {
    rows,
    button,
    label: { delay: buttonLabelGap, speed: rowSpeed },
    ...(previous ? { buttonAfter: previous } : {}),
  };
}

/**
 * Inline `style` value for an animated element (or a wrapper whose children animate). Every
 * variable is always written, so nothing is inherited from an animated ancestor.
 */
export function introStepStyle(step: IntroStep): string {
  const { delay, duration, easing = 'out', x = 0, y = 0, scale = 1, opacity = 0, lg = {} } = step;
  return [
    `--intro-delay: ${delay}ms`,
    `--intro-duration: ${duration}ms`,
    `--intro-ease: ${INTRO_EASINGS[easing]}`,
    `--intro-x: ${x}px`,
    `--intro-y: ${y}px`,
    `--intro-lg-x: ${lg.x ?? x}px`,
    `--intro-lg-y: ${lg.y ?? y}px`,
    `--intro-opacity: ${opacity}`,
    `--intro-scale: ${scale}`,
  ].join('; ');
}
