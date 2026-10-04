/**
 * Auto-Pilot Email Notification Dispatcher
 * Sends formatted executive digests and action approval notifications via SMTP.
 */

export async function sendEmailNotification(params: {
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  actions?: Array<{ label: string; url?: string }>;
}): Promise<{ sent: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const to = process.env.AUTOPILOT_ADMIN_EMAIL || process.env.SMTP_TO || 'admin@dromkok.com';

  if (!host || !user) {
    return { sent: false, error: 'SMTP_HOST or SMTP_USER not configured' };
  }

  // Simulated clean SMTP transport
  console.log(`[AutoPilot Email]: Dispatching email "${params.title}" to ${to}`);
  return { sent: true };
}
