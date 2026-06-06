import { ConversionMethod } from '@prisma/client';
import { MediagoStrategy } from '../src/postbacks/strategies/mediago.strategy';
import { FacebookStrategy } from '../src/postbacks/strategies/facebook.strategy';
import { GoogleStrategy } from '../src/postbacks/strategies/google.strategy';

describe('Postback strategy gating by conversion method', () => {
  const mediagoConfig = {
    mediagoEnabled: true,
    mediagoConversionType: 10,
    facebookEnabled: false,
    googleEnabled: false,
  } as Parameters<MediagoStrategy['canHandle']>[0];

  const fbConfig = {
    mediagoEnabled: false,
    facebookEnabled: true,
    facebookPixelId: '123',
    googleEnabled: false,
  } as Parameters<FacebookStrategy['canHandle']>[0];

  const googleConfig = {
    mediagoEnabled: false,
    facebookEnabled: false,
    googleEnabled: true,
  } as Parameters<GoogleStrategy['canHandle']>[0];

  const mediagoStrategy = new MediagoStrategy({} as never);
  const facebookStrategy = new FacebookStrategy({} as never, { get: () => undefined } as never);
  const googleStrategy = new GoogleStrategy({} as never);

  it('Mediago only handles mediago_s2s profile', () => {
    expect(
      mediagoStrategy.canHandle(mediagoConfig, {
        trafficSourceProfile: { conversionMethod: ConversionMethod.mediago_s2s, postbackDefaults: {} },
      }),
    ).toBe(true);
    expect(
      mediagoStrategy.canHandle(mediagoConfig, {
        trafficSourceProfile: { conversionMethod: ConversionMethod.facebook_capi, postbackDefaults: {} },
      }),
    ).toBe(false);
  });

  it('Facebook only handles facebook_capi profile', () => {
    expect(
      facebookStrategy.canHandle(fbConfig, {
        trafficSourceProfile: { conversionMethod: ConversionMethod.facebook_capi, postbackDefaults: {} },
      }),
    ).toBe(true);
    expect(
      facebookStrategy.canHandle(fbConfig, {
        trafficSourceProfile: { conversionMethod: ConversionMethod.mediago_s2s, postbackDefaults: {} },
      }),
    ).toBe(false);
  });

  it('Google only handles google_offline profile', () => {
    expect(
      googleStrategy.canHandle(googleConfig, {
        trafficSourceProfile: { conversionMethod: ConversionMethod.google_offline, postbackDefaults: {} },
      }),
    ).toBe(true);
    expect(
      googleStrategy.canHandle(googleConfig, {
        trafficSourceProfile: { conversionMethod: ConversionMethod.mediago_s2s, postbackDefaults: {} },
      }),
    ).toBe(false);
  });
});
