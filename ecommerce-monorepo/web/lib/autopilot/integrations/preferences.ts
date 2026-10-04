/**
 * Auto-Pilot Notification Preferences & Routing
 * Controls channel destinations per event type:
 * - critical_alert: [telegram, email, slack]
 * - approval_needed: [telegram, email, slack]
 * - cycle_complete: [email, slack]
 * - daily_briefing: [email, slack]
 * - weekly_summary: [email]
 */

import { prisma } from '../../db';

export type NotificationChannel = 'telegram' | 'slack' | 'email' | 'dashboard';
export type NotificationEventType =
  | 'critical_alert'
  | 'approval_needed'
  | 'cycle_complete'
  | 'daily_briefing'
  | 'weekly_summary'
  | 'kill_switch'
  | 'warning';

export interface ChannelPreferences {
  critical_alert: NotificationChannel[];
  approval_needed: NotificationChannel[];
  cycle_complete: NotificationChannel[];
  daily_briefing: NotificationChannel[];
  weekly_summary: NotificationChannel[];
  kill_switch: NotificationChannel[];
  warning: NotificationChannel[];
}

export const DEFAULT_PREFERENCES: ChannelPreferences = {
  critical_alert: ['telegram', 'slack', 'email', 'dashboard'],
  approval_needed: ['telegram', 'slack', 'email', 'dashboard'],
  cycle_complete: ['slack', 'email', 'dashboard'],
  daily_briefing: ['email', 'slack'],
  weekly_summary: ['email'],
  kill_switch: ['telegram', 'slack', 'email', 'dashboard'],
  warning: ['slack', 'dashboard'],
};

const SETTINGS_NAME = 'autopilot';
const SETTINGS_KEY = 'notification_preferences';

export async function getNotificationPreferences(): Promise<ChannelPreferences> {
  try {
    const record = await prisma.materializedView.findUnique({
      where: {
        name_key: {
          name: SETTINGS_NAME,
          key: SETTINGS_KEY,
        },
      },
    });
    if (record?.data) {
      return { ...DEFAULT_PREFERENCES, ...(record.data as any) };
    }
  } catch {
    // Return default if DB lookup fails or record is missing
  }
  return DEFAULT_PREFERENCES;
}

export async function saveNotificationPreferences(
  prefs: Partial<ChannelPreferences>
): Promise<ChannelPreferences> {
  const current = await getNotificationPreferences();
  const updated: ChannelPreferences = { ...current, ...prefs };

  await prisma.materializedView.upsert({
    where: {
      name_key: {
        name: SETTINGS_NAME,
        key: SETTINGS_KEY,
      },
    },
    update: {
      data: updated as any,
    },
    create: {
      name: SETTINGS_NAME,
      key: SETTINGS_KEY,
      data: updated as any,
    },
  });

  return updated;
}
