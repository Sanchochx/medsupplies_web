import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STALL_CHECK_MS,
  initLoopingVideos,
  keepVideoLooping,
  type LoopingVideoController,
} from '../../../src/lib/media/loopingVideo';

interface FakeMediaQuery {
  matches: boolean;
  listeners: Set<() => void>;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
  fire(matches: boolean): void;
}

function fakeMediaQuery(matches: boolean): FakeMediaQuery {
  const query: FakeMediaQuery = {
    matches,
    listeners: new Set(),
    addEventListener: (_type, listener) => query.listeners.add(listener),
    removeEventListener: (_type, listener) => query.listeners.delete(listener),
    fire(next) {
      query.matches = next;
      query.listeners.forEach((listener) => listener());
    },
  };
  return query;
}

describe('keepVideoLooping', () => {
  let win: Window;
  let video: HTMLVideoElement;
  let query: FakeMediaQuery;
  let controller: LoopingVideoController | undefined;
  let paused: boolean;
  let visibility: DocumentVisibilityState;

  function setup(reducedMotion = false): void {
    query = fakeMediaQuery(reducedMotion);
    vi.spyOn(win, 'matchMedia').mockReturnValue(
      query as unknown as ReturnType<Window['matchMedia']>,
    );
    controller = keepVideoLooping(video, win as unknown as globalThis.Window);
  }

  function setVisibility(state: DocumentVisibilityState): void {
    visibility = state;
    win.document.dispatchEvent(new win.Event('visibilitychange'));
  }

  beforeEach(() => {
    win = new Window();
    win.document.body.innerHTML = '<video data-looping-video muted loop></video>';
    video = win.document.querySelector('video') as unknown as HTMLVideoElement;
    paused = true;
    visibility = 'visible';
    Object.defineProperty(win.document, 'visibilityState', { get: () => visibility });
    Object.defineProperty(video, 'paused', { get: () => paused });
    vi.spyOn(video, 'play').mockImplementation(() => {
      paused = false;
      return Promise.resolve();
    });
    vi.spyOn(video, 'pause').mockImplementation(() => {
      paused = true;
      video.dispatchEvent(new win.Event('pause') as unknown as Event);
    });
  });

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    vi.restoreAllMocks();
    void win.happyDOM.close();
  });

  it('starts playback right away', () => {
    setup();

    expect(video.play).toHaveBeenCalledTimes(1);
  });

  it('rewinds and plays again when the video ends', () => {
    setup();
    video.currentTime = 9.9;
    paused = true;

    video.dispatchEvent(new win.Event('ended') as unknown as Event);

    expect(video.currentTime).toBe(0);
    expect(video.play).toHaveBeenCalledTimes(2);
  });

  it('resumes when the browser pauses it on its own', () => {
    setup();
    paused = true;

    video.dispatchEvent(new win.Event('pause') as unknown as Event);

    expect(video.play).toHaveBeenCalledTimes(2);
  });

  it('pauses while the tab is hidden and resumes when it is visible again', () => {
    setup();

    setVisibility('hidden');
    expect(video.pause).toHaveBeenCalledTimes(1);
    expect(video.play).toHaveBeenCalledTimes(1);

    setVisibility('visible');
    expect(video.play).toHaveBeenCalledTimes(2);
  });

  it('never plays under reduced motion, and follows the preference when it changes', () => {
    setup(true);
    expect(video.play).not.toHaveBeenCalled();

    query.fire(false);
    expect(video.play).toHaveBeenCalledTimes(1);

    query.fire(true);
    expect(video.pause).toHaveBeenCalledTimes(1);
    expect(video.play).toHaveBeenCalledTimes(1);
  });

  it('swallows a blocked autoplay', async () => {
    vi.mocked(video.play).mockRejectedValue(new Error('NotAllowedError'));

    expect(() => setup()).not.toThrow();
    await Promise.resolve();
  });

  describe('stall watchdog', () => {
    let seeks: number;

    beforeEach(() => {
      vi.useFakeTimers();
      seeks = 0;
      let position = 0;
      Object.defineProperty(video, 'currentTime', {
        get: () => position,
        set: (value: number) => {
          seeks += 1;
          position = value;
        },
      });
      vi.spyOn(video, 'load').mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function advancePlayhead(): void {
      const current = video.currentTime;
      video.currentTime = current + 1;
      seeks -= 1;
    }

    it('leaves a video that keeps moving alone', () => {
      setup();
      advancePlayhead();
      vi.advanceTimersByTime(STALL_CHECK_MS);
      advancePlayhead();
      vi.advanceTimersByTime(STALL_CHECK_MS);

      expect(seeks).toBe(0);
      expect(video.load).not.toHaveBeenCalled();
    });

    it('seeks in place on the first frozen check, then reloads if still frozen', () => {
      setup();

      vi.advanceTimersByTime(STALL_CHECK_MS);
      expect(seeks).toBe(1);
      expect(video.load).not.toHaveBeenCalled();

      vi.advanceTimersByTime(STALL_CHECK_MS);
      expect(video.load).toHaveBeenCalledTimes(1);
      expect(video.play).toHaveBeenCalledTimes(3);
    });

    it('does not treat a paused or reduced-motion video as stalled', () => {
      setup(true);
      vi.advanceTimersByTime(STALL_CHECK_MS * 3);

      expect(seeks).toBe(0);
      expect(video.load).not.toHaveBeenCalled();
    });

    it('stops checking after destroy()', () => {
      setup();
      controller?.destroy();
      vi.advanceTimersByTime(STALL_CHECK_MS * 3);

      expect(seeks).toBe(0);
      expect(video.load).not.toHaveBeenCalled();
    });
  });

  it('stops reacting after destroy()', () => {
    setup();
    controller?.destroy();
    controller?.destroy();
    paused = true;

    video.dispatchEvent(new win.Event('ended') as unknown as Event);
    video.dispatchEvent(new win.Event('pause') as unknown as Event);
    query.fire(false);

    expect(video.play).toHaveBeenCalledTimes(1);
    expect(query.listeners.size).toBe(0);
  });
});

describe('initLoopingVideos', () => {
  it('only wires videos marked with data-looping-video', () => {
    const win = new Window();
    win.document.body.innerHTML =
      '<video data-looping-video></video><video data-looping-video></video><video></video>';
    vi.stubGlobal('window', win);
    vi.spyOn(win, 'matchMedia').mockReturnValue(
      fakeMediaQuery(true) as unknown as ReturnType<Window['matchMedia']>,
    );

    const controllers = initLoopingVideos(win.document as unknown as ParentNode);

    expect(controllers).toHaveLength(2);
    controllers.forEach((controller) => controller.destroy());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    void win.happyDOM.close();
  });
});
