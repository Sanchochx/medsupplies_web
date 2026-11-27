import type { ImageMetadata } from 'astro';

/** A partner company of the "Nuestros Aliados" section. */
export interface Ally {
  /** Code slug, from the image's file number (`aliado_7.png` → `ally-7`). */
  id: string;
  /** Company name; empty until the names are provided, which switches the `alt` text. */
  name: string;
  image: ImageMetadata;
}

type ImageModules = Record<string, { default: ImageMetadata }>;

// Eager glob: adding or removing a numbered file updates the list without touching code.
const ALLY_IMAGE_MODULES: ImageModules = import.meta.glob<{ default: ImageMetadata }>(
  '../../assets/images/aliados/*.{png,jpg,jpeg,webp,avif}',
  { eager: true },
);

const FILE_NUMBER_PATTERN = /(\d+)\.[a-z]+$/i;

function fileNumber(path: string): number {
  const match = FILE_NUMBER_PATTERN.exec(path);
  if (!match?.[1]) {
    throw new Error(`Ally image "${path}" must end in a number (e.g. "aliado_1.png").`);
  }
  return Number(match[1]);
}

/** Builds the ally list from image modules, in natural numeric order (1, 2, … 10, not 1, 10, 2). */
export function buildAllies(modules: ImageModules): Ally[] {
  return Object.entries(modules)
    .map(([path, module]) => ({ number: fileNumber(path), image: module.default }))
    .sort((a, b) => a.number - b.number)
    .map(({ number, image }) => ({ id: `ally-${number}`, name: '', image }));
}

const ALLIES: readonly Ally[] = buildAllies(ALLY_IMAGE_MODULES);

/** Allies in display order. */
export function getAllies(): readonly Ally[] {
  return ALLIES;
}

/** `alt` text of the ally at the 0-based `index`. */
export function allyImageAlt(ally: Pick<Ally, 'name'>, index: number): string {
  const name = ally.name.trim();
  return name ? `Logo de ${name}` : `Logo del aliado ${index + 1}`;
}
