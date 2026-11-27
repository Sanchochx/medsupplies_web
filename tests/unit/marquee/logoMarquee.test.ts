import { Window } from 'happy-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OFFSCREEN_ATTRIBUTE,
  type LogoMarqueeEnvironment,
  createCopy,
  fitWithin,
  initLogoMarquee,
  setsNeeded,
  syncCopies,
} from '../../../src/lib/marquee/logoMarquee';

const MARKUP = `
  <div data-marquee>
    <div data-marquee-track>
      <ul data-marquee-set><li><img alt="Logo del aliado 1"></li><li><img alt="Logo del aliado 2"></li></ul>
      <ul data-marquee-set data-marquee-copy aria-hidden="true"><li><img alt=""></li><li><img alt=""></li></ul>
    </div>
  </div>`;

describe('setsNeeded', () => {
  it('keeps the two rendered sets when one set is wider than the marquee', () => {
    expect(setsNeeded(4000, 1920)).toBe(2);
    expect(setsNeeded(1920, 1920)).toBe(2);
  });

  it('adds sets until one shift still leaves the marquee covered', () => {
    expect(setsNeeded(1000, 1920)).toBe(3);
    expect(setsNeeded(500, 2560)).toBe(7);
  });

  it('falls back to two sets before layout (zero width)', () => {
    expect(setsNeeded(0, 1920)).toBe(2);
  });
});

describe('fitWithin', () => {
  it('scales down to the limiting side, keeping the aspect ratio', () => {
    expect(fitWithin(871, 167, 360, 144)).toEqual({ width: 360, height: 69 });
    expect(fitWithin(280, 347, 360, 144)).toEqual({ width: 116, height: 144 });
  });

  it('never upscales', () => {
    expect(fitWithin(100, 40, 360, 144)).toEqual({ width: 100, height: 40 });
  });
});

describe('copies', () => {
  let win: Window;
  let track: HTMLElement;
  let original: HTMLElement;

  beforeEach(() => {
    win = new Window();
    win.document.body.innerHTML = MARKUP;
    track = win.document.querySelector('[data-marquee-track]') as unknown as HTMLElement;
    original = win.document.querySelector('[data-marquee-set]') as unknown as HTMLElement;
  });

  it('creates aria-hidden copies with empty alt text, leaving the original untouched', () => {
    const copy = createCopy(original);

    expect(copy.getAttribute('aria-hidden')).toBe('true');
    expect(copy.hasAttribute('data-marquee-copy')).toBe(true);
    expect([...copy.querySelectorAll('img')].map((img) => img.alt)).toEqual(['', '']);
    expect([...original.querySelectorAll('img')].map((img) => img.alt)).toEqual([
      'Logo del aliado 1',
      'Logo del aliado 2',
    ]);
  });

  it('adds and removes copies but never the original set', () => {
    syncCopies(track, original, 4);
    expect(track.querySelectorAll('[data-marquee-set]')).toHaveLength(4);
    expect(track.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);

    syncCopies(track, original, 1);
    expect(track.querySelectorAll('[data-marquee-set]')).toHaveLength(1);
    expect(track.firstElementChild).toBe(original);
  });
});

describe('initLogoMarquee', () => {
  let win: Window;
  let marquee: HTMLElement;
  let reducedMotion: boolean;
  let intersect: ((entries: Partial<IntersectionObserverEntry>[]) => void) | undefined;

  function setup(setWidth: number, viewportWidth: number): void {
    win = new Window();
    win.document.body.innerHTML = MARKUP;
    marquee = win.document.querySelector('[data-marquee]') as unknown as HTMLElement;
    const original = win.document.querySelector('[data-marquee-set]') as unknown as HTMLElement;
    vi.spyOn(original, 'getBoundingClientRect').mockReturnValue({ width: setWidth } as DOMRect);
    Object.defineProperty(marquee, 'clientWidth', { get: () => viewportWidth });
    vi.spyOn(win, 'matchMedia').mockReturnValue({
      matches: reducedMotion,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as unknown as ReturnType<Window['matchMedia']>);
    Object.assign(win, {
      IntersectionObserver: class {
        constructor(callback: typeof intersect) {
          intersect = callback;
        }
        observe(): void {}
        disconnect(): void {}
      },
    });
    initLogoMarquee(marquee, win as unknown as LogoMarqueeEnvironment);
  }

  beforeEach(() => {
    reducedMotion = false;
    intersect = undefined;
  });

  it('fills a marquee wider than one set with extra hidden copies', () => {
    setup(1000, 2560);

    expect(marquee.querySelectorAll('[data-marquee-set]')).toHaveLength(4);
    expect(marquee.querySelectorAll('[data-marquee-set]:not([aria-hidden])')).toHaveLength(1);
  });

  it('adds no copies under reduced motion', () => {
    reducedMotion = true;
    setup(1000, 2560);

    expect(marquee.querySelectorAll('[data-marquee-set]')).toHaveLength(2);
  });

  it('flags the marquee while it is off screen, so the CSS pauses it', () => {
    setup(4000, 1920);

    intersect?.([{ target: marquee, isIntersecting: false }]);
    expect(marquee.hasAttribute(OFFSCREEN_ATTRIBUTE)).toBe(true);

    intersect?.([{ target: marquee, isIntersecting: true }]);
    expect(marquee.hasAttribute(OFFSCREEN_ATTRIBUTE)).toBe(false);
  });
});
