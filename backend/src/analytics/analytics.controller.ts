import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { CampaignReportService } from './campaign-report.service';
import { FunnelAnalyticsService } from './funnel-analytics.service';
import { CreativeAnalyticsService } from './creative-analytics.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import type { VisitAnalyticsFilters, VisitBreakdownDimension } from './visit-filters';

@Controller('api/analytics')
@UseGuards(ApiKeyGuard)
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly campaignReport: CampaignReportService,
    private readonly funnelAnalytics: FunnelAnalyticsService,
    private readonly creativeAnalytics: CreativeAnalyticsService,
  ) {}

  @Get('overview')
  async overview(
    @Query('campaignId') campaignId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (campaignId) {
      return this.analytics.getOverview(campaignId, from, to);
    }
    const rollup = await this.campaignReport.getGlobalRollup(from, to);
    const visitStats = await this.analytics.getOverview(undefined, from, to);
    return {
      ...rollup,
      uniqueVisits: visitStats.uniqueVisits,
      newVisitors: visitStats.newVisitors,
      returningVisitors: visitStats.returningVisitors,
      sentConversions: visitStats.sentConversions,
    };
  }

  @Get('campaigns')
  reportCampaigns(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('workspace') workspace?: string,
  ) {
    return this.campaignReport.getCampaignReport(from, to, workspace);
  }

  @Get('campaigns/export/csv')
  async exportCampaignCsv(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('workspace') workspace?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.campaignReport.exportCampaignReportCsv(from, to, workspace);
    res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res!.setHeader('Content-Disposition', 'attachment; filename="campaign-report.csv"');
    res!.send(csv);
  }

  @Get('timeseries')
  timeseries(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: 'hour' | 'day',
    @Query('campaignId') campaignId?: string,
  ) {
    return this.campaignReport.getTimeseries(from, to, granularity || 'hour', campaignId);
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

  @Get('visits/summary')
  visitSummary(@Query() query: Record<string, string | undefined>) {
    return this.analytics.getVisitSummary(this.parseVisitFilters(query));
  }

  @Get('visits/breakdown')
  visitBreakdown(
    @Query('dimension') dimension: VisitBreakdownDimension,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.analytics.getVisitBreakdown(
      dimension || 'publisher',
      this.parseVisitFilters(query),
    );
  }

  @Get('creatives')
  creativeReport(@Query() query: Record<string, string | undefined>) {
    return this.creativeAnalytics.getCreativeReport(this.parseVisitFilters(query));
  }

  private parseVisitFilters(query: Record<string, string | undefined>): VisitAnalyticsFilters {
    const { isBot, isNewVisitor, ...rest } = query;
    return {
      campaignId: rest.campaignId,
      from: rest.from,
      to: rest.to,
      publisher: rest.publisher,
      platform: rest.platform,
      country: rest.country,
      device: rest.device,
      adId: rest.adId,
      siteId: rest.siteId,
      contentName: rest.contentName,
      isBot: isBot === 'true' ? true : isBot === 'false' ? false : undefined,
      isNewVisitor:
        isNewVisitor === 'true' ? true : isNewVisitor === 'false' ? false : undefined,
    };
  }

  @Get('funnel')
  getFunnel(
    @Query('campaignId') campaignId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.funnelAnalytics.getFunnel(campaignId, from, to);
  }

  @Get('funnel/postbacks')
  getFunnelPostbacks(
    @Query('campaignId') campaignId?: string,
    @Query('eventType') eventType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.funnelAnalytics.getRecentPostbacks(
      campaignId,
      eventType,
      from,
      to,
      limit ? parseInt(limit, 10) : 50,
    );
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
