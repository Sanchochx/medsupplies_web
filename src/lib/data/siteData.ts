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
import type { IconName } from '../../components/ui/iconNames';

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

/** Icon + title + text item used by the "Why Choose Us" pillars. */
export interface Highlight {
  icon: IconName;
  title: string;
  text: string;
}

export interface MissionVision {
  mission: string;
  vision: string;
}

export interface HeroCopy {
  microSpecs: readonly string[];
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
  whyUsPillars: readonly Highlight[];
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
    { label: 'Por qué elegirnos', href: '/#por-que-elegirnos' },
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
      'Proveer soluciones tecnológicas y farmacéuticas seguras y eficientes a las instituciones de salud de Colombia, respaldadas por un soporte técnico sobresaliente que garantice la continuidad y la calidad de la atención al paciente.',
    vision:
      'Ser el aliado estratégico preferido en distribución e ingeniería biomédica a nivel nacional, reconocido por su calidad, cumplimiento normativo y servicio humano en toda la red hospitalaria pública y privada.',
  },
  hero: {
    microSpecs: ['Regulación Sanitaria INVIMA', 'Trazabilidad y Cadena de Frío'],
  },
  whyUsPillars: [
    {
      icon: 'verified',
      title: 'Calidad Rigurosa',
      text: 'Selección exclusiva de fabricantes internacionales con certificaciones ISO 13485, CE y FDA, que garantizan insumos clínicos de primer nivel.',
    },
    {
      icon: 'policy',
      title: 'Cumplimiento Normativo',
      text: 'Alineación total con la regulación sanitaria del INVIMA y programas activos de reactivovigilancia, tecnovigilancia y farmacovigilancia.',
    },
    {
      icon: 'local-shipping',
      title: 'Eficiencia Logística',
      text: 'Red de distribución con control permanente de la cadena de frío y trazabilidad digital de envíos, con cobertura total en Colombia.',
    },
    {
      icon: 'precision-manufacturing',
      title: 'Soporte Técnico Continuo',
      text: 'Equipo multidisciplinario de ingenieros biomédicos con capacidad de respuesta inmediata para asegurar la continuidad de la atención.',
    },
  ],
};
