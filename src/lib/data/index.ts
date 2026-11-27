// Public entry point of the data access layer: pages and components import from here only.
export { getEngineeringServices } from './catalog';
export type { EngineeringService } from './catalog';
export {
  getCompanyInfo,
  getContactChannels,
  getDivisionBanners,
  getDivisionsHeading,
  getHeroCopy,
  getLegalLinks,
  getMissionVision,
  getNavItems,
  getSocialLinks,
  getWhatsAppUrl,
} from './site';
export type { ContactChannels, ContactLink } from './site';
export type {
  AnchorHref,
  BannerTextSide,
  CompanyInfo,
  DivisionBanner,
  DivisionLine,
  HeroCopy,
  LegalLink,
  MissionVision,
  NavItem,
  SocialLink,
  SocialNetwork,
} from './siteData';
