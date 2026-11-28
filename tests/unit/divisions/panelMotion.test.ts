import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DivisionsSection from '../../../src/components/sections/DivisionsSection.astro';
import { initDivisionPanels } from '../../../src/lib/divisions/divisionPanels';
import { createPanelMotion, type PanelMotion } from '../../../src/lib/divisions/panelMotion';
import {
  DIVISION_PANEL_MOTION,
  FOOTER_DELAY_PROPERTY,
  PANEL_MOTION_DELAYS,
  lineEntranceTotal,
  panelEntranceTotal,
  panelFooterDelay,
  staggerDelay,
} from '../../../src/lib/motion/panelMotionTimeline';
import { renderAstro } from '../helpers/renderAstro';

const { openOffset, open, line, leave } = DIVISION_PANEL_MOTION;

describe('staggerDelay', () => {
  const step = { delay: 300, stagger: 35, cap: 450 };

  it('starts at the step delay and adds one stagger per element', () => {
    expect(staggerDelay(0, step)).toBe(300);
    expect(staggerDelay(1, step)).toBe(335);
    expect(staggerDelay(4, step)).toBe(440);
  });

  it('caps the total stagger, so long lists never drag on', () => {
    expect(staggerDelay(12, step)).toBe(300 + 420);
    expect(staggerDelay(13, step)).toBe(300 + 450);
    expect(staggerDelay(40, step)).toBe(300 + 450);
  });

  it('treats negative indexes as the first element', () => {
    expect(staggerDelay(-1, step)).toBe(300);
  });
});

describe('panel motion timeline', () => {
  it('starts the entrance after the height expansion, tabs first and left to right', () => {
    expect(PANEL_MOTION_DELAYS.tab(0).open).toBe(openOffset);
    expect(PANEL_MOTION_DELAYS.tab(1).open).toBe(openOffset + open.tabs.stagger);
    expect(PANEL_MOTION_DELAYS.tab(50).open).toBe(openOffset + open.tabs.cap);
  });

  it('orders the steps: photo, pill, title, then the chips and the footer last', () => {
    const photo = PANEL_MOTION_DELAYS.photo().open;
    const pill = PANEL_MOTION_DELAYS.pill().open;
    const title = PANEL_MOTION_DELAYS.title().open;
    const firstChip = PANEL_MOTION_DELAYS.chip(0).open;

    expect(photo).toBeLessThan(pill);
    expect(title - pill).toBe(60);
    expect(firstChip).toBeGreaterThan(title);
    for (const count of [1, 3, 12, 40]) {
      expect(panelFooterDelay(count)).toBeGreaterThan(PANEL_MOTION_DELAYS.chip(count - 1).open);
    }
  });

  it('staggers chips faster and caps them lower on a line change', () => {
    expect(PANEL_MOTION_DELAYS.chip(1).line).toBe(line.chips.delay + 25);
    expect(PANEL_MOTION_DELAYS.chip(100).line).toBe(line.chips.delay + 300);
    expect(PANEL_MOTION_DELAYS.chip(100).open).toBe(openOffset + open.chips.delay + 450);
  });

  it('ends the sequences once their last element has finished', () => {
    expect(panelEntranceTotal(5)).toBe(panelFooterDelay(5) + DIVISION_PANEL_MOTION.duration);
    expect(lineEntranceTotal(40)).toBe(line.chips.delay + line.chips.cap + line.duration);
    // Never shorter than the height change.
    expect(lineEntranceTotal(0)).toBeGreaterThanOrEqual(DIVISION_PANEL_MOTION.resize);
  });
});

