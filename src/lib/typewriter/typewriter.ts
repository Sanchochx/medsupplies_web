/**
 * Typewriter effect for server-rendered text (see `components/ui/Typewriter.astro`).
 *
 * Inline markup (`<strong>`, `<span class>`, links…) and `<br>` are kept: only text is split, so a
 * paragraph with a highlighted phrase and line breaks types as one flow, in reading order.
 * The whole text is in the markup from the first frame, one span per character, so the element
 * already has its final height and line wraps: typing only flips characters from transparent to
 * visible and never reflows. Progress comes from elapsed time on `requestAnimationFrame`
 * (characters shown = floor(elapsed / speed)), so a slow frame skips ahead instead of drifting.
 * Under `prefers-reduced-motion` or on a back/forward cache restore the text is shown at once.
 * When every character is shown it dispatches `typewriter:complete` on its element.
 *
 * Triggers: `load` starts with the page, once the tab is visible. `view` starts with the intro
 * sequence it belongs to (the nearest `[data-intro-root]`, see lib/motion/introSequence.ts), so
 * its delay counts from the same moment as the rest of the sequence; outside any sequence it starts
 * when the element itself enters the viewport (shared observer, lib/motion/inView.ts). Once only.
 * Chains: with `data-typewriter-after="<id>"` it starts when the typewriter with that id completes
 * (its delay then counts from that moment), so several texts type one after another; a skipped
 * sequence still shows it at once.
 */
import { INTRO_ROOT_SELECTOR, INTRO_SKIP_EVENT, INTRO_START_EVENT } from '../motion/introEvents';
import { onceInView } from '../motion/inView';

export type TypewriterTrigger = 'load' | 'view';

export interface TypewriterOptions {
  /** Milliseconds per character. */
  speed: number;
  /** Milliseconds between the trigger and the first character. */
  delay: number;
  /** `load`: start with the page (once the tab is visible). `view`: start on entering the viewport. */
  trigger: TypewriterTrigger;
}

export interface TypewriterController {
  /** Characters currently shown. */
  readonly typed: number;
  /** Shows the whole text and stops; safe to call more than once. */
  complete(): void;
  /** Removes every listener without changing what is shown. */
  destroy(): void;
}

