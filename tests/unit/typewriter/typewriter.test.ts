import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  TYPEWRITER_COMPLETE_EVENT,
  TYPEWRITER_DEFAULTS,
  createTypewriter,
  escapeHtml,
  readTypewriterOptions,
  splitTypewriterHtml,
  typedCharCount,
  type TypewriterController,
} from '../../../src/lib/typewriter/typewriter';
import { createMotionEnv, REDUCED_MOTION, type MotionEnv } from '../helpers/fakeMotionEnv';

/** The painted text of split markup: tags removed, except `<br>`. */
function painted(html: string): string {
  return html.replace(/<(?!br\b)[^>]+>/g, '');
}

describe('splitTypewriterHtml', () => {
  it('wraps each character in a span, grouped per word, with collapsed whitespace', () => {
    const html = splitTypewriterHtml('  Hola   señor\nmédico ');

    expect(painted(html)).toBe('Hola señor médico');
    expect(html.match(/data-typewriter-char/g)).toHaveLength('Hola señor médico'.length);
    expect(html.match(/<span data-typewriter-word>/g)).toHaveLength(3);
    expect(html).toMatch(
      /^<span data-typewriter-word><span data-typewriter-char>H<\/span><span data-typewriter-char>o<\/span>/,
    );
    expect(html).toContain(
      '</span></span><span data-typewriter-char> </span><span data-typewriter-word>',
    );
  });

  it('keeps inline elements around their (split) text', () => {
    const html = splitTypewriterHtml(
      'Para <span class="font-semibold text-primary">Medsupplies &amp; Co.</span>, la salud',
    );

    expect(html).toMatch(
      /<span class="font-semibold text-primary"><span data-typewriter-word><span data-typewriter-char>M<\/span>[\s\S]*<span data-typewriter-char>\.<\/span><\/span><\/span><span data-typewriter-word><span data-typewriter-char>,<\/span>/,
    );
    expect(painted(html)).toBe('Para Medsupplies &amp; Co., la salud');
    // An entity is a single character.
    expect(html).toContain('<span data-typewriter-char>&amp;</span>');
  });

  it('keeps line breaks and drops the spaces around them, which never paint', () => {
    const html = splitTypewriterHtml('Primer bloque.\n  <br />\n  Segundo bloque.');

    expect(painted(html)).toBe('Primer bloque.<br />Segundo bloque.');
  });

  it('collapses whitespace across tag boundaries like HTML does', () => {
    expect(painted(splitTypewriterHtml('uno <strong> dos</strong>  tres'))).toBe('uno dos tres');
  });

  it('keeps emoji and accented letters whole', () => {
    const html = splitTypewriterHtml('sí 👍');

    expect(html).toContain('<span data-typewriter-char>í</span>');
    expect(html).toContain('<span data-typewriter-char>👍</span>');
  });

  it('escapes plain text before it is split', () => {
    expect(escapeHtml('a < b & "c"')).toBe('a &lt; b &amp; &quot;c&quot;');
  });
});

describe('typedCharCount', () => {
  const options = { speed: 28, delay: 0 };

  it('shows floor(elapsed / speed) characters', () => {
    expect(typedCharCount(0, options, 100)).toBe(0);
    expect(typedCharCount(27, options, 100)).toBe(0);
    expect(typedCharCount(28, options, 100)).toBe(1);
    expect(typedCharCount(290, options, 100)).toBe(10);
  });

  it('shows nothing until the delay has passed, then counts from it', () => {
    const delayed = { speed: 28, delay: 700 };

    expect(typedCharCount(699, delayed, 100)).toBe(0);
    expect(typedCharCount(700, delayed, 100)).toBe(0);
    expect(typedCharCount(700 + 56, delayed, 100)).toBe(2);
  });

  it('follows the speed option', () => {
    expect(typedCharCount(100, { speed: 10, delay: 0 }, 100)).toBe(10);
    expect(typedCharCount(100, { speed: 50, delay: 0 }, 100)).toBe(2);
  });

  it('never exceeds the total, and a zero speed shows everything', () => {
    expect(typedCharCount(1e6, options, 12)).toBe(12);
    expect(typedCharCount(0, { speed: 0, delay: 0 }, 12)).toBe(12);
  });
});

