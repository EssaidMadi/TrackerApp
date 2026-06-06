import { Body, Controller, Get, Header, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { TrackerScriptService } from './tracker-script.service';
import { DirectVisitDto } from './dto/direct-visit.dto';
import { ClicksService } from '../clicks/clicks.service';
import { buildVisitorContextFromRequest } from '../clicks/visitor-context.util';

@Controller('t')
export class TrackerScriptController {
  constructor(
    private readonly trackerScript: TrackerScriptService,
    private readonly clicks: ClicksService,
  ) {}

  @Get('tracker.js')
  @Header('Content-Type', 'application/javascript')
  @Header('Cache-Control', 'public, max-age=3600')
  @Header('Access-Control-Allow-Origin', '*')
  getTrackerScript() {
    return this.trackerScript.getScript();
  }

  /** Direct LP tracking — Facebook/Google land directly on LP, script registers the visit */
  @Post('visit')
  @Header('Access-Control-Allow-Origin', '*')
  async registerVisit(@Body() dto: DirectVisitDto, @Req() req: Request) {
    const query: Record<string, string> = { ...(dto.params || {}) };
    if (process.env.ALLOW_TEST_IP_OVERRIDE === 'true' && query.__test_ip) {
      // keep for local dev
    }

    const visitor = buildVisitorContextFromRequest(req, query);
    return this.clicks.registerDirectVisit(dto.campaign, query, visitor);
  }

  @Get('pixel')
  @Header('Content-Type', 'image/gif')
  @Header('Access-Control-Allow-Origin', '*')
  pixel() {
    return Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64',
    );
  }
}
