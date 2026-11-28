/**
 * Entrance sequences ("intros"). Markup contract:
 * - `[data-intro-root]`: a sequence. `data-intro-trigger="load"` plays it on page load (once the tab
 *   is visible); `"view"` when it enters the viewport (shared observer, see inView.ts). Either way
 *   it plays once per page load, never again on scrolling back.
 * - `[data-intro]`: an animated element of the nearest root (the root itself may be one). The CSS
 *   in global.css keeps it paused on its first keyframe while JS is on; this module sets
 *   `data-intro-state="playing"` on it when its sequence starts, or `"done"` (no animation, final
 *   state) when the sequence is skipped or restored from the back/forward cache.
 * - `[data-intro-after="<id>"]`: waits for the typewriter with that id to finish, instead of the
 *   sequence start.
 * - `[data-intro-group]` around view-triggered roots: those entering together start staggered, in
 *   DOM order (introStagger.ts).
 * - `[data-intro-parent="<id>"]` on a root: never starts before that root. While
 *   `data-intro-sync-media` matches (side-by-side layout) it starts together with it; otherwise it
 *   starts on its own entry into the viewport.
 * Timings live in the markup as CSS custom properties (introTimeline.ts), never in this script.
 * The sequence start is announced with an `intro:start` event on the root (typewriters listen to
 * it), and a skip with `intro:skip`. Under reduced motion every sequence is done from the start.
 */
import { TYPEWRITER_COMPLETE_EVENT } from '../typewriter/typewriter';
import { INTRO_ROOT_SELECTOR, INTRO_SKIP_EVENT, INTRO_START_EVENT } from './introEvents';
import { INTRO_GROUP_SELECTOR, startInGroup } from './introStagger';
import { onceInView } from './inView';

export type IntroState = 'playing' | 'done';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** `[data-intro]` elements that belong to `root` (not to a root nested inside it). */
export function introElementsOf(root: HTMLElement): HTMLElement[] {
  const candidates = [
    ...(root.hasAttribute('data-intro') ? [root] : []),
    ...Array.from(root.querySelectorAll<HTMLElement>('[data-intro]')),
  ];
  return candidates.filter((element) => element.closest(INTRO_ROOT_SELECTOR) === root);
}

function dispatch(target: HTMLElement, type: string): void {
  const EventCtor = target.ownerDocument.defaultView?.Event ?? Event;
  target.dispatchEvent(new EventCtor(type));
}

function setState(element: HTMLElement, state: IntroState): void {
  if (element.dataset.introState === 'done') return;
  element.dataset.introState = state;
}

export function startIntro(root: HTMLElement): void {
  if (root.dataset.introState) return;
  root.dataset.introState = 'playing';
  for (const element of introElementsOf(root)) {
    if (element !== root && element.hasAttribute('data-intro-after')) continue;
    element.dataset.introState = 'playing';
  }
  dispatch(root, INTRO_START_EVENT);
}

export function finishIntro(root: HTMLElement): void {
  const wasIdle = !root.dataset.introState;
  root.dataset.introState = 'done';
  for (const element of introElementsOf(root)) element.dataset.introState = 'done';
  if (wasIdle) dispatch(root, INTRO_SKIP_EVENT);
}

export interface IntroController {
  /** Removes every listener; safe to call more than once. */
  destroy(): void;
}

const initialized = new WeakSet<HTMLElement>();

export function initIntro(root: HTMLElement, win: Window = window): IntroController {
  const doc = root.ownerDocument;
  const cleanups: Array<() => void> = [];
  const listen = (target: EventTarget, type: string, listener: (event: Event) => void): void => {
    target.addEventListener(type, listener);
    cleanups.push(() => target.removeEventListener(type, listener));
  };
  const destroy = (): void => cleanups.splice(0).forEach((cleanup) => cleanup());

  if (win.matchMedia(REDUCED_MOTION_QUERY).matches) {
    finishIntro(root);
    return { destroy };
  }

  // Elements waiting for a typewriter play when it completes (a done sequence keeps them done).
  for (const element of introElementsOf(root)) {
    const typewriterId = element.dataset.introAfter;
    const typewriter = typewriterId ? doc.getElementById(typewriterId) : null;
    if (!typewriter || element === root) continue;
    if (typewriter.dataset.typewriterState === 'done') setState(element, 'playing');
    else listen(typewriter, TYPEWRITER_COMPLETE_EVENT, () => setState(element, 'playing'));
  }

  listen(win, 'pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted && root.dataset.introState === 'playing') {
      finishIntro(root);
    }
  });

  if (root.dataset.introTrigger === 'view') {
    const parent = root.dataset.introParent ? doc.getElementById(root.dataset.introParent) : null;
    if (parent) {
      const syncMedia = root.dataset.introSyncMedia;
      const synced = (): boolean => Boolean(syncMedia && win.matchMedia(syncMedia).matches);
      let seen = false;
      const parentStarted = (): boolean => Boolean(parent.dataset.introState);
      listen(parent, INTRO_START_EVENT, () => {
        if (synced() || seen) startIntro(root);
      });
      cleanups.push(
        onceInView(
          root,
          (outcome) => {
            if (outcome === 'skip') finishIntro(root);
            else if (parentStarted()) startIntro(root);
            else seen = true;
          },
          win,
        ),
      );
    } else {
      const group = root.parentElement?.closest<HTMLElement>(INTRO_GROUP_SELECTOR);
      cleanups.push(
        onceInView(
          root,
          (outcome) => {
            if (outcome === 'skip') finishIntro(root);
            else if (group) startInGroup(root, group, startIntro, win);
            else startIntro(root);
          },
          win,
        ),
      );
    }
  } else {
    const playWhenVisible = (): void => {
      if (doc.visibilityState === 'visible') startIntro(root);
    };
    // A page opened in a background tab plays its intro when it is first shown.
    listen(doc, 'visibilitychange', playWhenVisible);
    playWhenVisible();
  }

  return { destroy };
}

/** Initializes every sequence once; components may each call it. */
export function initIntros(scope: ParentNode = document): IntroController[] {
  const roots = Array.from(scope.querySelectorAll<HTMLElement>(INTRO_ROOT_SELECTOR));
  return roots
    .filter((root) => !initialized.has(root))
    .map((root) => {
      initialized.add(root);
      return initIntro(root);
    });
}