describe('createPanelMotion', () => {
  let window: Window;
  let panel: HTMLElement;
  let motion: PanelMotion;
  let reducedMotion: boolean;

  const state = (): string | null => panel.getAttribute('data-motion-state');

  beforeEach(() => {
    vi.useFakeTimers();
    reducedMotion = false;
    window = new Window();
    Object.assign(window, {
      setTimeout,
      clearTimeout,
      matchMedia: (query: string) => ({ matches: reducedMotion && query.includes('reduce') }),
    });
    const document = window.document as unknown as Document;
    document.body.innerHTML = `
      <div data-division-panel>
        <div role="tabpanel"><span data-motion="chip"></span><span data-motion="chip"></span></div>
        <div role="tabpanel" hidden><span data-motion="chip"></span></div>
      </div>`;
    const element = document.querySelector<HTMLElement>('[data-division-panel]');
    if (!element) throw new Error('Missing panel');
    panel = element;
    motion = createPanelMotion(panel, window as unknown as globalThis.Window);
  });

  afterEach(() => {
    motion.destroy();
    vi.useRealTimers();
    void window.happyDOM.close();
  });

  it('starts closed', () => {
    expect(state()).toBe('closed');
    expect(motion.state).toBe('closed');
  });

  it('enters on open, then settles to open once the last element has finished', () => {
    motion.open();
    expect(state()).toBe('entering');

    vi.advanceTimersByTime(panelEntranceTotal(2) - 1);
    expect(state()).toBe('entering');
    vi.advanceTimersByTime(1);
    expect(state()).toBe('open');
  });

  it('times the footer after the chips of the line shown (hidden lines do not count)', () => {
    motion.open();

    expect(panel.style.getPropertyValue(FOOTER_DELAY_PROPERTY)).toBe(`${panelFooterDelay(2)}ms`);
  });

  it('fades out on close, then sets closed', () => {
    motion.open();
    vi.advanceTimersByTime(panelEntranceTotal(2));

    motion.close();
    expect(state()).toBe('leaving');
    vi.advanceTimersByTime(leave);
    expect(state()).toBe('closed');
  });

  it('replays the entrance on every open', () => {
    for (let round = 0; round < 3; round += 1) {
      motion.open();
      expect(state()).toBe('entering');
      vi.advanceTimersByTime(panelEntranceTotal(2));
      expect(state()).toBe('open');
      motion.close();
      vi.advanceTimersByTime(leave);
      expect(state()).toBe('closed');
    }
  });

  it('lets the latest call win on a rapid open, close, open', () => {
    motion.open();
    motion.close();
    expect(state()).toBe('leaving');
    motion.open();
    expect(state()).toBe('entering');

    // The dropped close timer never flips it to closed.
    vi.advanceTimersByTime(leave);
    expect(state()).toBe('entering');
    vi.advanceTimersByTime(panelEntranceTotal(2));
    expect(state()).toBe('open');
  });

  it('closes cleanly when closed mid-entrance', () => {
    motion.open();
    vi.advanceTimersByTime(200);
    motion.close();

    vi.advanceTimersByTime(panelEntranceTotal(2));
    expect(state()).toBe('closed');
  });

  it('ignores repeated calls in the same direction', () => {
    motion.open();
    vi.advanceTimersByTime(200);
    motion.open(); // Does not restart the timer.
    vi.advanceTimersByTime(panelEntranceTotal(2) - 200);
    expect(state()).toBe('open');
  });

  it('goes straight to open or closed under reduced motion', () => {
    reducedMotion = true;

    motion.open();
    expect(state()).toBe('open');
    motion.close();
    expect(state()).toBe('closed');
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('panel motion in the divisions stack', () => {
  let markup: string;
  let window: Window;
  let document: Document;

  const toggles = (): HTMLButtonElement[] => [
    ...document.querySelectorAll<HTMLButtonElement>('[data-division-toggle]'),
  ];
  const states = (): (string | null)[] =>
    [...document.querySelectorAll('[data-division-panel]')].map((panel) =>
      panel.getAttribute('data-motion-state'),
    );

  beforeEach(async () => {
    markup ??= await renderAstro(DivisionsSection);
    vi.useFakeTimers();
    window = new Window({ width: 1440, height: 900 });
    Object.assign(window, {
      setTimeout,
      clearTimeout,
      matchMedia: () => ({ matches: false }),
    });
    document = window.document as unknown as Document;
    document.body.innerHTML = markup;
  });

  afterEach(() => {
    vi.useRealTimers();
    void window.happyDOM.close();
  });

  it('enters the panel of the clicked banner and fades out the one it replaces', () => {
    const controller = initDivisionPanels(document);
    expect(states()).toEqual(['closed', 'closed']);

    toggles()[0]?.click();
    expect(states()).toEqual(['entering', 'closed']);

    toggles()[1]?.click();
    expect(states()).toEqual(['leaving', 'entering']);
    vi.advanceTimersByTime(5000);
    expect(states()).toEqual(['closed', 'open']);

    toggles()[1]?.click();
    expect(states()).toEqual(['closed', 'leaving']);
    controller?.destroy();
  });

  it('writes the shared timings on the panel and a delay on every animated element', () => {
    const panel = document.querySelector<HTMLElement>('#division-hospital-panel');

    expect(panel?.style.getPropertyValue('--motion-duration')).toBe(
      `${DIVISION_PANEL_MOTION.duration}ms`,
    );
    const animated = [...(panel?.querySelectorAll<HTMLElement>('[data-motion]') ?? [])];
    const roles = new Set(animated.map((element) => element.dataset.motion));
    expect([...roles].sort()).toEqual(['chip', 'footer', 'photo', 'pill', 'tab', 'title']);
    for (const element of animated) {
      if (element.dataset.motion === 'footer') continue;
      expect(element.style.getPropertyValue('--motion-open-delay')).toMatch(/^\d+ms$/);
    }
  });
});
