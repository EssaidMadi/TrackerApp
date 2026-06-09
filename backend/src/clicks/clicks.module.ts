import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClicksController } from './clicks.controller';
import { VoluumRedirectController } from './voluum-redirect.controller';
import { ClicksService } from './clicks.service';
import { DeviceParserService } from './device-parser.service';
import { GeoIpService } from './geo-ip.service';
import { IpEnrichmentService } from './ip-enrichment.service';
import { ConversionsModule } from '../conversions/conversions.module';
import { ConversionEventTypesModule } from '../conversion-event-types/conversion-event-types.module';

@Module({
  imports: [HttpModule, ConversionsModule, ConversionEventTypesModule],
  controllers: [ClicksController, VoluumRedirectController],
  providers: [ClicksService, DeviceParserService, GeoIpService, IpEnrichmentService],
  exports: [ClicksService],
})
export class ClicksModule {}
