import { MediagoStrategy } from '../src/postbacks/strategies/mediago.strategy';
import { GoogleStrategy } from '../src/postbacks/strategies/google.strategy';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('Postback strategies', () => {
  const mockHttp = {
    get: jest.fn().mockReturnValue(of({ data: 'OK', status: 200 })),
    post: jest.fn().mockReturnValue(of({ data: { events_received: 1 }, status: 200 })),
  } as unknown as HttpService;

  describe('MediagoStrategy', () => {
    const strategy = new MediagoStrategy(mockHttp);

    it('builds Mediago GET postback with tracking_id', async () => {
      const result = await strategy.send(
        {
          clickId: 'dtest123',
          trackingId: 'mediago-track-abc',
          adId: '1000000',
        } as any,
        { revenue: 0 } as any,
        { mediagoEnabled: true, mediagoConversionType: 10 } as any,
      );

      expect(result.method).toBe('GET');
      expect(result.url).toContain('sync.mediago.io/api/bidder/postback');
      expect(result.url).toContain('trackingid=mediago-track-abc');
      expect(result.url).toContain('conversiontype=10');
      expect(result.success).toBe(true);
    });

    it('fails without tracking_id', async () => {
      const result = await strategy.send(
        { clickId: 'dtest123', trackingId: null } as any,
        { revenue: 0 } as any,
        { mediagoEnabled: true, mediagoConversionType: 10 } as any,
      );

      expect(result.success).toBe(false);
    });
  });

  describe('GoogleStrategy', () => {
    const strategy = new GoogleStrategy(mockHttp);

    it('builds Google postback with gclid', async () => {
      const result = await strategy.send(
        { clickId: 'dtest123', gclid: 'gclid-abc-123' } as any,
        { revenue: 5 } as any,
        {
          googleEnabled: true,
          googleConversionId: 'AW-123',
          googleConversionLabel: 'label-abc',
        } as any,
      );

      expect(result.method).toBe('GET');
      expect(result.url).toContain('gclid=gclid-abc-123');
      expect(result.success).toBe(true);
    });

    it('uses custom postback URL template', async () => {
      const result = await strategy.send(
        { clickId: 'dtest123', gclid: 'gclid-xyz' } as any,
        { revenue: 10 } as any,
        {
          googleEnabled: true,
          googlePostbackUrl:
            'https://tracker.example.com/google?gclid={gclid}&value={revenue}',
        } as any,
      );

      expect(result.url).toBe(
        'https://tracker.example.com/google?gclid=gclid-xyz&value=10',
      );
    });
  });
});
