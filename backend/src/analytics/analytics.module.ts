import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CampaignReportService } from './campaign-report.service';
import { FunnelAnalyticsService } from './funnel-analytics.service';
import { CreativeAnalyticsService } from './creative-analytics.service';
import { ConversionEventTypesModule } from '../conversion-event-types/conversion-event-types.module';

@Module({
  imports: [ConversionEventTypesModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    CampaignReportService,
    FunnelAnalyticsService,
    CreativeAnalyticsService,
  ],
  exports: [
    AnalyticsService,
    CampaignReportService,
    FunnelAnalyticsService,
    CreativeAnalyticsService,
  ],
})
export class AnalyticsModule {}
