import type { ImageMetadata } from 'astro';
import { getCollection } from 'astro:content';
import type { IconName } from '../../components/ui/iconNames';
import type { RequestTypeId } from './siteData';

export interface ProductLine {
  id: string;
  title: string;
  lineBadge: string;
  description: string;
  tags: readonly string[];
  ctaLabel: string;
  requestType: RequestTypeId;
  image: ImageMetadata;
  imageAlt: string;
  order: number;
}

export interface EngineeringService {
  id: string;
  title: string;
  icon: IconName;
  description: string;
  highlight: string;
  order: number;
}

function byOrder<T extends { order: number }>(a: T, b: T): number {
  return a.order - b.order;
}

/** Product lines, in display order. */
export async function getProductLines(): Promise<ProductLine[]> {
  const entries = await getCollection('productLines');
  return entries.map(({ id, data }) => ({ id, ...data })).sort(byOrder);
}

/** Engineering services, in display order. */
export async function getEngineeringServices(): Promise<EngineeringService[]> {
  const entries = await getCollection('engineeringServices');
  return entries.map(({ id, data }) => ({ id, ...data })).sort(byOrder);
}
