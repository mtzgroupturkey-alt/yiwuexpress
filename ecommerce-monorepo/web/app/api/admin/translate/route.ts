export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'
import { getApiKeys } from '@/lib/api-keys'

const TARGET_LOCALES = ['ru', 'zh'] as const
type TargetLocale = (typeof TARGET_LOCALES)[number]

const LOCALE_NAMES: Record<TargetLocale, string> = {
  ru: 'Russian',
  zh: 'Simplified Chinese',
}

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free'
const HTTP_REFERER = process.env.OPENROUTER_REFERER || 'http://localhost:3000'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'

interface TranslateRequest {
  fields?: Record<string, string>
  targetLocales?: string[]
}

/**
 * Universal Translation Guard Pass — identical expert system instructions sent
 * to every provider model (OpenRouter, DeepSeek, Qwen, Moonshot, Gemini). Do not alter.
 */
const SYSTEM_PROMPT =
  'You are an expert e-commerce and logistics translator. Translate the provided key-value dictionary into the requested target locales. ' +
  'Maintain all HTML tags, variables, placeholders, or layout structures exactly as they are. ' +
  'Return your answer strictly as a valid, parsable minified JSON object mapping each locale to its translated key-value pairs. ' +
  'Do not include markdown codeblocks, backticks (e.g. ```json), or any conversational prose.'

// Few-shot example to anchor the expected JSON shape.
const FEW_SHOT_EXAMPLE = {
  ru: {
    name: 'Прочная транспортная коробка',
    description: 'Двухслойная коробка из гофрокартона для международных грузов.',
  },
  zh: {
    name: '重型运输箱',
    description: '用于国际貨物的双层瓦楞纸箱。',
  },
}

/**
 * Typed result wrapper for every provider call.
 * - ok: true  → translations parsed successfully
 * - ok: false → provider failed; `retryable` signals a 429/timeout/network
 *           condition that should trigger the next tier.
 */
interface ProviderResult {
  ok: boolean
  translations?: Record<string, Record<string, string>>
  error?: string
  retryable: boolean
}

interface ProviderContext {
  targetLocales: TargetLocale[]
  fieldKeys: string[]
  trimmedFields: Record<string, string>
  apiKey?: string | null
  geminiApiKey?: string | null
  deepseekApiKey?: string | null
  qwenApiKey?: string | null
  kimiApiKey?: string | null
}

const DEFAULT_TIMEOUT_MS = 25_000

// ---------------------------------------------------------------------------
// TIER 1 — OpenRouter (Primary)
// ---------------------------------------------------------------------------
async function callOpenRouter(
  ctx: ProviderContext,
): Promise<ProviderResult> {
  const apiKey = ctx.apiKey
  if (!apiKey) {
    return { ok: false, error: 'OPENROUTER_API_KEY missing', retryable: true }
  }

  const userPrompt =
    `Target Locales: [${ctx.targetLocales.join(', ')}]\n` +
    `Data to translate: ${JSON.stringify(ctx.trimmedFields)}`

  let res: Response
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': HTTP_REFERER,
        'X-Title': 'Admin Translation Hub',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              'Target Locales: [ru, zh]\n' +
              'Data to translate: {"name": "Heavy Duty Shipping Box", "description": "Double-walled corrugated cardboard box for international cargo."}',
          },
          { role: 'assistant', content: JSON.stringify(FEW_SHOT_EXAMPLE) },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })
  } catch (err) {
    // Network failure / timeout — cascade to the next tier.
    return {
      ok: false,
      retryable: true,
      error: `OpenRouter network error: ${err instanceof Error ? err.message : 'unknown'}`,
    }
  }

  if (res.status === 429) {
    return { ok: false, retryable: true, error: 'OpenRouter rate limited (429).' }
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    return {
      ok: false,
      retryable: false,
      error: `OpenRouter provider error (${res.status}). ${errText.slice(0, 300)}`,
    }
  }

  const json = await res.json().catch(() => null)
  const rawText: string = json?.choices?.[0]?.message?.content ?? ''
  return finalizeFromRaw(rawText, ctx, 'OpenRouter')
}

