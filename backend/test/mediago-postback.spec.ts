import {
  resolveMediagoAccountName,
  resolveMediagoAdId,
  resolveMediagoTrackingId,
} from '../src/shared/tracking/mediago-postback';

describe('mediago postback helpers', () => {
  it('resolves tracking id from click_id in rawParams', () => {
    const id = resolveMediagoTrackingId({
      trackingId: null,
      externalClickId: null,
      adId: null,
      rawParams: { click_id: '5315d6e6bad2b321d1da4f26e39c8c41' },
    } as never);
    expect(id).toBe('5315d6e6bad2b321d1da4f26e39c8c41');
  });

  it('resolves adid from click', () => {
    expect(resolveMediagoAdId({ adId: '1000000' } as never)).toBe('1000000');
  });

  it('resolves account name from campaign config first', () => {
    expect(
      resolveMediagoAccountName(
        { mediagoAccountName: 'campaign_acct' },
        { mediagoAccountName: 'profile_acct' },
      ),
    ).toBe('campaign_acct');
  });
});
