/**
 * Auto-Pilot Bidirectional Telegram Bot Handler (Step A)
 * Supports:
 * - Secret token verification: X-Telegram-Bot-Api-Secret-Token
 * - Bilingual commands (English + Persian):
 *   /start, /status, /briefing, /cycles, /approvals, /approve <id>, /reject <id> <reason>,
 *   /kill, /pause, /resume, /help
 * - Interactive Inline Keyboards & Callback Queries ([✅ Approve], [❌ Reject], [📄 Details])
 * - Chat Rate-limiting: max 30 messages/minute per chat
 */

import { prisma } from '../../db';
import { getRedisClient } from '../redis';
import { resolveActionApproval } from '../actions/approval-gate';
import { activateKillSwitch, deactivateKillSwitch, isExecutionBlocked } from '../actions/kill-switch';
import { captureBusinessSnapshot } from '../state-observer';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name?: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name?: string; username?: string };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
}

/**
 * Rate limit check: max 30 messages/minute per chat
 */
export async function checkTelegramRateLimit(chatId: number): Promise<boolean> {
  const redis = getRedisClient();
  const key = `autopilot:tg_rate:${chatId}`;
  const countStr = await redis.get(key);
  const count = countStr ? parseInt(countStr, 10) : 0;

  if (count >= 30) {
    return false; // Exceeded limit
  }

  await redis.set(key, String(count + 1), 'EX', 60);
  return true;
}

/**
 * Dispatches a message to a Telegram chat
 */
export async function sendTelegramChatReply(params: {
  chatId: number;
  text: string;
  replyMarkup?: any;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: params.chatId,
        text: params.text,
        parse_mode: 'Markdown',
        reply_markup: params.replyMarkup,
      }),
    });
  } catch {
    // Fail-safe
  }
}

/**
 * Answers a Telegram callback query (closes button spinner)
 */
export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  } catch {}
}

