/**
 * Staggered groups of view-triggered sequences. Markup contract: `[data-intro-group]` with
 * `data-intro-stagger="<ms>"` around several `[data-intro-root]`s. Roots that enter the viewport
 * together (in the same observer report) start in DOM order, each `stagger` ms after the previous
 * one; a root entering later than that starts at once. Either way each still plays once.
 *
 * The gap is written as `--intro-offset` on the root, which every animation delay inside it adds
 * (global.css), so there are no timers to cancel: the root is marked as started right away and
 * its elements wait out the offset in their first keyframe.
 */

export const INTRO_GROUP_SELECTOR = '[data-intro-group]';
export const INTRO_OFFSET_PROPERTY = '--intro-offset';

// Node.DOCUMENT_POSITION_FOLLOWING, without relying on a global `Node` (tests run in happy-dom).
const DOCUMENT_POSITION_FOLLOWING = 4;

/** When the next root of a group starts: `stagger` ms after the previous one, never in the past. */
export function nextStartTime(now: number, previousStart: number, stagger: number): number {
  return Math.max(now, previousStart + stagger);
}

function byDocumentOrder(a: HTMLElement, b: HTMLElement): number {
  if (a === b) return 0;
  return a.compareDocumentPosition(b) & DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

interface GroupQueue {
  pending: HTMLElement[];
  lastStart: number;
}

const queues = new WeakMap<HTMLElement, GroupQueue>();

/**
 * Starts `root` (with `start`) as part of `group`, after the roots of the same group that entered
 * before it or together with it.
 */
export function startInGroup(
  root: HTMLElement,
  group: HTMLElement,
  start: (root: HTMLElement) => void,
  win: Window = window,
): void {
  const queue = queues.get(group) ?? { pending: [], lastStart: Number.NEGATIVE_INFINITY };
  queues.set(group, queue);
  const { pending } = queue;
  pending.push(root);
  if (pending.length > 1) return;

  // Entries of one observer report arrive one by one: wait for the whole report, then order it.
  queueMicrotask(() => {
    const stagger = Number(group.dataset.introStagger) || 0;
    const now = win.performance.now();
    for (const entered of pending.splice(0).sort(byDocumentOrder)) {
      const startAt = nextStartTime(now, queue.lastStart, stagger);
      queue.lastStart = startAt;
      entered.style.setProperty(INTRO_OFFSET_PROPERTY, `${Math.round(startAt - now)}ms`);
      start(entered);
    }
  });
}
