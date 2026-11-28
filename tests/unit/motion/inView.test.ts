import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IN_VIEW_THRESHOLD, onceInView } from '../../../src/lib/motion/inView';
import {
  FakeIntersectionObserver,
  createMotionEnv,
  type MotionEnv,
} from '../helpers/fakeMotionEnv';

describe('onceInView', () => {
  let env: MotionEnv;
  let first: Element;
  let second: Element;

  beforeEach(() => {
    env = createMotionEnv();
    env.win.document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    first = env.win.document.getElementById('a') as unknown as Element;
    second = env.win.document.getElementById('b') as unknown as Element;
  });

  afterEach(() => env.close());

  it('shares a single observer, at a 0.3 threshold, for every element', () => {
    onceInView(first, () => undefined, env.dom);
    onceInView(second, () => undefined, env.dom);

    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(env.observer()?.observed).toEqual(new Set([first, second]));
    expect(env.observer()?.options?.threshold).toContain(IN_VIEW_THRESHOLD);
  });

  it('reports `enter` once 30% is visible, then stops observing', () => {
    const callback = vi.fn();
    onceInView(first, callback, env.dom);
    const observer = env.observer();

    observer?.fire(first, { isIntersecting: true, intersectionRatio: 0.2 });
    expect(callback).not.toHaveBeenCalled();
    observer?.fire(first, { isIntersecting: true, intersectionRatio: 0.3 });
    expect(callback).toHaveBeenCalledExactlyOnceWith('enter');
    expect(observer?.observed.has(first)).toBe(false);

    observer?.fire(first, { isIntersecting: true });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('calls every callback registered for the same element', () => {
    const a = vi.fn();
    const b = vi.fn();
    onceInView(first, a, env.dom);
    onceInView(first, b, env.dom);

    env.observer()?.fire(first, { isIntersecting: true });
    expect(a).toHaveBeenCalledWith('enter');
    expect(b).toHaveBeenCalledWith('enter');
  });

  it('reports `skip` for an element already above the viewport on the first report', () => {
    const callback = vi.fn();
    onceInView(first, callback, env.dom);

    env.observer()?.fire(first, { isIntersecting: false, bottom: -200 });
    expect(callback).toHaveBeenCalledExactlyOnceWith('skip');
  });

  it('waits for an element below the viewport', () => {
    const callback = vi.fn();
    onceInView(first, callback, env.dom);
    const observer = env.observer();

    observer?.fire(first, { isIntersecting: false, bottom: 1600 });
    // Scrolled past without being reported in between: it is not skipped later on.
    observer?.fire(first, { isIntersecting: false, bottom: -200 });
    expect(callback).not.toHaveBeenCalled();
  });

  it('can be cancelled', () => {
    const callback = vi.fn();
    const cancel = onceInView(first, callback, env.dom);
    cancel();

    expect(env.observer()?.observed.has(first)).toBe(false);
  });
});
