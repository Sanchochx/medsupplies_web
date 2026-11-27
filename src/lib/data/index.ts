// Public entry point of the data access layer: pages and components import from here only.
export { allyImageAlt, getAllies } from './allies';
export type { Ally } from './allies';
export {
  getCompanyInfo,
  getContactChannels,
  getDivisionBanners,
  getHeroCopy,
  getMapEmbedUrl,
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
  DivisionLineKind,
  DivisionPanel,
  DivisionProductLine,
  DivisionServiceItem,
  DivisionServiceLine,
  HeroCopy,
  MissionVision,
  NavItem,
  SocialLink,
  SocialNetwork,
} from './siteData';
