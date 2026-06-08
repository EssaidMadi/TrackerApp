import { Body, Controller, Get, Header, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TrackerScriptService } from './tracker-script.service';
import { DirectVisitDto } from './dto/direct-visit.dto';
import { ClicksService } from '../clicks/clicks.service';
import { ConversionsService } from '../conversions/conversions.service';
import { buildVisitorContextFromRequest } from '../clicks/visitor-context.util';
import { buildVisitorCookie } from '../common/utils/visitor-id';
import { isMediagoTrafficSource } from '../shared/tracking/mediago-conversion-types';

@Controller('t')
export class TrackerScriptController {
  constructor(
    private readonly trackerScript: TrackerScriptService,
    private readonly clicks: ClicksService,
    private readonly conversions: ConversionsService,
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
  async registerVisit(
    @Body() dto: DirectVisitDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const query: Record<string, string> = { ...(dto.params || {}) };
    if (process.env.ALLOW_TEST_IP_OVERRIDE === 'true' && query.__test_ip) {
      // keep for local dev
    }

    const visitor = buildVisitorContextFromRequest(req, query);
    if (dto.visitorId) {
      visitor.visitorId = dto.visitorId;
    }
    const result = await this.clicks.registerDirectVisit(dto.campaign, query, visitor);
    res.append('Set-Cookie', buildVisitorCookie(result.visitorId, req.secure));

    const mediago =
      isMediagoTrafficSource(result.utmSource) ||
      result.trafficSource === 'mediago' ||
      isMediagoTrafficSource(query.utm_source);
    if (mediago) {
      setImmediate(() => {
        this.conversions
          .create({
            clickId: result.clickId,
            eventType: 'viewcontent',
            metadata: { source: 'auto_server_pageview', utm_source: result.utmSource || 'mediago' },
          })
          .catch(() => {});
      });
    }

    return result;
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
