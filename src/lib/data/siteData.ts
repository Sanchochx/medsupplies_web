/**
 * Single source of site data (D-09, D-10, D-11).
 *
 * PLACEHOLDER CONTENT: every value in this file is sample data — figures, contact details,
 * certification claims and corporate copy have NOT been validated by Medsupplies Ingeniería S.A.S.
 * and must be replaced before going live.
 *
 * Only the data access layer (`src/lib/data/`) and `src/content.config.ts` may import this file;
 * pages and components read it through the accessor functions (enforced by ESLint).
 */
import type { ImageMetadata } from 'astro';
import engineeringImage from '../../assets/images/division_ingenieria.png';
import suppliesImage from '../../assets/images/division_suministros.png';
import hospitalImage from '../../assets/images/divison_hospitalaria.png';
import productLinePlaceholder from '../../assets/images/placeholders/product-line.webp';

/** `/#anchor` hrefs work from any page, not only the home page. */
export type AnchorHref = `/#${string}`;

export interface NavItem {
  label: string;
  href: AnchorHref;
}

export interface LegalLink {
  label: string;
  href: string;
}

export interface CompanyInfo {
  legalName: string;
  description: string;
  /** Small badge shown in the footer. */
  complianceBadge: string;
  /** Intro text of the footer's social links column. */
  socialIntro: string;
  /** Shown in the copyright notice. */
  country: string;
}

/** A phone number shown as `display` and dialled as `e164` (digits with a leading `+`). */
export interface PhoneEntry {
  display: string;
  e164: `+${string}`;
}

export interface ContactData {
  address: string;
  addressNote: string;
  phones: readonly PhoneEntry[];
  emails: readonly string[];
  businessHours: string;
  emergencySupport: string;
}

export type SocialNetwork = 'facebook';

export interface SocialLink {
  network: SocialNetwork;
  /** Accessible name of the icon-only link. */
  label: string;
  /** External profile or chat: the footer opens it in a new tab so the visitor keeps the site. */
  href: string;
}

export interface MissionVision {
  mission: string;
  vision: string;
}

export interface HeroCopy {
  microSpecs: readonly string[];
}

/** Side of the banner the text block sits on; the dark overlay follows it. */
export type BannerTextSide = 'left' | 'right';

/**
 * A product (or service) line shown in a division's expandable panel. To replace the placeholder
 * content, edit the strings and point `image` at the real photo (square, 1:1, transparent or
 * white background works best because the tile shows it with `object-fit: contain`).
 */
export interface DivisionLine {
  /** Code slug, unique across all divisions; used for element ids. */
  id: string;
  /** Short pill above the title, e.g. "Línea 01" (shown uppercase). */
  label: string;
  title: string;
  /** Decorative product photo (rendered with `alt=""`; the line title names it). */
  image: ImageMetadata;
  /** Product or service names, in display order. Names only, no descriptions. */
  items: readonly string[];
}

/** Full-width image banner of the "Divisiones" section (anchor `#productos`). */
export interface DivisionBanner {
  /** Code slug, unique per division; used for element ids and the toggle script. */
  id: string;
  title: string;
  /** Decorative background photo (rendered with `alt=""`). */
  image: ImageMetadata;
  /** CSS `object-position` that keeps the photo's subject inside the short banner crop. */
  imagePosition: string;
  textSide: BannerTextSide;
  /** Content of the panel that expands below the banner. */
  lines: readonly DivisionLine[];
}

export interface SiteData {
  company: CompanyInfo;
  navItems: readonly NavItem[];
  legalLinks: readonly LegalLink[];
  contact: ContactData;
  /** International format, digits only, no `+` (as `wa.me` expects). */
  whatsAppNumber: string;
  socialLinks: readonly SocialLink[];
  missionVision: MissionVision;
  hero: HeroCopy;
  /** Visible title of the "Divisiones" section, shown above the banners. */
  divisionsHeading: string;
  divisionBanners: readonly DivisionBanner[];
}

