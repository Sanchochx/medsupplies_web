import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEngineeringServices, getProductLines } from '../../../src/lib/data';

const { getCollection } = vi.hoisted(() => ({ getCollection: vi.fn() }));
vi.mock('astro:content', () => ({ getCollection }));

const IMAGE = { src: '/placeholder.webp', width: 800, height: 448, format: 'webp' } as const;

function productEntry(id: string, order: number) {
  return {
    id,
    collection: 'productLines',
    data: {
      title: `Title ${id}`,
      lineBadge: 'Line',
      description: 'Description',
      tags: ['Tag'],
      ctaLabel: 'CTA',
      requestType: id,
      image: IMAGE,
      imageAlt: 'Alt',
      order,
    },
  };
}

function serviceEntry(id: string, order: number) {
  return {
    id,
    collection: 'engineeringServices',
    data: { title: `Title ${id}`, icon: 'build', description: 'Text', highlight: 'Note', order },
  };
}

beforeEach(() => {
  getCollection.mockReset();
});

describe('getProductLines', () => {
  it('reads the productLines collection and returns the lines sorted by order', async () => {
    getCollection.mockResolvedValue([
      productEntry('surgical-supplies', 3),
      productEntry('medical-devices', 1),
      productEntry('pharmaceuticals', 2),
    ]);

    const lines = await getProductLines();

    expect(getCollection).toHaveBeenCalledWith('productLines');
    expect(lines.map(({ id }) => id)).toEqual([
      'medical-devices',
      'pharmaceuticals',
      'surgical-supplies',
    ]);
  });

  it('flattens each entry into a domain object with its id', async () => {
    getCollection.mockResolvedValue([productEntry('medical-devices', 1)]);

    const [line] = await getProductLines();

    expect(line).toEqual({ id: 'medical-devices', ...productEntry('medical-devices', 1).data });
  });
});

describe('getEngineeringServices', () => {
  it('reads the engineeringServices collection and returns the services sorted by order', async () => {
    getCollection.mockResolvedValue([
      serviceEntry('training', 4),
      serviceEntry('maintenance', 1),
      serviceEntry('advisory', 3),
      serviceEntry('calibration', 2),
    ]);

    const services = await getEngineeringServices();

    expect(getCollection).toHaveBeenCalledWith('engineeringServices');
    expect(services.map(({ id }) => id)).toEqual([
      'maintenance',
      'calibration',
      'advisory',
      'training',
    ]);
  });
});
