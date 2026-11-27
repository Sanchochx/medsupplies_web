import { describe, expect, it } from 'vitest';
import { getDivisionBanners, type DivisionPanel } from '../../../src/lib/data';

function hospitalPanel(): DivisionPanel {
  const panel = getDivisionBanners().find(({ id }) => id === 'hospital')?.panel;
  if (!panel) throw new Error('The hospital division has no panel');
  return panel;
}

const itemNames = (panel: DivisionPanel): string[] =>
  panel.lines.flatMap((line) =>
    line.kind === 'products' ? [...line.items] : line.items.map(({ name }) => name),
  );

describe('hospital division panel data', () => {
  it('has the 12 catalog product lines, with these tab labels, in this order', () => {
    expect(hospitalPanel().lines.map(({ tabLabel }) => tabLabel)).toEqual([
      'Infusión',
      'Respiratoria',
      'Anestesia',
      'Ginecología',
      'Monitoreo',
      'Gasas y apósitos',
      'Drenaje y recolección',
      'Inyección y catéteres',
      'Protección',
      'Laboratorio y esterilización',
      'Limpieza',
      'Odontología',
    ]);
  });

  it('uses the catalog line titles in sentence case', () => {
    expect(hospitalPanel().lines.map(({ title }) => title)).toEqual([
      'Línea de infusión',
      'Línea respiratoria',
      'Línea de anestesia',
      'Línea de ginecología',
      'Línea de monitoreo',
      'Línea de gasas, compresas, vendas, cintas, apósitos y esparadrapos',
      'Línea de drenaje y recolección',
      'Guantes, jeringas, agujas y catéter',
      'Línea de protección',
      'Línea de laboratorio, desinfección y esterilización',
      'Línea de limpieza',
      'Línea de odontología',
    ]);
  });

  it('gives every line a unique id and at least one item', () => {
    const { lines } = hospitalPanel();

    expect(new Set(lines.map(({ id }) => id)).size).toBe(lines.length);
    for (const line of lines) expect(line.items.length).toBeGreaterThan(0);
  });

  it('has only product lines: biomedical maintenance is not part of the panel', () => {
    const { lines } = hospitalPanel();

    expect(lines.every(({ kind }) => kind === 'products')).toBe(true);
    expect(lines.map(({ id }) => id)).not.toContain('biomedical-maintenance');
  });

  it('splits entries into one trimmed, sentence-case name per chip, without duplicates in a line', () => {
    for (const line of hospitalPanel().lines) {
      const names = line.kind === 'products' ? line.items : line.items.map(({ name }) => name);
      expect(new Set(names).size).toBe(names.length);
      for (const name of names) {
        expect(name).toBe(name.trim());
        expect(name).not.toMatch(/^[A-ZÁÉÍÓÚÑ\s,]{6,}$/); // Not left in catalog uppercase.
        expect(name).not.toMatch(/…$/);
      }
    }
  });

  it('applies the catalog corrections and splits the first infusion entry as specified', () => {
    const names = itemNames(hospitalPanel());
    const [infusion] = hospitalPanel().lines;

    expect(names).toContain('Kit Venturi');
    expect(names.join(' ')).not.toMatch(/Ventury/i);
    expect(infusion?.items.slice(0, 5)).toEqual([
      'Equipo macro y microgoteo',
      'Equipo de administración de sangre',
      'Equipo pericraneal',
      'Equipo en Y',
      'Extensiones',
    ]);
  });

  it('pools the photos of all its lines into one division loop (30), not per line', () => {
    const { images, lines } = hospitalPanel();

    expect(images).toHaveLength(30);
    expect(new Set(images.map(({ src }) => src)).size).toBe(images.length);
    for (const line of lines) expect(line).not.toHaveProperty('images');
  });

  it('uses processed WebP photos of at most 1200px', () => {
    for (const image of hospitalPanel().images) {
      expect(image.format).toBe('webp');
      expect(Math.max(image.width, image.height)).toBeLessThanOrEqual(1200);
    }
  });
});
