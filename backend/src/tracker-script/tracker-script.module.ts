import { Module } from '@nestjs/common';
import { TrackerScriptController } from './tracker-script.controller';
import { TrackerScriptService } from './tracker-script.service';
import { ClicksModule } from '../clicks/clicks.module';

@Module({
  imports: [ClicksModule],
  controllers: [TrackerScriptController],
  providers: [TrackerScriptService],
  exports: [TrackerScriptService],
})
export class TrackerScriptModule {}
