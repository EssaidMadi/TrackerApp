import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConversionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PostbacksService } from '../postbacks/postbacks.service';
import { CreateConversionDto } from './dto/create-conversion.dto';
import type { ConversionContext } from './dto/conversion-context';
import { isTestLeadFromQuestionnaireData } from '../shared/tracking/params';
import {
  DEFAULT_PARAM_MAPPINGS,
  getReportFieldsFromClick,
  type ParamMapping,
} from '../shared/tracking/param-mapping';

@Injectable()
export class ConversionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postbacks: PostbacksService,
  ) {}

  async create(dto: CreateConversionDto, context?: ConversionContext) {
    if (
      isTestLeadFromQuestionnaireData({
        user_email: dto.metadata?.email as string,
        firstName: dto.metadata?.firstName as string,
        lastName: dto.metadata?.lastName as string,
        is_test_lead: dto.is_test_lead,
      })
    ) {
      return { skipped: true, reason: 'test_lead' };
    }

    const click = await this.findClick(dto);
    if (!click) {
      throw new NotFoundException('Click not found for provided clickId or trackingId');
    }

    const eventType = dto.eventType || 'lead';

    const existing = await this.prisma.conversion.findUnique({
      where: { clickId_eventType: { clickId: click.clickId, eventType } },
    });

    if (existing) {
      const full = await this.getConversionWithClick(existing.id);
      return { conversion: full, duplicate: true };
    }

    const conversion = await this.prisma.conversion.create({
      data: {
        clickId: click.clickId,
        campaignId: click.campaignId,
        eventType,
        revenue: dto.revenue || 0,
        totalRevenue: dto.totalRevenue ?? dto.revenue ?? 0,
        cost: dto.cost || 0,
        currency: dto.currency || null,
        transactionId: dto.transactionId || null,
        status: ConversionStatus.pending,
        metadata: (dto.metadata || {}) as Prisma.InputJsonValue,
        incomingPostbackIp: context?.incomingPostbackIp || null,
        incomingPostbackUrl: context?.incomingPostbackUrl || null,
        postbackParam1: dto.postbackParam1 || context?.postbackParam1 || null,
        postbackParam2: dto.postbackParam2 || context?.postbackParam2 || null,
        postbackParam3: dto.postbackParam3 || context?.postbackParam3 || null,
        postbackParam4: dto.postbackParam4 || context?.postbackParam4 || null,
        postbackParam5: dto.postbackParam5 || context?.postbackParam5 || null,
      },
    });

    setImmediate(() => {
      this.postbacks.processConversion(conversion.id).catch(() => {});
    });

    const full = await this.getConversionWithClick(conversion.id);
    return { conversion: full, duplicate: false };
  }

  async triggerByClickId(
    clickId: string,
    query?: Record<string, string | string[] | undefined>,
    context?: ConversionContext,
  ) {
    const get = (key: string) => {
      const v = query?.[key];
      if (Array.isArray(v)) return v[0];
      return v;
    };

    const resolvedClickId =
      get('cid') ||
      clickId ||
      get('click_id') ||
      get('clickId') ||
      get('tk-cid') ||
      get('tk_cid');

    return this.create(
      {
        clickId: resolvedClickId,
        trackingId: get('tracking_id') || get('externalid'),
        eventType: get('et') || get('event_type') || 'lead',
        transactionId: get('txid') || get('transaction_id'),
        revenue: get('payout') ? parseFloat(get('payout')!) : undefined,
        currency: get('currency'),
      },
      context,
    );
  }

  async list(filters: {
    campaignId?: string;
    status?: ConversionStatus;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (filters.campaignId) where.campaignId = filters.campaignId;
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.conversion.findMany({
        where,
        include: {
          click: true,
          campaign: { include: { trafficSourceProfile: true } },
          postbackLogs: true,
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.conversion.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        click: item.click
          ? {
              ...item.click,
              reportFields: getReportFieldsFromClick(
                item.click,
                (item.campaign.trafficSourceProfile?.paramMappings as unknown as ParamMapping[]) ||
                  DEFAULT_PARAM_MAPPINGS,
              ),
            }
          : item.click,
      })),
      total,
    };
  }

  async retry(conversionId: string) {
    const conversion = await this.prisma.conversion.findUnique({
      where: { id: conversionId },
    });
    if (!conversion) throw new NotFoundException('Conversion not found');

    await this.postbacks.retryConversion(conversionId);
    return { success: true };
  }

  async getOne(conversionId: string) {
    const conversion = await this.getConversionWithClick(conversionId);
    if (!conversion) throw new NotFoundException('Conversion not found');
    return conversion;
  }

  private async getConversionWithClick(conversionId: string) {
    return this.prisma.conversion.findUnique({
      where: { id: conversionId },
      include: {
        click: true,
        campaign: true,
        postbackLogs: true,
      },
    });
  }

  private async findClick(dto: CreateConversionDto) {
    if (dto.clickId) {
      return this.prisma.click.findUnique({ where: { clickId: dto.clickId } });
    }

    if (dto.trackingId) {
      return this.prisma.click.findFirst({
        where: { trackingId: dto.trackingId },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (dto.externalClickId) {
      return this.prisma.click.findFirst({
        where: {
          OR: [
            { externalClickId: dto.externalClickId },
            { trackingId: dto.externalClickId },
            { fbclid: dto.externalClickId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new BadRequestException('clickId, trackingId, or externalClickId is required');
  }
}
