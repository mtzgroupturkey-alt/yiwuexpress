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
2. Whenever the admin asks you to create categories, create attributes, or bulk-translate items:
   a. You MUST first display a clear summary of what you are about to do.
   b. You MUST list the exact items with their proposed translations (en, ru, zh), parent relationships, and types.
   c. You MUST explicitly ask the admin for confirmation before anything can be written.
   d. Never tell the user "I have created..." or "Successfully added..." until the user has actually confirmed and the operation was executed.
   e. Formulate your confirmation question in ${activeLangName}:
      - If English: "Do you confirm creating these items? Please reply with **yes** or **confirm** to proceed."
      - If Russian: "Вы подтверждаете создание этих элементов? Пожалуйста, ответьте **да** или **подтверждаю** для продолжения."
      - If Chinese: "您确认创建这些项目吗？请回复 **确认** 或 **yes** 以继续。"

3. When proposing an action that requires confirmation, you MUST append a machine-readable JSON block at the very end of your response inside \`\`\`action_proposal code block:
\`\`\`action_proposal
{
  "type": "createCategories" | "createAttributes" | "bulkTranslate",
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
 * Extract action_proposal block from the assistant's text
 */
export function extractActionProposal(text: string): {
  cleanText: string
  pendingAction: PendingAction | null
} {
  const proposalRegex = /```action_proposal\s*([\s\S]*?)```/i
  const match = text.match(proposalRegex)

  if (!match) {
    return { cleanText: text.trim(), pendingAction: null }
  }

  const rawJson = match[1].trim()
  const cleanText = text.replace(proposalRegex, '').trim()

  try {
    const parsed = JSON.parse(rawJson)
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

  return { cleanText, pendingAction: null }
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
    try {
      const baseUrl = (apiKeys.openaiBaseUrl || 'https://llm.gcat.ir/v1').trim().replace(/\/+$/, '')
      const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`
      const model = apiKeys.openaiModel || 'auto/best-chat'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKeys.openaiApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: fullMessages,
          temperature: 0.3,
          max_tokens: 2500,
        }),
        signal: AbortSignal.timeout(35_000),
      })

      if (res.ok) {
        const json = await res.json()
        const rawContent = json?.choices?.[0]?.message?.content || ''
        const { cleanText, pendingAction } = extractActionProposal(rawContent)
        return {
          content: cleanText || rawContent,
          pendingAction,
          providerUsed: 'OpenAI-Compatible Gateway',
          modelUsed: model,
        }
      }
      console.warn(`[AI Assistant] OpenAI Gateway returned status ${res.status}`)
    } catch (err) {
      console.warn('[AI Assistant] OpenAI Gateway call failed:', err)
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