// ---------------------------------------------------------------------------
// TIER 2 — DeepSeek (First Failover)
// ---------------------------------------------------------------------------
async function callDeepSeek(
  ctx: ProviderContext,
): Promise<ProviderResult> {
  const apiKey = ctx.deepseekApiKey
  if (!apiKey) {
    return { ok: false, error: 'DEEPSEEK_API_KEY missing', retryable: true }
  }

  // Exact OpenAI-compatible body design mirroring Tier 1.
  const userPrompt =
    `Target Locales: [${ctx.targetLocales.join(', ')}]\n` +
    `Data to translate: ${JSON.stringify(ctx.trimmedFields)}`

  let res: Response
  try {
    res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              'Target Locales: [ru, zh]\n' +
              'Data to translate: {"name": "Heavy Duty Shipping Box", "description": "Double-walled corrugated cardboard box for international cargo."}',
          },
          { role: 'assistant', content: JSON.stringify(FEW_SHOT_EXAMPLE) },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })
  } catch (err) {
    return {
      ok: false,
      retryable: true,
      error: `DeepSeek network error: ${err instanceof Error ? err.message : 'unknown'}`,
    }
  }

  if (res.status === 429) {
    return { ok: false, retryable: true, error: 'DeepSeek rate limited (429).' }
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    return {
      ok: false,
      retryable: false,
      error: `DeepSeek provider error (${res.status}). ${errText.slice(0, 300)}`,
    }
  }

  const json = await res.json().catch(() => null)
  const rawText: string = json?.choices?.[0]?.message?.content ?? ''
  return finalizeFromRaw(rawText, ctx, 'DeepSeek')
}

// ---------------------------------------------------------------------------
// TIER 3 — Alibaba Qwen (Second Failover, OpenAI-compatible dashscope mode)
// ---------------------------------------------------------------------------
async function callQwen(
  ctx: ProviderContext,
): Promise<ProviderResult> {
  const apiKey = ctx.qwenApiKey
  if (!apiKey) {
    return { ok: false, error: 'QWEN_API_KEY missing', retryable: true }
  }

  const userPrompt =
    `Target Locales: [${ctx.targetLocales.join(', ')}]\n` +
    `Data to translate: ${JSON.stringify(ctx.trimmedFields)}`

  let res: Response
  try {
    res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              'Target Locales: [ru, zh]\n' +
              'Data to translate: {"name": "Heavy Duty Shipping Box", "description": "Double-walled corrugated cardboard box for international cargo."}',
          },
          { role: 'assistant', content: JSON.stringify(FEW_SHOT_EXAMPLE) },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })
  } catch (err) {
    return {
      ok: false,
      retryable: true,
      error: `Qwen network error: ${err instanceof Error ? err.message : 'unknown'}`,
    }
  }

  if (res.status === 429) {
    return { ok: false, retryable: true, error: 'Qwen rate limited (429).' }
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    return {
      ok: false,
      retryable: false,
      error: `Qwen provider error (${res.status}). ${errText.slice(0, 300)}`,
    }
  }

  const json = await res.json().catch(() => null)
  const rawText: string = json?.choices?.[0]?.message?.content ?? ''
  return finalizeFromRaw(rawText, ctx, 'Qwen')
}

// ---------------------------------------------------------------------------
// TIER 4 — Moonshot AI / Kimi AI (Third Failover, OpenAI-compatible)
// ---------------------------------------------------------------------------
async function callMoonshot(
  ctx: ProviderContext,
): Promise<ProviderResult> {
  const apiKey = ctx.kimiApiKey
  if (!apiKey) {
    return { ok: false, error: 'KIMI_API_KEY missing', retryable: true }
  }

  const userPrompt =
    `Target Locales: [${ctx.targetLocales.join(', ')}]\n` +
    `Data to translate: ${JSON.stringify(ctx.trimmedFields)}`

  let res: Response
  try {
    res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              'Target Locales: [ru, zh]\n' +
              'Data to translate: {"name": "Heavy Duty Shipping Box", "description": "Double-walled corrugated cardboard box for international cargo."}',
          },
          { role: 'assistant', content: JSON.stringify(FEW_SHOT_EXAMPLE) },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })
  } catch (err) {
    return {
      ok: false,
      retryable: true,
      error: `Moonshot network error: ${err instanceof Error ? err.message : 'unknown'}`,
    }
  }

  if (res.status === 429) {
    return { ok: false, retryable: true, error: 'Moonshot rate limited (429).' }
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    return {
      ok: false,
      retryable: false,
      error: `Moonshot provider error (${res.status}). ${errText.slice(0, 300)}`,
    }
  }

  const json = await res.json().catch(() => null)
  const rawText: string = json?.choices?.[0]?.message?.content ?? ''
  return finalizeFromRaw(rawText, ctx, 'Moonshot')
}

