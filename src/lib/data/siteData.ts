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

/** Sub-service listed inside a division card. */
export interface DivisionItem {
  icon: IconName;
  title: string;
  text: string;
}

export interface ServiceDivision {
  /** Small uppercase label above the title, e.g. "DIVISIÓN 01". */
  label: string;
  title: string;
  icon: IconName;
  description: string;
  items: readonly DivisionItem[];
  /** Footer link text. */
  footerLabel: string;
  href: AnchorHref;
}

export interface ServiceOrganization {
  heading: string;
  lead: string;
  /** Screen-reader-only suffix of the division footer links, which all lead to the contact section. */
  linkHint: string;
  divisions: readonly ServiceDivision[];
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
  serviceOrganization: ServiceOrganization;
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
      'Para el año 2028 seremos una empresa competitiva y sostenible, generando 10 empleos directos y con una participación del 8% del mercado regional.',
    vision:
      'Entregar a la mano productos y servicios con los estándares de la calidad total, a precios tan competitivos que harán más fácil la vida de nuestros clientes.',
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
  serviceOrganization: {
    heading: 'Organización Integral de Servicios',
    lead: 'Arquitectura operativa articulada para responder a las exigencias industriales, asistenciales e institucionales con rigor técnico y certificación.',
    linkHint: '(ir a contacto)',
    divisions: [
      {
        label: 'DIVISIÓN 01',
        title: 'Ingeniería',
        icon: 'precision-manufacturing',
        description:
          'Optimización y gestión técnica especializada orientada al sector productivo y normas de calidad.',
        items: [
          {
            icon: 'verified',
            title: 'Programas de Gestión de Calidad',
            text: 'Estrategias y estándares adaptados para MIPYMES',
          },
          {
            icon: 'build',
            title: 'Mantenimiento Industrial',
            text: 'Rutinas preventivas, operativas y predictivas',
          },
          {
            icon: 'recycling',
            title: 'Gestión Integral de Residuos',
            text: "Implementación de metodología 5'S y sostenibilidad",
          },
        ],
        footerLabel: 'Línea de productos',
        href: '/#contacto',
      },
      {
        label: 'DIVISIÓN 02',
        title: 'Hospitalaria',
        icon: 'local-hospital',
        description:
          'Soluciones biomédicas y farmacológicas de alto impacto para la red de salud pública y privada.',
        items: [
          {
            icon: 'medical-services',
            title: 'Cadena Integral de Suministros',
            text: 'Medicamentos, ortopédicos, equipos, insumos y dispositivos',
          },
          {
            icon: 'monitor-heart',
            title: 'Mantenimiento Biomédico',
            text: 'Calibración, metrología y tecnovigilancia certificada',
          },
        ],
        footerLabel: 'Línea de productos',
        href: '/#contacto',
      },
      {
        label: 'DIVISIÓN 03',
        title: 'Suministros',
        icon: 'household-supplies',
        description:
          'Higiene, asepsia e insumos químicos especializados para entornos institucionales y domésticos.',
        items: [
          {
            icon: 'sanitizer',
            title: 'Productos Líquidos de Limpieza',
            text: 'Desinfectantes clínicos, detergentes y formulaciones especializadas',
          },
          {
            icon: 'home-and-garden',
            title: 'Elementos de Aseo Institucional y Hogar',
            text: 'Dotación para empresas, plantas clínicas y uso residencial',
          },
        ],
        footerLabel: 'Línea de productos',
        href: '/#contacto',
      },
    ],
  },
};
