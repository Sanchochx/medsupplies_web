import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import MobileNav from '../../../src/components/layout/MobileNav.astro';
import {
  SCROLL_LOCK_ATTRIBUTE,
  initMobileDrawer,
  wrapFocusIndex,
  type MobileDrawerController,
} from '../../../src/lib/navigation/mobileDrawer';
import { renderAstro } from '../helpers/renderAstro';

function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Missing ${what}`);
  return value;
}

describe('wrapFocusIndex', () => {
  it('wraps Tab from the last element to the first', () => {
    expect(wrapFocusIndex(2, 3, false)).toBe(0);
  });

  it('wraps Shift+Tab from the first element to the last', () => {
    expect(wrapFocusIndex(0, 3, true)).toBe(2);
  });

  it('pulls focus back in when it is outside the focusable list', () => {
    expect(wrapFocusIndex(-1, 3, false)).toBe(0);
    expect(wrapFocusIndex(-1, 3, true)).toBe(2);
  });

  it('leaves movement between inner elements to the browser', () => {
    expect(wrapFocusIndex(1, 3, false)).toBeNull();
    expect(wrapFocusIndex(1, 3, true)).toBeNull();
  });

  it('does nothing when there is nothing to focus', () => {
    expect(wrapFocusIndex(-1, 0, false)).toBeNull();
  });
});

// The Astro Container API cannot render inside a DOM test environment, so the component is
// rendered in Node and its markup is loaded into a standalone happy-dom window.
describe('initMobileDrawer', () => {
  let markup: string;
  let window: Window;
  let document: Document;
  let drawer: MobileDrawerController;

  const toggle = (): HTMLButtonElement =>
    required(
      document.querySelector<HTMLButtonElement>('[data-mobile-drawer-toggle]'),
      '[data-mobile-drawer-toggle]',
    );
  const dialog = (): HTMLDialogElement =>
    required(
      document.querySelector<HTMLDialogElement>('dialog[data-mobile-drawer]'),
      'dialog[data-mobile-drawer]',
    );
  const closeButton = (): HTMLButtonElement =>
    required(
      document.querySelector<HTMLButtonElement>('[data-mobile-drawer-close]'),
      '[data-mobile-drawer-close]',
    );
  const drawerLinks = (): HTMLAnchorElement[] => [...dialog().querySelectorAll('a')];

  const pressKey = (key: string, shiftKey = false): KeyboardEvent => {
    const event = new window.KeyboardEvent('keydown', {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true,
    }) as unknown as KeyboardEvent;
    (document.activeElement ?? dialog()).dispatchEvent(event);
    return event;
  };

  const openWithButton = (): void => {
    toggle().click();
  };

  const expectClosed = (): void => {
    expect(drawer.isOpen).toBe(false);
    expect(dialog().open).toBe(false);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.documentElement.hasAttribute(SCROLL_LOCK_ATTRIBUTE)).toBe(false);
    expect(document.activeElement).toBe(toggle());
  };

  const click = (): MouseEvent =>
    new window.MouseEvent('click', { bubbles: true, cancelable: true }) as unknown as MouseEvent;

  beforeEach(async () => {
    markup ??= await renderAstro(MobileNav);
    window = new Window({ width: 375, height: 800 });
    document = window.document as unknown as Document;
    document.body.innerHTML = markup;
    const controller = initMobileDrawer(document);
    if (!controller) throw new Error('Drawer markup not found');
    drawer = controller;
  });

  afterEach(() => {
    drawer.destroy();
    void window.happyDOM.close();
  });

  it('returns null on pages without the drawer', () => {
    document.body.innerHTML = '<main></main>';

    expect(initMobileDrawer(document)).toBeNull();
  });

  it('opens with the menu button, moves focus inside and locks page scroll', () => {
    openWithButton();

    expect(drawer.isOpen).toBe(true);
    expect(dialog().open).toBe(true);
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(document.documentElement.hasAttribute(SCROLL_LOCK_ATTRIBUTE)).toBe(true);
    expect(document.activeElement).toBe(closeButton());
  });

  it('closes with the close button and returns focus to the menu button', () => {
    openWithButton();
    closeButton().click();

    expectClosed();
  });

  it('closes with Escape and returns focus to the menu button', () => {
    openWithButton();
    const event = pressKey('Escape');

    expect(event.defaultPrevented).toBe(true);
    expectClosed();
  });

  it('closes on a click on the overlay (the dialog backdrop)', () => {
    openWithButton();
    dialog().dispatchEvent(click());

    expectClosed();
  });

  it('keeps the drawer open on a click inside the panel', () => {
    openWithButton();
    required(dialog().querySelector('nav'), 'nav').dispatchEvent(click());

    expect(drawer.isOpen).toBe(true);
  });

  it('closes when a section link is selected, without blocking its navigation', () => {
    openWithButton();
    const link = required(
      drawerLinks().find((anchor) => anchor.getAttribute('href') === '/#productos'),
      'products link',
    );
    const event = click();
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expectClosed();
  });

  it('traps Tab inside the drawer in both directions', () => {
    openWithButton();
    const lastLink = required(drawerLinks().at(-1), 'last link');

    expect(pressKey('Tab', true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(lastLink);

    expect(pressKey('Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(closeButton());
  });

  it('syncs its state when the platform closes the dialog (e.g. back gesture)', () => {
    openWithButton();
    dialog().dispatchEvent(new window.Event('cancel', { cancelable: true }) as unknown as Event);

    expectClosed();
  });

  it('closes when the viewport grows to the desktop breakpoint', () => {
    openWithButton();
    window.happyDOM.setViewport({ width: 1280, height: 800 });

    expectClosed();
  });

  it('ignores repeated close calls and stops reacting after destroy', () => {
    drawer.close();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');

    drawer.destroy();
    openWithButton();
    expect(drawer.isOpen).toBe(false);
  });
});
