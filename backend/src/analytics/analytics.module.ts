import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CampaignReportService } from './campaign-report.service';
import { ConversionEventTypesModule } from '../conversion-event-types/conversion-event-types.module';

@Module({
  imports: [ConversionEventTypesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, CampaignReportService],
  exports: [AnalyticsService, CampaignReportService],
})
export class AnalyticsModule {}
