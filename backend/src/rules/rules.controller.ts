import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AlertSeverity, AlertStatus, RuleAction, RuleMetric, RuleOperator, RuleScope } from '@prisma/client';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RulesService, type CreateRuleDto } from './rules.service';
import { AlertsService } from './alerts.service';

const RULE_SCOPES = new Set<string>(Object.values(RuleScope));
const RULE_METRICS = new Set<string>(Object.values(RuleMetric));
const RULE_OPERATORS = new Set<string>(Object.values(RuleOperator));
const RULE_ACTIONS = new Set<string>(Object.values(RuleAction));
const ALERT_SEVERITIES = new Set<string>(Object.values(AlertSeverity));

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
    this.validateRuleDto(dto);
    return this.rules.create(dto);
  }

  @Put('rules/:id')
  updateRule(@Param('id') id: string, @Body() dto: Partial<CreateRuleDto>) {
    this.validateRuleDto(dto, true);
    return this.rules.update(id, dto);
  }

  @Delete('rules/:id')
  deleteRule(@Param('id') id: string) {
    return this.rules.remove(id);
  }

  @Get('alerts')
  listAlerts(@Query('status') status?: AlertStatus, @Query('limit') limit?: string) {
    if (status && !Object.values(AlertStatus).includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 500) {
      throw new BadRequestException('limit must be an integer between 1 and 500');
    }
    return this.alerts.list(status, parsedLimit);
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

  private validateRuleDto(dto: Partial<CreateRuleDto>, partial = false) {
    if (!partial && !dto.name?.trim()) {
      throw new BadRequestException('name is required');
    }
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('name cannot be empty');
    }
    if (dto.scope !== undefined && !RULE_SCOPES.has(dto.scope)) {
      throw new BadRequestException(`Invalid scope: ${dto.scope}`);
    }
    if (dto.metric !== undefined && !RULE_METRICS.has(dto.metric)) {
      throw new BadRequestException(`Invalid metric: ${dto.metric}`);
    }
    if (dto.operator !== undefined && !RULE_OPERATORS.has(dto.operator)) {
      throw new BadRequestException(`Invalid operator: ${dto.operator}`);
    }
    if (dto.action !== undefined && !RULE_ACTIONS.has(dto.action)) {
      throw new BadRequestException(`Invalid action: ${dto.action}`);
    }
    if (dto.severity !== undefined && !ALERT_SEVERITIES.has(dto.severity)) {
      throw new BadRequestException(`Invalid severity: ${dto.severity}`);
    }
    if (dto.threshold !== undefined && (typeof dto.threshold !== 'number' || Number.isNaN(dto.threshold))) {
      throw new BadRequestException('threshold must be a number');
    }
    if (dto.windowHours !== undefined) {
      if (!Number.isInteger(dto.windowHours) || dto.windowHours < 1 || dto.windowHours > 720) {
        throw new BadRequestException('windowHours must be an integer between 1 and 720');
      }
    }
    if (dto.campaignId !== undefined && dto.campaignId !== null && !dto.campaignId.trim()) {
      throw new BadRequestException('campaignId cannot be empty');
    }
    if (!partial) {
      if (dto.scope === undefined) throw new BadRequestException('scope is required');
      if (dto.metric === undefined) throw new BadRequestException('metric is required');
      if (dto.operator === undefined) throw new BadRequestException('operator is required');
      if (dto.threshold === undefined) throw new BadRequestException('threshold is required');
    }
  }
}
