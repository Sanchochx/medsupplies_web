import {
  resolveActiveSection,
  sectionIdFromHref,
  updateVisibleSections,
  type SectionVisibilityChange,
} from './activeSection';

/** Marks nav links (header and mobile drawer) whose section is tracked by the scrollspy. */
export const SECTION_LINK_SELECTOR = 'a[data-section-link]';
/** Marks the fixed header, whose height defines the top of the observed area. */
export const SITE_HEADER_SELECTOR = '[data-site-header]';

// A few pixels below the header so the section that just scrolled under it (whose bottom edge
// touches the header line after an anchor jump) no longer counts as visible.
const HEADER_EDGE_TOLERANCE_PX = 4;

/**
 * Highlights the nav links of the section currently at the top of the page by setting
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

  const headerHeight =
    root.querySelector(SITE_HEADER_SELECTOR)?.getBoundingClientRect().height ?? 0;
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
    { rootMargin: `-${Math.ceil(headerHeight) + HEADER_EDGE_TOLERANCE_PX}px 0px 0px 0px` },
  );

  for (const section of sections) observer.observe(section);
}
