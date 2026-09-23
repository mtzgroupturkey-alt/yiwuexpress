import { getApiKeys, ApiKeys } from '@/lib/api-keys'
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

  // Provider 1: OpenAI-Compatible Gateway (Primary from SystemSettings)
  if (apiKeys.openaiApiKey) {
    const baseUrl = (apiKeys.openaiBaseUrl || 'https://llm.gcat.ir/v1').trim().replace(/\/+$/, '')
    const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`
    const primaryModel = apiKeys.openaiModel || 'auto/best-chat'

    // Candidate models on this gateway: use high-speed models first for snappy UX
    const candidateModels = [
      'agy/gemini-3.7-flash-low',
      'agy/gemini-3.5-flash-lite',
      'agy/gemini-3-flash',
      primaryModel,
    ].filter((m, idx, arr) => arr.indexOf(m) === idx)

    for (const model of candidateModels) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKeys.openaiApiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: fullMessages,
            temperature: 0.2,
            max_tokens: 4000,
          }),
          signal: AbortSignal.timeout(35_000),
        })

        if (res.ok) {
          const json = await res.json()
          const rawContent = json?.choices?.[0]?.message?.content || ''
          if (rawContent && rawContent.trim()) {
            const { cleanText, pendingAction } = extractActionProposal(rawContent)
            return {
              content: cleanText || rawContent,
              pendingAction,
              providerUsed: 'OpenAI-Compatible Gateway',
              modelUsed: model,
            }
          }
        }
        console.warn(`[AI Assistant] OpenAI Gateway (${model}) returned status ${res.status}`)
      } catch (err) {
        console.warn(`[AI Assistant] OpenAI Gateway (${model}) call failed:`, err)
      }
    }
  }

  // Provider 2: OpenRouter Fallback
  if (apiKeys.openrouterApiKey) {
    try {
      const models = ['meta-llama/llama-3.3-70b-instruct:free', 'google/gemini-2.0-flash-exp:free', 'openrouter/free']
      for (const model of models) {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKeys.openrouterApiKey.trim()}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://dromkok.com',
            'X-Title': 'Dromkok Admin AI Assistant',
          },
          body: JSON.stringify({
            model,
            messages: fullMessages,
            temperature: 0.3,
          }),
          signal: AbortSignal.timeout(30_000),
        })

        if (res.ok) {
          const json = await res.json()
          const rawContent = json?.choices?.[0]?.message?.content || ''
          const { cleanText, pendingAction } = extractActionProposal(rawContent)
          return {
            content: cleanText || rawContent,
            pendingAction,
            providerUsed: 'OpenRouter',
            modelUsed: model,
          }
        }
      }
    } catch (err) {
      console.warn('[AI Assistant] OpenRouter fallback failed:', err)
    }
  }

  // Provider 3: Google Gemini Direct Fallback
  if (apiKeys.geminiApiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeys.geminiApiKey.trim()}`,
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
          signal: AbortSignal.timeout(30_000),
        }
      )

      if (res.ok) {
        const json = await res.json()
        const rawContent = json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const { cleanText, pendingAction } = extractActionProposal(rawContent)
        return {
          content: cleanText || rawContent,
          pendingAction,
          providerUsed: 'Google Gemini',
          modelUsed: 'gemini-2.5-flash',
        }
      }
    } catch (err) {
      console.warn('[AI Assistant] Gemini direct fallback failed:', err)
    }
  }

  throw new Error(
    'No reachable AI Gateway provider found. Please verify your AI API Key in Admin > Settings > System.'
  )
}
