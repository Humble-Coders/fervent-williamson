import {
  createSlug,
  generateSalonUrl,
  generateServiceUrl,
  parseSalonUrl,
  parseServiceUrl,
  isSeoFriendlySalonUrl,
  isSeoFriendlyServiceUrl,
  getCategorySlug,
  getCategoryNameFromSlug
} from '../urlUtils';

describe('urlUtils', () => {
  describe('createSlug', () => {
    it('should create URL-friendly slugs', () => {
      expect(createSlug('Hair Studio & Spa')).toBe('hair-studio-spa');
      expect(createSlug('Beauty Salon 123')).toBe('beauty-salon-123');
      expect(createSlug('  Trim & Style  ')).toBe('trim-style');
      expect(createSlug('Salon-Name')).toBe('salon-name');
    });

    it('should handle special characters', () => {
      expect(createSlug('Salon@Home')).toBe('salonhome');
      expect(createSlug('Hair & Beauty')).toBe('hair-beauty');
      expect(createSlug('Style_Studio')).toBe('style-studio');
    });
  });

  describe('generateSalonUrl', () => {
    it('should generate SEO-friendly salon URLs', () => {
      expect(generateSalonUrl('Hair Studio', 123)).toBe('/salons/hair-studio/123');
      expect(generateSalonUrl('Beauty & Spa', '456')).toBe('/salons/beauty-spa/456');
      expect(generateSalonUrl('Trim Studio', 1)).toBe('/salons/trim-studio/1');
    });
  });

  describe('generateServiceUrl', () => {
    it('should generate SEO-friendly service URLs', () => {
      expect(generateServiceUrl('hair', 123)).toBe('/services/hair/123');
      expect(generateServiceUrl('facial', '456')).toBe('/services/facial/456');
      expect(generateServiceUrl('nails', 1)).toBe('/services/nails/1');
    });
  });

  describe('parseSalonUrl', () => {
    it('should parse salon URL parameters', () => {
      expect(parseSalonUrl('hair-studio', '123')).toEqual({
        salonName: 'hair-studio',
        id: '123'
      });
      expect(parseSalonUrl(undefined, '456')).toEqual({
        salonName: '',
        id: '456'
      });
    });
  });

  describe('parseServiceUrl', () => {
    it('should parse service URL parameters', () => {
      expect(parseServiceUrl('hair', '123')).toEqual({
        category: 'hair',
        serviceId: '123'
      });
      expect(parseServiceUrl('facial', undefined)).toEqual({
        category: 'facial',
        serviceId: undefined
      });
    });
  });

  describe('isSeoFriendlySalonUrl', () => {
    it('should identify SEO-friendly salon URLs', () => {
      expect(isSeoFriendlySalonUrl('/salons/hair-studio/123')).toBe(true);
      expect(isSeoFriendlySalonUrl('/salons/beauty-spa/456')).toBe(true);
      expect(isSeoFriendlySalonUrl('/salons/123')).toBe(false);
      expect(isSeoFriendlySalonUrl('/salons/456')).toBe(false);
      expect(isSeoFriendlySalonUrl('/other/path')).toBe(false);
    });
  });

  describe('isSeoFriendlyServiceUrl', () => {
    it('should identify SEO-friendly service URLs', () => {
      expect(isSeoFriendlyServiceUrl('/services/hair/123')).toBe(true);
      expect(isSeoFriendlyServiceUrl('/services/facial/456')).toBe(true);
      expect(isSeoFriendlyServiceUrl('/services/hair')).toBe(false);
      expect(isSeoFriendlyServiceUrl('/other/path')).toBe(false);
    });
  });

  describe('getCategorySlug', () => {
    it('should convert category names to slugs', () => {
      expect(getCategorySlug('Hair Care')).toBe('hair');
      expect(getCategorySlug('Facial')).toBe('facial');
      expect(getCategorySlug('Nail Care')).toBe('nails');
      expect(getCategorySlug('Custom Category')).toBe('custom-category');
    });
  });

  describe('getCategoryNameFromSlug', () => {
    it('should convert slugs to category names', () => {
      expect(getCategoryNameFromSlug('hair')).toBe('Hair Care');
      expect(getCategoryNameFromSlug('facial')).toBe('Facial');
      expect(getCategoryNameFromSlug('nails')).toBe('Nail Care');
      expect(getCategoryNameFromSlug('unknown')).toBe('unknown');
    });
  });
});
