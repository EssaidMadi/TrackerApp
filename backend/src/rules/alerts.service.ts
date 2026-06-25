import { Injectable } from '@nestjs/common';
import { AlertStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  list(status?: AlertStatus, limit = 50) {
    return this.prisma.alertEvent.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { rule: true },
    });
  }

  unreadCount() {
    return this.prisma.alertEvent.count({ where: { status: AlertStatus.open } });
  }

  acknowledge(id: string) {
    return this.prisma.alertEvent.update({
      where: { id },
      data: { status: AlertStatus.ack, acknowledgedAt: new Date() },
    });
  }

  resolve(id: string) {
    return this.prisma.alertEvent.update({
      where: { id },
      data: { status: AlertStatus.resolved, resolvedAt: new Date() },
    });
  }
}
