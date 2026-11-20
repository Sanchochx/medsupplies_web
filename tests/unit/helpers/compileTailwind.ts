import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { compile } from '@tailwindcss/node';

const GLOBAL_CSS_PATH = resolve(import.meta.dirname, '../../../src/styles/global.css');

/**
 * Compiles the site's global stylesheet with the same Tailwind engine the Vite plugin uses and
 * returns the CSS generated for the given class candidates. The Astro Container API renders markup
 * but never runs Tailwind, so this is how tests prove that token utilities actually exist.
 */
export async function compileTailwind(candidates: readonly string[]): Promise<string> {
  const css = await readFile(GLOBAL_CSS_PATH, 'utf8');
  const compiler = await compile(css, {
    base: dirname(GLOBAL_CSS_PATH),
    onDependency: () => undefined,
  });
  return compiler.build([...candidates]);
}

/** Extracts every class name from the `class` attributes of an HTML string. */
export function extractClasses(html: string): string[] {
  const classes = [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    (match[1] ?? '').split(/\s+/),
  );
  return [...new Set(classes.filter(Boolean))];
}
