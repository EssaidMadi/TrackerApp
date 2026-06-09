import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsClicksController } from './campaigns-clicks.controller';
import { CampaignsService } from './campaigns.service';
import { ClicksModule } from '../clicks/clicks.module';
import { TrackerScriptModule } from '../tracker-script/tracker-script.module';
import { DomainsModule } from '../domains/domains.module';
import { TrafficSourcesModule } from '../traffic-sources/traffic-sources.module';
import { ConversionEventTypesModule } from '../conversion-event-types/conversion-event-types.module';

@Module({
  imports: [
    ClicksModule,
    TrackerScriptModule,
    DomainsModule,
    TrafficSourcesModule,
    ConversionEventTypesModule,
  ],
  controllers: [CampaignsController, CampaignsClicksController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
