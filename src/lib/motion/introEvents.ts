/** Shared by the intro sequencer and the typewriter (which starts with its sequence). */
export const INTRO_ROOT_SELECTOR = '[data-intro-root]';
/** Dispatched on a sequence root when it starts playing. */
export const INTRO_START_EVENT = 'intro:start';
/** Dispatched on a sequence root shown without animating (it was already scrolled past). */
export const INTRO_SKIP_EVENT = 'intro:skip';
