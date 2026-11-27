import { getCollection } from 'astro:content';
import type { IconName } from '../../components/ui/iconNames';

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

/** Engineering services, in display order. */
export async function getEngineeringServices(): Promise<EngineeringService[]> {
  const entries = await getCollection('engineeringServices');
  return entries.map(({ id, data }) => ({ id, ...data })).sort(byOrder);
}
