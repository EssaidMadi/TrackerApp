import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TargetsModule } from '../targets/targets.module';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { RulesEngineService } from './rules-engine.service';
import { AlertsService } from './alerts.service';

@Module({
  imports: [AnalyticsModule, TargetsModule],
  controllers: [RulesController],
  providers: [RulesService, RulesEngineService, AlertsService],
  exports: [RulesService, AlertsService],
})
export class RulesModule {}
