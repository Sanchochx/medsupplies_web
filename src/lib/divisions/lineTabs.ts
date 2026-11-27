/**
 * Line tabs inside a division panel (ARIA tabs pattern, automatic activation): one tab per product
 * line, Left/Right/Home/End move between tabs with roving `tabindex`, and the footer's prev/next
 * buttons step through the same selection. Every tab panel is in the HTML; the script only flips
 * which one is shown.
 */

export const LINE_TABS_SELECTOR = '[data-line-tabs]';
export const TAB_SELECTOR = '[role="tab"]';
export const TABLIST_SELECTOR = '[role="tablist"]';
export const PREV_SELECTOR = '[data-line-prev]';
export const NEXT_SELECTOR = '[data-line-next]';
export const COUNTER_SELECTOR = '[data-line-counter]';

/** Extra room so a tab scrolled into view clears the tab bar's faded edge. */
const SCROLL_PADDING_PX = 48;

export interface LineTabsController {
  readonly selectedIndex: number;
  select(index: number, options?: { focusTab?: boolean }): void;
  /** Removes every listener; safe to call more than once. */
  destroy(): void;
}

/** Pill above each line title: "Línea 01", "Línea 02"… (shown uppercase by the chip). */
export function formatLineLabel(index: number): string {
  return `Línea ${String(index + 1).padStart(2, '0')}`;
}

export function lineCounterText(index: number, count: number): string {
  return `Mostrando línea ${index + 1} de ${count}`;
}

/** Tab to select after a key press on the tab list, or `null` for keys the tabs do not handle. */
export function tabIndexForKey(key: string, current: number, count: number): number | null {
  if (count <= 0) return null;
  switch (key) {
    case 'ArrowRight':
      return (current + 1) % count;
    case 'ArrowLeft':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

/** Prev/next step: unlike the arrow keys it stops at the ends instead of wrapping. */
export function stepIndex(current: number, delta: number, count: number): number {
  return Math.min(Math.max(current + delta, 0), Math.max(count - 1, 0));
}

function controlledPanel(tab: HTMLElement): HTMLElement | null {
  const id = tab.getAttribute('aria-controls');
  return id ? tab.ownerDocument.getElementById(id) : null;
}

/** Scrolls only the tab bar (never the page) so `tab` is fully visible in it. */
function revealTab(tablist: HTMLElement, tab: HTMLElement): void {
  const list = tablist.getBoundingClientRect();
  const item = tab.getBoundingClientRect();
  if (item.left < list.left) {
    tablist.scrollLeft -= list.left - item.left + SCROLL_PADDING_PX;
  } else if (item.right > list.right) {
    tablist.scrollLeft += item.right - list.right + SCROLL_PADDING_PX;
  }
}

function initOne(root: HTMLElement): LineTabsController | null {
  const tablist = root.querySelector<HTMLElement>(TABLIST_SELECTOR);
  const tabs = [...root.querySelectorAll<HTMLButtonElement>(TAB_SELECTOR)];
  const panels = tabs.map(controlledPanel);
  if (!tablist || tabs.length === 0 || panels.some((panel) => panel === null)) return null;

  const prev = root.querySelector<HTMLButtonElement>(PREV_SELECTOR);
  const next = root.querySelector<HTMLButtonElement>(NEXT_SELECTOR);
  const counter = root.querySelector<HTMLElement>(COUNTER_SELECTOR);
  const listeners = new AbortController();
  const { signal } = listeners;
  const count = tabs.length;
  let selectedIndex = Math.max(
    tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
    0,
  );

  const select = (index: number, { focusTab = false } = {}): void => {
    if (index < 0 || index >= count) return;
    selectedIndex = index;
    tabs.forEach((tab, position) => {
      const isSelected = position === index;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      const panel = panels[position];
      if (panel) panel.hidden = !isSelected;
    });
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === count - 1;
    if (counter) counter.textContent = lineCounterText(index, count);

    const tab = tabs[index];
    if (!tab) return;
    revealTab(tablist, tab);
    if (focusTab) tab.focus();
  };

  // A button that becomes disabled drops focus to <body>; hand it to the other arrow instead.
  const step = (
    delta: number,
    button: HTMLButtonElement,
    other: HTMLButtonElement | null,
  ): void => {
    select(stepIndex(selectedIndex, delta, count));
    if (button.disabled && other && !other.disabled) other.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index), { signal });
  });
  tablist.addEventListener(
    'keydown',
    (event) => {
      const index = tabIndexForKey(event.key, selectedIndex, count);
      if (index === null) return;
      event.preventDefault();
      select(index, { focusTab: true });
    },
    { signal },
  );
  prev?.addEventListener('click', () => step(-1, prev, next), { signal });
  next?.addEventListener('click', () => step(1, next, prev), { signal });

  select(selectedIndex);

  return {
    get selectedIndex() {
      return selectedIndex;
    },
    select,
    destroy: () => listeners.abort(),
  };
}

/** Wires every line-tabs block in `root`. */
export function initLineTabs(root: ParentNode = document): LineTabsController[] {
  return [...root.querySelectorAll<HTMLElement>(LINE_TABS_SELECTOR)].flatMap((element) => {
    const controller = initOne(element);
    return controller ? [controller] : [];
  });
}