export const SITE_DATA: SiteData = {
  company: {
    legalName: 'Medsupplies Ingeniería S.A.S.',
    description:
      'Soluciones avanzadas en tecnología biomédica, dotación hospitalaria y soporte técnico especializado, con altos estándares de calidad y rigor institucional.',
    complianceBadge: 'Operamos bajo normativa INVIMA',
    socialIntro:
      'Conéctese con nuestro equipo técnico y de ingeniería a través de los canales oficiales.',
    country: 'Colombia',
  },
  navItems: [
    { label: 'Inicio', href: '/#inicio' },
    { label: 'Nosotros', href: '/#nosotros' },
    { label: 'Productos', href: '/#productos' },
    { label: 'Ingeniería', href: '/#ingenieria' },
    { label: 'Contacto', href: '/#contacto' },
  ],
  legalLinks: [
    { label: 'Política de Tratamiento de Datos Personales', href: '/politica-de-privacidad' },
    { label: 'Cumplimiento Normativo INVIMA', href: '#' },
  ],
  contact: {
    address: 'Sede principal: Tunja, Boyacá',
    addressNote: 'Envíos y cobertura a nivel nacional',
    phones: [{ display: '+57 3114472353', e164: '+573114472353' }],
    emails: ['contacto@example.com', 'cotizaciones@example.com'],
    businessHours: 'Lunes a viernes: 7:30 a. m. – 5:30 p. m.',
    emergencySupport: 'Soporte de ingeniería 24/7 para emergencias clínicas',
  },
  whatsAppNumber: '573114472353',
  socialLinks: [
    {
      network: 'facebook',
      label: 'Medsupplies en Facebook (abre Facebook en una pestaña nueva)',
      href: 'https://www.facebook.com/100064867987295/about/',
    },
  ],
  missionVision: {
    mission:
      'Para el año 2028 seremos una empresa competitiva y sostenible, generando 10 empleos directos y con una participación del 8% del mercado regional.',
    vision:
      'Entregar a la mano productos y servicios con los estándares de la calidad total, a precios tan competitivos que harán más fácil la vida de nuestros clientes.',
  },
  hero: {
    microSpecs: ['Regulación Sanitaria INVIMA', 'Trazabilidad y Cadena de Frío'],
  },

  divisionsHeading: 'Organización Integral de Servicios',
  divisionBanners: [
    {
      id: 'hospital',
      title: 'División Hospitalaria',
      image: hospitalImage,
      imagePosition: '55% 42%',
      textSide: 'left',
      lines: [
        {
          id: 'hospital-line-1',
          label: 'Línea 01',
          title: 'Línea de productos de ejemplo A',
          image: productLinePlaceholder,
          items: [
            'Producto de ejemplo 1',
            'Producto de ejemplo 2 con un nombre bastante más largo',
            'Producto de ejemplo 3',
            'Producto de ejemplo 4 de nombre medio',
            'Producto 5',
            'Producto de ejemplo 6 con nombre largo para probar el ajuste',
            'Producto de ejemplo 7',
            'Producto de ejemplo 8',
          ],
        },
        {
          id: 'hospital-line-2',
          label: 'Línea 02',
          title: 'Línea de productos de ejemplo B',
          image: productLinePlaceholder,
          items: [
            'Producto de ejemplo 1',
            'Producto 2',
            'Producto de ejemplo 3 con un nombre que ocupa dos líneas',
            'Producto de ejemplo 4',
            'Producto de ejemplo 5 de nombre medio',
            'Producto de ejemplo 6',
            'Producto de ejemplo 7 con un nombre bastante más largo',
            'Producto de ejemplo 8',
            'Producto de ejemplo 9',
          ],
        },
      ],
    },
    {
      id: 'supplies',
      title: 'División Suministros',
      image: suppliesImage,
      imagePosition: '70% 50%',
      textSide: 'right',
      lines: [
        {
          id: 'supplies-line-1',
          label: 'Línea 01',
          title: 'Línea de suministros de ejemplo A',
          image: productLinePlaceholder,
          items: [
            'Producto de ejemplo 1',
            'Producto de ejemplo 2 de nombre medio',
            'Producto 3',
            'Producto de ejemplo 4 con un nombre bastante más largo',
            'Producto de ejemplo 5',
            'Producto de ejemplo 6',
            'Producto de ejemplo 7',
          ],
        },
        {
          id: 'supplies-line-2',
          label: 'Línea 02',
          title: 'Línea de suministros de ejemplo B',
          image: productLinePlaceholder,
          items: [
            'Producto de ejemplo 1',
            'Producto de ejemplo 2',
            'Producto de ejemplo 3 con nombre largo para probar el ajuste',
            'Producto 4',
            'Producto de ejemplo 5 de nombre medio',
            'Producto de ejemplo 6',
          ],
        },
      ],
    },
    {
      id: 'engineering',
      title: 'División Ingeniería',
      image: engineeringImage,
      imagePosition: '75% 28%',
      textSide: 'left',
      lines: [
        {
          id: 'engineering-line-1',
          label: 'Línea 01',
          title: 'Línea de servicios de ejemplo',
          image: productLinePlaceholder,
          items: [
            'Servicio de ejemplo 1',
            'Servicio de ejemplo 2 con un nombre bastante más largo',
            'Servicio 3',
            'Servicio de ejemplo 4 de nombre medio',
            'Servicio de ejemplo 5',
            'Servicio de ejemplo 6 con nombre largo para probar el ajuste',
            'Servicio de ejemplo 7',
          ],
        },
      ],
    },
  ],
};
