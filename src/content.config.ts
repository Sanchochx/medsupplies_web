import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { ICON_NAMES } from './components/ui/iconNames';
import { REQUEST_TYPES } from './lib/data/siteData';

const nonEmptyText = z.string().trim().min(1);
const order = z.number().int().positive();
const requestTypeId = z.enum(REQUEST_TYPES.map(({ id }) => id));

// Strict objects: an unknown or misspelled key fails the build instead of being silently dropped.
const productLines = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/product-lines' }),
  schema: ({ image }) =>
    z.strictObject({
      title: nonEmptyText,
      lineBadge: nonEmptyText,
      description: nonEmptyText,
      tags: z.array(nonEmptyText).min(1),
      ctaLabel: nonEmptyText,
      requestType: requestTypeId,
      image: image(),
      imageAlt: nonEmptyText,
      order,
    }),
});

const engineeringServices = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/engineering-services' }),
  schema: z.strictObject({
    title: nonEmptyText,
    icon: z.enum(ICON_NAMES),
    description: nonEmptyText,
    highlight: nonEmptyText,
    order,
  }),
});

export const collections = { productLines, engineeringServices };
