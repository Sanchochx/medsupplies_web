/**
 * Pure scrollspy logic (D-05): which nav link is active, given which sections are on screen.
 * Kept free of DOM APIs so it can be unit tested; `trackActiveSection.ts` wires it to the page.
 */

export interface SectionVisibilityChange {
  id: string;
  isIntersecting: boolean;
}

/** Extracts the section id from a `/#anchor` (or `#anchor`) href; `null` if it has no fragment. */
export function sectionIdFromHref(href: string): string | null {
  const hashIndex = href.indexOf('#');
  const id = hashIndex === -1 ? '' : href.slice(hashIndex + 1);
  return id === '' ? null : id;
}

/** Applies a batch of observer changes to the set of visible sections, without mutating it. */
export function updateVisibleSections(
  visible: ReadonlySet<string>,
  changes: readonly SectionVisibilityChange[],
): Set<string> {
  const next = new Set(visible);
  for (const { id, isIntersecting } of changes) {
    if (isIntersecting) next.add(id);
    else next.delete(id);
  }
  return next;
}

/**
 * The active section is the first visible one in page order, i.e. the one at the top of the
 * viewport just below the header. When none is visible (e.g. between anchored sections) the
 * previous one stays active, so the highlight never flickers off while scrolling.
 */
export function resolveActiveSection(
  order: readonly string[],
  visible: ReadonlySet<string>,
  previous: string | null,
): string | null {
  return order.find((id) => visible.has(id)) ?? previous;
}
