/**
 * Shared look of text inputs, selects and textareas. The design's bare `outline-none` is replaced
 * by a visible focus state (primary border + soft ring), and a hairline border keeps the field
 * visible on the white card, where the `surface` fill alone is almost invisible.
 */
export const FIELD_CONTROL_CLASSES =
  'w-full rounded-lg border border-outline-variant bg-surface px-3 text-body-sm text-on-surface ' +
  'transition-colors duration-200 outline-none placeholder:text-on-surface-variant ' +
  'focus:border-primary focus:bg-surface-container-lowest focus:ring-3 focus:ring-primary/20';

/** Single-line controls (inputs and select) are 44px tall, the minimum touch target. */
export const FIELD_SINGLE_LINE_CLASSES = `${FIELD_CONTROL_CLASSES} h-11`;
