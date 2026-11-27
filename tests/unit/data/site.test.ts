import { describe, expect, it } from 'vitest';
import {
  getContactChannels,
  getMapEmbedUrl,
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
      '/#aliados',
      '/#contacto',
    ]);
  });
});

describe('getContactChannels', () => {
  it('turns phones into tel: links and emails into mailto: links', () => {
    const { phones, emails } = getContactChannels();

    expect(phones).toEqual([{ label: '+57 3114472353', href: 'tel:+573114472353' }]);
    expect(emails).toEqual([
      { label: 'medsuppliesingenieria@gmail.com', href: 'mailto:medsuppliesingenieria@gmail.com' },
    ]);
  });
});

describe('getMapEmbedUrl', () => {
  it('embeds the configured location (Tunja by default) without an API key', () => {
    expect(getContactChannels().mapQuery).toBe('Tunja, Boyacá, Colombia');
    expect(getMapEmbedUrl()).toBe(
      'https://www.google.com/maps?q=Tunja%2C%20Boyac%C3%A1%2C%20Colombia&output=embed',
    );
  });

  it('encodes the given query', () => {
    expect(getMapEmbedUrl('Calle 1 # 2-3, Tunja')).toBe(
      'https://www.google.com/maps?q=Calle%201%20%23%202-3%2C%20Tunja&output=embed',
    );
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
