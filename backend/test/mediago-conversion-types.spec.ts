import {
  MEDIAGO_CONVERSION_TYPE_BY_SLUG,
  resolveMediagoConversionType,
  isMediagoTrafficSource,
  getUtmSourceFromQuery,
} from '../src/shared/tracking/mediago-conversion-types';

describe('Mediago conversion type map', () => {
  it('maps Table 1.1 event slugs', () => {
    expect(MEDIAGO_CONVERSION_TYPE_BY_SLUG.viewcontent).toBe(1);
    expect(MEDIAGO_CONVERSION_TYPE_BY_SLUG.purchase).toBe(8);
    expect(MEDIAGO_CONVERSION_TYPE_BY_SLUG.lead).toBe(10);
    expect(MEDIAGO_CONVERSION_TYPE_BY_SLUG.click_button).toBe(12);
    expect(MEDIAGO_CONVERSION_TYPE_BY_SLUG.call_click).toBe(12);
    expect(MEDIAGO_CONVERSION_TYPE_BY_SLUG.call_connected).toBe(14);
    expect(MEDIAGO_CONVERSION_TYPE_BY_SLUG.account_opening).toBe(16);
    expect(MEDIAGO_CONVERSION_TYPE_BY_SLUG.account_validated).toBe(17);
  });

  it('resolveMediagoConversionType normalizes labels', () => {
    expect(resolveMediagoConversionType('View Content')).toBe(1);
    expect(resolveMediagoConversionType('Call Connected')).toBe(14);
    expect(resolveMediagoConversionType('Purchase')).toBe(8);
  });

  it('accepts numeric et values', () => {
    expect(resolveMediagoConversionType('14')).toBe(14);
  });

  it('falls back for unknown events', () => {
    expect(resolveMediagoConversionType('unknown_event', 10)).toBe(10);
  });

  it('detects mediago utm_source case-insensitively', () => {
    expect(isMediagoTrafficSource('mediago')).toBe(true);
    expect(isMediagoTrafficSource('Mediago')).toBe(true);
    expect(isMediagoTrafficSource('MEDIAGO')).toBe(true);
    expect(isMediagoTrafficSource('facebook')).toBe(false);
  });

  it('reads utm_source from query regardless of casing', () => {
    expect(getUtmSourceFromQuery({ UTM_SOURCE: 'mediago' })).toBe('mediago');
    expect(getUtmSourceFromQuery({ utm_source: 'mediago' })).toBe('mediago');
    expect(getUtmSourceFromQuery({ click_id: 'x' })).toBe('');
  });
});
