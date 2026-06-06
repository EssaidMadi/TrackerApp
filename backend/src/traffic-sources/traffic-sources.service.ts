import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CANONICAL_FIELDS,
  type ParamMapping,
} from '../shared/tracking/param-mapping';
import { SYSTEM_TRAFFIC_SOURCE_PROFILES } from './traffic-source-profiles.seed';
import { CreateTrafficSourceDto, UpdateTrafficSourceDto } from './dto/traffic-source.dto';

@Injectable()
export class TrafficSourcesService implements OnModuleInit {
  private readonly logger = new Logger(TrafficSourcesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.seedSystemProfiles();
      await this.linkCampaignsToProfiles();
      const count = await this.prisma.trafficSourceProfile.count();
      this.logger.log(`Traffic source profiles ready (${count} total)`);
    } catch (err) {
      this.logger.error('Failed to seed traffic source profiles', err);
      throw err;
    }
  }

  async seedSystemProfiles() {
    for (const profile of SYSTEM_TRAFFIC_SOURCE_PROFILES) {
      await this.prisma.trafficSourceProfile.upsert({
        where: { slug: profile.slug },
        create: {
          slug: profile.slug,
          name: profile.name,
          trackingModeDefault: profile.trackingModeDefault,
          clickUrlTemplate: profile.clickUrlTemplate,
          directAdUrlTemplate: profile.directAdUrlTemplate,
          paramMappings: profile.paramMappings as unknown as Prisma.InputJsonValue,
          conversionMethod: profile.conversionMethod,
          postbackDefaults: profile.postbackDefaults as unknown as Prisma.InputJsonValue,
          setupNote: profile.setupNote,
          isSystem: profile.isSystem,
          active: true,
        },
        update: {
          name: profile.name,
          trackingModeDefault: profile.trackingModeDefault,
          clickUrlTemplate: profile.clickUrlTemplate,
          directAdUrlTemplate: profile.directAdUrlTemplate,
          paramMappings: profile.paramMappings as unknown as Prisma.InputJsonValue,
          conversionMethod: profile.conversionMethod,
          postbackDefaults: profile.postbackDefaults as unknown as Prisma.InputJsonValue,
          setupNote: profile.setupNote,
        },
      });
    }
  }

  async linkCampaignsToProfiles() {
    const profiles = await this.prisma.trafficSourceProfile.findMany();
    const bySlug = Object.fromEntries(profiles.map((p: { slug: string; id: string }) => [p.slug, p.id]));

    const campaigns = await this.prisma.campaign.findMany({
      where: { trafficSourceProfileId: null },
    });

    for (const campaign of campaigns) {
      const profileId = bySlug[campaign.trafficSource];
      if (profileId) {
        await this.prisma.campaign.update({
          where: { id: campaign.id },
          data: { trafficSourceProfileId: profileId },
        });
      }
    }
  }

  validateParamMappings(mappings: ParamMapping[]) {
    if (!mappings.length) {
      throw new BadRequestException('At least one param mapping is required');
    }
    for (const m of mappings) {
      if (!CANONICAL_FIELDS.includes(m.internalField as (typeof CANONICAL_FIELDS)[number])) {
        throw new BadRequestException(`Invalid internal field: ${m.internalField}`);
      }
      if (!m.externalKeys.length) {
        throw new BadRequestException(`Mapping for ${m.internalField} needs external keys`);
      }
    }
  }

  async findAll(includeInactive = false) {
    return this.prisma.trafficSourceProfile.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { campaigns: true } } },
    });
  }

  async findAllAdmin() {
    return this.prisma.trafficSourceProfile.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { campaigns: true } } },
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.trafficSourceProfile.findUnique({
      where: { id },
      include: { _count: { select: { campaigns: true } } },
    });
    if (!profile) throw new NotFoundException('Traffic source profile not found');
    return profile;
  }

  async findBySlug(slug: string) {
    return this.prisma.trafficSourceProfile.findUnique({ where: { slug } });
  }

  getParamMappings(profile: { paramMappings: unknown }): ParamMapping[] {
    return (profile.paramMappings as ParamMapping[]) || [];
  }

  async create(dto: CreateTrafficSourceDto) {
    this.validateParamMappings(dto.paramMappings);
    const existing = await this.prisma.trafficSourceProfile.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new BadRequestException(`Slug "${dto.slug}" already exists`);

    return this.prisma.trafficSourceProfile.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        trackingModeDefault: dto.trackingModeDefault,
        clickUrlTemplate: dto.clickUrlTemplate || null,
        directAdUrlTemplate: dto.directAdUrlTemplate || null,
        paramMappings: dto.paramMappings as unknown as Prisma.InputJsonValue,
        conversionMethod: dto.conversionMethod,
        postbackDefaults: (dto.postbackDefaults || {}) as unknown as Prisma.InputJsonValue,
        setupNote: dto.setupNote || null,
        active: dto.active ?? true,
        isSystem: false,
      },
    });
  }

  async update(id: string, dto: UpdateTrafficSourceDto) {
    const profile = await this.findOne(id);
    if (dto.paramMappings) this.validateParamMappings(dto.paramMappings);
    if (dto.slug && dto.slug !== profile.slug) {
      const clash = await this.prisma.trafficSourceProfile.findUnique({
        where: { slug: dto.slug },
      });
      if (clash) throw new BadRequestException(`Slug "${dto.slug}" already exists`);
    }

    return this.prisma.trafficSourceProfile.update({
      where: { id },
      data: {
        ...dto,
        paramMappings: dto.paramMappings
          ? (dto.paramMappings as unknown as Prisma.InputJsonValue)
          : undefined,
        postbackDefaults: dto.postbackDefaults
          ? (dto.postbackDefaults as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }

  async remove(id: string) {
    const profile = await this.findOne(id);
    if (profile.isSystem) {
      throw new BadRequestException('System traffic source profiles cannot be deleted');
    }
    const count = await this.prisma.campaign.count({
      where: { trafficSourceProfileId: id },
    });
    if (count > 0) {
      throw new BadRequestException(
        `Cannot delete: ${count} campaign(s) use this profile`,
      );
    }
    await this.prisma.trafficSourceProfile.delete({ where: { id } });
    return { deleted: true, id };
  }

  buildPostbackDefaultsFromProfile(profile: {
    conversionMethod: string;
    postbackDefaults: unknown;
  }) {
    const defaults = (profile.postbackDefaults || {}) as Record<string, unknown>;
    return {
      mediagoEnabled: Boolean(defaults.mediagoEnabled),
      mediagoConversionType: Number(defaults.mediagoConversionType ?? 10),
      facebookEnabled: Boolean(defaults.facebookEnabled),
      facebookPixelId: (defaults.facebookPixelId as string) || undefined,
      facebookAccessToken: (defaults.facebookAccessToken as string) || undefined,
      googleEnabled: Boolean(defaults.googleEnabled),
      googleConversionId: (defaults.googleConversionId as string) || undefined,
      googleConversionLabel: (defaults.googleConversionLabel as string) || undefined,
      googlePostbackUrl: (defaults.googlePostbackUrl as string) || undefined,
    };
  }
}
