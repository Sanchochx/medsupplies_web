// Public entry point of the data access layer: pages and components import from here only.
export { getEngineeringServices, getProductLines } from './catalog';
export type { EngineeringService, ProductLine } from './catalog';
export {
  getCompanyInfo,
  getConsentNotice,
  getContactChannels,
  getHeroCopy,
  getLegalLinks,
  getMetrics,
  getMissionVision,
  getNavItems,
  getRequestTypes,
  getSocialLinks,
  getTrustBadges,
  getWhatsAppUrl,
  getWhyUsPillars,
} from './site';
export type { ConsentNotice, ContactChannels, ContactLink } from './site';
export type {
  AnchorHref,
  CompanyInfo,
  ConsentCopy,
  HeroCopy,
  Highlight,
  LegalLink,
  Metric,
  MissionVision,
  NavItem,
  RequestType,
  RequestTypeId,
  SocialLink,
  SocialNetwork,
} from './siteData';
