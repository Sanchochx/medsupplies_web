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
 * Where the activation line sits, as a fraction of the viewport height from the top. A section is
 * active while it crosses this line: low enough to clear the fixed header, high enough that a new
 * section takes over as soon as it fills the reading area instead of only once the previous one
 * has scrolled completely out of view.
 */
export const ACTIVATION_LINE_RATIO = 0.35;

/**
 * IntersectionObserver `rootMargin` that shrinks the root to a zero-height line at `ratio` of the
 * viewport height, so an entry intersects only while the section crosses that line.
 */
export function activationLineRootMargin(ratio: number = ACTIVATION_LINE_RATIO): string {
  if (!(ratio >= 0 && ratio <= 1)) throw new RangeError(`Invalid activation line ratio: ${ratio}`);
  const top = Math.round(ratio * 100);
  return `-${top}% 0px -${100 - top}% 0px`;
}

/**
 * The active section is the first one in page order that crosses the activation line (at a
 * boundary two can touch it for a frame). When none does (e.g. the line falls on the footer) the
 * previous one stays active, so the highlight never flickers off while scrolling.
 */
export function resolveActiveSection(
  order: readonly string[],
  visible: ReadonlySet<string>,
  previous: string | null,
): string | null {
  return order.find((id) => visible.has(id)) ?? previous;
}
