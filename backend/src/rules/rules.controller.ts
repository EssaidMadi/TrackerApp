import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AlertStatus } from '@prisma/client';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RulesService, type CreateRuleDto } from './rules.service';
import { AlertsService } from './alerts.service';

@Controller('api')
@UseGuards(ApiKeyGuard)
export class RulesController {
  constructor(
    private readonly rules: RulesService,
    private readonly alerts: AlertsService,
  ) {}

  @Get('rules')
  listRules() {
    return this.rules.findAll();
  }

  @Post('rules')
  createRule(@Body() dto: CreateRuleDto) {
    return this.rules.create(dto);
  }

  @Put('rules/:id')
  updateRule(@Param('id') id: string, @Body() dto: Partial<CreateRuleDto>) {
    return this.rules.update(id, dto);
  }

  @Delete('rules/:id')
  deleteRule(@Param('id') id: string) {
    return this.rules.remove(id);
  }

  @Get('alerts')
  listAlerts(@Query('status') status?: AlertStatus, @Query('limit') limit?: string) {
    return this.alerts.list(status, limit ? parseInt(limit, 10) : 50);
  }

  @Get('alerts/unread-count')
  unreadCount() {
    return this.alerts.unreadCount();
  }

  @Patch('alerts/:id/ack')
  ackAlert(@Param('id') id: string) {
    return this.alerts.acknowledge(id);
  }

  @Patch('alerts/:id/resolve')
  resolveAlert(@Param('id') id: string) {
    return this.alerts.resolve(id);
  }
}
