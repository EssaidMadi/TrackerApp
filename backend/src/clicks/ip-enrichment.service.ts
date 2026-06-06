import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Prisma } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { detectBot } from '../shared/tracking/bot-detector';
import { inferConnectionType } from '../shared/tracking/request-context';

interface IpApiResponse {
  status: string;
  isp?: string;
  org?: string;
  mobile?: boolean;
  proxy?: boolean;
  hosting?: boolean;
}

@Injectable()
export class IpEnrichmentService {
  private readonly logger = new Logger(IpEnrichmentService.name);

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  enrichClickAsync(clickId: string, ipAddress?: string, userAgent?: string, acceptLanguage?: string) {
    if (!ipAddress || this.isPrivateIp(ipAddress)) return;

    setImmediate(() => {
      this.enrichClick(clickId, ipAddress, userAgent, acceptLanguage).catch((err) => {
        this.logger.debug(`IP enrichment failed for ${clickId}: ${err}`);
      });
    });
  }

  private async enrichClick(
    clickId: string,
    ipAddress: string,
    userAgent?: string,
    acceptLanguage?: string,
  ) {
    const data = await this.lookupIp(ipAddress);
    if (!data) return;

    const click = await this.prisma.click.findUnique({
      where: { clickId },
      select: { device: true, requestHeaders: true },
    });
    if (!click) return;

    const headers = (click.requestHeaders || {}) as Record<string, string>;
    const connectionType = inferConnectionType(
      click.device || 'Unknown',
      data.mobile,
      headers.secChUaMobile,
    );

    const bot = detectBot({
      userAgent,
      acceptLanguage,
      isProxy: data.proxy,
      isHosting: data.hosting,
      hasSecFetchHeaders: Boolean(headers.secFetchDest || headers.secFetchMode),
    });

    await this.prisma.click.update({
      where: { clickId },
      data: {
        isp: data.isp || null,
        mobileCarrier: data.mobile ? data.org || data.isp || null : null,
        connectionType,
        isProxy: data.proxy || false,
        isHosting: data.hosting || false,
        isBot: bot.isBot,
        botScore: bot.score,
        botReasons: bot.reasons as Prisma.InputJsonValue,
      },
    });
  }

  private async lookupIp(ip: string): Promise<IpApiResponse | null> {
    try {
      const cleanIp = ip.replace(/^::ffff:/, '');
      const res = await firstValueFrom(
        this.http.get<IpApiResponse>(
          `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,isp,org,mobile,proxy,hosting`,
          { timeout: 2000 },
        ),
      );
      if (res.data.status !== 'success') return null;
      return res.data;
    } catch {
      return null;
    }
  }

  private isPrivateIp(ip: string): boolean {
    const clean = ip.replace(/^::ffff:/, '');
    return (
      clean === '127.0.0.1' ||
      clean === '::1' ||
      clean.startsWith('10.') ||
      clean.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(clean)
    );
  }
}
