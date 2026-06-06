import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ClicksService } from '../clicks/clicks.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('api')
@UseGuards(ApiKeyGuard)
export class CampaignsClicksController {
  constructor(private readonly clicksService: ClicksService) {}

  @Get('clicks')
  listClicks(
    @Query('campaignId') campaignId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('publisher') publisher?: string,
    @Query('platform') platform?: string,
    @Query('device') device?: string,
    @Query('country') country?: string,
    @Query('isBot') isBot?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.clicksService.listClicks({
      campaignId,
      from,
      to,
      publisher,
      platform,
      device,
      country,
      isBot: isBot === 'true' ? true : isBot === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
