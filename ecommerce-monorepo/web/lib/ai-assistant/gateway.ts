import dns from 'dns'
// Fix IPv6 fetch failures on Linux hosts — must run before any fetch() call
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first')
}
import { getApiKeys, ApiKeys, getDefaultOpenRouterFallbackKey } from '@/lib/api-keys'
import { callZaiChatCompletion, formatZaiErrorMessage } from '@/lib/ai/providers/zai'
import { AdminChatLocale, PendingAction } from './types'

export interface AssistantCallParams {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  locale: AdminChatLocale
  contextData?: string
}

export interface AssistantResponse {
  content: string
  pendingAction?: PendingAction | null
  providerUsed: string
  modelUsed: string
}

/**
 * Build the system prompt strictly enforcing confirmation rules,
 * catalog expertise, and active admin panel language (en/ru/zh only).
 */
export function buildSystemPrompt(locale: AdminChatLocale, contextData?: string): string {
  const languageNames: Record<AdminChatLocale, string> = {
    en: 'English (en)',
    ru: 'Russian (ru)',
    zh: 'Simplified Chinese (zh)',
  }

  const activeLangName = languageNames[locale] || 'English (en)'

  return `You are the Senior E-Commerce Catalog & Taxonomies AI Assistant for the Dromkok Admin Panel.
You help authenticated administrators organize categories, configure product attributes, inspect catalog health, and manage multilingual translations.

=========================================
CRITICAL LANGUAGE RULES (MUST OBEY):
1. The active admin panel language is: ${activeLangName}.
2. You MUST ALWAYS write all your explanations, thoughts, summaries, and confirmation requests in ${activeLangName}.
3. STRICT PROHIBITION: You must NEVER use or display the Persian (Farsi) language under ANY circumstances (neither in answers, nor in translations, nor in examples). Supported languages are ONLY English (en), Russian (ru), and Chinese (zh).
4. When proposing translations for e-commerce entities, provide translations strictly for: English (en), Russian (ru), and Chinese (zh).

=========================================
CRITICAL INFRASTRUCTURE RULES (MUST OBEY):
5. You are ALWAYS connected and operational. NEVER say the AI gateway is "offline", "unavailable", "not configured", or any variation thereof. NEVER mention API keys, providers, gateways, or backend connectivity in your responses. If the system is talking to you, it is online.
6. Do NOT add disclaimers, footnotes, or parenthetical notes about your technical infrastructure, API key status, or provider availability.

=========================================
CRITICAL SAFETY & CONFIRMATION RULES (MUST OBEY):
1. You have NO DIRECT WRITE PERMISSIONS to the database. You CANNOT write anything to the database without explicit confirmation from the administrator.
2. Whenever the admin asks you to create categories, create attributes, create products, or bulk-translate items:
   a. You MUST provide a clear, concise summary (1-2 sentences) of what you propose to create, followed by the confirmation question.
   b. DO NOT write out lengthy product descriptions, exhaustive tables, or repetitive translation dumps in the chat prose text. The admin UI automatically renders a rich, visual interactive preview card (with thumbnail photos, badges, price, and translation chips) directly from your action_proposal JSON!
   c. Put all entity details, translations (en, ru, zh), images, prices, and hierarchies strictly inside the \`\`\`action_proposal code block.
   d. Never tell the user "I have created..." or "Successfully added..." until the user has actually confirmed and the operation was executed.
   e. Formulate your confirmation question in ${activeLangName}:
      - If English: "Do you confirm creating these items? Please reply with **yes** or **confirm** to proceed, or click Confirm & Apply."
      - If Russian: "Вы подтверждаете создание этих элементов? Пожалуйста, ответьте **да** или **подтверждаю** для продолжения."
      - If Chinese: "您确认创建这些项目吗？请回复 **确认** 或 **yes** 以继续。"

3. When proposing an action that requires confirmation, you MUST append a machine-readable JSON block inside \`\`\`action_proposal code block:
\`\`\`action_proposal
{
  "type": "createCategories" | "createAttributes" | "createProducts" | "bulkTranslate",
  "summary": "Brief description of the action",
  "payload": {
    // For createCategories:
    "categories": [
      {
        "name": "Power Tools",
        "slug": "power-tools",
        "parentName": "Tools & Hardware",
        "translations": {
          "en": { "name": "Power Tools", "description": "Electric and cordless tools" },
          "ru": { "name": "Электроинструменты", "description": "Электрические и аккумуляторные инструменты" },
          "zh": { "name": "电动工具", "description": "电动和无绳工具" }
        }
      }
    ],
    // For createAttributes:
    "attributes": [
      {
        "name": "Voltage",
        "slug": "voltage",
        "type": "SELECT",
        "options": ["110V", "220V", "Dual Voltage"],
        "placeholder": "e.g. 220V",
        "categoryNames": ["Power Tools"],
        "translations": {
          "en": { "name": "Voltage" },
          "ru": { "name": "Напряжение" },
          "zh": { "name": "电压" }
        }
      }
    ],
    // For createProducts:
    "products": [
      {
        "name": "Professional 8-Piece Knife Block Set",
        "slug": "professional-8-piece-knife-set",
        "sku": "CK-SET-001",
        "categoryName": "Cutlery & Knives",
        "price": 79.99,
        "description": "High carbon stainless steel kitchen knife set with wooden block.",
        "images": [
          "https://images.unsplash.com/photo-1593618998160-e34014e67546"
        ],
        "translations": {
          "en": { "name": "Professional 8-Piece Knife Block Set" },
          "ru": { "name": "Профессиональный набор кухонных ножей из 8 предметов" },
          "zh": { "name": "专业8件套实木刀座刀具套装" }
        }
      }
    ],
    // For bulkTranslate:
    "translations": {
      "type": "products" | "categories" | "attributes",
      "itemIds": ["id1", "id2"],
      "targetLocales": ["ru", "zh"]
    }
  }
}
\`\`\`

=========================================
CURRENT CATALOG CONTEXT:
${contextData || 'No context loaded yet.'}
`
}

