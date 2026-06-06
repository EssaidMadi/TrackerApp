import { Module } from '@nestjs/common';
import { ConversionsController } from './conversions.controller';
import { ConversionsService } from './conversions.service';
import { VoluumExportService } from './voluum-export.service';
import { PostbacksModule } from '../postbacks/postbacks.module';

@Module({
  imports: [PostbacksModule],
  controllers: [ConversionsController],
  providers: [ConversionsService, VoluumExportService],
  exports: [ConversionsService],
})
export class ConversionsModule {}
