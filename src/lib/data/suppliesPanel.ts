/**
 * Lines of the "División Suministros" panel, taken from slides 13–14 of the company catalog
 * ("Catálogo virtual MEDSUPPLIES & INGENIERÍA"). Wording follows the catalog in sentence case;
 * brand names (Maxi Rey, Varsol) stay as written.
 *
 * Photos: the blue-and-white catalog images from `npm run images:prepare`, all lines together in
 * tab order, shown as one loop for the whole division.
 */
import biodegradableDisposables01 from '../../assets/images/products/supplies/biodegradable-disposables/01.webp';
import biodegradableDisposables02 from '../../assets/images/products/supplies/biodegradable-disposables/02.webp';
import cleaningProducts01 from '../../assets/images/products/supplies/cleaning-products/01.webp';
import cleaningProducts02 from '../../assets/images/products/supplies/cleaning-products/02.webp';
import cleaningProducts03 from '../../assets/images/products/supplies/cleaning-products/03.webp';
import cleaningProducts04 from '../../assets/images/products/supplies/cleaning-products/04.webp';
import cleaningProducts05 from '../../assets/images/products/supplies/cleaning-products/05.webp';
import type { DivisionPanel } from './siteData';

export const SUPPLIES_PANEL: DivisionPanel = {
  lines: [
    {
      id: 'cleaning-products',
      kind: 'products',
      tabLabel: 'Aseo y limpieza',
      title: 'Productos líquidos y elementos para el aseo institucional y el hogar',
      badge: 'Productos certificados y con registro INVIMA',
      items: [
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
      ],
    },
    {
      id: 'biodegradable-disposables',
      kind: 'products',
      tabLabel: 'Desechables biodegradables',
      title: 'Desechables ecológicos y biodegradables',
      description:
        'Provienen de recursos naturales renovables. Reducen las emisiones de CO2, generando en su fabricación y en su disposición final un mejor impacto ambiental que otros envases.',
      items: [
        'Portacomidas',
        'Cubiertos y pinchos',
        'Bowls',
        'Ecotazones',
        'Platos y bandejas',
        'Vasos y pitillos',
        'Mezcladores',
        'Bolsas y cajas',
      ],
    },
  ],
  images: [
    cleaningProducts01,
    cleaningProducts02,
    cleaningProducts03,
    cleaningProducts04,
    cleaningProducts05,
    biodegradableDisposables01,
    biodegradableDisposables02,
  ],
};
