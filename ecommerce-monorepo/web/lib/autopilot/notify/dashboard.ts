/**
 * Auto-Pilot Dashboard & SSE Notification Dispatcher
 * Persists notification rows to the AutoPilotNotification table
 * and publishes real-time alerts through the Redis / In-Memory Event Bus.
 */

import { prisma } from '../../db';
import { publishDomainEvent } from '../event-bus';

export async function sendDashboardNotification(params: {
  type: string;
  severity: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  cycleId?: string;
  deliveryLog?: Record<string, unknown>;
}): Promise<{ id: string }> {
  const notif = await prisma.autoPilotNotification.create({
    data: {
      type: params.type,
      severity: params.severity,
      title: params.title,
      body: params.body,
      data: params.data as any,
      cycleId: params.cycleId,
      deliveryLog: params.deliveryLog as any,
    },
  });

  // Broadcast to Event Bus for Server-Sent Events (SSE) subscribers
  try {
    await publishDomainEvent({
      type: 'NOTIFICATION_PUBLISHED',
      aggregateId: notif.id,
      payload: {
        aggregateType: 'AutoPilotNotification',
        actor: 'autopilot:notify',
        data: {
          id: notif.id,
          title: notif.title,
          severity: notif.severity,
          cycleId: notif.cycleId,
        },
      },
    });
  } catch {
    // Non-blocking
  }

  return { id: notif.id };
}
