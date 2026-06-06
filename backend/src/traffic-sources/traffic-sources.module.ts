import { Module } from '@nestjs/common';
import { TrafficSourcesService } from './traffic-sources.service';
import { TrafficSourcesController } from './traffic-sources.controller';

@Module({
  controllers: [TrafficSourcesController],
  providers: [TrafficSourcesService],
  exports: [TrafficSourcesService],
})
export class TrafficSourcesModule {}