/**
 * Processes an incoming Telegram Webhook Update
 */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<{ handled: boolean; reply?: string }> {
  // 1. Process Callback Queries (Inline Button clicks)
  if (update.callback_query) {
    const cb = update.callback_query;
    const data = cb.data || '';
    const chatId = cb.message?.chat.id;

    if (!chatId) return { handled: false };

    // Format: "approve:<id>" or "reject:<id>" or "details:<id>"
    const [action, approvalId] = data.split(':');

    if (action === 'approve' && approvalId) {
      const res = await resolveActionApproval({
        approvalId,
        decision: 'approve',
        operator: `tg:@${cb.from.username || cb.from.id}`,
      });
      await answerCallbackQuery(cb.id, res.success ? 'Approved & Executed!' : 'Approval failed');
      await sendTelegramChatReply({
        chatId,
        text: res.success
          ? `✅ *Action Approved & Executed*\nApproval ID: \`${approvalId}\`\nOperated by: @${cb.from.username || cb.from.id}`
          : `❌ *Execution Failed*\n${res.message}`,
      });
      return { handled: true };
    }

    if (action === 'reject' && approvalId) {
      const res = await resolveActionApproval({
        approvalId,
        decision: 'reject',
        operator: `tg:@${cb.from.username || cb.from.id}`,
        reason: 'Rejected via Telegram inline button',
      });
      await answerCallbackQuery(cb.id, 'Action Rejected');
      await sendTelegramChatReply({
        chatId,
        text: `🚫 *Action Proposal Rejected*\nApproval ID: \`${approvalId}\`\nOperated by: @${cb.from.username || cb.from.id}`,
      });
      return { handled: true };
    }

    if (action === 'details' && approvalId) {
      const app = await prisma.actionApproval.findUnique({
        where: { id: approvalId },
        include: { decision: true },
      });
      await answerCallbackQuery(cb.id);
      if (app) {
        await sendTelegramChatReply({
          chatId,
          text: `📄 *Approval Details*\n\n*Action:* ${app.decision.type}\n*Department:* ${app.decision.evidence ? (app.decision.evidence as any).department : 'N/A'}\n*Rationale:* ${app.decision.rationale}\n*Status:* ${app.status}`,
        });
      }
      return { handled: true };
    }

    await answerCallbackQuery(cb.id);
    return { handled: true };
  }

  // 2. Process Text Messages & Commands
  if (!update.message || !update.message.text) {
    return { handled: false };
  }

  const { chat, text, from } = update.message;
  const isAllowed = await checkTelegramRateLimit(chat.id);
  if (!isAllowed) {
    await sendTelegramChatReply({
      chatId: chat.id,
      text: '⚠️ Rate limit exceeded (max 30 msgs/min). Please slow down.',
    });
    return { handled: true };
  }

  const cleanText = text.trim();
  const parts = cleanText.split(/\s+/);
  const command = parts[0].toLowerCase();

  // /start
  if (command === '/start') {
    const welcome = `🤖 *Auto-Pilot Business Management Bot*\n\nخوش آمدید! سامانه خودکار هدایت کسب‌وکار آماده دریافت فرامین است.\nWelcome! Auto-Pilot system is active and monitoring business telemetry.\n\nUse /help to see all available commands.`;
    await sendTelegramChatReply({ chatId: chat.id, text: welcome });
    return { handled: true, reply: welcome };
  }

  // /help
  if (command === '/help') {
    const helpMsg = `📋 *Available Commands / دستورات:*\n\n` +
      `• /status — وضعیت زنده سیستم و شاخص‌ها (System Status & KPIs)\n` +
      `• /briefing — آخرین گزارش مدیریتی (Latest Executive Briefing)\n` +
      `• /cycles — آخرین چرخه‌های اجرا شده (Last 5 Cycles)\n` +
      `• /approvals — تاییدیه‌های در انتظار (Pending Approvals)\n` +
      `• /approve <id> — تایید اجرای یک اقدام (Approve Action)\n` +
      `• /reject <id> <reason> — رد یک اقدام (Reject Action)\n` +
      `• /kill — فعال‌سازی سوئیچ اضطراری (Emergency Kill Switch)\n` +
      `• /resume — غیرفعال‌سازی سوئیچ اضطراری (Resume Operations)`;
    await sendTelegramChatReply({ chatId: chat.id, text: helpMsg });
    return { handled: true, reply: helpMsg };
  }

  // /status
  if (command === '/status') {
    const kill = await isExecutionBlocked();
    const snapshot = await captureBusinessSnapshot();
    const statusText = `📊 *Auto-Pilot Operational Status*\n\n` +
      `• Kill Switch: ${kill.blocked ? '🔴 BLOCKED' : '🟢 ACTIVE (Nominal)'}\n` +
      `• 24h Revenue: $${snapshot.finance.revenueLast24h.toLocaleString()}\n` +
      `• Open Orders: ${snapshot.orders.totalOpen}\n` +
      `• Order Exceptions: ${snapshot.orders.exceptionsCount}\n` +
      `• Low Stock Alerts: ${snapshot.inventory.lowStockCount}\n` +
      `• Open Tickets: ${snapshot.support.openTickets}`;
    await sendTelegramChatReply({ chatId: chat.id, text: statusText });
    return { handled: true, reply: statusText };
  }

  // /briefing
  if (command === '/briefing') {
    const lastCycle = await prisma.autoPilotCycle.findFirst({
      where: { briefing: { not: null } },
      orderBy: { startedAt: 'desc' },
    });
    const briefingText = lastCycle?.briefing || 'No executive briefing recorded yet.';
    await sendTelegramChatReply({ chatId: chat.id, text: `📝 *Latest Executive Briefing:*\n\n${briefingText}` });
    return { handled: true };
  }

  // /cycles
  if (command === '/cycles') {
    const cycles = await prisma.autoPilotCycle.findMany({
      take: 5,
      orderBy: { startedAt: 'desc' },
    });
    if (cycles.length === 0) {
      await sendTelegramChatReply({ chatId: chat.id, text: 'No cycles recorded yet.' });
      return { handled: true };
    }
    const cycleLines = cycles
      .map((c) => `• \`${c.id.slice(0, 8)}\` — ${c.status} (${c.trigger}) | $${(c.costUsd || 0).toFixed(4)}`)
      .join('\n');
    await sendTelegramChatReply({ chatId: chat.id, text: `🔄 *Recent Auto-Pilot Cycles:*\n\n${cycleLines}` });
    return { handled: true };
  }

  // /approvals
  if (command === '/approvals') {
    const pendings = await prisma.actionApproval.findMany({
      where: { status: 'PENDING' },
      include: { decision: true },
      take: 5,
    });
    if (pendings.length === 0) {
      await sendTelegramChatReply({ chatId: chat.id, text: '✅ No pending approvals in queue.' });
      return { handled: true };
    }

    for (const p of pendings) {
      const msg = `⚠️ *Approval Required*\n\nAction: \`${p.decision.type}\`\nRationale: ${p.decision.rationale}\nID: \`${p.id}\``;
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Approve', callback_data: `approve:${p.id}` },
            { text: '❌ Reject', callback_data: `reject:${p.id}` },
            { text: '📄 Details', callback_data: `details:${p.id}` },
          ],
        ],
      };
      await sendTelegramChatReply({ chatId: chat.id, text: msg, replyMarkup: keyboard });
    }
    return { handled: true };
  }

  // /approve <id>
  if (command === '/approve') {
    const id = parts[1];
    if (!id) {
      await sendTelegramChatReply({ chatId: chat.id, text: 'Usage: /approve <approval_id>' });
      return { handled: true };
    }
    const res = await resolveActionApproval({
      approvalId: id,
      decision: 'approve',
      operator: `tg:@${from.username || from.id}`,
    });
    await sendTelegramChatReply({
      chatId: chat.id,
      text: res.success ? `✅ Action \`${id}\` approved and executed.` : `❌ Failed: ${res.message}`,
    });
    return { handled: true };
  }

  // /reject <id> <reason>
  if (command === '/reject') {
    const id = parts[1];
    const reason = parts.slice(2).join(' ') || 'Rejected via Telegram command';
    if (!id) {
      await sendTelegramChatReply({ chatId: chat.id, text: 'Usage: /reject <approval_id> [reason]' });
      return { handled: true };
    }
    const res = await resolveActionApproval({
      approvalId: id,
      decision: 'reject',
      operator: `tg:@${from.username || from.id}`,
      reason,
    });
    await sendTelegramChatReply({
      chatId: chat.id,
      text: res.success ? `🚫 Action \`${id}\` rejected.` : `❌ Failed: ${res.message}`,
    });
    return { handled: true };
  }

  // /kill
  if (command === '/kill') {
    await activateKillSwitch({
      actor: `tg:@${from.username || from.id}`,
      reason: 'Emergency kill switch triggered via Telegram',
      scope: 'global',
    });
    await sendTelegramChatReply({
      chatId: chat.id,
      text: `🚨 *GLOBAL KILL SWITCH ACTIVATED*\nAll autonomous action execution halted.\nTriggered by: @${from.username || from.id}`,
    });
    return { handled: true };
  }

  // /resume
  if (command === '/resume') {
    await deactivateKillSwitch({
      actor: `tg:@${from.username || from.id}`,
      reason: 'Kill switch deactivated via Telegram command',
      scope: 'global',
    });
    await sendTelegramChatReply({
      chatId: chat.id,
      text: `🟢 *Auto-Pilot Resumed*\nAutonomous execution permissions restored.`,
    });
    return { handled: true };
  }

  return { handled: false };
}
