/**
 * Auto-Pilot Unified Notification Hub (Layer 7 & 9)
 * Dispatches alerts across Telegram, Slack, Email, and Dashboard concurrently.
 * Checks dynamic Notification Preferences per event type.
 * Ensures notifications are fail-safe (errors are caught and logged).
 */

import { sendTelegramNotification } from './telegram';
import { sendEmailNotification } from './email';
import { sendDashboardNotification } from './dashboard';
import { sendSlackNotification } from '../integrations/slack';
import {
  getNotificationPreferences,
  NotificationChannel,
  NotificationEventType,
} from '../integrations/preferences';

export interface AutoPilotNotificationPayload {
  type: NotificationEventType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  cycleId?: string;
  actions?: Array<{ label: string; url?: string; callback?: string }>;
  channels?: NotificationChannel[];
}

export interface NotificationDeliveryReport {
  telegram: 'sent' | 'failed' | 'disabled';
  slack: 'sent' | 'failed' | 'disabled';
  email: 'sent' | 'failed' | 'disabled';
  dashboard: 'sent' | 'failed';
  notificationId?: string;
}

export async function notify(
  payload: AutoPilotNotificationPayload
): Promise<NotificationDeliveryReport> {
  // If specific channels passed in payload, respect them; otherwise query configured preferences
  let targetChannels = payload.channels;
  if (!targetChannels) {
    const prefs = await getNotificationPreferences();
    targetChannels = prefs[payload.type] || ['dashboard'];
  }

  const deliveryReport: NotificationDeliveryReport = {
    telegram: 'disabled',
    slack: 'disabled',
    email: 'disabled',
    dashboard: 'sent',
  };

  // 1. Telegram Dispatch
  if (targetChannels.includes('telegram')) {
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        const tgRes = await sendTelegramNotification({
          title: payload.title,
          body: payload.body,
          severity: payload.severity,
          actions: payload.actions,
        });
        deliveryReport.telegram = tgRes.sent ? 'sent' : 'failed';
      } catch {
        deliveryReport.telegram = 'failed';
      }
    } else {
      deliveryReport.telegram = 'disabled';
    }
  }

  // 2. Slack Dispatch
  if (targetChannels.includes('slack')) {
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        const icon =
          payload.severity === 'critical' ? '🚨' : payload.severity === 'warning' ? '⚠️' : 'ℹ️';
        const slackRes = await sendSlackNotification({
          text: `${icon} *${payload.title}*\n\n${payload.body}`,
        });
        deliveryReport.slack = slackRes.sent ? 'sent' : 'failed';
      } catch {
        deliveryReport.slack = 'failed';
      }
    } else {
      deliveryReport.slack = 'disabled';
    }
  }

  // 3. Email Dispatch
  if (targetChannels.includes('email')) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const emailRes = await sendEmailNotification({
          title: payload.title,
          body: payload.body,
          severity: payload.severity,
          actions: payload.actions,
        });
        deliveryReport.email = emailRes.sent ? 'sent' : 'failed';
      } catch {
        deliveryReport.email = 'failed';
      }
    } else {
      deliveryReport.email = 'disabled';
    }
  }

  // 4. Dashboard Persistence (Always stores record in AutoPilotNotification)
  if (targetChannels.includes('dashboard')) {
    try {
      const dashRes = await sendDashboardNotification({
        type: payload.type as any,
        severity: payload.severity,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        cycleId: payload.cycleId,
        deliveryLog: deliveryReport as any,
      });
      deliveryReport.notificationId = dashRes.id;
    } catch (err: any) {
      console.warn(`[AutoPilot Notify]: Failed to save notification to database (${err.message})`);
      deliveryReport.dashboard = 'failed';
    }
  }

  return deliveryReport;
}
