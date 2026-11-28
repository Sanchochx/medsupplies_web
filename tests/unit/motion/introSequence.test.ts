import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initIntro, type IntroController } from '../../../src/lib/motion/introSequence';
import {
  MISSION_VISION_INTRO,
  SIDE_BY_SIDE_MEDIA,
  SITE_CHROME_INTRO,
  introStepStyle,
  navLinkIntro,
} from '../../../src/lib/motion/introTimeline';
import { createMotionEnv, REDUCED_MOTION, type MotionEnv } from '../helpers/fakeMotionEnv';

/** Mirrors MissionVisionPanel: a wiping band with two halves that follow it. */
const BAND = `
  <div id="band" data-intro-root data-intro-trigger="view"><div id="wipe" data-intro="wipe">
    <article id="half-1" data-intro-root data-intro-trigger="view" data-intro-parent="band" data-intro-sync-media="${SIDE_BY_SIDE_MEDIA}">
      <h3 data-intro>Nuestra Misión</h3>
      <p id="text-1" data-typewriter>…</p>
      <span id="chip-1" data-intro data-intro-after="text-1">Meta</span>
    </article>
    <article id="half-2" data-intro-root data-intro-trigger="view" data-intro-parent="band" data-intro-sync-media="${SIDE_BY_SIDE_MEDIA}">
      <h3 data-intro>Nuestra Visión</h3>
      <p id="text-2" data-typewriter>…</p>
      <span id="chip-2" data-intro data-intro-after="text-2">Calidad</span>
    </article>
  </div></div>`;

