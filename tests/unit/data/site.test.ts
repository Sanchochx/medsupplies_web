import { describe, expect, it } from 'vitest';
import {
  getContactChannels,
  getNavItems,
  getSocialLinks,
  getWhatsAppUrl,
} from '../../../src/lib/data';

describe('getWhatsAppUrl', () => {
  it('builds a wa.me URL from the configured number', () => {
    expect(getWhatsAppUrl()).toBe('https://wa.me/573114472353');
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

describe('getNavItems', () => {
  it('returns the five sections as /#anchor links', () => {
    expect(getNavItems().map(({ href }) => href)).toEqual([
      '/#inicio',
      '/#nosotros',
      '/#productos',
      '/#ingenieria',
      '/#contacto',
    ]);
  });
});

describe('getContactChannels', () => {
  it('turns phones into tel: links and emails into mailto: links', () => {
    const { phones, emails } = getContactChannels();

    expect(phones).toEqual([{ label: '+57 3114472353', href: 'tel:+573114472353' }]);
    expect(emails).toHaveLength(2);
    for (const { label, href } of emails) expect(href).toBe(`mailto:${label}`);
  });
});

describe('getSocialLinks', () => {
  it('returns only the Facebook page: WhatsApp is a contact channel, not a social network', () => {
    expect(getSocialLinks()).toEqual([
      expect.objectContaining({
        network: 'facebook',
        href: 'https://www.facebook.com/100064867987295/about/',
      }),
    ]);
  });
});
