import { Controller, Get, Param, Query, Req, Res, NotFoundException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { buildVisitorContextFromRequest } from './visitor-context.util';
import { ClicksService } from './clicks.service';

const RESERVED = new Set(['api', 't', 'conversions', 'postback', 'click', 'health', 'favicon.ico']);

@Controller()
export class VoluumRedirectController {
  constructor(private readonly clicksService: ClicksService) {}

  /** Voluum-style: https://tracks.domain.com/{campaign-uuid}?adid=...&click_id={TRACKING_ID} */
  @Get(':identifier')
  async voluumRedirect(
    @Param('identifier') identifier: string,
    @Query() query: Record<string, string | string[] | undefined>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (RESERVED.has(identifier.toLowerCase())) {
      throw new NotFoundException();
    }

    const visitor = buildVisitorContextFromRequest(req, query);
    const destination = await this.clicksService.handleClick(identifier, query, visitor);

    return res.redirect(302, destination);
  }
}
