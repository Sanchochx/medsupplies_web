// Turns the product photos of the company catalog into the blue-and-white WebP files shown in the
// division panels' photo tiles. Run with `npm run images:prepare`.
//
// INPUT: the raw images of "Catálogo virtual MEDSUPPLIES & INGENIERÍA.pptx", unzipped into the
// gitignored `scratch/catalog/pptx/` folder (`unzip <catalog>.pptx -d scratch/catalog/pptx`); the
// script reads `scratch/catalog/pptx/ppt/media/`. The originals are never committed.
// OUTPUT: `src/assets/images/products/<division>/<line-id>/NN.webp`, numbered in MANIFEST order.
// The line folders only record which catalog line a photo comes from: the site shows all of a
// division's photos together, in one loop (`images` of the division panel).
//
// Deterministic and idempotent: the same input gives byte-identical files, and every managed line
// folder is cleared of stale `NN.webp` files before writing.
import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const MEDIA_DIR = fileURLToPath(new URL('../scratch/catalog/pptx/ppt/media/', import.meta.url));
const OUTPUT_DIR = fileURLToPath(new URL('../src/assets/images/products/', import.meta.url));
const TOKENS_FILE = fileURLToPath(new URL('../src/styles/global.css', import.meta.url));

/** Longest side of the output, in px. Sources are smaller, so this only guards future ones. */
const MAX_SIZE = 1200;
const WEBP_OPTIONS = { quality: 82, effort: 6, smartSubsample: true };

/**
 * DUOTONE GRADIENT. Luminance (0 = black, 1 = white, after contrast normalisation) is mapped
 * through three stops taken from the design tokens, the same blues as the division banners:
 *   0           → `--color-inverse-surface` (navy #213145)
 *   MID_STOP    → `--color-primary` (brand blue #0057cd)
 *   WHITE_FROM+ → pure white, so the photos' near-white backgrounds merge into the white tile.
 */
const DARK_TOKEN = '--color-inverse-surface';
const MID_TOKEN = '--color-primary';
const MID_STOP = 0.45;
const WHITE_FROM = 0.93;

/**
 * Selected catalog images, in display order per line (catalog reading order). `crop` repeats the
 * crop the slide applies to the picture (`a:srcRect`, fractions cut from each side).
 * Excluded: the brand footer repeated on every slide, the full-width banner of slide 12, images
 * whose alt text points to an external URL or file path, and slide 12 (biomedical maintenance, not on the site).
 */
const MANIFEST = [
  // Hospitalaria (slides 6–11)
  { source: 'image27.jpeg', slide: 6, division: 'hospital', line: 'infusion' },
  { source: 'image25.jpeg', slide: 6, division: 'hospital', line: 'infusion' },
  { source: 'image26.jpeg', slide: 6, division: 'hospital', line: 'respiratory' },
  { source: 'image24.jpeg', slide: 6, division: 'hospital', line: 'respiratory' },
  { source: 'image23.jpeg', slide: 6, division: 'hospital', line: 'respiratory' },
  { source: 'image32.jpeg', slide: 7, division: 'hospital', line: 'anesthesia' },
  { source: 'image28.jpeg', slide: 7, division: 'hospital', line: 'anesthesia' },
  {
    source: 'image29.jpg',
    slide: 7,
    division: 'hospital',
    line: 'gynecology',
    crop: { t: 0.12332, b: 0.13064 },
  },
  {
    source: 'image31.png',
    slide: 7,
    division: 'hospital',
    line: 'monitoring',
    crop: { l: 0.66554, t: 0.28299, r: 0.1276, b: 0.49293 },
  },
  {
    source: 'image30.jpeg',
    slide: 7,
    division: 'hospital',
    line: 'monitoring',
    crop: { l: 0.20661, r: 0.18498 },
  },
  {
    source: 'image38.png',
    slide: 8,
    division: 'hospital',
    line: 'dressings',
    crop: { l: 0.61622, t: 0.19485, r: 0.09599, b: 0.47047 },
  },
  {
    source: 'image37.png',
    slide: 8,
    division: 'hospital',
    line: 'dressings',
    crop: { l: 0.69823, t: 0.32734, r: 0.15715, b: 0.2525 },
  },
  {
    source: 'image36.jpeg',
    slide: 8,
    division: 'hospital',
    line: 'drainage',
    crop: { t: 0.13435, b: 0.14443 },
  },
  { source: 'image33.jpeg', slide: 8, division: 'hospital', line: 'drainage' },
  { source: 'image39.jpg', slide: 9, division: 'hospital', line: 'injection' },
  { source: 'image40.jpeg', slide: 9, division: 'hospital', line: 'injection' },
  {
    source: 'image43.png',
    slide: 9,
    division: 'hospital',
    line: 'injection',
    crop: { l: 0.61748, t: 0.2438, r: 0.11456, b: 0.25887 },
  },
  { source: 'image41.jpeg', slide: 9, division: 'hospital', line: 'injection' },
  {
    source: 'image44.png',
    slide: 9,
    division: 'hospital',
    line: 'protection',
    crop: { l: 0.61999, t: 0.19841, r: 0.09223, b: 0.50628 },
  },
  {
    source: 'image45.png',
    slide: 9,
    division: 'hospital',
    line: 'protection',
    crop: { l: 0.62343, t: 0.19766, r: 0.09788, b: 0.43786 },
  },
  { source: 'image42.jpg', slide: 9, division: 'hospital', line: 'protection' },
  {
    source: 'image46.jpg',
    slide: 9,
    division: 'hospital',
    line: 'protection',
    crop: { t: 0.29001, b: 0.26666 },
  },
  {
    source: 'image47.png',
    slide: 10,
    division: 'hospital',
    line: 'laboratory',
    crop: { l: 0.22329, t: 0.27358, r: 0.48893, b: 0.13579 },
  },
  {
    source: 'image48.png',
    slide: 10,
    division: 'hospital',
    line: 'laboratory',
    crop: { l: 0.6633, t: 0.19919, r: 0.13381, b: 0.53568 },
  },
  {
    source: 'image49.png',
    slide: 10,
    division: 'hospital',
    line: 'laboratory',
    crop: { l: 0.53669, t: 0.26467, r: 0.04855, b: 0.40037 },
  },
  {
    source: 'image50.png',
    slide: 10,
    division: 'hospital',
    line: 'laboratory',
    crop: { l: 0.57681, t: 0.26694, r: 0.05649, b: 0.38121 },
  },
  {
    source: 'image57.png',
    slide: 11,
    division: 'hospital',
    line: 'dentistry',
    crop: { l: 0.47719 },
  },
  { source: 'image55.jpeg', slide: 11, division: 'hospital', line: 'dentistry' },
  { source: 'image56.jpg', slide: 11, division: 'hospital', line: 'dentistry' },
  { source: 'image54.jpg', slide: 11, division: 'hospital', line: 'dentistry' },

  // Suministros (slides 13–14)
  {
    source: 'image65.jpg',
    slide: 13,
    division: 'supplies',
    line: 'cleaning-products',
    crop: { l: 0.4118, r: 0.13461 },
  },
  {
    source: 'image61.jpeg',
    slide: 13,
    division: 'supplies',
    line: 'cleaning-products',
    crop: { t: 0.05316 },
  },
  {
    source: 'image63.jpeg',
    slide: 13,
    division: 'supplies',
    line: 'cleaning-products',
    crop: { t: 0.0713 },
  },
  { source: 'image62.jpeg', slide: 13, division: 'supplies', line: 'cleaning-products' },
  {
    source: 'image64.jpeg',
    slide: 13,
    division: 'supplies',
    line: 'cleaning-products',
    crop: { t: 0.10311 },
  },
  { source: 'image67.jpg', slide: 14, division: 'supplies', line: 'biodegradable-disposables' },
  {
    source: 'image66.jpg',
    slide: 14,
    division: 'supplies',
    line: 'biodegradable-disposables',
    crop: { b: 0.12368 },
  },
];

