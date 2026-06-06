import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DnsVerificationService } from './dns-verification.service';
import { CreateDomainDto } from './dto/create-domain.dto';

export interface DnsRecordInstruction {
  type: 'CNAME' | 'A' | 'TXT';
  host: string;
  value: string;
  ttl: number;
  purpose: string;
  godaddyHint: string;
}

@Injectable()
export class DomainsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly dnsVerification: DnsVerificationService,
  ) {}

  async create(dto: CreateDomainDto) {
    const subdomain = (dto.subdomain || 'track').toLowerCase();
    const rootDomain = dto.rootDomain.toLowerCase().replace(/^\.|\.$/g, '');
    const hostname = `${subdomain}.${rootDomain}`;

    const existing = await this.prisma.trackingDomain.findUnique({ where: { hostname } });
    if (existing) {
      throw new ConflictException(`Domain ${hostname} is already registered`);
    }

    const verificationToken = `tracker-verify=${randomUUID()}`;
    const verificationHost = `_tk-verify.${hostname}`;
    const dnsRecords = this.buildDnsRecords(subdomain, rootDomain, verificationToken, verificationHost);

    return this.prisma.trackingDomain.create({
      data: {
        label: dto.label,
        subdomain,
        rootDomain,
        hostname,
        verificationToken,
        verificationHost,
        dnsRecords: dnsRecords as unknown as Prisma.InputJsonValue,
        status: DomainStatus.pending_dns,
      },
    });
  }

  findAll() {
    return this.prisma.trackingDomain.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { campaigns: true } } },
    });
  }

  async findOne(id: string) {
    const domain = await this.prisma.trackingDomain.findUnique({
      where: { id },
      include: { campaigns: { select: { id: true, name: true, slug: true } } },
    });
    if (!domain) throw new NotFoundException('Domain not found');
    return domain;
  }

  async refreshDnsRecords(id: string) {
    const domain = await this.findOne(id);
    const dnsRecords = this.buildDnsRecords(
      domain.subdomain,
      domain.rootDomain,
      domain.verificationToken,
      domain.verificationHost,
    );

    return this.prisma.trackingDomain.update({
      where: { id },
      data: {
        dnsRecords: dnsRecords as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async verify(id: string) {
    const domain = await this.refreshDnsRecords(id);
    const result = await this.dnsVerification.verify(domain);

    const updated = await this.prisma.trackingDomain.update({
      where: { id },
      data: {
        status: result.verified ? DomainStatus.verified : DomainStatus.failed,
        lastCheckedAt: new Date(),
        lastCheckError: result.verified ? null : result.message,
      },
    });

    return { domain: updated, check: result };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.trackingDomain.delete({ where: { id } });
    return { deleted: true, id };
  }

  getTrackerBaseUrl(domain?: { hostname: string; status: DomainStatus } | null): string {
    if (domain?.status === DomainStatus.verified) {
      const proto = this.config.get<string>('TRACKER_DOMAIN_PROTOCOL') || 'https';
      return `${proto}://${domain.hostname}`;
    }
    return this.config.get<string>('TRACKER_BASE_URL') || 'http://localhost:3001';
  }

  private buildDnsRecords(
    subdomain: string,
    rootDomain: string,
    verificationToken: string,
    _verificationHost: string,
  ): DnsRecordInstruction[] {
    const externalCname = this.config.get<string>('TRACKER_CNAME_TARGET');
    const serverIp = this.config.get<string>('TRACKER_SERVER_IP');
    const dnsMode = this.config.get<string>('TRACKER_DNS_MODE') || 'cname_root';
    const records: DnsRecordInstruction[] = [];

    if (externalCname) {
      records.push({
        type: 'CNAME',
        host: subdomain,
        value: externalCname,
        ttl: 3600,
        purpose: 'Point tracking subdomain to external tracker hostname',
        godaddyHint: `GoDaddy → DNS → Add CNAME — Name: "${subdomain}", Value: "${externalCname}"`,
      });
    } else if (dnsMode === 'a' && serverIp) {
      records.push({
        type: 'A',
        host: subdomain,
        value: serverIp,
        ttl: 3600,
        purpose: 'Point tracking subdomain directly to server IP (only if root is elsewhere)',
        godaddyHint: `GoDaddy → DNS → Add A — Name: "${subdomain}", Value: "${serverIp}"`,
      });
    } else {
      records.push({
        type: 'CNAME',
        host: subdomain,
        value: rootDomain,
        ttl: 3600,
        purpose:
          'Point track subdomain to your root domain (root A record already points to your server)',
        godaddyHint: `GoDaddy → DNS → Add CNAME — Name: "${subdomain}", Points to: "${rootDomain}"`,
      });
    }

    const txtHost = `_tk-verify.${subdomain}`;
    records.push({
      type: 'TXT',
      host: txtHost,
      value: verificationToken,
      ttl: 3600,
      purpose: 'Prove you own this domain (required for verification)',
      godaddyHint: `GoDaddy → DNS → Add TXT — Name: "${txtHost}", Value: "${verificationToken}"`,
    });

    return records;
  }
}
