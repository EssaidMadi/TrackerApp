import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resolver } from 'dns/promises';
import type { TrackingDomain } from '@prisma/client';
import type { DnsRecordInstruction } from './domains.service';

export interface DnsCheckResult {
  verified: boolean;
  txtOk: boolean;
  pointingOk: boolean;
  txtHost: string;
  hostname: string;
  expectedTxt: string;
  expectedTarget?: string;
  resolvedTxt: string[];
  resolvedCname: string[];
  resolvedA: string[];
  txtLookupError?: string;
  message: string;
}

const DEFAULT_DNS_SERVERS = ['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1'];
const DOH_TXT_URL = 'https://dns.google/resolve';
const NATIVE_TXT_TIMEOUT_MS = 4000;

function normalizeHost(value: string): string {
  return value.toLowerCase().replace(/\.$/, '');
}

export function normalizeTxt(value: string): string {
  return value.trim().replace(/^"|"$/g, '');
}

export function txtMatches(record: string, expected: string): boolean {
  const norm = normalizeTxt(record);
  const token = normalizeTxt(expected);
  return norm === token || norm.includes(token);
}

@Injectable()
export class DnsVerificationService {
  private readonly resolver: Resolver;

  constructor(private readonly config: ConfigService) {
    this.resolver = new Resolver();
    const servers = this.config.get<string>('TRACKER_DNS_SERVERS');
    this.resolver.setServers(
      servers
        ? servers.split(',').map((s) => s.trim()).filter(Boolean)
        : DEFAULT_DNS_SERVERS,
    );
  }

  async verify(domain: TrackingDomain): Promise<DnsCheckResult> {
    const serverIp = this.config.get<string>('TRACKER_SERVER_IP');
    const records = (domain.dnsRecords || []) as unknown as DnsRecordInstruction[];
    const trackingRecord = records.find((r) => r.type === 'CNAME' || r.type === 'A');

    let txtOk = false;
    let pointingOk = false;
    let txtLookupError: string | undefined;
    const resolvedTxt: string[] = [];
    const resolvedCname: string[] = [];
    const resolvedA: string[] = [];

    const txtValues = await this.lookupTxt(domain.verificationHost);
    for (const value of txtValues.values) {
      resolvedTxt.push(value);
      if (txtMatches(value, domain.verificationToken)) txtOk = true;
    }
    txtLookupError = txtValues.error;

    const expectedTarget = trackingRecord?.value;

    if (trackingRecord?.type === 'CNAME' && expectedTarget) {
      try {
        const cnames = await this.resolver.resolveCname(domain.hostname);
        resolvedCname.push(...cnames);
        pointingOk = cnames.some(
          (c) => normalizeHost(c) === normalizeHost(expectedTarget),
        );
      } catch {
        // CNAME not found yet
      }
    }

    if (!pointingOk && trackingRecord?.type === 'A' && expectedTarget) {
      try {
        const ips = await this.resolver.resolve4(domain.hostname);
        resolvedA.push(...ips);
        pointingOk = ips.includes(expectedTarget);
      } catch {
        // A not found yet
      }
    }

    // CNAME → root domain: final resolved IP should match server (root A record)
    if (!pointingOk && serverIp) {
      try {
        const ips = await this.resolver.resolve4(domain.hostname);
        resolvedA.push(...ips);
        pointingOk = ips.includes(serverIp);
      } catch {
        // not resolving yet
      }
    }

    const verified = txtOk && pointingOk;
    let message = '';
    if (verified) {
      message = 'DNS verified — domain is ready for campaigns';
    } else if (!txtOk && !pointingOk) {
      message = 'TXT verification and tracking CNAME/A record not detected yet';
    } else if (!txtOk) {
      if (resolvedTxt.length > 0) {
        message = `Tracking record OK but TXT value does not match (found: ${resolvedTxt.map(normalizeTxt).join(', ')})`;
      } else if (txtLookupError) {
        message = `Tracking record OK but TXT lookup failed for ${domain.verificationHost} (${txtLookupError})`;
      } else {
        message = 'Tracking record found but TXT verification record is missing';
      }
    } else if (trackingRecord?.type === 'CNAME') {
      message = `TXT OK but CNAME "${domain.hostname}" must point to "${expectedTarget}"`;
    } else {
      message = 'TXT verified but tracking subdomain is not pointing to your server yet';
    }

    return {
      verified,
      txtOk,
      pointingOk,
      txtHost: domain.verificationHost,
      hostname: domain.hostname,
      expectedTxt: domain.verificationToken,
      expectedTarget,
      resolvedTxt,
      resolvedCname,
      resolvedA,
      txtLookupError,
      message,
    };
  }

  private async lookupTxt(host: string): Promise<{ values: string[]; error?: string }> {
    const native = this.withTimeout(
      this.resolver.resolveTxt(host).then((records) =>
        records.map((chunk) => chunk.join('')),
      ),
      NATIVE_TXT_TIMEOUT_MS,
    );

    try {
      const values = await native;
      if (values.length > 0) return { values };
    } catch (nativeErr) {
      try {
        const values = await this.resolveTxtViaDoh(host);
        if (values.length > 0) return { values };
        return {
          values: [],
          error: nativeErr instanceof Error ? nativeErr.message : String(nativeErr),
        };
      } catch (dohErr) {
        const nativeMsg = nativeErr instanceof Error ? nativeErr.message : String(nativeErr);
        const dohMsg = dohErr instanceof Error ? dohErr.message : String(dohErr);
        return { values: [], error: `${nativeMsg}; DoH: ${dohMsg}` };
      }
    }

    try {
      return { values: await this.resolveTxtViaDoh(host) };
    } catch (err) {
      return {
        values: [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private async resolveTxtViaDoh(host: string): Promise<string[]> {
    const url = `${DOH_TXT_URL}?name=${encodeURIComponent(host)}&type=TXT`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      throw new Error(`DoH HTTP ${res.status}`);
    }

    const body = (await res.json()) as {
      Status?: number;
      Answer?: { data?: string }[];
    };

    if (body.Status !== 0 || !body.Answer?.length) {
      return [];
    }

    return body.Answer.map((a) => a.data || '').filter(Boolean);
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`DNS lookup timed out after ${ms}ms`)), ms);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
