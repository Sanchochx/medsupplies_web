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

/** Request categories shared by the product lines, the engineering callout and the form (D-13). */
export const REQUEST_TYPES = [
  { id: 'medical-devices', label: 'Medical Devices & Equipment' },
  { id: 'pharmaceuticals', label: 'Hospital Pharmaceutical Products' },
  { id: 'surgical-supplies', label: 'Medical-Surgical Supplies' },
  { id: 'engineering-services', label: 'Biomedical Engineering & Calibration Services' },
  { id: 'comprehensive-equipment', label: 'Comprehensive Hospital Equipment' },
] as const;

export type RequestTypeId = (typeof REQUEST_TYPES)[number]['id'];

export interface RequestType {
  id: RequestTypeId;
  label: string;
}

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
  wordmark: string;
  wordmarkSuffix: string;
  description: string;
  /** Small badge shown in the footer. */
  complianceBadge: string;
  /** Intro text of the footer's social links column. */
  socialIntro: string;
  /** Shown in the copyright notice. */
  country: string;
}

/**
 * Quote form consent sentence, split around the privacy policy link.
 * PLACEHOLDER (D-08): pending legal review.
 */
export interface ConsentCopy {
  beforeLink: string;
  afterLink: string;
}

export interface Metric {
  value: string;
  label: string;
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

export type SocialNetwork = 'linkedin' | 'instagram';

export interface SocialLink {
  network: SocialNetwork;
  /** Accessible name of the icon-only link. */
  label: string;
  href: string;
}

/** Icon + title + text item used by the hero badges, the trust bar and the "Why Choose Us" pillars. */
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
  badges: readonly Highlight[];
}

export interface SiteData {
  company: CompanyInfo;
  navItems: readonly NavItem[];
  legalLinks: readonly LegalLink[];
  contact: ContactData;
  /** International format, digits only, no `+` (as `wa.me` expects). */
  whatsAppNumber: string;
  metrics: readonly Metric[];
  socialLinks: readonly SocialLink[];
  missionVision: MissionVision;
  hero: HeroCopy;
  trustBadges: readonly Highlight[];
  whyUsPillars: readonly Highlight[];
  consent: ConsentCopy;
}

export const SITE_DATA: SiteData = {
  company: {
    legalName: 'Medsupplies Ingeniería S.A.S.',
    wordmark: 'Medsupplies',
    wordmarkSuffix: 'Ingeniería S.A.S.',
    description:
      'Advanced solutions in biomedical technology, hospital equipment and specialized technical support with high standards of quality and institutional rigor.',
    complianceBadge: 'Operating under INVIMA standards',
    socialIntro: 'Connect with our technical and engineering team through official channels.',
    country: 'Colombia',
  },
  navItems: [
    { label: 'Home', href: '/#home' },
    { label: 'About', href: '/#about' },
    { label: 'Products', href: '/#products' },
    { label: 'Engineering', href: '/#engineering' },
    { label: 'Why Choose Us', href: '/#why-us' },
    { label: 'Contact', href: '/#contact' },
  ],
  legalLinks: [
    { label: 'Personal Data Processing Policy', href: '/privacy-policy' },
    { label: 'INVIMA Regulatory Compliance', href: '#' },
  ],
  contact: {
    address: 'Main office: Bogotá D.C., Colombia',
    addressNote: 'Shipping and coverage nationwide',
    phones: [
      { display: '+57 (601) 000-0000', e164: '+576010000000' },
      { display: '+57 300 000-0000', e164: '+573000000000' },
    ],
    emails: ['contact@example.com', 'quotes@example.com'],
    businessHours: 'Monday to Friday: 7:30 AM – 5:30 PM',
    emergencySupport: '24/7 engineering support for clinical emergencies',
  },
  whatsAppNumber: '573000000000',
  metrics: [
    { value: '+10 Years', label: 'years of experience in the healthcare sector' },
    { value: '+500 Refs.', label: 'medical device and supply references' },
    { value: '99.4%', label: 'cold chain and delivery effectiveness' },
    { value: '24/7', label: 'technical support and engineering backup' },
  ],
  socialLinks: [
    { network: 'linkedin', label: 'Medsupplies on LinkedIn', href: '#' },
    { network: 'instagram', label: 'Medsupplies on Instagram', href: '#' },
  ],
  missionVision: {
    mission:
      'To provide safe and efficient technological and pharmaceutical solutions for healthcare institutions in Colombia, backed by outstanding technical support that ensures the continuity and quality of patient care.',
    vision:
      'To become the preferred strategic partner in distribution and biomedical engineering nationwide, recognized for quality, regulatory compliance and human service across the entire public and private hospital network.',
  },
  hero: {
    microSpecs: ['INVIMA Health Regulation', 'Traceability & Cold Chain'],
    badges: [
      {
        icon: 'health-and-safety',
        title: 'Technical Warranty & Quality',
        text: 'Certified metrology protocols',
      },
      {
        icon: 'ac-unit',
        title: 'Chain of Custody',
        text: 'Continuous temperature monitoring',
      },
    ],
  },
  trustBadges: [
    { icon: 'verified', title: 'Quality Certifications', text: 'INVIMA and ISO compliance' },
    { icon: 'thermostat', title: 'Cold Chain', text: 'Temperature control from 2 °C to 8 °C' },
    { icon: 'upload-file', title: 'Biomedical Advisory', text: 'Dedicated clinical specialists' },
    { icon: 'local-shipping', title: 'Nationwide Coverage', text: 'Shipping across Colombia' },
  ],
  whyUsPillars: [
    {
      icon: 'verified',
      title: 'Rigorous Quality',
      text: 'Exclusive selection of international manufacturers with ISO 13485, CE and FDA certifications, ensuring top-tier clinical supplies.',
    },
    {
      icon: 'policy',
      title: 'Regulatory Compliance',
      text: 'Full alignment with INVIMA health regulations and active reagent vigilance, technovigilance and pharmacovigilance.',
    },
    {
      icon: 'local-shipping',
      title: 'Logistics Efficiency',
      text: 'A distribution network with permanent cold chain control and digital shipment traceability, with full coverage across Colombia.',
    },
    {
      icon: 'precision-manufacturing',
      title: 'Continuous Technical Support',
      text: 'A multidisciplinary team of biomedical engineers with immediate response capacity to ensure continuity of care.',
    },
  ],
  // PLACEHOLDER (D-08): consent wording pending legal review.
  consent: {
    beforeLink: 'I accept the processing of my personal data under the',
    afterLink: 'and authorize Medsupplies Ingeniería S.A.S. to contact me.',
  },
};
