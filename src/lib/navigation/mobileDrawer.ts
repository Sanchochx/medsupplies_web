/**
 * Mobile navigation drawer (D-04): a native modal `<dialog>` opened by the header's menu button.
 * `showModal()` provides the dialog role, the top layer, the `::backdrop` overlay and makes the
 * rest of the page inert; this module adds the behaviour the platform leaves to us: focus moves
 * in/out predictably, Tab cycles inside, page scroll is locked, and every way of dismissing it
 * (close button, Escape, overlay click, link selection, viewport reaching `xl`) goes through one
 * `close()`.
 */

export const DRAWER_SELECTOR = 'dialog[data-mobile-drawer]';
export const DRAWER_TOGGLE_SELECTOR = '[data-mobile-drawer-toggle]';
export const DRAWER_CLOSE_SELECTOR = '[data-mobile-drawer-close]';
/** Same breakpoint as Tailwind's `xl`, from which the header shows the full nav. */
export const DESKTOP_NAV_QUERY = '(min-width: 80rem)';
/** Set on `<html>` while the drawer is open; `data-scroll-locked:overflow-hidden` locks scrolling. */
export const SCROLL_LOCK_ATTRIBUTE = 'data-scroll-locked';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface MobileDrawerController {
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  /** Removes every listener; used by tests and safe to call more than once. */
  destroy(): void;
}

/**
 * Index to move focus to when Tab is pressed on the element at `currentIndex`, or `null` to let
 * the browser move it normally. Only the edges wrap, so focus never leaves the drawer.
 */
export function wrapFocusIndex(
  currentIndex: number,
  count: number,
  backwards: boolean,
): number | null {
  if (count === 0) return null;
  if (backwards && currentIndex <= 0) return count - 1;
  if (!backwards && (currentIndex === -1 || currentIndex === count - 1)) return 0;
  return null;
}

/** Wires the drawer found in `root`; returns `null` when the page has no drawer markup. */
export function initMobileDrawer(root: Document = document): MobileDrawerController | null {
  const drawer = root.querySelector<HTMLDialogElement>(DRAWER_SELECTOR);
  const toggle = root.querySelector<HTMLButtonElement>(DRAWER_TOGGLE_SELECTOR);
  const closeButton = drawer?.querySelector<HTMLButtonElement>(DRAWER_CLOSE_SELECTOR);
  if (!drawer || !toggle || !closeButton) return null;

  const listeners = new AbortController();
  const { signal } = listeners;
  let isOpen = false;

  const open = (): void => {
    if (isOpen) return;
    isOpen = true;
    drawer.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    root.documentElement.setAttribute(SCROLL_LOCK_ATTRIBUTE, '');
    closeButton.focus();
  };

  // Synchronous on purpose: when a link is selected the scroll lock must be gone before the
  // browser performs the link's default action (scrolling to the section).
  const close = (): void => {
    if (!isOpen) return;
    isOpen = false;
    if (drawer.open) drawer.close();
    toggle.setAttribute('aria-expanded', 'false');
    root.documentElement.removeAttribute(SCROLL_LOCK_ATTRIBUTE);
    toggle.focus({ preventScroll: true });
  };

  const trapFocus = (event: KeyboardEvent): void => {
    const focusable = [...drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
    const current = focusable.indexOf(root.activeElement as HTMLElement);
    const target = wrapFocusIndex(current, focusable.length, event.shiftKey);
    if (target === null) return;
    event.preventDefault();
    focusable[target]?.focus();
  };

  toggle.addEventListener('click', open, { signal });
  closeButton.addEventListener('click', close, { signal });

  drawer.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'Tab') {
        trapFocus(event);
      }
    },
    { signal },
  );

  drawer.addEventListener(
    'click',
    (event) => {
      // The panel content fills the dialog box, so a click whose target is the dialog itself
      // can only come from its ::backdrop, i.e. the overlay.
      if (event.target === drawer) {
        close();
        return;
      }
      // Click targets inside the dialog are always elements (text nodes never receive events).
      if ((event.target as Element).closest('a[href]')) close();
    },
    { signal },
  );

  // Other ways the platform dismisses a modal dialog (e.g. Android's back gesture).
  drawer.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault();
      close();
    },
    { signal },
  );
  drawer.addEventListener('close', close, { signal });

  root.defaultView?.matchMedia(DESKTOP_NAV_QUERY).addEventListener(
    'change',
    (event) => {
      if (event.matches) close();
    },
    { signal },
  );

  return {
    get isOpen() {
      return isOpen;
    },
    open,
    close,
    destroy: () => {
      close();
      listeners.abort();
    },
  };
}
