import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { TargetsService, type UpsertCampaignTargetDto } from './targets.service';

@Controller('api/targets')
@UseGuards(ApiKeyGuard)
export class TargetsController {
  constructor(private readonly targets: TargetsService) {}

  @Get(':campaignId/pacing')
  getPacing(@Param('campaignId') campaignId: string) {
    return this.targets.getPacing(campaignId);
  }

  @Get(':campaignId')
  getTarget(@Param('campaignId') campaignId: string) {
    return this.targets.findByCampaign(campaignId);
  }

  @Put(':campaignId')
  upsertTarget(@Param('campaignId') campaignId: string, @Body() dto: UpsertCampaignTargetDto) {
    return this.targets.upsert(campaignId, dto);
  }
}
