import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PostbacksService } from './postbacks.service';
import { MediagoStrategy } from './strategies/mediago.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [HttpModule],
  providers: [PostbacksService, MediagoStrategy, FacebookStrategy, GoogleStrategy],
  exports: [PostbacksService],
})
export class PostbacksModule {}
