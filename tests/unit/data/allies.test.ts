import type { ImageMetadata } from 'astro';
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allyImageAlt, getAllies } from '../../../src/lib/data';
import { buildAllies } from '../../../src/lib/data/allies';

const ALLY_IMAGE_DIR = new URL('../../../src/assets/images/aliados/', import.meta.url);

function fakeImage(src: string): { default: ImageMetadata } {
  return { default: { src, width: 300, height: 200, format: 'png' } };
}

describe('buildAllies', () => {
  it('sorts the images in natural numeric order, not lexicographic', () => {
    const allies = buildAllies({
      '/aliados/aliado_10.png': fakeImage('ten'),
      '/aliados/aliado_2.png': fakeImage('two'),
      '/aliados/aliado_1.png': fakeImage('one'),
      '/aliados/aliado_11.webp': fakeImage('eleven'),
    });

    expect(allies.map(({ id }) => id)).toEqual(['ally-1', 'ally-2', 'ally-10', 'ally-11']);
    expect(allies.map(({ image }) => image.src)).toEqual(['one', 'two', 'ten', 'eleven']);
  });

  it('leaves every name empty until the company names are provided', () => {
    const allies = buildAllies({ '/aliados/aliado_1.png': fakeImage('one') });

    expect(allies).toEqual([{ id: 'ally-1', name: '', image: expect.anything() }]);
  });

  it('rejects an image whose file name does not end in a number', () => {
    expect(() => buildAllies({ '/aliados/logo.png': fakeImage('logo') })).toThrow(
      /must end in a number/,
    );
  });
});

describe('getAllies', () => {
  it('returns one ally per numbered image in the folder, in natural order', () => {
    const numbers = readdirSync(ALLY_IMAGE_DIR)
      .map((file) => /(\d+)\.(png|jpe?g|webp|avif)$/i.exec(file)?.[1])
      .filter((number): number is string => number !== undefined)
      .map(Number)
      .sort((a, b) => a - b);

    expect(numbers.length).toBeGreaterThan(0);
    expect(getAllies().map(({ id }) => id)).toEqual(numbers.map((number) => `ally-${number}`));
  });
});

describe('allyImageAlt', () => {
  it('numbers the logo while the name is empty', () => {
    expect(allyImageAlt({ name: '' }, 0)).toBe('Logo del aliado 1');
    expect(allyImageAlt({ name: '   ' }, 9)).toBe('Logo del aliado 10');
  });

  it('uses the company name once it exists', () => {
    expect(allyImageAlt({ name: 'B. Braun' }, 14)).toBe('Logo de B. Braun');
  });
});
