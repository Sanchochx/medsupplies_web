import { Window } from 'happy-dom';
import { vi } from 'vitest';

export interface FakeEntryInit {
  isIntersecting: boolean;
  intersectionRatio?: number;
  /** Bottom edge of the element relative to the viewport top. */
  bottom?: number;
}

/** Records observed elements; tests fire entries by hand. */
export class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly observed = new Set<Element>();
  readonly options: IntersectionObserverInit | undefined;

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.options = options;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed.add(element);
  }

  unobserve(element: Element): void {
    this.observed.delete(element);
  }

  disconnect(): void {
    this.observed.clear();
  }

  /** Reports `element` (only if still observed), as the browser would. */
  fire(element: Element, init: FakeEntryInit): void {
    if (!this.observed.has(element)) return;
    const { isIntersecting, intersectionRatio = isIntersecting ? 1 : 0, bottom = 500 } = init;
    const entry = {
      target: element,
      isIntersecting,
      intersectionRatio,
      intersectionRect: { height: isIntersecting ? 100 * intersectionRatio : 0 },
      boundingClientRect: { bottom },
      rootBounds: { height: 800 },
    };
    this.callback(
      [entry as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

export interface MotionEnv {
  win: Window;
  /** The happy-dom window typed as a DOM window, for the code under test. */
  dom: globalThis.Window;
  /** Media queries that match; `(prefers-reduced-motion: reduce)` for reduced motion. */
  matching: Set<string>;
  setVisibility(state: DocumentVisibilityState): void;
  /** Runs the pending animation frames at `time` ms. */
  frameAt(time: number): void;
  pendingFrames(): number;
  observer(): FakeIntersectionObserver | undefined;
  /** Dispatches `pageshow`, as on a back/forward cache restore when `persisted`. */
  pageshow(persisted: boolean): void;
  close(): void;
}

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export function createMotionEnv(): MotionEnv {
  const win = new Window();
  const dom = win as unknown as globalThis.Window;
  const matching = new Set<string>();
  const frames = new Map<number, FrameRequestCallback>();
  let visibility: DocumentVisibilityState = 'visible';
  let nextFrame = 1;

  FakeIntersectionObserver.instances = [];
  Object.defineProperty(win, 'IntersectionObserver', {
    value: FakeIntersectionObserver,
    configurable: true,
  });
  Object.defineProperty(win.document, 'visibilityState', { get: () => visibility });
  vi.spyOn(dom, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return matching.has(query);
        },
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
  vi.spyOn(dom, 'requestAnimationFrame').mockImplementation((callback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  vi.spyOn(dom, 'cancelAnimationFrame').mockImplementation((id) => {
    frames.delete(id);
  });

  return {
    win,
    dom,
    matching,
    setVisibility(state) {
      visibility = state;
      win.document.dispatchEvent(new win.Event('visibilitychange'));
    },
    frameAt(time) {
      const pending = Array.from(frames.values());
      frames.clear();
      pending.forEach((callback) => callback(time));
    },
    pendingFrames: () => frames.size,
    observer: () => FakeIntersectionObserver.instances[0],
    pageshow(persisted) {
      const event = new win.Event('pageshow');
      Object.defineProperty(event, 'persisted', { value: persisted });
      win.dispatchEvent(event);
    },
    close() {
      vi.restoreAllMocks();
      void win.happyDOM.close();
    },
  };
}
