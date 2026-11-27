import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DivisionPhotoLoop from '../../../src/components/sections/DivisionPhotoLoop.astro';
import DivisionsSection from '../../../src/components/sections/DivisionsSection.astro';
import { getDivisionBanners } from '../../../src/lib/data';
import { initLineTabs, type LineTabsController } from '../../../src/lib/divisions/lineTabs';
import {
  createRotation,
  FADE_MS,
  INTERVAL_MS,
  initPhotoRotators,
  nextSlideIndex,
  slideStates,
  type PhotoRotatorController,
  type Rotation,
  type Timers,
} from '../../../src/lib/divisions/photoRotation';
import { renderAstro } from '../helpers/renderAstro';

const fakeTimers: Timers = {
  setTimeout: (callback, ms) => setTimeout(callback, ms) as unknown as number,
  clearTimeout: (id) => clearTimeout(id),
};

describe('slide helpers', () => {
  it('loops to the first image after the last', () => {
    expect(nextSlideIndex(0, 3)).toBe(1);
    expect(nextSlideIndex(2, 3)).toBe(0);
  });

  it('shows one image, readies only the next and hides the rest', () => {
    expect(slideStates(0, 4)).toEqual(['active', 'next', 'idle', 'idle']);
    expect(slideStates(3, 4)).toEqual(['next', 'idle', 'idle', 'active']);
    expect(slideStates(1, 4, 0)).toEqual(['leaving', 'active', 'next', 'idle']);
  });
});

describe('createRotation', () => {
  let changes: [number, number][];
  let rotation: Rotation;

  const make = (count: number, autoplay = true): Rotation =>
    createRotation({
      count,
      autoplay,
      timers: fakeTimers,
      onChange: (index, previous) => changes.push([index, previous]),
    });

  beforeEach(() => {
    vi.useFakeTimers();
    changes = [];
  });

  afterEach(() => {
    rotation.destroy();
    vi.useRealTimers();
  });

  it('advances every interval in an endless loop', () => {
    rotation = make(3);

    vi.advanceTimersByTime(INTERVAL_MS - 1);
    expect(rotation.index).toBe(0);
    vi.advanceTimersByTime(1);
    expect(rotation.index).toBe(1);
    vi.advanceTimersByTime(INTERVAL_MS * 2);
    expect(rotation.index).toBe(0);
    expect(changes).toEqual([
      [1, 0],
      [2, 1],
      [0, 2],
    ]);
  });

  it('pauses while any blocker is on and resumes with a full interval once all are off', () => {
    rotation = make(3);
    vi.advanceTimersByTime(INTERVAL_MS - 100);

    rotation.block('hover', true);
    rotation.block('offscreen', true);
    vi.advanceTimersByTime(INTERVAL_MS * 3);
    expect(rotation.index).toBe(0);
    expect(rotation.running).toBe(false);

    rotation.block('hover', false);
    vi.advanceTimersByTime(INTERVAL_MS);
    expect(rotation.index).toBe(0); // Still off screen.

    rotation.block('offscreen', false);
    vi.advanceTimersByTime(INTERVAL_MS - 1);
    expect(rotation.index).toBe(0);
    vi.advanceTimersByTime(1);
    expect(rotation.index).toBe(1);
  });

  it('stops while the browser tab is hidden', () => {
    rotation = make(2);

    rotation.block('page-hidden', true);
    vi.advanceTimersByTime(INTERVAL_MS * 2);
    expect(rotation.index).toBe(0);

    rotation.block('page-hidden', false);
    vi.advanceTimersByTime(INTERVAL_MS);
    expect(rotation.index).toBe(1);
  });

  it('never moves without autoplay (reduced motion)', () => {
    rotation = make(3, false);

    vi.advanceTimersByTime(INTERVAL_MS * 5);
    expect(rotation.index).toBe(0);
    expect(rotation.running).toBe(false);
  });

  it('never runs with a single image', () => {
    rotation = make(1);

    vi.advanceTimersByTime(INTERVAL_MS * 3);
    expect(rotation.running).toBe(false);
    expect(changes).toEqual([]);
  });

  it('stops for good after destroy', () => {
    rotation = make(2);
    rotation.destroy();

    vi.advanceTimersByTime(INTERVAL_MS * 3);
    expect(changes).toEqual([]);
  });
});

describe('DivisionPhotoLoop markup', () => {
  const [hospital] = getDivisionBanners();
  const images = hospital?.panel?.images ?? [];

  it('renders nothing to rotate for no images and a still photo for one', async () => {
    const none = await renderAstro(DivisionPhotoLoop, { props: { images: [] } });
    expect(none).not.toMatch(/<img\b|data-photo-rotator/);

    const one = await renderAstro(DivisionPhotoLoop, { props: { images: images.slice(0, 1) } });
    expect(one.match(/<img\b/g)).toHaveLength(1);
    expect(one).not.toMatch(/data-photo-rotator|data-slide/);
  });
});

