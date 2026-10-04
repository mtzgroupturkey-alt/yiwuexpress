import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/autopilot/integrations/telegram-bot';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const providedSecret = request.headers.get('x-telegram-bot-api-secret-token');

    // If TELEGRAM_WEBHOOK_SECRET is set in environment, enforce matching token
    if (expectedSecret && providedSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid Telegram secret token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await handleTelegramUpdate(body);

    return NextResponse.json({
      success: true,
      handled: result.handled,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Telegram webhook handling error' },
      { status: 500 }
    );
  }
}
