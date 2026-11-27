import {
  SITE_DATA,
  type CompanyInfo,
  type DivisionBanner,
  type HeroCopy,
  type LegalLink,
  type MissionVision,
  type NavItem,
  type SocialLink,
} from './siteData';

export interface ContactLink {
  label: string;
  href: `tel:${string}` | `mailto:${string}`;
}

export interface ContactChannels {
  address: { text: string; note: string };
  phones: readonly ContactLink[];
  emails: readonly ContactLink[];
  hours: { text: string; note: string };
}

// wa.me requires the full international number as digits only (E.164 without the `+`).
const WHATSAPP_NUMBER_PATTERN = /^\d{8,15}$/;

export function getCompanyInfo(): CompanyInfo {
  return SITE_DATA.company;
}

export function getNavItems(): readonly NavItem[] {
  return SITE_DATA.navItems;
}

export function getLegalLinks(): readonly LegalLink[] {
  return SITE_DATA.legalLinks;
}

export function getContactChannels(): ContactChannels {
  const { address, addressNote, phones, emails, businessHours, emergencySupport } =
    SITE_DATA.contact;
  return {
    address: { text: address, note: addressNote },
    phones: phones.map(({ display, e164 }) => ({ label: display, href: `tel:${e164}` })),
    emails: emails.map((email) => ({ label: email, href: `mailto:${email}` })),
    hours: { text: businessHours, note: emergencySupport },
  };
}

export function getSocialLinks(): readonly SocialLink[] {
  return SITE_DATA.socialLinks;
}

/** Builds the `wa.me` chat URL; throws (failing the build) if the configured number is malformed. */
export function getWhatsAppUrl(number: string = SITE_DATA.whatsAppNumber): string {
  if (!WHATSAPP_NUMBER_PATTERN.test(number)) {
    throw new Error(
      `Invalid WhatsApp number "${number}": expected 8–15 digits in international format, without "+".`,
    );
  }
  return `https://wa.me/${number}`;
}

export function getMissionVision(): MissionVision {
  return SITE_DATA.missionVision;
}

export function getHeroCopy(): HeroCopy {
  return SITE_DATA.hero;
}

export function getDivisionsHeading(): string {
  return SITE_DATA.divisionsHeading;
}

/** The three division banners, in display order. */
export function getDivisionBanners(): readonly DivisionBanner[] {
  return SITE_DATA.divisionBanners;
}
