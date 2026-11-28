import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DivisionsSection from '../../../src/components/sections/DivisionsSection.astro';
import {
  initDivisionPanels,
  type DivisionPanelsController,
} from '../../../src/lib/divisions/divisionPanels';
import { lineDirection } from '../../../src/lib/divisions/lineMotion';
import { initLineTabs, type LineTabsController } from '../../../src/lib/divisions/lineTabs';
import { DIVISION_PANEL_MOTION } from '../../../src/lib/motion/panelMotionTimeline';
import { renderAstro } from '../helpers/renderAstro';

/** Long enough for any entrance, fade or height change to finish. */
const SETTLE_MS = 3000;

describe('lineDirection', () => {
  it('comes from the right for a later line and from the left for an earlier one', () => {
    expect(lineDirection(2, 5)).toBe('next');
    expect(lineDirection(5, 2)).toBe('prev');
    expect(lineDirection(12, 0)).toBe('prev'); // Wrapping to the first line goes back.
  });
});

describe('line changes in an open panel', () => {
  let markup: string;
  let window: Window;
  let document: Document;
  let panels: DivisionPanelsController | null;
  let tabControllers: LineTabsController[];
  let reducedMotion: boolean;

  const scope = (): HTMLElement => {
    const element = document.querySelector<HTMLElement>('#division-hospital-panel');
    if (!element) throw new Error('Missing #division-hospital-panel');
    return element;
  };
  const root = (): HTMLElement => {
    const element = scope().querySelector<HTMLElement>('[data-line-tabs]');
    if (!element) throw new Error('Missing [data-line-tabs]');
    return element;
  };
  const viewport = (): HTMLElement => {
    const element = scope().querySelector<HTMLElement>('[data-line-viewport]');
    if (!element) throw new Error('Missing [data-line-viewport]');
    return element;
  };
  const tabs = (): HTMLButtonElement[] => [
    ...scope().querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  ];
  const shown = (): number[] =>
    [...scope().querySelectorAll<HTMLElement>('[role="tabpanel"]')].flatMap((panel, index) =>
      panel.hidden ? [] : [index],
    );
  const phase = (): string | null => root().getAttribute('data-line-motion');
  const direction = (): string | null => root().getAttribute('data-direction');
  const button = (selector: string): HTMLButtonElement => {
    const element = scope().querySelector<HTMLButtonElement>(selector);
    if (!element) throw new Error(`Missing ${selector}`);
    return element;
  };
  const press = (key: string): void => {
    scope()
      .querySelector('[role="tablist"]')
      ?.dispatchEvent(
        new window.KeyboardEvent('keydown', { key, bubbles: true }) as unknown as Event,
      );
  };

  const setup = async (): Promise<void> => {
    panels = initDivisionPanels(document);
    tabControllers = initLineTabs(document);
    document.querySelector<HTMLButtonElement>('[data-division-toggle]')?.click();
    await vi.advanceTimersByTimeAsync(SETTLE_MS);
    expect(scope().getAttribute('data-motion-state')).toBe('open');
  };

  beforeEach(async () => {
    markup ??= await renderAstro(DivisionsSection);
    vi.useFakeTimers();
    reducedMotion = false;
    window = new Window({ width: 1440, height: 900 });
    Object.assign(window, {
      setTimeout,
      clearTimeout,
      matchMedia: (query: string) => ({ matches: reducedMotion && query.includes('reduce') }),
    });
    document = window.document as unknown as Document;
    document.body.innerHTML = markup;
  });

  afterEach(() => {
    for (const controller of tabControllers) controller.destroy();
    panels?.destroy();
    vi.useRealTimers();
    void window.happyDOM.close();
  });

  it('fades the shown line out, swaps it, then plays the shorter entrance', async () => {
    await setup();
    tabs()[3]?.click();

    // The tab is selected at once; the old line is still fading out.
    expect(tabs()[3]?.getAttribute('aria-selected')).toBe('true');
    expect(phase()).toBe('leaving');
    expect(shown()).toEqual([0]);

    await vi.advanceTimersByTimeAsync(DIVISION_PANEL_MOTION.leave);
    expect(phase()).toBe('entering');
    expect(shown()).toEqual([3]);

    await vi.advanceTimersByTimeAsync(SETTLE_MS);
    expect(phase()).toBe('idle');
  });

  it('sets the direction from the line it moves to: tabs, arrows and keys', async () => {
    await setup();

    tabs()[4]?.click();
    expect(direction()).toBe('next');
    tabs()[2]?.click();
    expect(direction()).toBe('prev');

    button('[data-line-next]').click();
    expect(direction()).toBe('next');
    button('[data-line-prev]').click();
    expect(direction()).toBe('prev');

    tabs()[2]?.focus();
    press('ArrowRight');
    expect(direction()).toBe('next');
    press('ArrowLeft');
    expect(direction()).toBe('prev');
  });

  it('keeps focus on the control that was activated', async () => {
    await setup();
    const next = button('[data-line-next]');
    next.focus();

    next.click();
    await vi.advanceTimersByTimeAsync(SETTLE_MS);
    expect(document.activeElement).toBe(next);

    tabs()[1]?.focus();
    press('ArrowRight');
    await vi.advanceTimersByTimeAsync(SETTLE_MS);
    expect(document.activeElement).toBe(tabs()[2]);
  });

  it('ends on the latest tab after rapid switching, with nothing left hidden or pending', async () => {
    await setup();

    tabs()[2]?.click();
    tabs()[7]?.click();
    tabs()[5]?.click(); // All while the first line is still fading out.
    await vi.advanceTimersByTimeAsync(DIVISION_PANEL_MOTION.leave);
    expect(shown()).toEqual([5]);

    await vi.advanceTimersByTimeAsync(100);
    tabs()[9]?.click(); // Mid-entrance: fades out from where it is.
    expect(phase()).toBe('leaving');
    tabs()[1]?.click();

    await vi.advanceTimersByTimeAsync(SETTLE_MS);
    expect(shown()).toEqual([1]);
    expect(tabs()[1]?.getAttribute('aria-selected')).toBe('true');
    expect(direction()).toBe('prev');
    expect(phase()).toBe('idle');
    expect(viewport().hasAttribute('data-resizing')).toBe(false);
    expect(viewport().style.height).toBe('');
  });

  it('animates the line area between the old and the new height, then lets it go', async () => {
    await setup();
    // happy-dom has no layout: the old line measures 400px, the new one 640px.
    const heights = [400, 640];
    viewport().getBoundingClientRect = () => {
      const height = heights.shift() ?? 640;
      return { height, width: 0, top: 0, left: 0, right: 0, bottom: height } as DOMRect;
    };

    tabs()[9]?.click();
    await vi.advanceTimersByTimeAsync(DIVISION_PANEL_MOTION.leave);
    expect(viewport().hasAttribute('data-resizing')).toBe(true);
    expect(viewport().style.height).toBe('640px');

    await vi.advanceTimersByTimeAsync(SETTLE_MS);
    expect(viewport().hasAttribute('data-resizing')).toBe(false);
    expect(viewport().style.height).toBe('');
  });

  it('leaves the photo loop alone: no fade, no reset, same image', async () => {
    await setup();
    const photo = scope().querySelector<HTMLElement>('[data-division-photo]');
    if (!photo) throw new Error('Missing [data-division-photo]');
    const states = (): (string | undefined)[] =>
      [...photo.querySelectorAll<HTMLElement>('[data-slide]')].map((slide) => slide.dataset.state);
    const before = states();
    const events = vi.fn();
    photo.addEventListener('photo:reset', events);

    tabs()[3]?.click();
    // The photo tile is not part of the line's content, so the line-change CSS never matches it.
    expect(photo.closest('[role="tabpanel"]')).toBeNull();
    await vi.advanceTimersByTimeAsync(DIVISION_PANEL_MOTION.leave + 50);
    expect(shown()).toEqual([3]);
    expect(states()).toEqual(before);
    expect(photo.style.transition).toBe('');
    expect(events).not.toHaveBeenCalled();
  });

  it('swaps instantly under reduced motion', async () => {
    reducedMotion = true;
    await setup();

    tabs()[6]?.click();
    expect(shown()).toEqual([6]);
    expect(phase()).toBe('idle');
    expect(viewport().hasAttribute('data-resizing')).toBe(false);
  });

  it('swaps instantly while the panel is not fully open', async () => {
    await setup();
    document.querySelector<HTMLButtonElement>('[data-division-toggle]')?.click();
    expect(scope().getAttribute('data-motion-state')).toBe('leaving');

    tabControllers[0]?.select(4);
    expect(shown()).toEqual([4]);
    expect(phase()).toBe('idle');
  });

  it('settles a line change that was in progress when the panel closes', async () => {
    await setup();
    tabs()[4]?.click();
    document.querySelector<HTMLButtonElement>('[data-division-toggle]')?.click();

    await vi.advanceTimersByTimeAsync(SETTLE_MS);
    expect(shown()).toEqual([4]);
    expect(phase()).toBe('idle');
  });
});
