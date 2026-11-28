/**
 * Single source of site data (D-09, D-10, D-11).
 *
 * PLACEHOLDER CONTENT: every value in this file is sample data — figures, contact details,
 * certification claims and corporate copy have NOT been validated by Medsupplies Ingeniería S.A.S.
 * and must be replaced before going live.
 *
 * Only the data access layer (`src/lib/data/`) may import this file;
 * pages and components read it through the accessor functions (enforced by ESLint).
 */
import type { ImageMetadata } from 'astro';
import engineeringImage from '../../assets/images/division_ingenieria.png';
import suppliesImage from '../../assets/images/division_suministros.png';
import hospitalImage from '../../assets/images/divison_hospitalaria.png';
import type { IconName } from '../../components/ui/iconNames';
import { HOSPITAL_PANEL } from './hospitalPanel';
import { SUPPLIES_PANEL } from './suppliesPanel';

/** `/#anchor` hrefs work from any page, not only the home page. */
export type AnchorHref = `/#${string}`;

export interface NavItem {
  label: string;
  href: AnchorHref;
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
  /** Google Maps search query of the location shown in the contact map (an address or a place). */
  mapQuery: string;
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

/** Products get check chips; services get icon chips. */
export type DivisionLineKind = 'products' | 'services';

interface DivisionLineBase {
  /** Code slug, unique within its panel; used for element ids. */
  id: string;
  /** Short name on the line's tab. */
  tabLabel: string;
  title: string;
  /** Short catalog statement shown as a badge under the title (e.g. a certification). */
  badge?: string;
  /** Short paragraph under the title; omitted when the catalog has none. */
  description?: string;
}

/** A product line of a division panel. */
export interface DivisionProductLine extends DivisionLineBase {
  kind: 'products';
  /** Product names, in display order. Names only, no descriptions. */
  items: readonly string[];
  /**
   * Columns of the product list from `sm` up (one column on phones). Defaults to 1; long lists
   * use 2 so the panel does not grow too tall.
   */
  columns?: 1 | 2;
}

export interface DivisionServiceItem {
  name: string;
  /** Decorative icon shown beside the name. */
  icon: IconName;
}

/** A service line (e.g. biomedical maintenance). */
export interface DivisionServiceLine extends DivisionLineBase {
  kind: 'services';
  items: readonly DivisionServiceItem[];
}

export type DivisionLine = DivisionProductLine | DivisionServiceLine;

/** Content of the tabbed panel that expands below a division banner. */
export interface DivisionPanel {
  /** One tab per line, in display order; the "Línea NN" number follows this order. */
  lines: readonly DivisionLine[];
  /**
   * Decorative product photos of the whole division (rendered with `alt=""`: the chips carry the
   * information), shown beside every tab as one endless crossfading loop. Any aspect ratio: they
   * are fitted with `object-fit: contain`. Empty → no photo column. The catalog photos are
   * produced by `npm run images:prepare`.
   */
  images: readonly ImageMetadata[];
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
  /** Expandable panel below the banner. Without it the banner is static: no toggle or chevron. */
  panel?: DivisionPanel;
}

export interface SiteData {
  company: CompanyInfo;
  navItems: readonly NavItem[];
  contact: ContactData;
  /** International format, digits only, no `+` (as `wa.me` expects). */
  whatsAppNumber: string;
  socialLinks: readonly SocialLink[];
  missionVision: MissionVision;
  hero: HeroCopy;
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
    { label: 'Aliados', href: '/#aliados' },
    { label: 'Contacto', href: '/#contacto' },
  ],
  contact: {
    address: 'Sede principal: Tunja, Boyacá',
    addressNote: 'Envíos y cobertura a nivel nacional',
    phones: [{ display: '+57 3114472353', e164: '+573114472353' }],
    emails: ['medsuppliesingenieria@gmail.com'],
    mapQuery: 'Tunja, Boyacá, Colombia',
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
    microSpecs: ['Regulación Sanitaria INVIMA', 'Envíos nacionales a todo Colombia'],
  },

  divisionBanners: [
    {
      id: 'hospital',
      title: 'División Hospitalaria',
      image: hospitalImage,
      imagePosition: '55% 42%',
      textSide: 'left',
      panel: HOSPITAL_PANEL,
    },
    {
      id: 'supplies',
      title: 'División Suministros',
      image: suppliesImage,
      imagePosition: '70% 50%',
      textSide: 'right',
      panel: SUPPLIES_PANEL,
    },
    {
      id: 'engineering',
      title: 'División Ingeniería',
      image: engineeringImage,
      imagePosition: '75% 28%',
      textSide: 'left',
    },
  ],
};
