import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { BlockedPlacementStatus, PlacementDimension } from '@prisma/client';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { PlacementsService, type CreateBlockedPlacementDto } from './placements.service';

@Controller('api/placements')
@UseGuards(ApiKeyGuard)
export class PlacementsController {
  constructor(private readonly placements: PlacementsService) {}

  @Get('blocked')
  listBlocked(
    @Query('campaignId') campaignId?: string,
    @Query('dimension') dimension?: PlacementDimension,
  ) {
    return this.placements.list({ campaignId, dimension, status: BlockedPlacementStatus.active });
  }

  @Post('blocked')
  createBlocked(@Body() body: CreateBlockedPlacementDto | CreateBlockedPlacementDto[]) {
    const items = Array.isArray(body) ? body : [body];
    return this.placements.createMany(items);
  }

  @Delete('blocked/:id')
  removeBlocked(@Param('id') id: string) {
    return this.placements.remove(id);
  }

  @Get('blocked/export')
  exportBlocklist(
    @Query('campaignId') campaignId?: string,
    @Query('dimension') dimension?: PlacementDimension,
  ) {
    return this.placements.exportBlocklist(campaignId, dimension || PlacementDimension.site);
  }
}
