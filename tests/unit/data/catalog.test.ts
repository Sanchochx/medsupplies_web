import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEngineeringServices } from '../../../src/lib/data';

const { getCollection } = vi.hoisted(() => ({ getCollection: vi.fn() }));
vi.mock('astro:content', () => ({ getCollection }));

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