/**
 * Sanitize unescaped control characters inside JSON strings (e.g. raw newlines or tabs)
 * and auto-close unclosed string literals / nested arrays before subsequent JSON structures.
 */
function sanitizeJsonString(raw: string): string {
  let inString = false
  let escaped = false
  let out = ''

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (escaped) {
      out += ch
      escaped = false
      continue
    }
    if (ch === '\\') {
      out += ch
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      out += ch
      continue
    }
    if (inString) {
      if (ch === '\n' || ch === '\r') {
        // Look ahead: does the following line look like JSON structure (e.g. "key": or } or ])?
        const remainder = raw.slice(i + 1).trimStart()
        if (
          remainder.startsWith('}') ||
          remainder.startsWith(']') ||
          remainder.startsWith(',') ||
          /^"[a-zA-Z0-9_-]+"\s*:/.test(remainder)
        ) {
          // Unclosed string literal before next JSON token -> auto-close string quote
          out += '"'
          inString = false
          // Check if inside unclosed array before object closing brace '}'
          const openArrays = (out.match(/\[/g) || []).length
          const closeArrays = (out.match(/\]/g) || []).length
          if (remainder.startsWith('}') && openArrays > closeArrays) {
            out += '\n]'
          }
          out += ch
          continue
        }
        out += ch === '\n' ? '\\n' : '\\r'
        continue
      }
      if (ch === '\t') {
        out += '\\t'
        continue
      }
      const code = ch.charCodeAt(0)
      if (code < 32) {
        out += '\\u' + code.toString(16).padStart(4, '0')
        continue
      }
    }
    out += ch
  }
  if (inString) {
    out += '"'
  }
  return out
}

/**
 * Attempt to repair slightly truncated or ill-formed JSON
 */
function tryRepairJson(str: string): any {
  // Step 1: Direct parse
  try {
    return JSON.parse(str)
  } catch {
    // continue to sanitize
  }

  // Step 2: Sanitize control characters in string literals
  const sanitized = sanitizeJsonString(str)
  try {
    return JSON.parse(sanitized)
  } catch {
    // continue to repair truncation
  }

  // Step 3: Repair truncation / unclosed braces
  try {
    let trimmed = sanitized.trim()
    trimmed = trimmed.replace(/,\s*$/, '')

    const lastObjectClose = Math.max(trimmed.lastIndexOf('},'), trimmed.lastIndexOf('}'))
    if (lastObjectClose > 10) {
      trimmed = trimmed.substring(0, lastObjectClose + 1)
    }

    const openBrackets = (trimmed.match(/\[/g) || []).length
    const closeBrackets = (trimmed.match(/\]/g) || []).length
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      trimmed += ']'
    }

    const openBraces = (trimmed.match(/{/g) || []).length
    const closeBraces = (trimmed.match(/}/g) || []).length
    for (let i = 0; i < openBraces - closeBraces; i++) {
      trimmed += '}'
    }

    return JSON.parse(trimmed)
  } catch (err: any) {
    console.warn('[AI Assistant] trimmed JSON.parse error:', err?.message)
    return null
  }
}

