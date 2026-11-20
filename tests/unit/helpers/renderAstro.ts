import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

type RenderOptions = Parameters<AstroContainer['renderToString']>[1];

/**
 * Renders an `.astro` component to an HTML string, outside of a real request, so unit tests
 * can assert on markup without building the whole site.
 */
export async function renderAstro(
  component: AstroComponentFactory,
  options?: RenderOptions,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(component, options);
}
