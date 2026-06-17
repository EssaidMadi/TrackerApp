import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClicksModule } from './clicks/clicks.module';
import { ConversionsModule } from './conversions/conversions.module';
import { PostbacksModule } from './postbacks/postbacks.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { TrackerScriptModule } from './tracker-script/tracker-script.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DomainsModule } from './domains/domains.module';
import { TrafficSourcesModule } from './traffic-sources/traffic-sources.module';
import { ConversionEventTypesModule } from './conversion-event-types/conversion-event-types.module';
import { PlatformSyncModule } from './platform-sync/platform-sync.module';
import { LandersModule } from './landers/landers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ClicksModule,
    ConversionsModule,
    PostbacksModule,
    CampaignsModule,
    TrackerScriptModule,
    AnalyticsModule,
    DomainsModule,
    TrafficSourcesModule,
    ConversionEventTypesModule,
    PlatformSyncModule,
    LandersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
