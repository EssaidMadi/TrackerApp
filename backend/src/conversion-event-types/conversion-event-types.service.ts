import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_CONVERSION_EVENT_TYPES } from './conversion-event-types.seed';
import { CreateConversionEventTypeDto, UpdateConversionEventTypeDto } from './dto/conversion-event-type.dto';
import { normalizeEventType } from '../common/utils/normalize-event-type';

@Injectable()
export class ConversionEventTypesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  async seedDefaults() {
    for (const row of DEFAULT_CONVERSION_EVENT_TYPES) {
      await this.prisma.conversionEventType.upsert({
        where: { slug: row.slug },
        create: { ...row, isSystem: true },
        update: { displayLabel: row.displayLabel, sortOrder: row.sortOrder },
      });
    }
  }

  findAll(includeInactive = false) {
    return this.prisma.conversionEventType.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.conversionEventType.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Conversion event type not found');
    return row;
  }

  create(dto: CreateConversionEventTypeDto) {
    const slug = normalizeEventType(dto.slug || dto.displayLabel);
    return this.prisma.conversionEventType.create({
      data: {
        slug,
        displayLabel: dto.displayLabel,
        sortOrder: dto.sortOrder ?? 500,
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateConversionEventTypeDto) {
    await this.findOne(id);
    return this.prisma.conversionEventType.update({
      where: { id },
      data: {
        ...(dto.displayLabel !== undefined ? { displayLabel: dto.displayLabel } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    if (row.isSystem) {
      return this.prisma.conversionEventType.update({
        where: { id },
        data: { active: false },
      });
    }
    await this.prisma.conversionEventType.delete({ where: { id } });
    return { deleted: true, id };
  }
}