/**
 * Extract action_proposal block from the assistant's text
 */
export function extractActionProposal(text: string): {
  cleanText: string
  pendingAction: PendingAction | null
} {
  // 1. Try explicit ```action_proposal block (closed or unclosed)
  let rawJson = ''
  let cleanText = text

  const explicitRegex = /```(?:action_proposal|json\s+action_proposal)\s*([\s\S]*?)(?:```|$)/i
  const explicitMatch = text.match(explicitRegex)

  if (explicitMatch && explicitMatch[1]) {
    rawJson = explicitMatch[1].trim()
    cleanText = text.replace(explicitRegex, '').trim()
  } else {
    // 2. Try generic code block containing action type
    const genericCodeRegex = /```(?:json)?\s*(\{[\s\S]*?"type"\s*:\s*"(?:createCategories|createAttributes|createProducts|bulkTranslate)"[\s\S]*?\})\s*(?:```|$)/i
    const genericMatch = text.match(genericCodeRegex)
    if (genericMatch && genericMatch[1]) {
      rawJson = genericMatch[1].trim()
      cleanText = text.replace(genericCodeRegex, '').trim()
    } else {
      // 3. Try raw JSON object in text
      const rawJsonRegex = /(\{[\s\S]*?"type"\s*:\s*"(?:createCategories|createAttributes|createProducts|bulkTranslate)"[\s\S]*?"payload"\s*:\s*\{[\s\S]*?\})/i
      const rawMatch = text.match(rawJsonRegex)
      if (rawMatch && rawMatch[1]) {
        rawJson = rawMatch[1].trim()
        cleanText = text.replace(rawJsonRegex, '').trim()
      }
    }
  }

  if (!rawJson) {
    return { cleanText: text.trim(), pendingAction: null }
  }

  try {
    const parsed = tryRepairJson(rawJson)
    if (parsed && parsed.type && parsed.payload) {
      const pendingAction: PendingAction = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: parsed.type,
        summary: parsed.summary || 'Database write operation',
        payload: parsed.payload,
        status: 'PENDING',
        createdAt: Date.now(),
      }
      return { cleanText, pendingAction }
    }
  } catch (err) {
    console.warn('[AI Assistant] Failed to parse action_proposal JSON:', err)
  }

  return { cleanText: cleanText.trim(), pendingAction: null }
}

/**
 * Call the AI Gateway with fallback through configured providers.
 */
