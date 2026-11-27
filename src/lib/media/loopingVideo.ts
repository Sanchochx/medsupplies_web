/**
 * Keeps decorative background videos looping. The `loop` attribute alone is not reliable: some
 * browsers stall at the loop point, and power saving or a background tab can pause the video
 * without resuming it. A decoder can also freeze mid-playback without firing any event, so a
 * watchdog checks that the playhead keeps moving and, if it does not, nudges the video with a seek
 * and then, if that is not enough, reloads it. Under reduced motion the video is paused (it is also hidden by CSS), so it
 * stops downloading and decoding.
 */

export const LOOPING_VIDEO_SELECTOR = 'video[data-looping-video]';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
/** How often the watchdog checks that the playhead advanced. */
export const STALL_CHECK_MS = 2000;

export interface LoopingVideoController {
  /** Removes every listener; used by tests and safe to call more than once. */
  destroy(): void;
}

function tryPlay(video: HTMLVideoElement): void {
  // Rejected when the browser blocks autoplay; the still photo underneath covers that case.
  video.play().catch(() => undefined);
}

export function keepVideoLooping(
  video: HTMLVideoElement,
  win: Window = window,
): LoopingVideoController {
  const doc = video.ownerDocument;
  const reducedMotion = win.matchMedia(REDUCED_MOTION_QUERY);
  const shouldPlay = (): boolean => !reducedMotion.matches && doc.visibilityState === 'visible';

  const sync = (): void => {
    if (shouldPlay()) {
      if (video.paused) tryPlay(video);
    } else if (!video.paused) {
      video.pause();
    }
  };

  const restart = (): void => {
    video.currentTime = 0;
    sync();
  };

  const resumeIfPaused = (): void => {
    if (shouldPlay()) tryPlay(video);
  };

  let lastTime = video.currentTime;
  let stalledChecks = 0;
  const checkProgress = (): void => {
    const moved = video.currentTime !== lastTime;
    lastTime = video.currentTime;
    if (moved || video.paused || !shouldPlay()) {
      stalledChecks = 0;
      return;
    }
    stalledChecks += 1;
    if (stalledChecks === 1) {
      // A seek to the same spot makes the decoder start again from the previous keyframe.
      const position = video.currentTime;
      video.currentTime = position;
      tryPlay(video);
    } else {
      stalledChecks = 0;
      video.load();
      tryPlay(video);
    }
  };
  const watchdog = setInterval(checkProgress, STALL_CHECK_MS);

  video.addEventListener('ended', restart);
  video.addEventListener('pause', resumeIfPaused);
  doc.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  sync();

  let destroyed = false;
  return {
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      clearInterval(watchdog);
      video.removeEventListener('ended', restart);
      video.removeEventListener('pause', resumeIfPaused);
      doc.removeEventListener('visibilitychange', sync);
      reducedMotion.removeEventListener('change', sync);
    },
  };
}

export function initLoopingVideos(root: ParentNode = document): LoopingVideoController[] {
  return Array.from(root.querySelectorAll<HTMLVideoElement>(LOOPING_VIDEO_SELECTOR), (video) =>
    keepVideoLooping(video),
  );
}
