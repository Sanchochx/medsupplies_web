import { describe, expect, it } from 'vitest';
import {
  getConsentNotice,
  getContactChannels,
  getMetrics,
  getNavItems,
  getRequestTypes,
  getSocialLinks,
  getWhatsAppUrl,
} from '../../../src/lib/data';

describe('getWhatsAppUrl', () => {
  it('builds a wa.me URL from the configured number', () => {
    expect(getWhatsAppUrl()).toMatch(/^https:\/\/wa\.me\/\d{8,15}$/);
  });

  it('uses the given international number as is', () => {
    expect(getWhatsAppUrl('573001234567')).toBe('https://wa.me/573001234567');
  });

  it.each(['+573001234567', '57 300 123 4567', '1234567', ''])(
    'rejects the malformed number "%s"',
    (number) => {
      expect(() => getWhatsAppUrl(number)).toThrow(/Invalid WhatsApp number/);
    },
  );
});

describe('getRequestTypes', () => {
  it('lists the five request types, in form order, each with a label', () => {
    const types = getRequestTypes();

    expect(types.map(({ id }) => id)).toEqual([
      'medical-devices',
      'pharmaceuticals',
      'surgical-supplies',
      'engineering-services',
      'comprehensive-equipment',
    ]);
    expect(types.find(({ id }) => id === 'engineering-services')?.label).toBe(
      'Biomedical Engineering & Calibration Services',
    );
    for (const { label } of types) expect(label.trim()).not.toBe('');
  });
});

describe('getNavItems', () => {
  it('returns the six sections as /#anchor links', () => {
    expect(getNavItems().map(({ href }) => href)).toEqual([
      '/#home',
      '/#about',
      '/#products',
      '/#engineering',
      '/#why-us',
      '/#contact',
    ]);
  });
});

describe('getContactChannels', () => {
  it('turns phones into tel: links and emails into mailto: links', () => {
    const { phones, emails } = getContactChannels();

    expect(phones).toHaveLength(2);
    for (const { href } of phones) expect(href).toMatch(/^tel:\+\d+$/);
    expect(emails).toHaveLength(2);
    for (const { label, href } of emails) expect(href).toBe(`mailto:${label}`);
  });
});

describe('getConsentNotice', () => {
  it('splits the consent sentence around the privacy policy link', () => {
    const { beforeLink, afterLink, policyLink } = getConsentNotice();

    expect(policyLink).toEqual({
      label: 'Personal Data Processing Policy',
      href: '/privacy-policy',
    });
    expect(`${beforeLink} ${policyLink.label} ${afterLink}`).toBe(
      'I accept the processing of my personal data under the Personal Data Processing Policy and authorize Medsupplies Ingeniería S.A.S. to contact me.',
    );
  });
});

describe('getMetrics and getSocialLinks', () => {
  it('returns the four metrics', () => {
    expect(getMetrics()).toHaveLength(4);
  });

  it('returns the LinkedIn and Instagram placeholder links', () => {
    expect(getSocialLinks()).toEqual([
      expect.objectContaining({ network: 'linkedin', href: '#' }),
      expect.objectContaining({ network: 'instagram', href: '#' }),
    ]);
  });
});
