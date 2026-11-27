import { describe, expect, it } from 'vitest';
import { getDivisionBanners, type DivisionPanel } from '../../../src/lib/data';

function suppliesPanel(): DivisionPanel {
  const panel = getDivisionBanners().find(({ id }) => id === 'supplies')?.panel;
  if (!panel) throw new Error('The supplies division has no panel');
  return panel;
}

describe('supplies division panel data', () => {
  it('gives hospital and supplies a panel; engineering stays static', () => {
    expect(getDivisionBanners().map(({ panel }) => panel !== undefined)).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('has the 2 catalog lines, as products, with these tabs and titles, in order', () => {
    const { lines } = suppliesPanel();

    expect(lines.map(({ kind }) => kind)).toEqual(['products', 'products']);
    expect(lines.map(({ tabLabel }) => tabLabel)).toEqual([
      'Aseo y limpieza',
      'Desechables biodegradables',
    ]);
    expect(lines.map(({ title }) => title)).toEqual([
      'Productos líquidos y elementos para el aseo institucional y el hogar',
      'Desechables ecológicos y biodegradables',
    ]);
    expect(new Set(lines.map(({ id }) => id)).size).toBe(lines.length);
  });

  it('lists the catalog items of each line, in order, keeping brand names as written', () => {
    const [cleaning, disposables] = suppliesPanel().lines;

    expect(cleaning?.items).toEqual([
      'Gel antibacterial',
      'Desengrasante',
      'Blanqueador',
      'Ambientador',
      'Limpiavidrios',
      'Jabón líquido Maxi Rey',
      'Detergente líquido para ropa',
      'Jabón líquido para manos (con aroma y neutro)',
      'Jabón de loza',
      'Varsol',
      'Cera autobrillante',
    ]);
    expect(disposables?.items).toEqual([
      'Portacomidas',
      'Cubiertos y pinchos',
      'Bowls',
      'Ecotazones',
      'Platos y bandejas',
      'Vasos y pitillos',
      'Mezcladores',
      'Bolsas y cajas',
    ]);
  });

  it('puts the INVIMA badge only on the cleaning line', () => {
    expect(suppliesPanel().lines.map(({ badge }) => badge)).toEqual([
      'Productos certificados y con registro INVIMA',
      undefined,
    ]);
  });

  it('puts the catalog description only on the disposables line', () => {
    expect(suppliesPanel().lines.map(({ description }) => description)).toEqual([
      undefined,
      'Provienen de recursos naturales renovables. Reducen las emisiones de CO2, generando en su fabricación y en su disposición final un mejor impacto ambiental que otros envases.',
    ]);
  });

  it('has its own loop of 7 photos, separate from the hospital division', () => {
    const { images, lines } = suppliesPanel();
    const hospital = getDivisionBanners().find(({ id }) => id === 'hospital')?.panel;
    const hospitalSources = new Set(hospital?.images.map(({ src }) => src));

    expect(images).toHaveLength(7);
    for (const image of images) {
      expect(image.format).toBe('webp');
      expect(hospitalSources.has(image.src)).toBe(false);
    }
    for (const line of lines) expect(line).not.toHaveProperty('images');
  });
});
