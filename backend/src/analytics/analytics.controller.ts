import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('api/analytics')
@UseGuards(ApiKeyGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(
    @Query('campaignId') campaignId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.getOverview(campaignId, from, to);
  }

  @Get('breakdown')
  breakdown(
    @Query('dimension') dimension: 'publisher' | 'platform' | 'device' | 'os' | 'country' | 'browser',
    @Query('campaignId') campaignId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.getBreakdown(dimension || 'publisher', campaignId, from, to);
  }

  @Get('live')
  liveTraffic(
    @Query('campaignId') campaignId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analytics.getLiveTraffic(
      campaignId,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
