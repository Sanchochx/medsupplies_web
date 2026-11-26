import {
  activationLineRootMargin,
  resolveActiveSection,
  sectionIdFromHref,
  updateVisibleSections,
  type SectionVisibilityChange,
} from './activeSection';

/** Marks nav links (header and mobile drawer) whose section is tracked by the scrollspy. */
export const SECTION_LINK_SELECTOR = 'a[data-section-link]';

/**
 * Highlights the nav links of the section crossing the activation line by setting
 * `aria-current="true"` (the active style is keyed off that attribute). Uses a single
 * IntersectionObserver, so no work runs on scroll. On pages without the anchored sections, or
 * without IntersectionObserver support, it does nothing and the links simply stay unhighlighted.
 */
export function trackActiveSection(root: Document = document): void {
  const links = [...root.querySelectorAll<HTMLAnchorElement>(SECTION_LINK_SELECTOR)];
  const order = [
    ...new Set(links.map((link) => sectionIdFromHref(link.getAttribute('href') ?? ''))),
  ].filter((id): id is string => id !== null);
  const sections = order
    .map((id) => root.getElementById(id))
    .filter((section): section is HTMLElement => section !== null);

  if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return;

  let visible: ReadonlySet<string> = new Set();
  let active: string | null = null;

  const render = (): void => {
    for (const link of links) {
      if (sectionIdFromHref(link.getAttribute('href') ?? '') === active) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const changes: SectionVisibilityChange[] = entries.map((entry) => ({
        id: entry.target.id,
        isIntersecting: entry.isIntersecting,
      }));
      visible = updateVisibleSections(visible, changes);
      const next = resolveActiveSection(order, visible, active);
      if (next !== active) {
        active = next;
        render();
      }
    },
    { rootMargin: activationLineRootMargin() },
  );

  for (const section of sections) observer.observe(section);
}
