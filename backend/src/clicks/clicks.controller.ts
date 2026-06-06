import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { buildVisitorContextFromRequest } from './visitor-context.util';
import { ClicksService } from './clicks.service';

@Controller()
export class ClicksController {
  constructor(private readonly clicksService: ClicksService) {}

  @Get('click/:slug')
  async redirect(
    @Param('slug') slug: string,
    @Query() query: Record<string, string | string[] | undefined>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const visitor = buildVisitorContextFromRequest(req, query);
    const destination = await this.clicksService.handleClick(slug, query, visitor);

    return res.redirect(302, destination);
  }
}
