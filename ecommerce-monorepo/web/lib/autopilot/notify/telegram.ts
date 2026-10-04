/**
 * Auto-Pilot Telegram Notification Dispatcher
 * Sends formatted alert messages and interactive inline approval keyboards
 * via Telegram Bot API.
 */

export interface TelegramButton {
  label: string;
  url?: string;
  callback?: string;
}

export async function sendTelegramNotification(params: {
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  actions?: TelegramButton[];
}): Promise<{ sent: boolean; messageId?: number; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { sent: false, error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured' };
  }

  const icon = params.severity === 'critical' ? '🚨' : params.severity === 'warning' ? '⚠️' : 'ℹ️';
  const text = `${icon} *${params.title}*\n\n${params.body}`;

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
  };

  if (params.actions && params.actions.length > 0) {
    payload.reply_markup = {
      inline_keyboard: [
        params.actions.map((act) => ({
          text: act.label,
          url: act.url,
          callback_data: act.callback || act.label,
        })),
      ],
    };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { sent: false, error: data.description || 'Telegram API error' };
    }

    return { sent: true, messageId: data.result?.message_id };
  } catch (err: any) {
    return { sent: false, error: err.message || 'Network error reaching Telegram' };
  }
}
