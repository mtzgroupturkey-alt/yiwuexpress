export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);
  } catch (error) {
    return createAuthErrorResponse(error as Error);
  }

  try {
    const body = await request.json();
    const { apiKey, baseUrl, model } = body;

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, error: 'API Key is required to test the connection.' },
        { status: 400 }
      );
    }

    const cleanBaseUrl = (baseUrl && typeof baseUrl === 'string' && baseUrl.trim()
      ? baseUrl.trim()
      : 'https://llm.gcat.ir/v1'
    ).replace(/\/+$/, '');

    const endpoint = cleanBaseUrl.endsWith('/chat/completions')
      ? cleanBaseUrl
      : `${cleanBaseUrl}/chat/completions`;

    const targetModel = model && typeof model === 'string' && model.trim()
      ? model.trim()
      : 'auto/best-chat';

    const startTime = Date.now();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: 'user', content: 'Test connection from Yiwu Express. Respond with "Connection Successful".' }
        ],
        max_tokens: 25,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json({
        success: false,
        status: response.status,
        latencyMs,
        error: `Gateway returned status ${response.status} (${response.statusText}): ${errorText.slice(0, 300)}`,
      });
    }

    const data = await response.json().catch(() => null);
    const replyText = data?.choices?.[0]?.message?.content?.trim() || 'Connected successfully';

    return NextResponse.json({
      success: true,
      status: response.status,
      latencyMs,
      model: targetModel,
      reply: replyText,
      message: `Gateway connection verified in ${latencyMs}ms with model "${targetModel}".`,
    });
  } catch (error: any) {
    console.error('Error testing AI connection:', error);
    const isTimeout = error?.name === 'TimeoutError' || error?.message?.includes('timeout');
    return NextResponse.json({
      success: false,
      error: isTimeout
        ? 'Connection timed out after 15 seconds. Please verify the Base URL is reachable.'
        : error?.message || 'Failed to connect to the AI Gateway.',
    });
  }
}
