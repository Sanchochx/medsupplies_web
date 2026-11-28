import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import astroConfig from '../../../astro.config.mjs';

type RenderOptions = Parameters<AstroContainer['renderToString']>[1];

/**
 * Renders an `.astro` component to an HTML string, outside of a real request, so unit tests
 * can assert on markup without building the whole site.
 */
export async function renderAstro(
  component: AstroComponentFactory,
  options?: RenderOptions,
): Promise<string> {
  // The container does not read astro.config; `site` is passed so `Astro.site` matches the build.
  const container = await AstroContainer.create({ astroConfig: { site: astroConfig.site } });
  return container.renderToString(component, options);
}
