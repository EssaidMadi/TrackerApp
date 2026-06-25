import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  AlertSeverity,
  RuleAction,
  RuleMetric,
  RuleOperator,
  RuleScope,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type CreateRuleDto = {
  name: string;
  scope: RuleScope;
  metric: RuleMetric;
  operator: RuleOperator;
  threshold: number;
  windowHours?: number;
  action?: RuleAction;
  severity?: AlertSeverity;
  enabled?: boolean;
  campaignId?: string;
};

@Injectable()
export class RulesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.optimizationRule.count();
    if (count > 0) return;

    await this.prisma.optimizationRule.createMany({
      data: [
        {
          name: 'Spend with no events',
          scope: RuleScope.site,
          metric: RuleMetric.spendNoEvents,
          operator: RuleOperator.gte,
          threshold: 10,
          windowHours: 24,
          action: RuleAction.suggest_block,
          severity: AlertSeverity.danger,
        },
        {
          name: 'High bot traffic',
          scope: RuleScope.publisher,
          metric: RuleMetric.botPct,
          operator: RuleOperator.gte,
          threshold: 40,
          windowHours: 24,
          action: RuleAction.alert,
          severity: AlertSeverity.warning,
        },
        {
          name: 'Negative ROI',
          scope: RuleScope.campaign,
          metric: RuleMetric.roi,
          operator: RuleOperator.lt,
          threshold: -50,
          windowHours: 24,
          action: RuleAction.suggest_pause,
          severity: AlertSeverity.danger,
        },
        {
          name: 'Budget overspend pace',
          scope: RuleScope.campaign,
          metric: RuleMetric.budgetPace,
          operator: RuleOperator.gt,
          threshold: 100,
          windowHours: 24,
          action: RuleAction.alert,
          severity: AlertSeverity.warning,
        },
      ],
    });
  }

  findAll() {
    return this.prisma.optimizationRule.findMany({ orderBy: { createdAt: 'asc' } });
  }

  create(dto: CreateRuleDto) {
    return this.prisma.optimizationRule.create({ data: dto });
  }

  update(id: string, dto: Partial<CreateRuleDto>) {
    return this.prisma.optimizationRule.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.optimizationRule.delete({ where: { id } });
  }
}
