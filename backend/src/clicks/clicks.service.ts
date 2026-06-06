import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateClickId } from '../common/utils/click-id-generator';
import {
  getTrackingParamsFromQuery,
  extractRawParams,
} from '../shared/tracking/params';
import {
  applyNativeParamFallbacks,
  extractVoluumFields,
} from '../shared/tracking/voluum-fields';
import { detectBot } from '../shared/tracking/bot-detector';
import {
  inferConnectionType,
  type VisitorContext,
} from '../shared/tracking/request-context';
import { DeviceParserService } from './device-parser.service';
import { GeoIpService } from './geo-ip.service';
import { IpEnrichmentService } from './ip-enrichment.service';
import { isPrivateOrLoopback } from '../shared/tracking/ip-resolver';

@Injectable()
export class ClicksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly deviceParser: DeviceParserService,
    private readonly geoIp: GeoIpService,
    private readonly ipEnrichment: IpEnrichmentService,
  ) {}

  async registerDirectVisit(
    identifier: string,
    query: Record<string, string | string[] | undefined>,
    visitor: VisitorContext,
  ) {
    const { clickId, campaign } = await this.recordClick(identifier, query, visitor);
    return { clickId, campaignId: campaign.id, trackingMode: campaign.trackingMode };
  }

  async handleClick(
    identifier: string,
    query: Record<string, string | string[] | undefined>,
    visitor: VisitorContext,
  ): Promise<string> {
    const { clickId, campaign } = await this.recordClick(identifier, query, visitor);

    const destination = new URL(campaign.destinationUrl);

    for (const [key, value] of Object.entries(query)) {
      if (key.toLowerCase() === '__test_ip') continue;
      if (Array.isArray(value)) {
        if (value[0]) destination.searchParams.set(key, value[0]);
      } else if (value) {
        destination.searchParams.set(key, value);
      }
    }

    destination.searchParams.set('click_id', clickId);
    destination.searchParams.set('tk-cid', clickId);

    return destination.toString();
  }

  private async recordClick(
    identifier: string,
    query: Record<string, string | string[] | undefined>,
    visitor: VisitorContext,
  ) {
    const campaign = await this.findCampaign(identifier);
    const params = getTrackingParamsFromQuery(query);
    const rawParams = extractRawParams(query);
    const voluum = extractVoluumFields(query);
    const customVars = applyNativeParamFallbacks(voluum.customVariables, {
      adId: params.ad_id,
      campaignExternalId: params.campaign_external_id,
      publisherName: params.publisher_name,
      adTitle: params.ad_title,
      contentName: params.content_name,
      siteId: params.site_id,
      platform: params.platform,
      assetId: params.asset_id,
      adsetId: params.utm_adset,
      placement: params.utm_content,
    });
    const clickId = generateClickId();
    const userAgent = visitor.userAgent;
    const ipAddress = visitor.ipAddress;
    const device = this.deviceParser.parse(userAgent);
    const geo = this.geoIp.lookup(ipAddress);
    const acceptLanguage = visitor.headers.acceptLanguage;
    const connectionType = inferConnectionType(
      device.device,
      undefined,
      visitor.headers.secChUaMobile,
    );
    const bot = detectBot({
      userAgent,
      acceptLanguage,
      hasSecFetchHeaders: Boolean(
        visitor.headers.secFetchDest || visitor.headers.secFetchMode,
      ),
    });

    await this.prisma.click.create({
      data: {
        clickId,
        campaignId: campaign.id,
        trackingId: params.tracking_id || null,
        externalClickId: params.external_click_id || null,
        gclid: params.gclid || null,
        fbclid: params.fbclid || null,
        adId: params.ad_id || null,
        adTitle: params.ad_title || null,
        campaignExternalId: params.campaign_external_id || null,
        publisherName: params.publisher_name || null,
        siteId: params.site_id || null,
        contentName: params.content_name || null,
        platform: params.platform || null,
        assetId: params.asset_id || null,
        pathId: voluum.pathId || null,
        landerId: voluum.landerId || campaign.landerId || null,
        landerName: voluum.landerName || campaign.landerName || null,
        offerId: voluum.offerId || campaign.offerId || null,
        offerName: voluum.offerName || campaign.offerName || null,
        affiliateNetwork: voluum.affiliateNetwork || campaign.affiliateNetwork || null,
        affiliateNetworkId: voluum.affiliateNetworkId || campaign.affiliateNetworkId || null,
        trafficSourceId: voluum.trafficSourceId || campaign.trafficSourceId || null,
        trafficSourceName:
          campaign.trafficSourceName || this.formatTrafficSource(campaign.trafficSource),
        customVariable1: customVars.cv1 || null,
        customVariable2: customVars.cv2 || null,
        customVariable3: customVars.cv3 || null,
        customVariable4: customVars.cv4 || null,
        customVariable5: customVars.cv5 || null,
        customVariable6: customVars.cv6 || null,
        customVariable7: customVars.cv7 || null,
        customVariable8: customVars.cv8 || null,
        customVariable9: customVars.cv9 || null,
        customVariable10: customVars.cv10 || null,
        utmSource: params.utm_source || null,
        utmMedium: params.utm_medium || null,
        utmCampaign: params.utm_campaign || null,
        utmTerm: params.utm_term || null,
        utmContent: params.utm_content || null,
        country: geo.country,
        countryCode: geo.countryCode,
        region: geo.region,
        city: geo.city,
        device: device.device,
        os: device.os,
        osVersion: device.osVersion,
        brand: device.brand,
        model: device.model,
        browser: device.browser,
        browserVersion: device.browserVersion,
        connectionType,
        isBot: bot.isBot,
        botScore: bot.score,
        botReasons: bot.reasons as Prisma.InputJsonValue,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        acceptLanguage: acceptLanguage || null,
        referrer: visitor.referrer || params.referrer || null,
        rawParams: rawParams as Prisma.InputJsonValue,
        requestHeaders: visitor.headers as Prisma.InputJsonValue,
      },
    });

    this.ipEnrichment.enrichClickAsync(clickId, ipAddress, userAgent, acceptLanguage);

    return { clickId, campaign };
  }

  private async findCampaign(identifier: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        OR: [{ slug: identifier }, { externalId: identifier }, { id: identifier }],
        active: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign "${identifier}" not found or inactive`);
    }

    return campaign;
  }

  async listClicks(filters: {
    campaignId?: string;
    from?: string;
    to?: string;
    publisher?: string;
    platform?: string;
    device?: string;
    country?: string;
    isBot?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.ClickWhereInput = {};

    if (filters.campaignId) where.campaignId = filters.campaignId;
    if (filters.publisher) where.publisherName = { contains: filters.publisher, mode: 'insensitive' };
    if (filters.platform) where.platform = { equals: filters.platform, mode: 'insensitive' };
    if (filters.device) where.device = filters.device;
    if (filters.country) where.countryCode = filters.country;
    if (filters.isBot !== undefined) where.isBot = filters.isBot;

    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.click.findMany({
        where,
        include: {
          campaign: { select: { name: true, slug: true } },
          conversions: {
            select: {
              id: true,
              eventType: true,
              status: true,
              revenue: true,
              transactionId: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.click.count({ where }),
    ]);

    return {
      items: items.map((click) => ({
        ...click,
        converted: click.conversions.length > 0,
        conversionStatus: click.conversions[0]?.status || null,
        isLocalIp: isPrivateOrLoopback(click.ipAddress || undefined),
      })),
      total,
    };
  }

  private formatTrafficSource(source: string): string {
    const labels: Record<string, string> = {
      mediago: 'Mediago',
      facebook: 'Facebook',
      google: 'Google',
      outbrain: 'Outbrain',
      native: 'Native',
    };
    return labels[source] || source;
  }

  getClickUrl(campaign: { slug: string; externalId?: string | null }): string {
    const base = this.config.get<string>('TRACKER_BASE_URL') || 'http://localhost:3001';
    const path = campaign.externalId || campaign.slug;
    return `${base}/${path}`;
  }
}
