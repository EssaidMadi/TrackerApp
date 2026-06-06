import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PlatformSyncController } from './platform-sync.controller';
import { PlatformSyncService } from './platform-sync.service';

@Module({
  imports: [HttpModule],
  controllers: [PlatformSyncController],
  providers: [PlatformSyncService],
  exports: [PlatformSyncService],
})
export class PlatformSyncModule {}
