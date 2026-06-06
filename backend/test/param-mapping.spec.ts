import {
  resolveParamsFromMappings,
  getReportFieldsFromClick,
  DEFAULT_PARAM_MAPPINGS,
} from '../src/shared/tracking/param-mapping';

describe('resolveParamsFromMappings', () => {
  const mediagoQuery = {
    adid: '123',
    adtitle: 'My Ad',
    campaignid: 'camp-1',
    publishername: 'PubCo',
    click_id: 'track-abc',
    platform: 'mobile',
  };

  it('maps Mediago params via default mappings', () => {
    const resolved = resolveParamsFromMappings(mediagoQuery, DEFAULT_PARAM_MAPPINGS);
    expect(resolved.ad_id).toBe('123');
    expect(resolved.ad_title).toBe('My Ad');
    expect(resolved.campaign_external_id).toBe('camp-1');
    expect(resolved.publisher_name).toBe('PubCo');
    expect(resolved.tracking_id).toBe('track-abc');
    expect(resolved.platform).toBe('mobile');
  });

  it('maps Facebook fbclid via facebook profile mappings', () => {
    const fbMappings = [
      {
        internalField: 'fbclid',
        displayLabel: 'FBCLID',
        externalKeys: ['fbclid'],
        showInReports: true,
        priority: 1,
      },
      {
        internalField: 'utm_source',
        displayLabel: 'UTM Source',
        externalKeys: ['utm_source'],
        showInReports: true,
        priority: 2,
      },
    ];
    const resolved = resolveParamsFromMappings(
      { fbclid: 'fb.123', utm_source: 'facebook' },
      fbMappings,
    );
    expect(resolved.fbclid).toBe('fb.123');
    expect(resolved.utm_source).toBe('facebook');
  });

  it('maps Google gclid via google profile mappings', () => {
    const googleMappings = [
      {
        internalField: 'gclid',
        displayLabel: 'GCLID',
        externalKeys: ['gclid'],
        showInReports: true,
        priority: 1,
      },
    ];
    const resolved = resolveParamsFromMappings({ gclid: 'gclid-xyz' }, googleMappings);
    expect(resolved.gclid).toBe('gclid-xyz');
  });

  it('strips unreplaced macros', () => {
    const resolved = resolveParamsFromMappings(
      { adid: '${AD_ID}', click_id: 'real-id' },
      DEFAULT_PARAM_MAPPINGS,
    );
    expect(resolved.ad_id).toBeUndefined();
    expect(resolved.tracking_id).toBe('real-id');
  });
});

describe('getReportFieldsFromClick', () => {
  it('returns display labels for mapped click fields', () => {
    const rows = getReportFieldsFromClick(
      {
        adId: '99',
        publisherName: 'Pub',
        trackingId: 'tid-1',
      },
      DEFAULT_PARAM_MAPPINGS,
    );
    expect(rows.some((r) => r.label === 'Ad id' && r.value === '99')).toBe(true);
    expect(rows.some((r) => r.label === 'Publisher Name' && r.value === 'Pub')).toBe(true);
  });
});
