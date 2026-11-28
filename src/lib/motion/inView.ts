/**
 * One shared `IntersectionObserver` per window for every scroll-triggered animation, instead of one
 * observer per element. Each watched element is reported once, then unobserved:
 * - `enter`: it reached the threshold (30% of it visible, or for elements taller than that allows,
 *   a band 30% of the viewport high);
 * - `skip`: on the first report it was already above the viewport (a reload that restored the
 *   scroll position, say). The visitor never saw it come in, so it is shown without animating.
 */

export type InViewOutcome = 'enter' | 'skip';
export type InViewCallback = (outcome: InViewOutcome) => void;

export const IN_VIEW_THRESHOLD = 0.3;
// Intermediate steps so elements too tall to ever reach 30% are re-checked as they scroll in.
const THRESHOLDS = [0, 0.1, 0.2, IN_VIEW_THRESHOLD];

interface Registry {
  observer: IntersectionObserver;
  callbacks: Map<Element, InViewCallback[]>;
  reported: WeakSet<Element>;
}

const registries = new WeakMap<Window, Registry>();

function hasEntered(entry: IntersectionObserverEntry): boolean {
  if (!entry.isIntersecting) return false;
  if (entry.intersectionRatio >= IN_VIEW_THRESHOLD) return true;
  const viewportHeight = entry.rootBounds?.height ?? 0;
  return viewportHeight > 0 && entry.intersectionRect.height >= viewportHeight * IN_VIEW_THRESHOLD;
}

function registryFor(win: Window): Registry | undefined {
  const existing = registries.get(win);
  if (existing) return existing;
  const Observer = (win as Window & typeof globalThis).IntersectionObserver as
    typeof IntersectionObserver | undefined;
  if (!Observer) return undefined;

  const callbacks = new Map<Element, InViewCallback[]>();
  const reported = new WeakSet<Element>();
  const observer = new Observer(
    (entries) => {
      for (const entry of entries) {
        const { target } = entry;
        const firstReport = !reported.has(target);
        reported.add(target);
        let outcome: InViewOutcome | undefined;
        if (hasEntered(entry)) outcome = 'enter';
        else if (firstReport && !entry.isIntersecting && entry.boundingClientRect.bottom <= 0) {
          outcome = 'skip';
        }
        if (!outcome) continue;
        const listeners = callbacks.get(target) ?? [];
        callbacks.delete(target);
        observer.unobserve(target);
        listeners.forEach((listener) => listener(outcome));
      }
    },
    { threshold: THRESHOLDS },
  );
  const registry = { observer, callbacks, reported };
  registries.set(win, registry);
  return registry;
}

/**
 * Calls `callback` once, when `element` enters the viewport (or is skipped). Without
 * IntersectionObserver support it reports `enter` right away. Returns a function that cancels.
 */
export function onceInView(
  element: Element,
  callback: InViewCallback,
  win: Window = window,
): () => void {
  const registry = registryFor(win);
  if (!registry) {
    callback('enter');
    return () => undefined;
  }
  const { observer, callbacks } = registry;
  const listeners = callbacks.get(element);
  if (listeners) listeners.push(callback);
  else {
    callbacks.set(element, [callback]);
    observer.observe(element);
  }

  return () => {
    const current = callbacks.get(element);
    if (!current) return;
    const remaining = current.filter((listener) => listener !== callback);
    if (remaining.length > 0) {
      callbacks.set(element, remaining);
    } else {
      callbacks.delete(element);
      observer.unobserve(element);
    }
  };
}
