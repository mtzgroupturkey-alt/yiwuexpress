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

    const isZai = cleanBaseUrl.includes('z.ai') || cleanBaseUrl.includes('bigmodel.cn');
    const isFreeModel = targetModel.includes('flash') || targetModel.includes(':free') || targetModel === 'qwen-max' || targetModel === 'qwen-flash';
    const freeStatus = isFreeModel ? 'Free Model' : 'Standard Tier';

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
          { role: 'user', content: 'hello' }
        ],
        max_tokens: 25,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let parsedErrorMsg = '';
      try {
        const errJson = JSON.parse(errorText);
        parsedErrorMsg = errJson?.error?.message || errJson?.message || '';
      } catch {}

      let userFriendlyError = '';
      if (isZai) {
        userFriendlyError = `Z.ai returned HTTP ${response.status}${parsedErrorMsg ? ` (${parsedErrorMsg})` : ''}\nCheck your API key in Admin > Settings > System\nFree models: glm-4.7-flash, glm-4.5-flash`;
      } else if (response.status === 402 || errorText.includes('insufficient_quota') || errorText.includes('wallet balance')) {
        userFriendlyError = `Gateway returned 402 (Payment Required): ${parsedErrorMsg || 'Insufficient wallet balance'}. Please deposit funds into your wallet at your provider portal, or switch to OpenRouter / Gemini.`;
      } else if (response.status === 401) {
        userFriendlyError = `Invalid API Key (HTTP 401 Unauthorized): ${parsedErrorMsg || 'Please verify and re-enter your key.'}`;
      } else if (response.status === 404) {
        userFriendlyError = `Model or endpoint not found (HTTP 404): ${parsedErrorMsg || `Please check if "${targetModel}" is supported.`}`;
      } else {
        userFriendlyError = `Gateway returned status ${response.status} (${response.statusText}): ${parsedErrorMsg || errorText.slice(0, 300)}`;
      }

      return NextResponse.json({
        success: false,
        status: response.status,
        latencyMs,
        error: userFriendlyError,
        rawError: errorText,
      });
    }

    const data = await response.json().catch(() => null);
    const replyText = data?.choices?.[0]?.message?.content?.trim() || 'Connected successfully';

    return NextResponse.json({
      success: true,
      status: response.status,
      latencyMs,
      model: targetModel,
      isFree: isFreeModel,
      freeStatus,
      reply: replyText,
      message: `Connection verified in ${latencyMs}ms with model "${targetModel}" (${freeStatus}).`,
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
