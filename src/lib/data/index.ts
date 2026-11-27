// Public entry point of the data access layer: pages and components import from here only.
export { getEngineeringServices, getProductLines } from './catalog';
export type { EngineeringService, ProductLine } from './catalog';
export {
  getCompanyInfo,
  getContactChannels,
  getHeroCopy,
  getLegalLinks,
  getMissionVision,
  getNavItems,
  getServiceOrganization,
  getSocialLinks,
  getWhatsAppUrl,
  getWhyUsPillars,
} from './site';
export type { ContactChannels, ContactLink } from './site';
export type {
  AnchorHref,
  CompanyInfo,
  DivisionItem,
  HeroCopy,
  Highlight,
  LegalLink,
  MissionVision,
  NavItem,
  ServiceDivision,
  ServiceOrganization,
  SocialLink,
  SocialNetwork,
} from './siteData';
