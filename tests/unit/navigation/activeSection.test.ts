import { describe, expect, it } from 'vitest';
import {
  ACTIVATION_LINE_RATIO,
  activationLineRootMargin,
  resolveActiveSection,
  sectionIdFromHref,
  updateVisibleSections,
} from '../../../src/lib/navigation/activeSection';

const ORDER = ['home', 'about', 'products', 'engineering', 'why-us', 'contact'] as const;

describe('sectionIdFromHref', () => {
  it.each([
    ['/#about', 'about'],
    ['#why-us', 'why-us'],
    ['/privacy-policy', null],
    ['/#', null],
  ])('reads "%s" as %s', (href, id) => {
    expect(sectionIdFromHref(href)).toBe(id);
  });
});

describe('updateVisibleSections', () => {
  it('adds entering sections and removes leaving ones without mutating the input', () => {
    const visible = new Set(['home']);
    const next = updateVisibleSections(visible, [
      { id: 'home', isIntersecting: false },
      { id: 'about', isIntersecting: true },
    ]);

    expect([...next]).toEqual(['about']);
    expect([...visible]).toEqual(['home']);
  });
});

describe('resolveActiveSection', () => {
  it('activates the first visible section in page order, whatever the set order', () => {
    expect(resolveActiveSection(ORDER, new Set(['products', 'about']), 'home')).toBe('about');
  });

  it('keeps the previous section when none is visible', () => {
    expect(resolveActiveSection(ORDER, new Set(), 'engineering')).toBe('engineering');
  });

  it('returns null before any section has been seen', () => {
    expect(resolveActiveSection(ORDER, new Set(), null)).toBeNull();
  });

  it('ignores visible elements that are not nav sections', () => {
    expect(resolveActiveSection(ORDER, new Set(['footer', 'contact']), null)).toBe('contact');
  });

  it('follows a scroll through the page, one active link at a time', () => {
    const steps = [
      [{ id: 'home', isIntersecting: true }],
      [{ id: 'about', isIntersecting: true }],
      [{ id: 'home', isIntersecting: false }],
      [{ id: 'about', isIntersecting: false }],
    ];
    let visible: ReadonlySet<string> = new Set();
    let active: string | null = null;
    const history: (string | null)[] = [];

    for (const changes of steps) {
      visible = updateVisibleSections(visible, changes);
      active = resolveActiveSection(ORDER, visible, active);
      history.push(active);
    }

    expect(history).toEqual(['home', 'home', 'about', 'about']);
  });
});

describe('activationLineRootMargin', () => {
  it('shrinks the root to a line at 35% of the viewport by default', () => {
    expect(ACTIVATION_LINE_RATIO).toBe(0.35);
    expect(activationLineRootMargin()).toBe('-35% 0px -65% 0px');
  });

  it('places the line at the given ratio', () => {
    expect(activationLineRootMargin(0.5)).toBe('-50% 0px -50% 0px');
    expect(activationLineRootMargin(0)).toBe('-0% 0px -100% 0px');
  });

  it.each([-0.1, 1.5, Number.NaN])('rejects the out-of-range ratio %s', (ratio) => {
    expect(() => activationLineRootMargin(ratio)).toThrow(RangeError);
  });
});
