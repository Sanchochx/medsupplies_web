import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DivisionsSection from '../../../src/components/sections/DivisionsSection.astro';
import {
  LOCKED_ATTRIBUTE,
  initDivisionPanels,
  nextOpenId,
  parseDurationMs,
  type DivisionPanelsController,
} from '../../../src/lib/divisions/divisionPanels';
import { renderAstro } from '../helpers/renderAstro';

describe('nextOpenId', () => {
  it('opens a panel when none is open', () => {
    expect(nextOpenId(null, 'hospital')).toBe('hospital');
  });

  it('closes the open panel when its banner is toggled again', () => {
    expect(nextOpenId('hospital', 'hospital')).toBeNull();
  });

  it('switches to another panel, so only one is open at a time', () => {
    expect(nextOpenId('hospital', 'supplies')).toBe('supplies');
  });
});

describe('parseDurationMs', () => {
  it('reads seconds and milliseconds and keeps the longest value', () => {
    expect(parseDurationMs('0.35s')).toBe(350);
    expect(parseDurationMs('200ms, 0.4s')).toBe(400);
  });

  it('treats empty or invalid values as no transition', () => {
    expect(parseDurationMs('')).toBe(0);
    expect(parseDurationMs('auto')).toBe(0);
  });
});

// The Astro Container API cannot render inside a DOM test environment, so the section is
// rendered in Node and its markup is loaded into a standalone happy-dom window.
describe('initDivisionPanels', () => {
  let markup: string;
  let window: Window;
  let document: Document;
  let controller: DivisionPanelsController;

  const toggles = (): HTMLButtonElement[] => [
    ...document.querySelectorAll<HTMLButtonElement>('[data-division-toggle]'),
  ];
  const panels = (): HTMLElement[] => [
    ...document.querySelectorAll<HTMLElement>('[data-division-panel]'),
  ];
  const list = (): HTMLElement => {
    const element = document.querySelector<HTMLElement>('[data-divisions-list]');
    if (!element) throw new Error('Missing [data-divisions-list]');
    return element;
  };
  const expanded = (): (string | null)[] =>
    toggles().map((button) => button.getAttribute('aria-expanded'));
  const click = (index: number): void => {
    toggles()[index]?.click();
  };

  const expectOnlyOpen = (index: number | null): void => {
    toggles().forEach((button, position) => {
      const isOpen = position === index;
      const panel = panels()[position];
      expect(button.getAttribute('aria-expanded')).toBe(String(isOpen));
      expect(button.closest('article')?.dataset.state).toBe(isOpen ? 'open' : 'closed');
      expect(panel?.hasAttribute('inert')).toBe(!isOpen);
      expect(panel?.getAttribute('aria-hidden')).toBe(isOpen ? null : 'true');
    });
  };

  beforeEach(async () => {
    markup ??= await renderAstro(DivisionsSection);
    window = new Window({ width: 1440, height: 900 });
    document = window.document as unknown as Document;
    document.body.innerHTML = markup;
    const instance = initDivisionPanels(document);
    if (!instance) throw new Error('Divisions markup not found');
    controller = instance;
  });

  afterEach(() => {
    controller.destroy();
    void window.happyDOM.close();
  });

  it('returns null on pages without the divisions stack', () => {
    document.body.innerHTML = '<main></main>';

    expect(initDivisionPanels(document)).toBeNull();
  });

  it('starts with every panel collapsed, inert and hidden from assistive tech', () => {
    expect(controller.openId).toBeNull();
    expectOnlyOpen(null);
    expect(list().hasAttribute(LOCKED_ATTRIBUTE)).toBe(false);
  });

  it('opens a panel when its banner is clicked and locks the banner heights', () => {
    click(0);

    expect(controller.openId).toBe('hospital');
    expectOnlyOpen(0);
    expect(list().hasAttribute(LOCKED_ATTRIBUTE)).toBe(true);
  });

  it('closes the panel when the same banner is clicked again, then releases the lock', async () => {
    click(0);
    click(0);

    expect(controller.openId).toBeNull();
    expectOnlyOpen(null);
    await window.happyDOM.waitUntilComplete();
    expect(list().hasAttribute(LOCKED_ATTRIBUTE)).toBe(false);
  });

  it('wires the hospital and supplies banners, the divisions with a panel', () => {
    expect(toggles().map((button) => button.closest('article')?.dataset.division)).toEqual([
      'hospital',
      'supplies',
    ]);
    expect(panels()).toHaveLength(2);
  });

  it('keeps only one panel open across the section, in both directions', () => {
    click(0);
    click(1);
    expect(controller.openId).toBe('supplies');
    expectOnlyOpen(1);

    click(0);
    expect(controller.openId).toBe('hospital');
    expectOnlyOpen(0);
    expect(expanded().filter((value) => value === 'true')).toHaveLength(1);
  });

  it('scrolls to the clicked banner only after the other panel has finished closing', async () => {
    for (const panel of panels()) panel.style.transitionDuration = '350ms';
    const scrollTo = vi.spyOn(window, 'scrollTo');

    click(0);
    expect(scrollTo).toHaveBeenCalledTimes(1); // Nothing was closing: scrolls at once.

    click(1);
    expectOnlyOpen(1);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    await window.happyDOM.waitUntilComplete();
    expect(scrollTo).toHaveBeenCalledTimes(2);
  });

  it('pins the clicked banner while the panel above it collapses, then scrolls to it', async () => {
    for (const panel of panels()) panel.style.transitionDuration = '50ms';
    click(0);
    const supplies = toggles()[1]?.closest('article');
    if (!supplies) throw new Error('Missing supplies article');
    // happy-dom has no layout: fake a banner that rises 40px per frame as the panel above closes.
    let top = 300;
    supplies.getBoundingClientRect = () => {
      const rect = {
        top,
        bottom: top + 200,
        left: 0,
        right: 0,
        width: 0,
        height: 200,
        x: 0,
        y: top,
      };
      top -= 40;
      return { ...rect, toJSON: () => rect } as DOMRect;
    };
    const scrollBy = vi.spyOn(window, 'scrollBy');
    const scrollTo = vi.spyOn(window, 'scrollTo');

    click(1);
    await window.happyDOM.waitUntilComplete();

    expect(scrollBy).toHaveBeenCalled();
    // Each correction scrolls up by however much the banner rose.
    const shifts = scrollBy.mock.calls.map(([options]) => (options as ScrollToOptions).top ?? 0);
    expect(shifts.every((shift) => shift < 0)).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('drops a pending scroll when the visitor toggles again before it fires', async () => {
    for (const panel of panels()) panel.style.transitionDuration = '350ms';
    const scrollTo = vi.spyOn(window, 'scrollTo');

    click(0);
    click(1);
    click(1); // Closes supplies before the delayed scroll runs.
    await window.happyDOM.waitUntilComplete();

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expectOnlyOpen(null);
  });

  it('reflects open/closed in aria-expanded across repeated toggles', async () => {
    click(0);
    expect(expanded()).toEqual(['true', 'false']);
    click(0);
    expect(expanded()).toEqual(['false', 'false']);
    click(0);
    expect(expanded()).toEqual(['true', 'false']);

    // A panel reopened before the close timer fires keeps the lock.
    await window.happyDOM.waitUntilComplete();
    expect(list().hasAttribute(LOCKED_ATTRIBUTE)).toBe(true);
  });

  it('works from the keyboard through the native button (Enter and Space click it)', () => {
    const [first] = toggles();

    expect(first?.tagName).toBe('BUTTON');
    expect(first?.type).toBe('button');
    expect(first?.getAttribute('aria-controls')).toBe(panels()[0]?.id);
  });

  it('ignores unknown ids and stops reacting after destroy', () => {
    controller.toggle('unknown');
    expectOnlyOpen(null);

    controller.destroy();
    click(0);
    expectOnlyOpen(null);
  });
});
