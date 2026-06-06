import { ConfigService } from '@nestjs/config';
import { DomainsService } from '../src/domains/domains.service';
import {
  DnsVerificationService,
  normalizeTxt,
  txtMatches,
} from '../src/domains/dns-verification.service';

describe('DomainsService DNS record generation', () => {
  it('builds CNAME to root domain by default (same server setup)', () => {
    const config = {
      get: (key: string) => {
        if (key === 'TRACKER_DNS_MODE') return 'cname_root';
        if (key === 'TRACKER_SERVER_IP') return '76.13.114.85';
        return undefined;
      },
    } as ConfigService;

    const service = new DomainsService(
      {} as never,
      config,
      new DnsVerificationService(config),
    );

    const records = (service as unknown as { buildDnsRecords: Function }).buildDnsRecords(
      'track',
      'auto-coverage.org',
      'tracker-verify=abc-123',
      '_tk-verify.track.auto-coverage.org',
    );

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      type: 'CNAME',
      host: 'track',
      value: 'auto-coverage.org',
    });
    expect(records[1]).toMatchObject({ type: 'TXT', host: '_tk-verify.track' });
  });
});

describe('DnsVerificationService TXT matching', () => {
  it('matches TXT values with or without surrounding quotes', () => {
    const token = 'tracker-verify=b4529709-907e-4e4f-8620-b4515cf2934b';
    expect(txtMatches(`"${token}"`, token)).toBe(true);
    expect(txtMatches(token, token)).toBe(true);
    expect(normalizeTxt(`"${token}"`)).toBe(token);
  });
});