export async function generateAssistantResponse(
  params: AssistantCallParams
): Promise<AssistantResponse> {
  // Enforce IPv4 DNS resolution on Linux at runtime before any network call
  try {
    const dns = await import('dns')
    if (typeof dns.setDefaultResultOrder === 'function') {
      dns.setDefaultResultOrder('ipv4first')
    }
  } catch {}

  const { messages, locale, contextData } = params
  const apiKeys = await getApiKeys()
  const systemPrompt = buildSystemPrompt(locale, contextData)

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  const providerErrors: string[] = []

  // Helper to call Z.ai (GLM) provider adapter
  const tryZai = async (): Promise<AssistantResponse | null> => {
    if (!apiKeys.zaiApiKey) return null
    const zaiKey = apiKeys.zaiApiKey.trim()
    const baseUrl = apiKeys.zaiBaseUrl || 'https://api.z.ai/api/paas/v4'
    const modelsToTry = [
      apiKeys.zaiModel && apiKeys.zaiModel.trim() ? apiKeys.zaiModel.trim() : 'glm-4.7-flash',
      'glm-4.7-flash',
      'glm-4.5-flash',
    ].filter((m, idx, arr) => arr.indexOf(m) === idx)

    for (const model of modelsToTry) {
      try {
        const result = await callZaiChatCompletion({
          apiKey: zaiKey,
          baseUrl,
          model,
          messages: fullMessages as any,
          temperature: 0.2,
          max_tokens: 4000,
          timeoutMs: 25_000,
        })
        if (result.content && result.content.trim()) {
          const { cleanText, pendingAction } = extractActionProposal(result.content)
          return {
            content: cleanText || result.content,
            pendingAction,
            providerUsed: 'Z.ai (GLM)',
            modelUsed: model,
          }
        }
      } catch (err: any) {
        console.warn(`[AI Assistant] Z.ai (${model}) call failed:`, err?.message)
        const errMsg = err?.message || formatZaiErrorMessage(500, 'Connection failed')
        if (!providerErrors.includes(errMsg)) {
          providerErrors.push(errMsg)
        }
      }
    }
    return null
  }

  // If Z.ai is configured as the primary provider, invoke it first
  if (apiKeys.primaryAiProvider === 'zai') {
    const zaiResponse = await tryZai()
    if (zaiResponse) return zaiResponse
  }

  // Provider 1: OpenAI-Compatible Gateway (Primary from SystemSettings)
  if (apiKeys.openaiApiKey) {
    const rawKey = apiKeys.openaiApiKey.trim()
    const baseUrl = (apiKeys.openaiBaseUrl || 'https://llm.gcat.ir/v1').trim().replace(/\/+$/, '')
    const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`
    const primaryModel = apiKeys.openaiModel || 'auto/best-chat'

    const isOpenRouter = baseUrl.includes('openrouter.ai') || rawKey.startsWith('sk-or-')
    const isDeepSeek = baseUrl.includes('deepseek')
    const isQwen = baseUrl.includes('dashscope') || baseUrl.includes('aliyuncs') || baseUrl.includes('modelstudio') || rawKey.startsWith('sk-ws-')
    const isZai = baseUrl.includes('z.ai') || baseUrl.includes('bigmodel.cn')

    // Intelligently select candidate models based on provider so models don't 404
    const candidateModels: string[] = isOpenRouter
      ? [
          primaryModel && !primaryModel.startsWith('auto/') ? primaryModel : 'nvidia/nemotron-3-super-120b-a12b:free',
          'nvidia/nemotron-3-super-120b-a12b:free',
          'nvidia/nemotron-3.5-lightning:free',
          'qwen/qwen3.8-27b:free',
          'openrouter/free',
        ].filter((m, idx, arr) => arr.indexOf(m) === idx)
      : isDeepSeek
      ? ['deepseek-chat', primaryModel].filter((m, idx, arr) => arr.indexOf(m) === idx)
      : isQwen
      ? [
          primaryModel && !primaryModel.startsWith('auto/') ? primaryModel : 'qwen-max',
          'qwen-max',
          'qwen-flash',
          'qwen-plus',
          'qwen-turbo',
        ].filter((m, idx, arr) => arr.indexOf(m) === idx)
      : isZai
      ? [
          primaryModel && !primaryModel.startsWith('auto/') ? primaryModel : 'glm-4.7-flash',
          'glm-4.7-flash',
          'glm-4.5-flash',
        ].filter((m, idx, arr) => arr.indexOf(m) === idx)
      : [
          'agy/gemini-3.7-flash-low',
          'agy/gemini-3.5-flash-lite',
          'agy/gemini-3-flash',
          primaryModel,
        ].filter((m, idx, arr) => arr.indexOf(m) === idx)

    const requestHeaders: Record<string, string> = {
      Authorization: `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
    }

    if (isOpenRouter) {
      requestHeaders['HTTP-Referer'] = 'https://dromkok.com'
      requestHeaders['X-Title'] = 'Dromkok Admin AI Assistant'
    }

    let gatewayAccountError = false
    for (const model of candidateModels) {
      if (gatewayAccountError) break
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({
            model,
            messages: fullMessages,
            temperature: 0.2,
            max_tokens: 4000,
          }),
          signal: AbortSignal.timeout(20_000),
        })

        if (res.ok) {
          const json = await res.json()
          const rawContent = json?.choices?.[0]?.message?.content || ''
          if (rawContent && rawContent.trim()) {
            const { cleanText, pendingAction } = extractActionProposal(rawContent)
            return {
              content: cleanText || rawContent,
              pendingAction,
              providerUsed: isZai ? 'Z.ai (GLM)' : isQwen ? 'Alibaba Model Studio' : 'OpenAI-Compatible Gateway',
              modelUsed: model,
            }
          }
        } else if (res.status === 401 || res.status === 402) {
          const errBody = await res.text().catch(() => '')
          const reason = res.status === 402
            ? 'HTTP 402: Insufficient wallet balance on gateway. Please top up funds at your portal'
            : `HTTP 401: Unauthorized API key for gateway (${baseUrl})`
          console.warn(`[AI Assistant] Gateway account error: ${reason}`)
          providerErrors.push(reason)
          gatewayAccountError = true
        } else if (res.status === 403) {
          // Free quota exhausted on this specific model; try next model in candidateModels
          console.warn(`[AI Assistant] Gateway model (${model}) returned 403 (quota exhausted or access denied), trying next candidate`)
          continue
        } else {
          console.warn(`[AI Assistant] Gateway (${model}) returned status ${res.status}`)
        }
      } catch (err: any) {
        console.warn(`[AI Assistant] Gateway (${model}) call failed:`, err?.message)
        providerErrors.push(`Gateway network error (${baseUrl}): ${err?.message || 'Connection failed'}`)
        break
      }
    }
  }

  // Provider 2: DeepSeek Direct (Excellent for Mainland China production hosts)
  if (apiKeys.deepseekApiKey) {
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKeys.deepseekApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: fullMessages,
          temperature: 0.3,
          max_tokens: 4000,
        }),
        signal: AbortSignal.timeout(25_000),
      })

      if (res.ok) {
        const json = await res.json()
        const rawContent = json?.choices?.[0]?.message?.content || ''
        if (rawContent && rawContent.trim()) {
          const { cleanText, pendingAction } = extractActionProposal(rawContent)
          return {
            content: cleanText || rawContent,
            pendingAction,
            providerUsed: 'DeepSeek',
            modelUsed: 'deepseek-chat',
          }
        }
      } else {
        providerErrors.push(`DeepSeek API returned HTTP ${res.status}`)
      }
    } catch (err: any) {
      providerErrors.push(`DeepSeek error: ${err?.message}`)
    }
  }

  // Provider 3: Alibaba Qwen / Model Studio / DashScope (Tries Singapore Intl & China Mainland)
  if (apiKeys.qwenApiKey) {
    const qwenKey = apiKeys.qwenApiKey.trim()
    const endpoints = [
      'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', // Alibaba Cloud Model Studio (Singapore / ap-southeast-1)
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',      // Alibaba Cloud DashScope (China Mainland)
    ]
    const qwenModels = ['qwen-max', 'qwen-flash', 'qwen-plus', 'qwen-turbo']

    let qwenHandled = false
    for (const ep of endpoints) {
      if (qwenHandled) break
      for (const model of qwenModels) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${qwenKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: fullMessages,
              temperature: 0.3,
              max_tokens: 4000,
            }),
            signal: AbortSignal.timeout(25_000),
          })

          if (res.ok) {
            const json = await res.json()
            const rawContent = json?.choices?.[0]?.message?.content || ''
            if (rawContent && rawContent.trim()) {
              const { cleanText, pendingAction } = extractActionProposal(rawContent)
              qwenHandled = true
              return {
                content: cleanText || rawContent,
                pendingAction,
                providerUsed: 'Alibaba Qwen (Model Studio)',
                modelUsed: model,
              }
            }
          } else if (res.status === 401) {
            // Region mismatch for this endpoint, try next endpoint
            break
          } else if (res.status === 403 || res.status === 404) {
            // Model quota exhausted on this model, continue to next model
            continue
          } else {
            console.warn(`[AI Assistant] Qwen (${model} on ${ep}) returned status ${res.status}`)
          }
        } catch (err: any) {
          console.warn(`[AI Assistant] Qwen (${model} on ${ep}) failed:`, err?.message)
          break
        }
      }
    }
  }

  // Provider 4: Z.ai Direct (GLM Flash) Fallback
  if (apiKeys.primaryAiProvider !== 'zai' && apiKeys.zaiApiKey) {
    const zaiFallback = await tryZai()
    if (zaiFallback) return zaiFallback
  }

  // Provider 5: OpenRouter Fallback
  const openrouterKey = (
    apiKeys.openrouterApiKey ||
    getDefaultOpenRouterFallbackKey()
  ).trim()

  if (openrouterKey) {
    const models = [
      'nvidia/nemotron-3-super-120b-a12b:free',
      'nvidia/nemotron-3.5-lightning:free',
      'qwen/qwen3.8-27b:free',
      'google/gemma-4-31b-it:free',
      'openrouter/free',
    ]
    for (const model of models) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://dromkok.com',
            'X-Title': 'Dromkok Admin AI Assistant',
          },
          body: JSON.stringify({
            model,
            messages: fullMessages,
            temperature: 0.3,
            max_tokens: 4000,
          }),
          signal: AbortSignal.timeout(20_000),
        })

        if (res.ok) {
          const json = await res.json()
          const rawContent = json?.choices?.[0]?.message?.content || ''
          if (rawContent && rawContent.trim()) {
            const { cleanText, pendingAction } = extractActionProposal(rawContent)
            return {
              content: cleanText || rawContent,
              pendingAction,
              providerUsed: 'OpenRouter',
              modelUsed: model,
            }
          }
        } else {
          console.warn(`[AI Assistant] OpenRouter (${model}) returned status ${res.status}`)
        }
      } catch (err: any) {
        console.warn(`[AI Assistant] OpenRouter (${model}) failed:`, err?.message)
        const isNetworkBlocked =
          err?.name === 'TimeoutError' ||
          err?.code === 'ENOTFOUND' ||
          err?.code === 'ECONNRESET' ||
          err?.code === 'ETIMEDOUT' ||
          err?.message?.includes('fetch failed')
        if (isNetworkBlocked) {
          providerErrors.push(`OpenRouter: Connection blocked or unreachable from server network region`)
          break
        }
      }
    }
  }

  // Provider 5: Google Gemini Direct Fallback
  if (apiKeys.geminiApiKey) {
    const geminiKey = apiKeys.geminiApiKey.trim()
    const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
    for (const gModel of geminiModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: fullMessages.map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: `${m.role === 'system' ? '[SYSTEM INSTRUCTION]\n' : ''}${m.content}` }],
              })),
              generationConfig: { temperature: 0.3 },
            }),
            signal: AbortSignal.timeout(20_000),
          }
        )

        if (res.ok) {
          const json = await res.json()
          const rawContent = json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (rawContent && rawContent.trim()) {
            const { cleanText, pendingAction } = extractActionProposal(rawContent)
            return {
              content: cleanText || rawContent,
              pendingAction,
              providerUsed: 'Google Gemini',
              modelUsed: gModel,
            }
          }
        } else {
          providerErrors.push(`Gemini (${gModel}) returned HTTP ${res.status}`)
        }
      } catch (err: any) {
        console.warn(`[AI Assistant] Gemini (${gModel}) failed:`, err?.message)
        const isNetworkBlocked =
          err?.name === 'TimeoutError' ||
          err?.code === 'ENOTFOUND' ||
          err?.code === 'ECONNRESET' ||
          err?.code === 'ETIMEDOUT' ||
          err?.message?.includes('fetch failed')
        if (isNetworkBlocked) {
          providerErrors.push(`Gemini: Connection blocked or unreachable from server network region`)
          break
        }
      }
    }
  }

  // Provider 6: Moonshot / Kimi AI
  if (apiKeys.kimiApiKey) {
    try {
      const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKeys.kimiApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: fullMessages,
          temperature: 0.3,
          max_tokens: 4000,
        }),
        signal: AbortSignal.timeout(25_000),
      })

      if (res.ok) {
        const json = await res.json()
        const rawContent = json?.choices?.[0]?.message?.content || ''
        if (rawContent && rawContent.trim()) {
          const { cleanText, pendingAction } = extractActionProposal(rawContent)
          return {
            content: cleanText || rawContent,
            pendingAction,
            providerUsed: 'Moonshot Kimi',
            modelUsed: 'moonshot-v1-8k',
          }
        }
      }
    } catch (err: any) {
      providerErrors.push(`Moonshot Kimi error: ${err?.message}`)
    }
  }

  const zaiError = providerErrors.find((e) => e.startsWith('Z.ai returned HTTP') || e.includes('Z.ai'))
  if (zaiError && (apiKeys.primaryAiProvider === 'zai' || !apiKeys.openaiApiKey)) {
    throw new Error(zaiError)
  }

  const errorSummary = providerErrors.length > 0
    ? `AI service unavailable. Please configure a working provider in Admin > Settings.\n\n${providerErrors.join('\n\n')}`
    : 'AI service unavailable. Please configure a working provider in Admin > Settings.'

  throw new Error(errorSummary)
}
