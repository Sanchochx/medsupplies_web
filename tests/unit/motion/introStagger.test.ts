import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initIntro, type IntroController } from '../../../src/lib/motion/introSequence';
import { nextStartTime } from '../../../src/lib/motion/introStagger';
import { createMotionEnv, REDUCED_MOTION, type MotionEnv } from '../helpers/fakeMotionEnv';

/** Mirrors DivisionsSection: three banner sequences in a staggered list. */
const LIST = `
  <ul data-intro-group data-intro-stagger="250">
    ${[1, 2, 3]
      .map(
        (n) =>
          `<li><article id="d${n}" data-intro-root data-intro-trigger="view"><div data-intro="wipe"></div></article></li>`,
      )
      .join('')}
  </ul>`;

describe('nextStartTime', () => {
  it('starts right away when nothing started recently, otherwise one stagger after the last', () => {
    expect(nextStartTime(1000, Number.NEGATIVE_INFINITY, 250)).toBe(1000);
    expect(nextStartTime(1000, 1000, 250)).toBe(1250);
    expect(nextStartTime(1100, 1000, 250)).toBe(1250);
    expect(nextStartTime(2000, 1000, 250)).toBe(2000);
  });
});

describe('staggered intro group', () => {
  let env: MotionEnv;
  let controllers: IntroController[];
  let now: number;

  const $ = (selector: string): HTMLElement =>
    env.win.document.querySelector(selector) as unknown as HTMLElement;
  const state = (selector: string): string | undefined => $(selector).dataset.introState;
  const offset = (selector: string): string => $(selector).style.getPropertyValue('--intro-offset');
  const enter = (selector: string): void =>
    env.observer()?.fire($(selector), { isIntersecting: true });
  const flush = (): Promise<void> => Promise.resolve();

  beforeEach(() => {
    env = createMotionEnv();
    now = 1000;
    vi.spyOn(env.dom.performance, 'now').mockImplementation(() => now);
    env.win.document.body.innerHTML = LIST;
    controllers = ['#d1', '#d2', '#d3'].map((selector) => initIntro($(selector), env.dom));
  });

  afterEach(() => {
    controllers.forEach((controller) => controller.destroy());
    env.close();
  });

  it('staggers banners entering together in DOM order, whatever order they are reported in', async () => {
    enter('#d3');
    enter('#d1');
    enter('#d2');
    await flush();

    expect(['#d1', '#d2', '#d3'].map(state)).toEqual(['playing', 'playing', 'playing']);
    expect(['#d1', '#d2', '#d3'].map(offset)).toEqual(['0ms', '250ms', '500ms']);
    expect(state('#d2 [data-intro]')).toBe('playing');
  });

  it('plays each banner as it enters when they enter at different moments', async () => {
    enter('#d1');
    await flush();
    expect(state('#d1')).toBe('playing');
    expect(state('#d2')).toBeUndefined();

    now += 1200;
    enter('#d2');
    await flush();
    now += 100;
    enter('#d3');
    await flush();

    expect(offset('#d1')).toBe('0ms');
    expect(offset('#d2')).toBe('0ms');
    // Entered 100ms after the previous one: waits out the rest of the stagger.
    expect(offset('#d3')).toBe('150ms');
  });

  it('plays once: scrolling away and back does not replay or re-stagger it', async () => {
    let starts = 0;
    $('#d1').addEventListener('intro:start', () => (starts += 1));
    enter('#d1');
    await flush();

    env.observer()?.fire($('#d1'), { isIntersecting: false });
    enter('#d1');
    await flush();

    expect(starts).toBe(1);
    expect(offset('#d1')).toBe('0ms');
    expect(env.observer()?.observed.has($('#d1'))).toBe(false);
  });

  it('shows a banner already scrolled past without animating or delaying the next one', async () => {
    env.observer()?.fire($('#d1'), { isIntersecting: false, bottom: -100 });
    enter('#d2');
    await flush();

    expect(state('#d1')).toBe('done');
    expect(offset('#d1')).toBe('');
    expect(offset('#d2')).toBe('0ms');
  });
});

describe('staggered intro group under reduced motion', () => {
  it('shows every banner at once, without observing or offsetting them', () => {
    const env = createMotionEnv();
    env.matching.add(REDUCED_MOTION);
    env.win.document.body.innerHTML = LIST;
    const roots = ['#d1', '#d2', '#d3'].map(
      (selector) => env.win.document.querySelector(selector) as unknown as HTMLElement,
    );
    roots.forEach((root) => initIntro(root, env.dom));

    expect(roots.map((root) => root.dataset.introState)).toEqual(['done', 'done', 'done']);
    expect(
      roots.map((root) => root.querySelector<HTMLElement>('[data-intro]')?.dataset.introState),
    ).toEqual(['done', 'done', 'done']);
    expect(roots.map((root) => root.style.getPropertyValue('--intro-offset'))).toEqual([
      '',
      '',
      '',
    ]);
    expect(env.observer()).toBeUndefined();
    env.close();
  });
});