// ---------------------------------------------------------------------------
// TIER 5 — Google Gemini (Ultimate Fallback)
//   Note: gemini-1.5-flash was retired; gemini-2.5-flash is unavailable to new
//   keys. Default is gemini-flash-latest (Google's stable rolling Flash alias).
//   Override with GEMINI_MODEL if Google rotates the available model list.
// ---------------------------------------------------------------------------
async function callGemini(
  ctx: ProviderContext,
): Promise<ProviderResult> {
  const apiKey = ctx.geminiApiKey
  if (!apiKey) {
    return { ok: false, error: 'GEMINI_API_KEY missing', retryable: false }
  }

  const userPrompt =
    `Target Locales: [${ctx.targetLocales.join(', ')}]\n` +
    `Data to translate: ${JSON.stringify(ctx.trimmedFields)}`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: { temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })
  } catch (err) {
    return {
      ok: false,
      retryable: false,
      error: `Gemini network error: ${err instanceof Error ? err.message : 'unknown'}`,
    }
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    return {
      ok: false,
      retryable: false,
      error: `Gemini provider error (${res.status}). ${errText.slice(0, 300)}`,
    }
  }

  const json = await res.json().catch(() => null)
  const rawText: string =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return finalizeFromRaw(rawText, ctx, 'Gemini')
}

// ---------------------------------------------------------------------------
// Shared parsing + locale/key filtering
// ---------------------------------------------------------------------------
/**
 * Safely extract a JSON object from the LLM output. Cleans accidental markdown
 * backticks / code fences before parsing, then falls back to the first {...} block.
 */
function parseJsonResponse(text: string): Record<string, any> | null {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim())
      } catch {
        /* fall through */
      }
    }
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

/**
 * Take a raw provider response string, purge markdown wrappers, parse, keep
 * only the requested locales + keys, and return a typed ProviderResult.
 */
function finalizeFromRaw(
  rawText: string,
  ctx: ProviderContext,
  provider: string,
): ProviderResult {
  if (!rawText) {
    return { ok: false, retryable: false, error: `${provider} returned an empty response.` }
  }

  const parsed = parseJsonResponse(rawText)
  if (!parsed) {
    return { ok: false, retryable: false, error: `${provider} response could not be parsed.` }
  }

  const translations: Record<string, Record<string, string>> = {}
  for (const locale of ctx.targetLocales) {
    const entry = parsed[locale]
    if (entry && typeof entry === 'object') {
      const cleaned: Record<string, string> = {}
      for (const key of ctx.fieldKeys) {
        const val = entry[key]
        if (typeof val === 'string' && val.trim().length > 0) {
          cleaned[key] = val
        }
      }
      if (Object.keys(cleaned).length > 0) translations[locale] = cleaned
    }
  }

  if (Object.keys(translations).length === 0) {
    return { ok: false, retryable: false, error: `${provider} returned no usable content.` }
  }

  return { ok: true, translations, retryable: false }
}

