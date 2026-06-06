import { Module } from '@nestjs/common';
import { ConversionEventTypesController } from './conversion-event-types.controller';
import { ConversionEventTypesService } from './conversion-event-types.service';

@Module({
  controllers: [ConversionEventTypesController],
  providers: [ConversionEventTypesService],
  exports: [ConversionEventTypesService],
})
export class ConversionEventTypesModule {}
