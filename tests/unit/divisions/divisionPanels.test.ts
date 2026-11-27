import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
    expect(list().style.getPropertyValue('--divisions-heading-height')).toMatch(/px$/);
  });

  it('closes the panel when the same banner is clicked again, then releases the lock', async () => {
    click(1);
    click(1);

    expect(controller.openId).toBeNull();
    expectOnlyOpen(null);
    await window.happyDOM.waitUntilComplete();
    expect(list().hasAttribute(LOCKED_ATTRIBUTE)).toBe(false);
  });

  it('keeps only one panel open: opening another closes the previous one', async () => {
    click(0);
    click(2);
    expectOnlyOpen(2);

    click(1);
    expectOnlyOpen(1);
    expect(expanded().filter((value) => value === 'true')).toHaveLength(1);

    // A panel still open keeps the lock even after a previous close timer would have fired.
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