describe('intro sequences', () => {
  let env: MotionEnv;
  let controllers: IntroController[];

  const $ = (selector: string): HTMLElement =>
    env.win.document.querySelector(selector) as unknown as HTMLElement;
  const state = (selector: string): string | undefined => $(selector).dataset.introState;
  const enter = (selector: string): void =>
    env.observer()?.fire($(selector), { isIntersecting: true });
  const init = (...selectors: string[]): void => {
    controllers.push(...selectors.map((selector) => initIntro($(selector), env.dom)));
  };
  const completeTyping = (selector: string): void => {
    $(selector).dataset.typewriterState = 'done';
    $(selector).dispatchEvent(new env.win.Event('typewriter:complete') as unknown as Event);
  };

  beforeEach(() => {
    env = createMotionEnv();
    controllers = [];
  });

  afterEach(() => {
    controllers.forEach((controller) => controller.destroy());
    env.close();
  });

  describe('view trigger', () => {
    beforeEach(() => {
      env.win.document.body.innerHTML = `
        <div id="header" data-intro-root data-intro-trigger="view">
          <h2 data-intro>Título</h2>
          <p data-typewriter>Texto</p>
        </div>`;
    });

    it('waits, then plays every element once the section enters the viewport', () => {
      let starts = 0;
      $('#header').addEventListener('intro:start', () => (starts += 1));
      init('#header');
      expect(state('#header')).toBeUndefined();
      expect(state('h2')).toBeUndefined();

      enter('#header');
      expect(state('#header')).toBe('playing');
      expect(state('h2')).toBe('playing');
      expect(starts).toBe(1);
    });

    it('plays once: scrolling away and back does not replay it', () => {
      let starts = 0;
      $('#header').addEventListener('intro:start', () => (starts += 1));
      init('#header');
      enter('#header');

      env.observer()?.fire($('#header'), { isIntersecting: false });
      enter('#header');
      expect(starts).toBe(1);
      expect(env.observer()?.observed.has($('#header'))).toBe(false);
    });

    it('shows a section already scrolled past without animating it', () => {
      let skips = 0;
      $('#header').addEventListener('intro:skip', () => (skips += 1));
      init('#header');

      env.observer()?.fire($('#header'), { isIntersecting: false, bottom: -100 });
      expect(state('#header')).toBe('done');
      expect(state('h2')).toBe('done');
      expect(skips).toBe(1);
    });

    it('under reduced motion is done from the start and observes nothing', () => {
      env.matching.add(REDUCED_MOTION);
      init('#header');

      expect(state('#header')).toBe('done');
      expect(state('h2')).toBe('done');
      expect(env.observer()).toBeUndefined();
    });

    it('jumps to the end on a back/forward cache restore while playing', () => {
      init('#header');
      enter('#header');
      env.pageshow(true);

      expect(state('h2')).toBe('done');
    });

    it('keeps waiting on a back/forward cache restore if it never started', () => {
      init('#header');
      env.pageshow(true);

      expect(state('h2')).toBeUndefined();
    });
  });

  describe('load trigger', () => {
    beforeEach(() => {
      env.win.document.body.innerHTML =
        '<section id="hero" data-intro-root data-intro-trigger="load"><h1 data-intro>Hola</h1></section>';
    });

    it('plays right away in a visible tab', () => {
      init('#hero');
      expect(state('h1')).toBe('playing');
    });

    it('waits for a background tab to become visible', () => {
      env.setVisibility('hidden');
      init('#hero');
      expect(state('h1')).toBeUndefined();

      env.setVisibility('visible');
      expect(state('h1')).toBe('playing');
    });
  });

  describe('mission and vision band', () => {
    beforeEach(() => {
      env.win.document.body.innerHTML = BAND;
    });

    it('wipes the band when its wrapper enters the viewport, and only the band', () => {
      init('#band', '#half-1', '#half-2');
      expect(state('#wipe')).toBeUndefined();

      enter('#band');
      expect(state('#band')).toBe('playing');
      expect(state('#wipe')).toBe('playing');
      expect(state('#half-1 h3')).toBeUndefined();
    });

    it('side by side: both halves start with the band, chips wait for their text', () => {
      env.matching.add(SIDE_BY_SIDE_MEDIA);
      init('#band', '#half-1', '#half-2');

      enter('#band');
      expect(state('#half-1 h3')).toBe('playing');
      expect(state('#half-2 h3')).toBe('playing');
      expect(state('#chip-1')).toBeUndefined();
      expect(state('#chip-2')).toBeUndefined();

      completeTyping('#text-2');
      expect(state('#chip-2')).toBe('playing');
      expect(state('#chip-1')).toBeUndefined();
      completeTyping('#text-1');
      expect(state('#chip-1')).toBe('playing');
    });

    it('stacked: each half starts on its own entry, never before the band', () => {
      init('#band', '#half-1', '#half-2');

      // The first half can reach the threshold before the (taller) band does.
      enter('#half-1');
      expect(state('#half-1 h3')).toBeUndefined();

      enter('#band');
      expect(state('#half-1 h3')).toBe('playing');
      expect(state('#half-2 h3')).toBeUndefined();

      enter('#half-2');
      expect(state('#half-2 h3')).toBe('playing');
    });

    it('a skipped half shows its chip without animating', () => {
      init('#band', '#half-1', '#half-2');
      env.observer()?.fire($('#half-1'), { isIntersecting: false, bottom: -50 });

      expect(state('#chip-1')).toBe('done');
    });
  });

  it('writes every timing variable, so nothing is inherited from an animated ancestor', () => {
    expect(introStepStyle(MISSION_VISION_INTRO.titles[0])).toBe(
      '--intro-delay: 600ms; --intro-duration: 600ms; --intro-ease: cubic-bezier(0.22, 1, 0.36, 1); --intro-x: 0px; --intro-y: 24px; --intro-lg-x: -32px; --intro-lg-y: 0px; --intro-opacity: 0; --intro-scale: 1',
    );
    expect(introStepStyle(MISSION_VISION_INTRO.band)).toContain(
      '--intro-ease: cubic-bezier(0.65, 0, 0.35, 1)',
    );
  });

  it('staggers the header links after the first one, and pops the WhatsApp button in', () => {
    const { link, linkStagger } = SITE_CHROME_INTRO;

    expect(navLinkIntro(0)).toEqual(link);
    expect(navLinkIntro(3).delay).toBe(link.delay + 3 * linkStagger);
    expect(introStepStyle(SITE_CHROME_INTRO.whatsApp)).toContain(
      '--intro-ease: cubic-bezier(0.34, 1.56, 0.64, 1)',
    );
    // The bar slides without fading: it starts fully above the viewport.
    expect(introStepStyle(SITE_CHROME_INTRO.bar)).toContain('--intro-y: -80px');
    expect(introStepStyle(SITE_CHROME_INTRO.bar)).toContain('--intro-opacity: 1');
  });
});
