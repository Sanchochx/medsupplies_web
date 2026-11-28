import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import ContactSection from '../../../src/components/sections/ContactSection.astro';
import { getContactChannels } from '../../../src/lib/data';
import { initIntro, type IntroController } from '../../../src/lib/motion/introSequence';
import {
  CONTACT_INTRO,
  SIDE_BY_SIDE_MEDIA,
  contactCardChain,
} from '../../../src/lib/motion/introTimeline';
import {
  createTypewriter,
  type TypewriterController,
} from '../../../src/lib/typewriter/typewriter';
import { createMotionEnv, REDUCED_MOTION, type MotionEnv } from '../helpers/fakeMotionEnv';
import { renderAstro } from '../helpers/renderAstro';

const FRAME = 16;
const CHAIN = [
  'contact-phone-0',
  'contact-email-0',
  'contact-address',
  'contact-address-note',
] as const;

type TrackedState = 'playing' | 'typing' | 'done';
/** First time (ms) each element was seen in each state. */
type Timeline = Map<HTMLElement, Partial<Record<TrackedState, number>>>;

function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Missing: ${what}`);
  return value;
}

describe('contactCardChain', () => {
  it('starts the first row from the sequence and every later step from the text before it', () => {
    const { chainStart, typingGap, rowSpeed, badge } = CONTACT_INTRO;
    const chain = contactCardChain([['phone'], ['email-1', 'email-2'], ['address', 'note']]);

    expect(chain.rows.map(({ badgeAfter }) => badgeAfter)).toEqual([undefined, 'phone', 'email-2']);
    expect(chain.rows[0]?.badge).toEqual({ ...badge, delay: chainStart });
    expect(chain.rows[1]?.badge.delay).toBe(0);
    expect(chain.rows.flatMap(({ lines }) => lines)).toEqual([
      { id: 'phone', delay: chainStart + typingGap, speed: rowSpeed },
      { id: 'email-1', after: 'phone', delay: typingGap, speed: rowSpeed },
      { id: 'email-2', after: 'email-1', delay: 0, speed: rowSpeed },
      { id: 'address', after: 'email-2', delay: typingGap, speed: rowSpeed },
      { id: 'note', after: 'address', delay: 0, speed: rowSpeed },
    ]);
    expect(chain.buttonAfter).toBe('note');
  });
});

describe('contact section entrance', () => {
  let markup: string;
  let env: MotionEnv;
  let typewriters: TypewriterController[];
  let intros: IntroController[];
  let now: number;

  const doc = (): Document => env.win.document as unknown as Document;
  const $ = (selector: string, scope: ParentNode = doc()): HTMLElement =>
    required(scope.querySelector<HTMLElement>(selector), selector);
  const $$ = (selector: string): HTMLElement[] =>
    Array.from(doc().querySelectorAll<HTMLElement>(selector));
  const section = (): HTMLElement => $('#contacto');
  // The card comes first in the DOM; from lg the map is moved before it visually.
  const card = (): HTMLElement => required($$('[data-intro-parent]')[0], 'card');
  const map = (): HTMLElement => required($$('[data-intro-parent]')[1], 'map');
  const badges = (): HTMLElement[] => $$('li > [data-intro]');
  const button = (): HTMLElement => $('a[href^="https://wa.me/"]');
  const label = (): HTMLElement => $('[data-typewriter]', button());
  const typed = (id: string): HTMLElement => $(`#${id}`);
  const enter = (element: HTMLElement): void =>
    env.observer()?.fire(element, { isIntersecting: true });

  /** Mounts the rendered section and starts its scripts, as the page does. */
  function mount(): void {
    env.win.document.body.innerHTML = markup;
    typewriters = $$('[data-typewriter]').map((element) => createTypewriter(element, env.dom));
    intros = $$('[data-intro-root]').map((root) => initIntro(root, env.dom));
  }

  /** Runs frames every 16ms until `until` holds (or `limit` ms pass), noting state changes. */
  function play(tracked: HTMLElement[], until: () => boolean, limit = 10_000): Timeline {
    const timeline: Timeline = new Map(tracked.map((element) => [element, {}]));
    const note = (): void => {
      for (const [element, seen] of timeline) {
        const state = element.dataset.introState ?? element.dataset.typewriterState;
        if (state === 'playing' || state === 'typing' || state === 'done') seen[state] ??= now;
      }
    };
    note();
    for (const end = now + limit; !until() && now < end;) {
      now += FRAME;
      env.frameAt(now);
      note();
    }
    return timeline;
  }

  const allTyped = (): boolean =>
    $$('[data-typewriter]').every((element) => element.dataset.typewriterState === 'done');

  const attributes = (element: HTMLElement): string[][] =>
    Array.from(element.attributes, ({ name, value }) => [name, value]);

  beforeAll(async () => {
    // Scripts are run by hand below, against the fake window.
    markup = (await renderAstro(ContactSection)).replace(/<script\b[^>]*><\/script>/g, '');
  });

  beforeEach(() => {
    env = createMotionEnv();
    typewriters = [];
    intros = [];
    now = 0;
  });

  afterEach(() => {
    typewriters.forEach((typewriter) => typewriter.destroy());
    intros.forEach((intro) => intro.destroy());
    env.close();
  });

  it('waits, hidden, until the section enters the viewport', () => {
    mount();

    expect($$('[data-intro]').every((element) => !element.dataset.introState)).toBe(true);
    expect($$('[data-typewriter]').every((element) => !element.dataset.typewriterState)).toBe(true);
    expect(env.pendingFrames()).toBe(0);
    expect(env.observer()?.observed).toEqual(new Set([section(), card(), map()]));
  });

  describe('side by side (from lg)', () => {
    beforeEach(() => {
      env.matching.add(SIDE_BY_SIDE_MEDIA);
      mount();
    });

    it('starts the heading, lead, photo, map and card together with the section', () => {
      enter(section());

      for (const element of [
        $('#contact-heading'),
        $('img'),
        map(),
        card(),
        $('li > [data-intro]'),
      ]) {
        expect(element.dataset.introState).toBe('playing');
      }
      expect($('p[data-typewriter]').dataset.typewriterState).toBe('typing');
      expect(typed(CHAIN[0]).dataset.typewriterState).toBe('typing');
      // Everything after the first row waits for the text before it.
      expect(
        badges()
          .slice(1)
          .map((badge) => badge.dataset.introState),
      ).toEqual([undefined, undefined]);
      expect(button().dataset.introState).toBeUndefined();
      for (const id of CHAIN.slice(1)) expect(typed(id).dataset.typewriterState).toBeUndefined();
    });

    it('types the card row by row, each step starting when the previous text completes', () => {
      const { phones, emails, address } = getContactChannels();
      const { chainStart, typingGap, rowSpeed, buttonLabelGap } = CONTACT_INTRO;
      const [phone, email, street, note] = CHAIN.map(typed) as [
        HTMLElement,
        HTMLElement,
        HTMLElement,
        HTMLElement,
      ];
      const [badge1, badge2, badge3] = badges() as [HTMLElement, HTMLElement, HTMLElement];
      enter(section());
      const timeline = play(
        [phone, email, street, note, badge1, badge2, badge3, button(), label()],
        allTyped,
      );
      const when = (element: HTMLElement, state: TrackedState): number =>
        required(timeline.get(element)?.[state], `${element.id || element.tagName} ${state}`);
      const typingTime = (text = ''): number => text.length * rowSpeed;

      expect(allTyped()).toBe(true);
      expect(when(badge1, 'playing')).toBe(0);
      expect(when(phone, 'done')).toBeGreaterThanOrEqual(
        chainStart + typingGap + typingTime(phones[0]?.label),
      );
      // Row 2: badge and email start the moment the phone is typed, not on a timer.
      expect(when(badge2, 'playing')).toBe(when(phone, 'done'));
      expect(when(email, 'typing')).toBe(when(phone, 'done'));
      expect(when(email, 'done')).toBeGreaterThanOrEqual(
        when(phone, 'done') + typingGap + typingTime(emails[0]?.label),
      );
      // Row 3: badge, then the address, then its note.
      expect(when(badge3, 'playing')).toBe(when(email, 'done'));
      expect(when(street, 'typing')).toBe(when(email, 'done'));
      expect(when(note, 'typing')).toBe(when(street, 'done'));
      expect(when(street, 'done')).toBeGreaterThanOrEqual(
        when(email, 'done') + typingGap + typingTime(address.text),
      );
      // The WhatsApp button closes the chain.
      expect(when(button(), 'playing')).toBe(when(note, 'done'));
      expect(when(label(), 'typing')).toBe(when(note, 'done'));
      expect(when(label(), 'done')).toBeGreaterThanOrEqual(
        when(note, 'done') + buttonLabelGap + typingTime('Escríbanos por WhatsApp'),
      );
    });

    it('keeps every link clickable and named while typing: same <a>, same attributes', () => {
      const links = $$('li a[href]');
      const before = links.map(attributes);
      enter(section());
      play([], () => typed(CHAIN[1]).dataset.typewriterState === 'typing');
      play([], () => typed(CHAIN[1]).querySelectorAll('[data-typed]').length > 3);

      expect(typed(CHAIN[1]).dataset.typewriterState).toBe('typing');
      expect(links.map(attributes)).toEqual(before);
      expect(links.map((link) => link.getAttribute('aria-label'))).toEqual(
        links.map((link) => link.querySelector('.sr-only')?.textContent),
      );
      expect(links.every((link) => link.isConnected && link.style.pointerEvents === '')).toBe(true);
      expect(button().getAttribute('aria-label')).toBe(
        'Escríbanos por WhatsApp (abre WhatsApp en una pestaña nueva)',
      );
    });

    it('plays once: scrolling away and back never replays it', () => {
      enter(section());
      play([], allTyped);
      const states = $$('[data-intro], [data-typewriter]').map(attributes);

      expect(env.observer()?.observed.has(section())).toBe(false);
      for (const element of [section(), card(), map()]) {
        env.observer()?.fire(element, { isIntersecting: false });
        enter(element);
      }
      play([], () => false, 1000);

      expect($$('[data-intro], [data-typewriter]').map(attributes)).toEqual(states);
      expect(env.pendingFrames()).toBe(0);
    });
  });

  describe('stacked (below lg)', () => {
    beforeEach(mount);

    it('runs the card when it enters the viewport, and the map on its own entry', () => {
      enter(section());

      expect([card(), map()].map((element) => element.dataset.introState)).toEqual([
        undefined,
        undefined,
      ]);
      expect(typed(CHAIN[0]).dataset.typewriterState).toBeUndefined();

      enter(card());
      expect(card().dataset.introState).toBe('playing');
      expect(typed(CHAIN[0]).dataset.typewriterState).toBe('typing');
      expect(map().dataset.introState).toBeUndefined();

      enter(map());
      expect(map().dataset.introState).toBe('playing');
    });

    it('never starts the card before the section, even if it is reported first', () => {
      enter(card());
      expect(card().dataset.introState).toBeUndefined();

      enter(section());
      expect(card().dataset.introState).toBe('playing');
    });
  });

  it('shows the final state at once when the section was scrolled past before load', () => {
    mount();
    for (const element of [section(), card(), map()]) {
      env.observer()?.fire(element, { isIntersecting: false, bottom: -10 });
    }

    expect($$('[data-intro]').every((element) => element.dataset.introState === 'done')).toBe(true);
    expect(allTyped()).toBe(true);
    expect(env.pendingFrames()).toBe(0);
  });

  it('under reduced motion shows everything immediately, without typing or observing', () => {
    env.matching.add(REDUCED_MOTION);
    mount();

    expect(
      $$('[data-intro-root], [data-intro]').every((el) => el.dataset.introState === 'done'),
    ).toBe(true);
    expect(allTyped()).toBe(true);
    expect(env.pendingFrames()).toBe(0);
    expect(env.observer()?.observed.size ?? 0).toBe(0);
    for (const link of $$('a[href]')) expect(link.getAttribute('aria-label')).toBeTruthy();
  });
});
