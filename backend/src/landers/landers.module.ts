import { Module } from '@nestjs/common';
import { LandersController } from './landers.controller';
import { LandersService } from './landers.service';
import { DomainsModule } from '../domains/domains.module';
import { TrackerScriptModule } from '../tracker-script/tracker-script.module';

@Module({
  imports: [DomainsModule, TrackerScriptModule],
  controllers: [LandersController],
  providers: [LandersService],
  exports: [LandersService],
})
export class LandersModule {}