/** Reads a `#rrggbb` color token from the `@theme` block. */
function readToken(css, name) {
  const match = new RegExp(`${name}:\\s*#([0-9a-f]{6})\\b`, 'i').exec(css);
  if (!match) throw new Error(`Color token ${name} not found in ${TOKENS_FILE}`);
  const hex = match[1];
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

const mix = (from, to, t) =>
  from.map((value, channel) => Math.round(value + (to[channel] - value) * t));

/** 256-entry RGB lookup table: luminance → duotone color. */
function buildGradient(dark, mid) {
  const white = [255, 255, 255];
  const table = new Uint8Array(256 * 3);
  for (let level = 0; level < 256; level += 1) {
    const t = level / 255;
    const color =
      t >= WHITE_FROM
        ? white
        : t <= MID_STOP
          ? mix(dark, mid, t / MID_STOP)
          : mix(mid, white, (t - MID_STOP) / (WHITE_FROM - MID_STOP));
    table.set(color, level * 3);
  }
  return table;
}

async function processImage({ source, crop = {} }, gradient, outputFile) {
  const input = sharp(await readFile(`${MEDIA_DIR}${source}`));
  const { width, height } = await input.metadata();
  const left = Math.round(width * (crop.l ?? 0));
  const top = Math.round(height * (crop.t ?? 0));
  const region = {
    left,
    top,
    width: Math.round(width * (1 - (crop.r ?? 0))) - left,
    height: Math.round(height * (1 - (crop.b ?? 0))) - top,
  };

  // Transparent pixels become white first, so cut-outs keep a white background.
  const { data, info } = await input
    .extract(region)
    .flatten({ background: '#ffffff' })
    .resize({ width: MAX_SIZE, height: MAX_SIZE, fit: 'inside', withoutEnlargement: true })
    .grayscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgb = Buffer.alloc(info.width * info.height * 3);
  for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
    const level = data[pixel * info.channels];
    rgb[pixel * 3] = gradient[level * 3];
    rgb[pixel * 3 + 1] = gradient[level * 3 + 1];
    rgb[pixel * 3 + 2] = gradient[level * 3 + 2];
  }

  await sharp(rgb, { raw: { width: info.width, height: info.height, channels: 3 } })
    .webp(WEBP_OPTIONS)
    .toFile(outputFile);
  return { width: info.width, height: info.height };
}

const css = await readFile(TOKENS_FILE, 'utf8');
const gradient = buildGradient(readToken(css, DARK_TOKEN), readToken(css, MID_TOKEN));

const counters = new Map();
const jobs = MANIFEST.map((entry) => {
  const folder = `${entry.division}/${entry.line}`;
  const number = (counters.get(folder) ?? 0) + 1;
  counters.set(folder, number);
  return { entry, folder, file: `${String(number).padStart(2, '0')}.webp` };
});

for (const folder of counters.keys()) {
  const directory = `${OUTPUT_DIR}${folder}/`;
  await mkdir(directory, { recursive: true });
  for (const file of await readdir(directory)) {
    if (/^\d{2}\.webp$/.test(file)) await rm(`${directory}${file}`);
  }
}

for (const { entry, folder, file } of jobs) {
  const { width, height } = await processImage(entry, gradient, `${OUTPUT_DIR}${folder}/${file}`);
  process.stdout.write(
    `${entry.source} (slide ${entry.slide}) -> products/${folder}/${file} ${width}x${height}\n`,
  );
}
process.stdout.write(`Prepared ${jobs.length} images in ${counters.size} lines.\n`);