/**
 * POST /api/admin/translate
 * Secure admin-only hub that translates a batch of English key-value fields
 * into the requested target locales using a 5-Tier Cascading Failover AI Engine:
 *   1. OpenRouter   (primary)
 *   2. DeepSeek     (failover on 429 / network / timeout)
 *   3. Alibaba Qwen (second failover)
 *   4. Moonshot Kimi (third failover)
 *   5. Google Gemini (ultimate fallback)
 * The provider keys are read exclusively on the server and never returned.
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN'])
  } catch (error) {
    return createAuthErrorResponse(error as Error)
  }

  // Get API keys from database (with .env fallback)
  const apiKeys = await getApiKeys()
  const apiKey = apiKeys.openrouterApiKey
  
  if (!apiKey) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Translation service is not configured. Please add your OpenRouter API key in System Settings (Admin > Settings > System).' 
      },
      { status: 200 }
    )
  }

  let body: TranslateRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload.' },
      { status: 200 }
    )
  }

  const fields = body.fields || {}
  const targetLocales = (body.targetLocales || TARGET_LOCALES).filter(
    (l): l is TargetLocale => (TARGET_LOCALES as readonly string[]).includes(l)
  )

  const fieldKeys = Object.keys(fields).filter((k) => (fields[k] ?? '').toString().trim().length > 0)
  if (fieldKeys.length === 0 || targetLocales.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No translatable fields or target locales provided.' },
      { status: 200 }
    )
  }

  const trimmedFields: Record<string, string> = {}
  for (const k of fieldKeys) trimmedFields[k] = fields[k].toString()

  const baseCtx: ProviderContext = { 
    targetLocales, 
    fieldKeys, 
    trimmedFields,
    apiKey,  // OpenRouter
    geminiApiKey: apiKeys.geminiApiKey,
    deepseekApiKey: apiKeys.deepseekApiKey,
    qwenApiKey: apiKeys.qwenApiKey,
    kimiApiKey: apiKeys.kimiApiKey,
  }

  /**
   * Run the 5-tier cascading failover for ONE provider call. `ctx.targetLocales`
   * may carry one or more locales. Returns the parsed translations map.
   */
  async function runCascade(
    ctx: ProviderContext,
  ): Promise<{ ok: boolean; translations?: Record<string, Record<string, string>>; error?: string }> {
    const tier1 = await callOpenRouter(ctx)
    if (tier1.ok && tier1.translations) return { ok: true, translations: tier1.translations }

    console.warn('[Translate] Tier 1 failed. DeepSeek...', tier1.error)
    const tier2 = await callDeepSeek(ctx)
    if (tier2.ok && tier2.translations) return { ok: true, translations: tier2.translations }

    console.warn('[Translate] Tier 2 failed. Qwen...', tier2.error)
    const tier3 = await callQwen(ctx)
    if (tier3.ok && tier3.translations) return { ok: true, translations: tier3.translations }

    console.warn('[Translate] Tier 3 failed. Moonshot...', tier3.error)
    const tier4 = await callMoonshot(ctx)
    if (tier4.ok && tier4.translations) return { ok: true, translations: tier4.translations }

    console.warn('[Translate] Tier 4 failed. Gemini...', tier4.error)
    const tier5 = await callGemini(ctx)
    if (tier5.ok && tier5.translations) return { ok: true, translations: tier5.translations }

    return {
      ok: false,
      error: tier5.error || tier4.error || tier3.error || tier2.error || tier1.error || 'All providers failed.',
    }
  }

  // Primary pass: request every target locale in a single call (cheapest, and
  // avoids burning the free-tier rate limit with one request per locale).
  const translations: Record<string, Record<string, string>> = {}
  const primary = await runCascade(baseCtx)
  if (primary.ok && primary.translations) {
    for (const locale of targetLocales) {
      const entry = primary.translations[locale]
      if (entry && Object.keys(entry).length > 0) translations[locale] = entry
    }
  }

  // Refill pass: some free models silently drop a locale (e.g. return `zh` but
  // omit `ru`). Re-request ONLY the missing locales, one targeted call each.
  const missing = targetLocales.filter((l) => !translations[l])
  const refillErrors: string[] = []
  for (const locale of missing) {
    const res = await runCascade({ ...baseCtx, targetLocales: [locale] })
    if (res.ok && res.translations && res.translations[locale] && Object.keys(res.translations[locale]).length > 0) {
      translations[locale] = res.translations[locale]
    } else {
      refillErrors.push(locale)
    }
  }

  if (Object.keys(translations).length === 0) {
    const lastError = refillErrors.concat(missing).join(', ') || primary.error || 'All providers failed.'
    return NextResponse.json(
      { success: false, error: `Translation failed for: ${lastError}` },
      { status: 200 }
    )
  }

  const response: any = { success: true, translations }
  if (refillErrors.length > 0) {
    response.warning = `Completed with missing locales: ${refillErrors.join(', ')}`
  }
  return NextResponse.json(response)
}
