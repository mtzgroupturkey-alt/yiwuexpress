/**
 * Z.ai (Zhipu GLM) Provider Adapter
 *
 * Implements OpenAI-compatible chat completions for Z.ai / BigModel PaaS.
 * Dedicated to free Flash models:
 *   - glm-4.7-flash (chat, free) — default
 *   - glm-4.5-flash (chat, free)
 *   - glm-4.6v-flash (vision, free)
 *
 * Base URLs:
 *   - International: https://api.z.ai/api/paas/v4
 *   - China (Mainland): https://open.bigmodel.cn/api/paas/v4
 */

export const ZAI_ENDPOINTS = {
  international: 'https://api.z.ai/api/paas/v4',
  china: 'https://open.bigmodel.cn/api/paas/v4',
} as const

export const ZAI_FREE_MODELS = [
  'glm-4.7-flash',
  'glm-4.5-flash',
  'glm-4.6v-flash',
] as const

export type ZaiModel = (typeof ZAI_FREE_MODELS)[number] | string

export const DEFAULT_ZAI_MODEL: ZaiModel = 'glm-4.7-flash'
export const DEFAULT_ZAI_VISION_MODEL: ZaiModel = 'glm-4.6v-flash'
export const DEFAULT_ZAI_BASE_URL = ZAI_ENDPOINTS.international

export interface ZaiMessageContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
  }
}

export interface ZaiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ZaiMessageContentPart[]
}

export interface ZaiChatCompletionOptions {
  apiKey?: string | null
  baseUrl?: string | null
  model?: ZaiModel
  messages: ZaiMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
  timeoutMs?: number
  maxRetries?: number
}

export interface ZaiChatCompletionResponse {
  content: string
  modelUsed: string
  provider: 'Z.ai (GLM)'
  latencyMs: number
  rawResponse?: any
}

export interface ZaiStreamChunk {
  delta: string
  isDone: boolean
  model?: string
}

/**
 * Normalizes Z.ai base URL to ensure clean /chat/completions endpoint
 */
export function getZaiChatEndpoint(rawBaseUrl?: string | null): string {
  const base = (rawBaseUrl && rawBaseUrl.trim()
    ? rawBaseUrl.trim()
    : DEFAULT_ZAI_BASE_URL
  ).replace(/\/+$/, '')

  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`
}

/**
 * Standardized user-friendly error formatting for Z.ai
 */
export function formatZaiErrorMessage(
  status: number | string,
  detail?: string
): string {
  const detailStr = detail ? ` (${detail})` : ''
  return `Z.ai returned HTTP ${status}${detailStr}\nCheck your API key in Admin > Settings > System\nFree models: glm-4.7-flash, glm-4.5-flash`
}

/**
 * Helper to sleep for exponential backoff
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Execute chat completion call to Z.ai (GLM)
 * Supports retry on 429 with exponential backoff
 */
export async function callZaiChatCompletion(
  options: ZaiChatCompletionOptions
): Promise<ZaiChatCompletionResponse> {
  const {
    apiKey,
    baseUrl = DEFAULT_ZAI_BASE_URL,
    model = DEFAULT_ZAI_MODEL,
    messages,
    temperature = 0.3,
    max_tokens = 4000,
    timeoutMs = 25_000,
    maxRetries = 2,
  } = options

  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      `Z.ai API key is missing. Please configure your key in Admin > Settings > System > Z.ai (GLM).`
    )
  }

  const endpoint = getZaiChatEndpoint(baseUrl)
  const startTime = Date.now()

  let lastError: Error | null = null
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
          stream: false,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      })

      const latencyMs = Date.now() - startTime

      if (response.ok) {
        const json = await response.json()
        const content = json?.choices?.[0]?.message?.content || ''
        return {
          content,
          modelUsed: model,
          provider: 'Z.ai (GLM)',
          latencyMs,
          rawResponse: json,
        }
      }

      // Handle 429 (Rate Limit) with backoff retry
      if (response.status === 429 && attempt < maxRetries) {
        attempt++
        const retryAfterHeader = response.headers.get('retry-after')
        const delayMs = retryAfterHeader
          ? Math.max(1000, parseInt(retryAfterHeader, 10) * 1000)
          : attempt * 1200
        console.warn(
          `[Z.ai Provider] Rate limit 429 hit. Retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})...`
        )
        await sleep(delayMs)
        continue
      }

      // Non-retried or exhausted errors
      const errText = await response.text().catch(() => '')
      let errorDetail = ''
      try {
        const errJson = JSON.parse(errText)
        errorDetail = errJson?.error?.message || errJson?.message || ''
      } catch {
        errorDetail = errText.slice(0, 150)
      }

      throw new Error(formatZaiErrorMessage(response.status, errorDetail))
    } catch (err: any) {
      lastError = err

      const isNetworkError =
        err?.name === 'TimeoutError' ||
        err?.code === 'ENOTFOUND' ||
        err?.code === 'ETIMEDOUT' ||
        err?.message?.includes('fetch failed')

      if (isNetworkError && attempt < maxRetries) {
        attempt++
        const delayMs = attempt * 1000
        console.warn(
          `[Z.ai Provider] Network error (${err?.message}). Retrying in ${delayMs}ms...`
        )
        await sleep(delayMs)
        continue
      }

      break
    }
  }

  throw lastError || new Error(`Z.ai request failed after ${attempt} attempts.`)
}

/**
 * Execute streaming chat completion call to Z.ai (GLM)
 * Async generator that yields text deltas
 */
export async function* streamZaiChatCompletion(
  options: ZaiChatCompletionOptions
): AsyncGenerator<ZaiStreamChunk, void, unknown> {
  const {
    apiKey,
    baseUrl = DEFAULT_ZAI_BASE_URL,
    model = DEFAULT_ZAI_MODEL,
    messages,
    temperature = 0.3,
    max_tokens = 4000,
    timeoutMs = 30_000,
  } = options

  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      `Z.ai API key is missing. Please configure your key in Admin > Settings > System > Z.ai (GLM).`
    )
  }

  const endpoint = getZaiChatEndpoint(baseUrl)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream: true,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(formatZaiErrorMessage(response.status, errText.slice(0, 150)))
  }

  if (!response.body) {
    throw new Error('Z.ai returned an empty response body for streaming.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) continue

        if (trimmed === 'data: [DONE]') {
          yield { delta: '', isDone: true, model }
          return
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6))
            const delta = data?.choices?.[0]?.delta?.content || ''
            if (delta) {
              yield { delta, isDone: false, model }
            }
          } catch {
            // Ignore malformed partial chunks in SSE stream
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  yield { delta: '', isDone: true, model }
}
