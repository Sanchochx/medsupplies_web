import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import DivisionsSection from '../../../src/components/sections/DivisionsSection.astro';
import {
  formatLineLabel,
  initLineTabs,
  lineCounterText,
  stepIndex,
  tabIndexForKey,
  type LineTabsController,
} from '../../../src/lib/divisions/lineTabs';
import { renderAstro } from '../helpers/renderAstro';

describe('formatLineLabel', () => {
  it('numbers lines from 01 with two digits', () => {
    expect(formatLineLabel(0)).toBe('Línea 01');
    expect(formatLineLabel(12)).toBe('Línea 13');
  });
});

describe('lineCounterText', () => {
  it('shows the 1-based position and the total', () => {
    expect(lineCounterText(0, 13)).toBe('Mostrando línea 1 de 13');
    expect(lineCounterText(12, 13)).toBe('Mostrando línea 13 de 13');
  });
});

describe('tabIndexForKey', () => {
  it('moves right and left, wrapping at the ends', () => {
    expect(tabIndexForKey('ArrowRight', 0, 13)).toBe(1);
    expect(tabIndexForKey('ArrowRight', 12, 13)).toBe(0);
    expect(tabIndexForKey('ArrowLeft', 5, 13)).toBe(4);
    expect(tabIndexForKey('ArrowLeft', 0, 13)).toBe(12);
  });

  it('jumps to the first and last tab with Home and End', () => {
    expect(tabIndexForKey('Home', 7, 13)).toBe(0);
    expect(tabIndexForKey('End', 2, 13)).toBe(12);
  });

  it('ignores other keys and empty tab lists', () => {
    expect(tabIndexForKey('Enter', 3, 13)).toBeNull();
    expect(tabIndexForKey('ArrowDown', 3, 13)).toBeNull();
    expect(tabIndexForKey('ArrowRight', 0, 0)).toBeNull();
  });
});

describe('stepIndex', () => {
  it('steps by one and stops at the ends instead of wrapping', () => {
    expect(stepIndex(0, 1, 13)).toBe(1);
    expect(stepIndex(0, -1, 13)).toBe(0);
    expect(stepIndex(12, 1, 13)).toBe(12);
  });
});

// The Astro Container API cannot render inside a DOM test environment, so the section is
// rendered in Node and its markup is loaded into a standalone happy-dom window.
describe('initLineTabs', () => {
  let markup: string;
  let window: Window;
  let document: Document;
  let controller: LineTabsController;

  // Both division panels have a tab set; these tests drive the first one (hospital).
  const scope = (): Element => {
    const element = document.querySelector('#division-hospital-panel');
    if (!element) throw new Error('Missing #division-hospital-panel');
    return element;
  };
  const tabs = (): HTMLButtonElement[] => [
    ...scope().querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  ];
  const tabPanels = (): HTMLElement[] => [
    ...scope().querySelectorAll<HTMLElement>('[role="tabpanel"]'),
  ];
  const button = (selector: string): HTMLButtonElement => {
    const element = scope().querySelector<HTMLButtonElement>(selector);
    if (!element) throw new Error(`Missing ${selector}`);
    return element;
  };
  const counter = (): string =>
    scope().querySelector('[data-line-counter]')?.textContent?.trim() ?? '';
  const press = (key: string): void => {
    scope()
      .querySelector('[role="tablist"]')
      ?.dispatchEvent(
        new window.KeyboardEvent('keydown', { key, bubbles: true }) as unknown as Event,
      );
  };

  const expectSelected = (index: number): void => {
    tabs().forEach((tab, position) => {
      const isSelected = position === index;
      expect(tab.getAttribute('aria-selected')).toBe(String(isSelected));
      expect(tab.tabIndex).toBe(isSelected ? 0 : -1);
      const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '');
      expect(panel?.hidden).toBe(!isSelected);
    });
    expect(controller.selectedIndex).toBe(index);
    expect(counter()).toBe(`Mostrando línea ${index + 1} de ${tabs().length}`);
  };

  beforeEach(async () => {
    markup ??= await renderAstro(DivisionsSection);
    window = new Window({ width: 1440, height: 900 });
    document = window.document as unknown as Document;
    document.body.innerHTML = markup;
    // The tabs live in the division panel, which is inert (unfocusable) until opened.
    document.querySelector('[data-division-panel]')?.removeAttribute('inert');
    const [instance] = initLineTabs(document);
    if (!instance) throw new Error('Line tabs markup not found');
    controller = instance;
  });

  afterEach(() => {
    controller.destroy();
    void window.happyDOM.close();
  });

  it('wires one tab set per panel (hospital, supplies) and none on pages without one', () => {
    expect(initLineTabs(document)).toHaveLength(2);
    document.body.innerHTML = '<main></main>';
    expect(initLineTabs(document)).toEqual([]);
  });

  it('starts on the first line with one tab panel per tab', () => {
    expect(tabPanels()).toHaveLength(tabs().length);
    expectSelected(0);
    expect(button('[data-line-prev]').disabled).toBe(true);
    expect(button('[data-line-next]').disabled).toBe(false);
  });

  it('selects a line when its tab is clicked', () => {
    tabs()[9]?.click();

    expectSelected(9);
  });

  it('moves selection and focus with the arrow keys, Home and End (roving tabindex)', () => {
    tabs()[0]?.focus();

    press('ArrowRight');
    expectSelected(1);
    expect(document.activeElement).toBe(tabs()[1]);

    press('End');
    expectSelected(tabs().length - 1);
    expect(document.activeElement).toBe(tabs().at(-1));

    press('ArrowRight');
    expectSelected(0);

    press('ArrowLeft');
    expectSelected(tabs().length - 1);

    press('Home');
    expectSelected(0);
    expect(document.activeElement).toBe(tabs()[0]);
  });

  it('steps with prev/next, disabling each arrow at its end', () => {
    const prev = button('[data-line-prev]');
    const next = button('[data-line-next]');

    next.click();
    expectSelected(1);
    expect(prev.disabled).toBe(false);

    prev.click();
    expectSelected(0);
    expect(prev.disabled).toBe(true);

    controller.select(tabs().length - 2);
    next.focus();
    next.click();
    expectSelected(tabs().length - 1);
    expect(next.disabled).toBe(true);
    // The disabled arrow would drop focus to <body>; it moves to the other arrow instead.
    expect(document.activeElement).toBe(prev);
  });

  it('ignores out-of-range indexes and stops reacting after destroy', () => {
    controller.select(99);
    expectSelected(0);

    controller.destroy();
    tabs()[3]?.click();
    button('[data-line-next]').click();
    expect(controller.selectedIndex).toBe(0);
  });
});