// The Astro Container API cannot render inside a DOM test environment, so the section is
// rendered in Node and its markup is loaded into a standalone happy-dom window.
describe('initPhotoRotators', () => {
  let markup: string;
  let window: Window;
  let document: Document;
  let controllers: PhotoRotatorController[];
  let tabs: LineTabsController[];
  let observed: { callback: IntersectionObserverCallback; target: Element }[];

  /** IntersectionObserver stand-in that lets each test decide what is on screen. */
  class FakeIntersectionObserver {
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe(target: Element): void {
      observed.push({ callback: this.callback, target });
    }
    disconnect(): void {}
  }

  const loop = (division: 'hospital' | 'supplies'): HTMLElement => {
    const element = document.querySelector<HTMLElement>(
      `#division-${division}-panel [data-division-photo]`,
    );
    if (!element) throw new Error(`Missing photo loop of ${division}`);
    return element;
  };
  const indexOf = (element: HTMLElement): number => {
    const index = [...document.querySelectorAll('[data-photo-rotator]')].indexOf(element);
    const controller = controllers[index];
    if (!controller) throw new Error('Loop not wired');
    return controller.rotation.index;
  };
  const states = (element: HTMLElement): (string | undefined)[] =>
    [...element.querySelectorAll<HTMLElement>('[data-slide]')].map((slide) => slide.dataset.state);
  const setOnScreen = (element: HTMLElement, onScreen: boolean): void => {
    const entry = {
      isIntersecting: onScreen,
      intersectionRatio: onScreen ? 1 : 0,
      target: element,
    };
    for (const { callback, target } of observed) {
      if (target === element)
        callback([entry as unknown as IntersectionObserverEntry], {} as never);
    }
  };

  const setup = (reducedMotion = false): void => {
    window = new Window({ width: 1440, height: 900 });
    // Route the window's timers through Vitest's fake clock.
    Object.assign(window, {
      setTimeout,
      clearTimeout,
      IntersectionObserver: FakeIntersectionObserver,
      matchMedia: (query: string) => ({
        matches: reducedMotion && query.includes('reduce'),
        media: query,
      }),
    });
    document = window.document as unknown as Document;
    document.body.innerHTML = markup;
    for (const panel of document.querySelectorAll('[data-division-panel]')) {
      panel.removeAttribute('inert');
    }
    tabs = initLineTabs(document);
    controllers = initPhotoRotators(document);
  };

  beforeEach(async () => {
    markup ??= await renderAstro(DivisionsSection);
    vi.useFakeTimers();
    observed = [];
  });

  afterEach(() => {
    for (const controller of controllers) controller.destroy();
    for (const controller of tabs) controller.destroy();
    vi.useRealTimers();
    void window.happyDOM.close();
  });

  it('wires one loop per division (hospital and supplies), with no controls', () => {
    setup();

    expect(controllers).toHaveLength(2);
    for (const division of ['hospital', 'supplies'] as const) {
      expect(loop(division).querySelector('button')).toBeNull();
    }
  });

  it('waits until the photo is on screen, then crossfades every interval', () => {
    setup();
    const element = loop('supplies');

    vi.advanceTimersByTime(INTERVAL_MS * 2);
    expect(states(element).slice(0, 3)).toEqual(['active', 'next', 'idle']);

    setOnScreen(element, true);
    vi.advanceTimersByTime(INTERVAL_MS);
    expect(states(element).slice(0, 3)).toEqual(['leaving', 'active', 'next']);
    vi.advanceTimersByTime(FADE_MS);
    expect(states(element).slice(0, 3)).toEqual(['idle', 'active', 'next']);

    setOnScreen(element, false);
    vi.advanceTimersByTime(INTERVAL_MS * 3);
    expect(indexOf(element)).toBe(1);
  });

  it('loops through every photo of the division and back to the first', () => {
    setup();
    const element = loop('supplies');
    const count = states(element).length;
    setOnScreen(element, true);

    vi.advanceTimersByTime(INTERVAL_MS * count);
    expect(indexOf(element)).toBe(0);
  });

  it('keeps looping when the line tab changes: the photos belong to the division', () => {
    setup();
    const element = loop('hospital');
    setOnScreen(element, true);
    vi.advanceTimersByTime(INTERVAL_MS * 2);

    tabs[0]?.select(5);
    expect(indexOf(element)).toBe(2);
    vi.advanceTimersByTime(INTERVAL_MS);
    expect(indexOf(element)).toBe(3);
  });

  it('does not run inside a closed (inert) panel even if the observer reports it', () => {
    setup();
    const element = loop('hospital');
    element.closest('[data-division-panel]')?.setAttribute('inert', '');

    setOnScreen(element, true);
    vi.advanceTimersByTime(INTERVAL_MS * 2);
    expect(indexOf(element)).toBe(0);
  });

  it('pauses while hovered', () => {
    setup();
    const element = loop('hospital');
    setOnScreen(element, true);

    element.dispatchEvent(new window.Event('mouseenter') as unknown as Event);
    vi.advanceTimersByTime(INTERVAL_MS * 2);
    expect(indexOf(element)).toBe(0);

    element.dispatchEvent(new window.Event('mouseleave') as unknown as Event);
    vi.advanceTimersByTime(INTERVAL_MS);
    expect(indexOf(element)).toBe(1);
  });

  it('pauses while the browser tab is hidden', () => {
    setup();
    const element = loop('hospital');
    setOnScreen(element, true);
    let visibility = 'hidden';
    Object.defineProperty(document, 'visibilityState', { get: () => visibility });

    document.dispatchEvent(new window.Event('visibilitychange') as unknown as Event);
    vi.advanceTimersByTime(INTERVAL_MS * 2);
    expect(indexOf(element)).toBe(0);

    visibility = 'visible';
    document.dispatchEvent(new window.Event('visibilitychange') as unknown as Event);
    vi.advanceTimersByTime(INTERVAL_MS);
    expect(indexOf(element)).toBe(1);
  });

  it('with reduced motion keeps the first photo still', () => {
    setup(true);
    const element = loop('hospital');
    setOnScreen(element, true);

    vi.advanceTimersByTime(INTERVAL_MS * 3);
    expect(indexOf(element)).toBe(0);
    expect(states(element)[0]).toBe('active');
  });
});
