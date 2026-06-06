import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DomainStatus, Prisma, TrackingMode, TrafficSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DomainsService } from '../domains/domains.service';
import { TrackerScriptService } from '../tracker-script/tracker-script.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdatePostbackConfigDto,
} from './dto/create-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domainsService: DomainsService,
    private readonly trackerScript: TrackerScriptService,
  ) {}

  async create(dto: CreateCampaignDto) {
    await this.validateDomainId(dto.domainId);

    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        externalId: dto.externalId || undefined,
        domainId: dto.domainId || undefined,
        trafficSource: dto.trafficSource,
        trackingMode: dto.trackingMode || this.defaultTrackingMode(dto.trafficSource),
        trafficSourceName:
          dto.trafficSourceName || this.defaultTrafficSourceName(dto.trafficSource),
        trafficSourceId: dto.trafficSourceId,
        workspaceName: dto.workspaceName,
        workspaceId: dto.workspaceId,
        landerId: dto.landerId,
        landerName: dto.landerName,
        offerId: dto.offerId,
        offerName: dto.offerName,
        affiliateNetwork: dto.affiliateNetwork,
        affiliateNetworkId: dto.affiliateNetworkId,
        destinationUrl: dto.destinationUrl,
        active: dto.active ?? true,
        postbackConfig: { create: {} },
      },
      include: { postbackConfig: true, domain: true },
    });

    return this.enrichCampaign(campaign);
  }

  async findAll() {
    const campaigns = await this.prisma.campaign.findMany({
      include: { postbackConfig: true, domain: true },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((c) => this.enrichCampaign(c));
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { postbackConfig: true, domain: true },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');
    return this.enrichCampaign(campaign);
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);
    if (dto.domainId !== undefined) {
      await this.validateDomainId(dto.domainId || undefined);
    }

    const { domainId, ...rest } = dto;
    const data: Prisma.CampaignUpdateInput = { ...rest };

    if (dto.externalId === '') {
      data.externalId = null;
    }

    if (domainId === '') {
      data.domain = { disconnect: true };
    } else if (domainId) {
      data.domain = { connect: { id: domainId } };
    }

    if (dto.trafficSource && !dto.trafficSourceName) {
      data.trafficSourceName = this.defaultTrafficSourceName(dto.trafficSource);
    }

    const campaign = await this.prisma.campaign.update({
      where: { id },
      data,
      include: { postbackConfig: true, domain: true },
    });

    return this.enrichCampaign(campaign);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.campaign.delete({ where: { id } });
    return { deleted: true, id };
  }

  async updatePostbackConfig(campaignId: string, dto: UpdatePostbackConfigDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { postbackConfig: true },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    if (!campaign.postbackConfig) {
      await this.prisma.postbackConfig.create({
        data: { campaignId, ...dto },
      });
    } else {
      await this.prisma.postbackConfig.update({
        where: { campaignId },
        data: dto,
      });
    }

    return this.findOne(campaignId);
  }

  async getStats(campaignId: string) {
    const [clicks, conversions, sentConversions] = await Promise.all([
      this.prisma.click.count({ where: { campaignId } }),
      this.prisma.conversion.count({ where: { campaignId } }),
      this.prisma.conversion.count({
        where: { campaignId, status: 'sent' },
      }),
    ]);

    return {
      clicks,
      conversions,
      sentConversions,
      conversionRate: clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : '0',
    };
  }

  private defaultTrackingMode(source: TrafficSource): TrackingMode {
    if (source === 'facebook' || source === 'google') return TrackingMode.direct;
    return TrackingMode.redirect;
  }

  private defaultTrafficSourceName(source: string): string {
    const labels: Record<string, string> = {
      mediago: 'Mediago',
      facebook: 'Facebook',
      google: 'Google',
      outbrain: 'Outbrain',
      native: 'Native',
    };
    return labels[source] || source;
  }

  private async validateDomainId(domainId?: string) {
    if (!domainId) return;
    const domain = await this.prisma.trackingDomain.findUnique({ where: { id: domainId } });
    if (!domain) throw new NotFoundException('Tracking domain not found');
    if (domain.status !== DomainStatus.verified) {
      throw new BadRequestException(
        `Domain ${domain.hostname} is not verified yet. Add DNS records at GoDaddy and click Verify.`,
      );
    }
  }

  private enrichCampaign(campaign: {
    slug: string;
    externalId?: string | null;
    trafficSource: string;
    trackingMode?: TrackingMode;
    destinationUrl: string;
    name: string;
    domain?: { hostname: string; status: DomainStatus; label: string } | null;
    [key: string]: unknown;
  }) {
    const trackerBase = this.domainsService.getTrackerBaseUrl(campaign.domain);
    const campaignRef = campaign.externalId || campaign.slug;
    const clickUrl = `${trackerBase}/${campaignRef}`;
    const mode = campaign.trackingMode || TrackingMode.redirect;

    const mediagoTemplate = `${clickUrl}?adid=\${AD_ID}&adtitle=\${AD_TITLE}&campaignid=\${CAMPAIGN_ID}&publishername=\${PUBLISHER_NAME}&siteid=\${SITE_ID}&contentname=\${CONTENT_NAME}&platform=\${PLATFORM}&assetid=\${ASSET_ID}&click_id=\${TRACKING_ID}`;

    const redirectTemplates: Record<string, string> = {
      mediago: mediagoTemplate,
      native: mediagoTemplate,
      outbrain: `${clickUrl}?click_id=\${OB_CLICK_ID}&utm_source=outbrain`,
    };

    const directAdUrls: Record<string, string> = {
      facebook: `${campaign.destinationUrl}?utm_source=facebook&utm_medium=paid_social&utm_campaign=${encodeURIComponent(campaign.name)}`,
      google: `${campaign.destinationUrl}?utm_source=google&utm_medium=cpc&utm_campaign=${encodeURIComponent(campaign.name)}`,
    };

    const lpScriptSnippet = this.trackerScript.getLpScriptSnippet(
      campaignRef,
      mode,
      trackerBase,
    );

    const setupNotes: Record<string, string> = {
      mediago: 'Put the redirect Click URL in Mediago. User clicks → tracker records visit → redirects to LP.',
      native: 'Put the redirect Click URL in your native ad network tracking field.',
      outbrain: 'Put the redirect Click URL in Outbrain. Uses click_id macro.',
      facebook:
        'Put the Direct Ad URL in Facebook (website URL field). Facebook adds fbclid automatically. Add the LP script to your landing page — no redirect.',
      google:
        'Put the Direct Ad URL in Google Ads (final URL). Google adds gclid automatically. Add the LP script to your landing page — no redirect.',
    };

    return {
      ...campaign,
      trackerBaseUrl: trackerBase,
      clickUrl,
      trackingMode: mode,
      trackingTemplate:
        mode === TrackingMode.direct
          ? directAdUrls[campaign.trafficSource] || campaign.destinationUrl
          : redirectTemplates[campaign.trafficSource] || mediagoTemplate,
      directAdUrl: directAdUrls[campaign.trafficSource] || null,
      lpScriptSnippet,
      setupNote: setupNotes[campaign.trafficSource] || setupNotes.native,
    };
  }
}