export const TYPEWRITER_SELECTOR = '[data-typewriter]';
export const TYPEWRITER_CHAR_SELECTOR = '[data-typewriter-char]';
/** Dispatched on the typewriter element when the whole text is shown (typed or completed). */
export const TYPEWRITER_COMPLETE_EVENT = 'typewriter:complete';
export const TYPEWRITER_DEFAULTS: Readonly<TypewriterOptions> = {
  speed: 12,
  delay: 0,
  trigger: 'load',
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const TYPED_ATTR = 'data-typed';
const CARET_ATTR = 'data-typewriter-caret-at';

const TAG_PATTERN = /<\/?[a-zA-Z][^>]*>/g;
// One visible character: an HTML entity (`&amp;`) or a single code point.
const CHAR_PATTERN = /&(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);|[\s\S]/giu;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type HtmlPart = { kind: 'tag'; raw: string; isBreak: boolean } | { kind: 'text'; raw: string };

function htmlParts(html: string): HtmlPart[] {
  const parts: HtmlPart[] = [];
  let last = 0;
  for (const match of html.matchAll(TAG_PATTERN)) {
    if (match.index > last) parts.push({ kind: 'text', raw: html.slice(last, match.index) });
    parts.push({ kind: 'tag', raw: match[0], isBreak: /^<br\b/i.test(match[0]) });
    last = match.index + match[0].length;
  }
  if (last < html.length) parts.push({ kind: 'text', raw: html.slice(last) });
  return parts;
}

/** Whether the text after `index` starts a new line (a `<br>` or the end) before any more text. */
function endsLine(parts: HtmlPart[], index: number): boolean {
  for (const part of parts.slice(index + 1)) {
    if (part.kind === 'tag' && part.isBreak) return true;
    if (part.kind === 'text' && part.raw.trim() !== '') return false;
  }
  return true;
}

function splitText(text: string): string {
  return text
    .split(/( )/)
    .filter(Boolean)
    .map((segment) => {
      if (segment === ' ') return '<span data-typewriter-char> </span>';
      const chars = segment.match(CHAR_PATTERN) ?? [];
      return `<span data-typewriter-word>${chars.map((char) => `<span data-typewriter-char>${char}</span>`).join('')}</span>`;
    })
    .join('');
}

/**
 * Wraps every visible character of `html` in `<span data-typewriter-char>`, grouping each word
 * (or the part of a word inside one element) in a `nowrap` span, so lines wrap exactly as in the
 * original. Tags pass through untouched. Whitespace collapses as HTML renders it, and spaces at
 * the start or end of a line (around `<br>`) are dropped, so they do not count as typed time.
 */
export function splitTypewriterHtml(html: string): string {
  const parts = htmlParts(html);
  let atLineStart = true;
  let afterSpace = false;
  return parts
    .map((part, index) => {
      if (part.kind === 'tag') {
        if (part.isBreak) {
          atLineStart = true;
          afterSpace = false;
        }
        return part.raw;
      }
      let text = part.raw.replace(/\s+/g, ' ');
      if (atLineStart || afterSpace) text = text.replace(/^ /, '');
      if (text.endsWith(' ') && endsLine(parts, index)) text = text.slice(0, -1);
      if (text !== '') {
        atLineStart = false;
        afterSpace = text.endsWith(' ');
      }
      return splitText(text);
    })
    .join('');
}

/** How many of `total` characters are shown `elapsed` ms after the trigger. */
export function typedCharCount(
  elapsed: number,
  { speed, delay }: Pick<TypewriterOptions, 'speed' | 'delay'>,
  total: number,
): number {
  const typingTime = elapsed - delay;
  if (typingTime < 0) return 0;
  if (speed <= 0) return total;
  return Math.min(total, Math.floor(typingTime / speed));
}

function readMs(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function readTypewriterOptions(element: HTMLElement): TypewriterOptions {
  const { typewriterSpeed, typewriterDelay, typewriterTrigger } = element.dataset;
  return {
    speed: readMs(typewriterSpeed, TYPEWRITER_DEFAULTS.speed),
    delay: readMs(typewriterDelay, TYPEWRITER_DEFAULTS.delay),
    trigger: typewriterTrigger === 'view' ? 'view' : TYPEWRITER_DEFAULTS.trigger,
  };
}

export function createTypewriter(root: HTMLElement, win: Window = window): TypewriterController {
  const doc = root.ownerDocument;
  const options = readTypewriterOptions(root);
  const chars = Array.from(root.querySelectorAll<HTMLElement>(TYPEWRITER_CHAR_SELECTOR));
  const reducedMotion = win.matchMedia(REDUCED_MOTION_QUERY);
  const cleanups: Array<() => void> = [];

  let typed = 0;
  let startTime: number | undefined;
  let frame: number | undefined;
  let caretChar: HTMLElement | undefined;
  let state: 'idle' | 'typing' | 'done' = 'idle';

  const listen = (target: EventTarget, type: string, listener: (event: Event) => void): void => {
    target.addEventListener(type, listener);
    cleanups.push(() => target.removeEventListener(type, listener));
  };

  const destroy = (): void => {
    if (frame !== undefined) win.cancelAnimationFrame(frame);
    frame = undefined;
    cleanups.splice(0).forEach((cleanup) => cleanup());
  };

  const moveCaret = (): void => {
    // Never on a space: a space at a line end hangs past the edge and the caret would float there.
    let index = typed - 1;
    while (index >= 0 && chars[index]?.textContent?.trim() === '') index -= 1;
    const next = index >= 0 ? chars[index] : undefined;
    if (next === caretChar) return;
    caretChar?.removeAttribute(CARET_ATTR);
    next?.setAttribute(CARET_ATTR, '');
    caretChar = next;
  };

  const complete = (): void => {
    if (state === 'done') return;
    state = 'done';
    typed = chars.length;
    // One attribute on the root shows every character (CSS), instead of touching each span.
    root.dataset.typewriterState = 'done';
    destroy();
    const EventCtor = doc.defaultView?.Event ?? Event;
    root.dispatchEvent(new EventCtor(TYPEWRITER_COMPLETE_EVENT));
  };

  const tick = (now: number): void => {
    startTime ??= now;
    const count = typedCharCount(now - startTime, options, chars.length);
    for (let index = typed; index < count; index += 1) chars[index]?.setAttribute(TYPED_ATTR, '');
    if (count !== typed) {
      typed = count;
      moveCaret();
    }
    if (count >= chars.length) {
      frame = undefined;
      complete();
      return;
    }
    frame = win.requestAnimationFrame(tick);
  };

  const start = (): void => {
    if (state !== 'idle') return;
    state = 'typing';
    root.dataset.typewriterState = 'typing';
    frame = win.requestAnimationFrame(tick);
  };

  const controller: TypewriterController = {
    get typed() {
      return typed;
    },
    complete,
    destroy,
  };

  if (reducedMotion.matches) {
    complete();
    return controller;
  }

  listen(reducedMotion, 'change', () => {
    if (reducedMotion.matches) complete();
  });
  // Restored mid-typing from the back/forward cache: show the end. Not-yet-started text waits.
  listen(win, 'pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted && state === 'typing') complete();
  });

  const sequence =
    options.trigger === 'view' ? root.closest<HTMLElement>(INTRO_ROOT_SELECTOR) : null;
  const afterId = root.dataset.typewriterAfter;
  const previous = afterId ? doc.getElementById(afterId) : null;
  if (previous) {
    if (sequence?.dataset.introState === 'done') complete();
    else if (previous.dataset.typewriterState === 'done') start();
    else {
      listen(previous, TYPEWRITER_COMPLETE_EVENT, start);
      if (sequence) listen(sequence, INTRO_SKIP_EVENT, complete);
    }
  } else if (sequence) {
    const sequenceState = sequence.dataset.introState;
    if (sequenceState === 'done') complete();
    else if (sequenceState === 'playing') start();
    else {
      listen(sequence, INTRO_START_EVENT, start);
      listen(sequence, INTRO_SKIP_EVENT, complete);
    }
  } else if (options.trigger === 'view') {
    cleanups.push(onceInView(root, (outcome) => (outcome === 'skip' ? complete() : start()), win));
  } else if (doc.visibilityState === 'visible') {
    start();
  } else {
    // A page opened in a background tab starts typing when it is first shown.
    listen(doc, 'visibilitychange', () => {
      if (doc.visibilityState === 'visible') start();
    });
  }

  return controller;
}

export function initTypewriters(root: ParentNode = document): TypewriterController[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TYPEWRITER_SELECTOR), (element) =>
    createTypewriter(element),
  );
}
