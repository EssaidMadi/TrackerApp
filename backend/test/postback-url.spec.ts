import {
  DEFAULT_MEDIAGO_POSTBACK_URL,
  resolvePostbackUrlTemplate,
} from '../src/shared/tracking/postback-url';

describe('resolvePostbackUrlTemplate', () => {
  it('builds Mediago URL matching Voluum template', () => {
    const url = resolvePostbackUrlTemplate(DEFAULT_MEDIAGO_POSTBACK_URL, {
      click: {
        clickId: 'dabc123',
        campaignId: 'camp-1',
        trackingId: 'mg-track-99',
        adId: '1000000',
        adTitle: 'My Ad',
      } as never,
      conversion: { revenue: 25, eventType: 'Lead' } as never,
      config: { mediagoConversionType: 10 },
      profileDefaults: { mediagoAccountName: 'MyAccount' },
    });

    expect(url).toContain('sync.mediago.io/api/bidder/postback');
    expect(url).toContain('trackingid=mg-track-99');
    expect(url).toContain('adid=1000000');
    expect(url).toContain('conversiontype=10');
    expect(url).toContain('conversionprice=25');
    expect(url).toContain('includeintotalconversion=1');
    expect(url).toContain('accountname=MyAccount');
  });

  it('maps viewcontent event to Mediago type 1', () => {
    const url = resolvePostbackUrlTemplate(DEFAULT_MEDIAGO_POSTBACK_URL, {
      click: {
        clickId: 'dabc123',
        trackingId: 'mg-track-99',
      } as never,
      conversion: { revenue: 0, eventType: 'viewcontent' } as never,
      config: { mediagoConversionType: 10 },
    });

    expect(url).toContain('conversiontype=1');
  });

  it('maps call_connected event to Mediago type 14', () => {
    const url = resolvePostbackUrlTemplate(DEFAULT_MEDIAGO_POSTBACK_URL, {
      click: {
        clickId: 'dabc123',
        trackingId: 'mg-track-99',
      } as never,
      conversion: { revenue: 0, eventType: 'call_connected' } as never,
      config: { mediagoConversionType: 10 },
    });

    expect(url).toContain('conversiontype=14');
  });
});
