import { Injectable } from '@nestjs/common';
import { BlockedPlacementSource, BlockedPlacementStatus, PlacementDimension } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type CreateBlockedPlacementDto = {
  campaignId?: string;
  workspaceName?: string;
  dimension: PlacementDimension;
  value: string;
  reason?: string;
  source?: BlockedPlacementSource;
};

@Injectable()
export class PlacementsService {
  constructor(private readonly prisma: PrismaService) {}

  list(params?: { campaignId?: string; dimension?: PlacementDimension; status?: BlockedPlacementStatus }) {
    return this.prisma.blockedPlacement.findMany({
      where: {
        ...(params?.campaignId ? { campaignId: params.campaignId } : {}),
        ...(params?.dimension ? { dimension: params.dimension } : {}),
        status: params?.status || BlockedPlacementStatus.active,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createMany(items: CreateBlockedPlacementDto[]) {
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.blockedPlacement.create({
          data: {
            campaignId: item.campaignId,
            workspaceName: item.workspaceName,
            dimension: item.dimension,
            value: item.value,
            reason: item.reason,
            source: item.source || BlockedPlacementSource.manual,
            status: BlockedPlacementStatus.active,
          },
        }),
      ),
    );
  }

  remove(id: string) {
    return this.prisma.blockedPlacement.update({
      where: { id },
      data: { status: BlockedPlacementStatus.removed },
    });
  }

  exportBlocklist(campaignId?: string, dimension: PlacementDimension = PlacementDimension.site) {
    return this.list({ campaignId, dimension, status: BlockedPlacementStatus.active }).then((rows) =>
      rows.map((r) => r.value).join('\n'),
    );
  }
}
