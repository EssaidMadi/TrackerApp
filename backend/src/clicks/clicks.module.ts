import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClicksController } from './clicks.controller';
import { VoluumRedirectController } from './voluum-redirect.controller';
import { ClicksService } from './clicks.service';
import { DeviceParserService } from './device-parser.service';
import { GeoIpService } from './geo-ip.service';
import { IpEnrichmentService } from './ip-enrichment.service';

@Module({
  imports: [HttpModule],
  controllers: [ClicksController, VoluumRedirectController],
  providers: [ClicksService, DeviceParserService, GeoIpService, IpEnrichmentService],
  exports: [ClicksService],
})
export class ClicksModule {}