describe('createTypewriter', () => {
  const TEXT = 'Hola mundo';
  const TOTAL = TEXT.length;

  let env: MotionEnv;
  let root: HTMLElement;
  let controller: TypewriterController | undefined;
  let completions: number;

  function markup(attrs: string, content = TEXT): string {
    return `<p data-typewriter data-typewriter-caret ${attrs}><span class="sr-only">${content}</span><span aria-hidden="true">${splitTypewriterHtml(content)}</span></p>`;
  }

  function setup(attrs = '', wrap = (html: string): string => html): TypewriterController {
    env.win.document.body.innerHTML = wrap(markup(attrs));
    root = env.win.document.querySelector('[data-typewriter]') as unknown as HTMLElement;
    root.addEventListener(TYPEWRITER_COMPLETE_EVENT, () => (completions += 1));
    controller = createTypewriter(root, env.dom);
    return controller;
  }

  function typedChars(): number {
    return root.querySelectorAll('[data-typed]').length;
  }

  beforeEach(() => {
    env = createMotionEnv();
    completions = 0;
  });

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    env.close();
  });

  it('reads speed, delay and trigger from data attributes, with defaults', () => {
    setup('data-typewriter-speed="40" data-typewriter-delay="700" data-typewriter-trigger="view"');
    expect(readTypewriterOptions(root)).toEqual({ speed: 40, delay: 700, trigger: 'view' });

    root.removeAttribute('data-typewriter-speed');
    root.removeAttribute('data-typewriter-delay');
    root.setAttribute('data-typewriter-trigger', 'nonsense');
    expect(readTypewriterOptions(root)).toEqual(TYPEWRITER_DEFAULTS);

    root.setAttribute('data-typewriter-speed', '-5');
    expect(readTypewriterOptions(root).speed).toBe(TYPEWRITER_DEFAULTS.speed);
  });

  it('types by elapsed time from the first frame, not by frame count', () => {
    const typewriter = setup('data-typewriter-speed="10"');

    env.frameAt(1000);
    expect(typedChars()).toBe(0);
    env.frameAt(1035);
    expect(typedChars()).toBe(3);
    // A long frame jumps ahead instead of drifting behind.
    env.frameAt(1080);
    expect(typedChars()).toBe(8);
    expect(typewriter.typed).toBe(8);
    expect(root.dataset.typewriterState).toBe('typing');
  });

  it('waits for the delay before the first character', () => {
    setup('data-typewriter-speed="10" data-typewriter-delay="700"');

    env.frameAt(0);
    env.frameAt(699);
    expect(typedChars()).toBe(0);
    env.frameAt(730);
    expect(typedChars()).toBe(3);
  });

  it('keeps the caret on the last typed character, never on a space', () => {
    setup('data-typewriter-speed="10"');

    env.frameAt(0);
    env.frameAt(40);
    let caret = root.querySelectorAll('[data-typewriter-caret-at]');
    expect(caret).toHaveLength(1);
    expect(caret[0]?.textContent).toBe('a');

    // 5 characters: "Hola " — the space is typed but the caret stays after the "a".
    env.frameAt(50);
    caret = root.querySelectorAll('[data-typewriter-caret-at]');
    expect(caret).toHaveLength(1);
    expect(caret[0]?.textContent).toBe('a');
  });

  it('types inline markup and line breaks in reading order, as one flow', () => {
    env.win.document.body.innerHTML = markup(
      'data-typewriter-speed="10"',
      'Ab <strong>cd</strong><br>ef',
    );
    root = env.win.document.querySelector('[data-typewriter]') as unknown as HTMLElement;
    controller = createTypewriter(root, env.dom);

    env.frameAt(0);
    env.frameAt(50);
    const typed = Array.from(root.querySelectorAll('[data-typed]'), (char) => char.textContent);
    expect(typed).toEqual(['A', 'b', ' ', 'c', 'd']);
    expect(root.querySelector('strong [data-typed]')).not.toBeNull();
    env.frameAt(70);
    const afterBreak = root.querySelectorAll('br + [data-typewriter-word] [data-typed]');
    expect(Array.from(afterBreak, (char) => char.textContent)).toEqual(['e', 'f']);
    expect(root.dataset.typewriterState).toBe('done');
  });

  it('marks itself done, fires the completion event once and stops requesting frames', () => {
    const typewriter = setup('data-typewriter-speed="10"');

    env.frameAt(0);
    env.frameAt(50);
    expect(completions).toBe(0);
    env.frameAt(TOTAL * 10);
    expect(typedChars()).toBe(TOTAL);
    expect(typewriter.typed).toBe(TOTAL);
    expect(root.dataset.typewriterState).toBe('done');
    expect(completions).toBe(1);
    expect(env.pendingFrames()).toBe(0);

    typewriter.complete();
    expect(completions).toBe(1);
  });

  it('complete() shows the whole text at once, cancels the pending frame and fires the event', () => {
    const typewriter = setup();

    env.frameAt(0);
    typewriter.complete();
    expect(root.dataset.typewriterState).toBe('done');
    expect(typewriter.typed).toBe(TOTAL);
    expect(env.pendingFrames()).toBe(0);
    expect(completions).toBe(1);
  });

  it('under reduced motion completes immediately without animating', () => {
    env.matching.add(REDUCED_MOTION);
    const typewriter = setup('data-typewriter-delay="700"');

    expect(root.dataset.typewriterState).toBe('done');
    expect(typewriter.typed).toBe(TOTAL);
    expect(completions).toBe(1);
    expect(env.dom.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('jumps to the end when restored from the back/forward cache mid-typing', () => {
    setup();
    env.frameAt(0);
    env.pageshow(true);

    expect(root.dataset.typewriterState).toBe('done');
  });

  it('leaves text that has not started alone on a back/forward cache restore', () => {
    setup('data-typewriter-trigger="view"');
    env.pageshow(true);

    expect(root.dataset.typewriterState).toBeUndefined();
  });

  it('with the load trigger, waits for a background tab to become visible', () => {
    env.setVisibility('hidden');
    setup();
    expect(env.dom.requestAnimationFrame).not.toHaveBeenCalled();
    expect(root.dataset.typewriterState).toBeUndefined();

    env.setVisibility('visible');
    expect(root.dataset.typewriterState).toBe('typing');
    expect(env.pendingFrames()).toBe(1);
  });

  describe('view trigger', () => {
    it('outside a sequence, starts once on entering the viewport, through the shared observer', () => {
      setup('data-typewriter-trigger="view" data-typewriter-speed="10"');
      const observer = env.observer();

      expect(observer?.observed.has(root)).toBe(true);
      observer?.fire(root, { isIntersecting: true, intersectionRatio: 0.1 });
      expect(env.dom.requestAnimationFrame).not.toHaveBeenCalled();

      observer?.fire(root, { isIntersecting: true, intersectionRatio: 0.3 });
      expect(root.dataset.typewriterState).toBe('typing');
      expect(observer?.observed.has(root)).toBe(false);

      env.frameAt(0);
      env.frameAt(30);
      // Leaving and coming back does not restart: it is no longer observed.
      observer?.fire(root, { isIntersecting: false });
      observer?.fire(root, { isIntersecting: true });
      env.frameAt(50);
      expect(typedChars()).toBe(5);
    });

    it('inside a sequence, starts with it instead of observing itself', () => {
      setup('data-typewriter-trigger="view"', (html) => `<div data-intro-root>${html}</div>`);
      const sequence = env.win.document.querySelector('[data-intro-root]');

      expect(env.observer()).toBeUndefined();
      sequence?.dispatchEvent(new env.win.Event('intro:start'));
      expect(root.dataset.typewriterState).toBe('typing');
    });

    it('inside a sequence that is skipped, shows the whole text', () => {
      setup('data-typewriter-trigger="view"', (html) => `<div data-intro-root>${html}</div>`);
      env.win.document
        .querySelector('[data-intro-root]')
        ?.dispatchEvent(new env.win.Event('intro:skip'));

      expect(root.dataset.typewriterState).toBe('done');
      expect(completions).toBe(1);
    });
  });

  describe('after another typewriter', () => {
    let first: HTMLElement;
    let second: HTMLElement;
    let controllers: TypewriterController[];

    function chain(firstState = ''): void {
      env.win.document.body.innerHTML = `<div data-intro-root>${markup(
        `id="first" data-typewriter-trigger="view" ${firstState}`,
      )}${markup('id="second" data-typewriter-trigger="view" data-typewriter-delay="100" data-typewriter-after="first"')}</div>`;
      [first, second] = Array.from(
        env.win.document.querySelectorAll('[data-typewriter]'),
      ) as unknown as HTMLElement[];
      second.addEventListener(TYPEWRITER_COMPLETE_EVENT, () => (completions += 1));
      controllers = [createTypewriter(first, env.dom), createTypewriter(second, env.dom)];
    }

    const startSequence = (): void => {
      env.win.document
        .querySelector('[data-intro-root]')
        ?.dispatchEvent(new env.win.Event('intro:start'));
    };

    afterEach(() => controllers.forEach((typewriter) => typewriter.destroy()));

    it('ignores the sequence start and types when the previous one completes', () => {
      chain();
      startSequence();

      expect(first.dataset.typewriterState).toBe('typing');
      expect(second.dataset.typewriterState).toBeUndefined();

      env.frameAt(0);
      env.frameAt(TOTAL * TYPEWRITER_DEFAULTS.speed);
      expect(first.dataset.typewriterState).toBe('done');
      expect(second.dataset.typewriterState).toBe('typing');
    });

    it('counts its delay from the completion of the previous one', () => {
      chain();
      startSequence();
      controllers[0]?.complete();

      env.frameAt(5000);
      env.frameAt(5099);
      expect(second.querySelectorAll('[data-typed]')).toHaveLength(0);
      env.frameAt(5100 + 2 * TYPEWRITER_DEFAULTS.speed);
      expect(second.querySelectorAll('[data-typed]')).toHaveLength(2);
    });

    it('starts at once when the previous one is already done', () => {
      chain('data-typewriter-state="done"');

      expect(second.dataset.typewriterState).toBe('typing');
    });

    it('shows its whole text when the sequence is skipped', () => {
      chain();
      env.win.document
        .querySelector('[data-intro-root]')
        ?.dispatchEvent(new env.win.Event('intro:skip'));

      expect(second.dataset.typewriterState).toBe('done');
      expect(completions).toBe(1);
      expect(env.pendingFrames()).toBe(0);
    });
  });
});
