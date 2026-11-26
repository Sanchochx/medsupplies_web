import {
  activationLineRootMargin,
  resolveActiveSection,
  sectionIdFromHref,
  updateVisibleSections,
  type SectionVisibilityChange,
} from './activeSection';

/** Marks nav links (header and mobile drawer) whose section is tracked by the scrollspy. */
export const SECTION_LINK_SELECTOR = 'a[data-section-link]';

/*
 * Extra room below the viewport within which the end-of-page marker still counts as reached, so
 * fractional scroll positions (zoom, mobile browsers) never leave the last link unlit.
 */
const PAGE_END_TOLERANCE_PX = 4;

/**
 * Highlights the nav links of the section crossing the activation line by setting
 * `aria-current="true"` (the active style is keyed off that attribute). Uses IntersectionObservers
 * only (one for the sections, one for an end-of-page marker), so no work runs on scroll. On pages without the anchored sections, or
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
  let atPageEnd = false;
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

  const update = (): void => {
    const next = resolveActiveSection(order, visible, active, atPageEnd);
    if (next !== active) {
      active = next;
      render();
    }
  };

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const changes: SectionVisibilityChange[] = entries.map((entry) => ({
        id: entry.target.id,
        isIntersecting: entry.isIntersecting,
      }));
      visible = updateVisibleSections(visible, changes);
      update();
    },
    { rootMargin: activationLineRootMargin() },
  );
  for (const section of sections) sectionObserver.observe(section);

  // Zero-height marker after everything else: it only enters the viewport at the bottom of the page.
  const pageEnd = root.createElement('div');
  pageEnd.setAttribute('aria-hidden', 'true');
  pageEnd.dataset.scrollspyPageEnd = '';
  root.body.append(pageEnd);
  const pageEndObserver = new IntersectionObserver(
    (entries) => {
      atPageEnd = entries.some((entry) => entry.isIntersecting);
      update();
    },
    { rootMargin: `0px 0px ${PAGE_END_TOLERANCE_PX}px 0px` },
  );
  pageEndObserver.observe(pageEnd);
}
