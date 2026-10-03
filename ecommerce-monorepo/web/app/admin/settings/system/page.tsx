'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Cog, Key, Loader2, Save, Eye, EyeOff, Globe,
  Check, Copy, Sparkles, Server, Zap, RefreshCw,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
  Terminal, Code2, ShieldAlert, Cpu, CheckCheck,
  Star, ExternalLink, Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'

export type AIProviderId = 'zai' | 'qwen' | 'openai' | 'openrouter' | 'gemini' | 'deepseek'

interface SystemSettings {
  id?: string
  // OpenAI-Compatible Gateway
  openaiApiKey?: string
  openaiBaseUrl?: string
  openaiModel?: string
  primaryAiProvider?: string
  // Z.ai (GLM)
  zaiApiKey?: string
  zaiBaseUrl?: string
  zaiModel?: string
  // Fallbacks
  openrouterApiKey?: string
  geminiApiKey?: string
  deepseekApiKey?: string
  qwenApiKey?: string
  kimiApiKey?: string
  cerebrasApiKey?: string
  timezone?: string
  language?: string
  currency?: string
  emailNotifications?: boolean
  smsNotifications?: boolean
  maintenanceMode?: boolean
}

interface TestResult {
  success: boolean
  latencyMs?: number
  message?: string
  error?: string
  model?: string
  isFree?: boolean
  freeStatus?: string
}

interface ProviderMeta {
  id: AIProviderId
  name: string
  shortLabel: string
  tagline: string
  badge: string
  badgeType: 'free' | 'quota' | 'standard'
  portalUrl: string
  portalLabel: string
  keyField: keyof SystemSettings
  baseUrlField?: keyof SystemSettings
  modelField?: keyof SystemSettings
  defaultBaseUrl: string
  baseUrlOptions?: { label: string; value: string }[]
  defaultModel: string
  models: { label: string; value: string; badge?: string }[]
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'zai',
    name: 'Z.ai (Zhipu GLM)',
    shortLabel: 'Z.ai GLM',
    tagline: '100% Free Flash Chat & Vision models with zero per-token charge',
    badge: '100% Free Flash Tier',
    badgeType: 'free',
    portalUrl: 'https://z.ai',
    portalLabel: 'Get API Key at z.ai',
    keyField: 'zaiApiKey',
    baseUrlField: 'zaiBaseUrl',
    modelField: 'zaiModel',
    defaultBaseUrl: 'https://api.z.ai/api/paas/v4',
    baseUrlOptions: [
      { label: 'International — https://api.z.ai/api/paas/v4', value: 'https://api.z.ai/api/paas/v4' },
      { label: 'China Mainland — https://open.bigmodel.cn/api/paas/v4', value: 'https://open.bigmodel.cn/api/paas/v4' },
    ],
    defaultModel: 'glm-4.7-flash',
    models: [
      { label: 'glm-4.7-flash', value: 'glm-4.7-flash', badge: '★ Flagship Free' },
      { label: 'glm-4.5-flash', value: 'glm-4.5-flash', badge: '⚡ Fast Free' },
      { label: 'glm-4.6v-flash', value: 'glm-4.6v-flash', badge: '👁️ Vision Free' },
    ],
  },
  {
    id: 'qwen',
    name: 'Alibaba Model Studio (Qwen)',
    shortLabel: 'Alibaba Qwen',
    tagline: 'Alibaba Cloud Model Studio / DashScope with active 90-day free quota',
    badge: 'Active Free Quota',
    badgeType: 'quota',
    portalUrl: 'https://modelstudio.console.alibabacloud.com/ap-southeast-1/api-key',
    portalLabel: 'Model Studio Console (ap-southeast-1)',
    keyField: 'qwenApiKey',
    defaultBaseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    baseUrlOptions: [
      { label: 'Singapore / Intl (ap-southeast-1) — https://dashscope-intl.aliyuncs.com/compatible-mode/v1', value: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1' },
      { label: 'China Mainland — https://dashscope.aliyuncs.com/compatible-mode/v1', value: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
    ],
    defaultModel: 'qwen-max',
    models: [
      { label: 'qwen-max', value: 'qwen-max', badge: '★ Flagship Free Quota' },
      { label: 'qwen-flash', value: 'qwen-flash', badge: '⚡ Ultra Fast Free Quota' },
      { label: 'qwen-plus', value: 'qwen-plus', badge: 'Balanced' },
      { label: 'qwen-turbo', value: 'qwen-turbo', badge: 'Fast Speed' },
    ],
  },
  {
    id: 'openai',
    name: 'Custom Gateway (G-CAT / OpenAI)',
    shortLabel: 'OpenAI Gateway',
    tagline: 'Universal OpenAI-compatible API gateway (e.g. G-CAT, OpenAI, custom proxy)',
    badge: 'OpenAI Compatible',
    badgeType: 'standard',
    portalUrl: 'https://gcat.ir',
    portalLabel: 'Gateway Portal',
    keyField: 'openaiApiKey',
    baseUrlField: 'openaiBaseUrl',
    modelField: 'openaiModel',
    defaultBaseUrl: 'https://llm.gcat.ir/v1',
    defaultModel: 'auto/best-chat',
    models: [
      { label: 'auto/best-chat', value: 'auto/best-chat', badge: '★ Translation' },
      { label: 'auto/best-fast', value: 'auto/best-fast', badge: '⚡ Fast' },
      { label: 'auto/pro-chat', value: 'auto/pro-chat', badge: '💎 Pro' },
      { label: 'gpt-4o', value: 'gpt-4o', badge: 'OpenAI' },
      { label: 'gpt-4o-mini', value: 'gpt-4o-mini', badge: 'Fast' },
      { label: 'claude-3-5-sonnet', value: 'claude-3-5-sonnet', badge: 'Anthropic' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    shortLabel: 'OpenRouter',
    tagline: 'Global multi-model router with open-source and flagship models',
    badge: 'Free & Paid Models',
    badgeType: 'free',
    portalUrl: 'https://openrouter.ai',
    portalLabel: 'openrouter.ai/keys',
    keyField: 'openrouterApiKey',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'nvidia/nemotron-3-super-120b-a12b:free',
    models: [
      { label: 'nvidia/nemotron-3-super-120b-a12b:free', value: 'nvidia/nemotron-3-super-120b-a12b:free', badge: 'Free' },
      { label: 'nvidia/nemotron-3.5-lightning:free', value: 'nvidia/nemotron-3.5-lightning:free', badge: 'Fast Free' },
      { label: 'meta-llama/llama-3.3-70b-instruct:free', value: 'meta-llama/llama-3.3-70b-instruct:free', badge: 'Llama Free' },
      { label: 'qwen/qwen3.8-27b:free', value: 'qwen/qwen3.8-27b:free', badge: 'Qwen Free' },
      { label: 'openrouter/free', value: 'openrouter/free', badge: 'Auto Free' },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    shortLabel: 'Gemini',
    tagline: 'Google AI Studio with high rate limits and fast multi-language processing',
    badge: 'Google AI Studio',
    badgeType: 'free',
    portalUrl: 'https://aistudio.google.com/app/apikey',
    portalLabel: 'Google AI Studio Console',
    keyField: 'geminiApiKey',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    models: [
      { label: 'gemini-2.0-flash', value: 'gemini-2.0-flash', badge: '★ Flagship Fast' },
      { label: 'gemini-1.5-flash', value: 'gemini-1.5-flash', badge: 'Flash' },
      { label: 'gemini-1.5-pro', value: 'gemini-1.5-pro', badge: 'Pro' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek Direct',
    shortLabel: 'DeepSeek',
    tagline: 'Direct DeepSeek API endpoint with high performance and low cost',
    badge: 'DeepSeek V3',
    badgeType: 'standard',
    portalUrl: 'https://platform.deepseek.com',
    portalLabel: 'platform.deepseek.com',
    keyField: 'deepseekApiKey',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: [
      { label: 'deepseek-chat', value: 'deepseek-chat', badge: '★ DeepSeek-V3' },
      { label: 'deepseek-reasoner', value: 'deepseek-reasoner', badge: 'DeepSeek-R1' },
    ],
  },
]

export default function SystemSettingsPage() {
  const { dict, locale } = useAdminLocale()
  const [settings, setSettings] = useState<SystemSettings>({
    openaiBaseUrl: 'https://llm.gcat.ir/v1',
    openaiModel: 'auto/best-chat',
    primaryAiProvider: 'zai',
    zaiBaseUrl: 'https://api.z.ai/api/paas/v4',
    zaiModel: 'glm-4.7-flash',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showFallbacks, setShowFallbacks] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'python' | 'node'>('curl')

  // Selected Provider Tab for focused configuration
  const [activeProviderTab, setActiveProviderTab] = useState<AIProviderId>('zai')

  // Provider-specific model selections for those not stored directly in settings schema
  const [providerModels, setProviderModels] = useState<Record<AIProviderId, string>>({
    zai: 'glm-4.7-flash',
    qwen: 'qwen-max',
    openai: 'auto/best-chat',
    openrouter: 'nvidia/nemotron-3-super-120b-a12b:free',
    gemini: 'gemini-2.0-flash',
    deepseek: 'deepseek-chat',
  })

  // Provider-specific custom base URLs
  const [providerBaseUrls, setProviderBaseUrls] = useState<Record<AIProviderId, string>>({
    zai: 'https://api.z.ai/api/paas/v4',
    qwen: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    openai: 'https://llm.gcat.ir/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
    deepseek: 'https://api.deepseek.com/v1',
  })

  // Independent Test Result for EACH provider
  const [testingProvider, setTestingProvider] = useState<AIProviderId | null>(null)
  const [testResults, setTestResults] = useState<Record<AIProviderId, TestResult | null>>({
    zai: null,
    qwen: null,
    openai: null,
    openrouter: null,
    gemini: null,
    deepseek: null,
  })

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    openai: false,
    zai: false,
    openrouter: false,
    gemini: false,
    deepseek: false,
    qwen: false,
    kimi: false,
    cerebras: false,
  })
  const [imageStats, setImageStats] = useState<{
    external: number;
    local: number;
    lastRunAt: string | null;
    lastRunStatus: string;
  } | null>(null)

  useEffect(() => {
    fetchSettings()
    fetch('/api/admin/images/migrate')
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.external === 'number') {
          setImageStats({
            external: d.external,
            local: d.local,
            lastRunAt: d.lastRunAt,
            lastRunStatus: d.lastRunStatus,
          })
        }
      })
      .catch(() => {})
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/system')
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()
      setSettings({
        ...data,
        openaiBaseUrl: data.openaiBaseUrl || 'https://llm.gcat.ir/v1',
        openaiModel: data.openaiModel || 'auto/best-chat',
        primaryAiProvider: data.primaryAiProvider || 'zai',
        zaiBaseUrl: data.zaiBaseUrl || 'https://api.z.ai/api/paas/v4',
        zaiModel: data.zaiModel || 'glm-4.7-flash',
      })

      if (data.primaryAiProvider) {
        setActiveProviderTab(data.primaryAiProvider as AIProviderId)
      }

      setProviderModels(prev => ({
        ...prev,
        zai: data.zaiModel || 'glm-4.7-flash',
        openai: data.openaiModel || 'auto/best-chat',
      }))

      setProviderBaseUrls(prev => ({
        ...prev,
        zai: data.zaiBaseUrl || 'https://api.z.ai/api/paas/v4',
        openai: data.openaiBaseUrl || 'https://llm.gcat.ir/v1',
      }))
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const isZai = settings.primaryAiProvider === 'zai'
      const isQwen = settings.primaryAiProvider === 'qwen'

      const payload = {
        ...settings,
        zaiModel: providerModels.zai,
        zaiBaseUrl: providerBaseUrls.zai,
        // If Z.ai or Qwen is selected as primary, keep openaiBaseUrl / model synchronized for backwards compatibility
        openaiBaseUrl: isZai
          ? (providerBaseUrls.zai || 'https://api.z.ai/api/paas/v4')
          : isQwen
          ? (providerBaseUrls.qwen || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1')
          : (providerBaseUrls.openai || settings.openaiBaseUrl),
        openaiModel: isZai
          ? providerModels.zai
          : isQwen
          ? providerModels.qwen
          : providerModels.openai,
        openaiApiKey: isZai
          ? (settings.zaiApiKey || settings.openaiApiKey)
          : isQwen
          ? (settings.qwenApiKey || settings.openaiApiKey)
          : settings.openaiApiKey,
      }

      const response = await fetch('/api/admin/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => null)
        throw new Error(errJson?.error || `Server responded with status ${response.status}`)
      }
      
      const result = await response.json()
      toast.success('System settings saved successfully!')
      if (result.data) {
        setSettings(prev => ({ ...prev, ...result.data }))
      }
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldKey)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleTestProvider = async (providerId: AIProviderId) => {
    const meta = PROVIDERS.find(p => p.id === providerId)!
    const apiKey = (settings[meta.keyField] as string) || ''

    if (!apiKey || !apiKey.trim()) {
      toast.error(`Please enter an API Key for ${meta.name} first`)
      return
    }

    const baseUrl = providerBaseUrls[providerId] || meta.defaultBaseUrl
    const model = providerModels[providerId] || meta.defaultModel

    setTestingProvider(providerId)
    setTestResults(prev => ({ ...prev, [providerId]: null }))

    try {
      const response = await fetch('/api/admin/settings/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          baseUrl,
          model,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResults(prev => ({
          ...prev,
          [providerId]: {
            success: true,
            latencyMs: data.latencyMs,
            message: data.message || `Connected in ${data.latencyMs}ms!`,
            model: data.model,
            isFree: data.isFree,
            freeStatus: data.freeStatus,
          },
        }))
        toast.success(`${meta.shortLabel} connected successfully (${data.latencyMs}ms)!`)
      } else {
        setTestResults(prev => ({
          ...prev,
          [providerId]: {
            success: false,
            error: data.error || 'Connection failed',
            latencyMs: data.latencyMs,
          },
        }))
        toast.error(data.error || `${meta.shortLabel} connection failed`)
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          success: false,
          error: err.message || 'Network request failed',
        },
      }))
      toast.error(`Failed to test ${meta.shortLabel}`)
    } finally {
      setTestingProvider(null)
    }
  }

  const activeMeta = PROVIDERS.find(p => p.id === activeProviderTab)!
  const currentKeyVal = (settings[activeMeta.keyField] as string) || ''
  const currentEndpoint = providerBaseUrls[activeProviderTab] || activeMeta.defaultBaseUrl
  const currentSelectedModel = providerModels[activeProviderTab] || activeMeta.defaultModel
  const displayKey = currentKeyVal ? (showKeys[activeMeta.id] ? currentKeyVal : 'YOUR_API_KEY') : 'YOUR_API_KEY'
  const isPrimary = settings.primaryAiProvider === activeMeta.id

  const codeSnippets = {
    curl: `curl ${currentEndpoint}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${displayKey}" \\
  -d '{
    "model": "${currentSelectedModel}",
    "messages": [{"role": "user", "content": "Hello ${activeMeta.shortLabel}!"}]
  }'`,
    python: `from openai import OpenAI

client = OpenAI(
    api_key="${displayKey}",
    base_url="${currentEndpoint}"
)

response = client.chat.completions.create(
    model="${currentSelectedModel}",
    messages=[{"role": "user", "content": "Translate to Russian & Chinese"}]
)
print(response.choices[0].message.content)`,
    node: `import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "${displayKey}",
  baseURL: "${currentEndpoint}",
});

const completion = await openai.chat.completions.create({
  model: "${currentSelectedModel}",
  messages: [{ role: "user", content: "Translate to Russian & Chinese" }],
});

console.log(completion.choices[0].message.content);`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3a5c]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
            <span>Portal</span>
            <span>&gt;</span>
            <span className="text-[#1a3a5c]">AI Providers & Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            AI Providers &amp; Gateway Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Configure each AI provider with its own API key, choose models, and test each model separately.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Active Primary</span>
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {PROVIDERS.find(p => p.id === settings.primaryAiProvider)?.name || settings.primaryAiProvider}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider Cards Switcher Grid */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Cpu size={18} className="text-[#1a3a5c]" />
                <span>Supported AI Providers</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Select any provider below to enter its specific API key, change endpoints, and test its models.
              </p>
            </div>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              6 Independent Engines
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {PROVIDERS.map((p) => {
              const hasKey = Boolean(settings[p.keyField] && (settings[p.keyField] as string).trim())
              const isSelected = activeProviderTab === p.id
              const isCurrentPrimary = settings.primaryAiProvider === p.id
              const testRes = testResults[p.id]

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveProviderTab(p.id)}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#1a3a5c] bg-blue-50/50 shadow-md ring-2 ring-[#1a3a5c]/20'
                      : 'border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${hasKey ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#1a3a5c]">
                        {p.shortLabel}
                      </h3>
                    </div>

                    {isCurrentPrimary && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                        <Star size={10} className="fill-emerald-600 text-emerald-600" />
                        Primary
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {p.tagline}
                  </p>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100/80 text-[10px]">
                    <span className={`font-semibold px-2 py-0.5 rounded-md ${
                      p.badgeType === 'free'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : p.badgeType === 'quota'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {p.badge}
                    </span>

                    {testRes && (
                      <span className={`font-bold flex items-center gap-1 ${
                        testRes.success ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {testRes.success ? (
                          <>
                            <CheckCheck size={12} />
                            <span>{testRes.latencyMs}ms</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} />
                            <span>Failed</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Focused Provider Workspace Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
          {/* Header of Active Provider Workspace */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-gray-900">
                    {activeMeta.name}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    activeMeta.badgeType === 'free'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : activeMeta.badgeType === 'quota'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-blue-50 text-blue-900 border-blue-200'
                  }`}>
                    {activeMeta.badge}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {activeMeta.tagline}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Set As Primary Button */}
              <button
                type="button"
                onClick={() => {
                  handleChange('primaryAiProvider', activeMeta.id)
                  toast.success(`${activeMeta.shortLabel} set as primary AI provider! Click Save Settings to persist.`)
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isPrimary
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Star size={14} className={isPrimary ? 'fill-emerald-600 text-emerald-600' : 'text-gray-400'} />
                <span>{isPrimary ? 'Active Primary Provider' : 'Set as Primary'}</span>
              </button>

              {/* Dedicated Test Connection Button */}
              <button
                type="button"
                onClick={() => handleTestProvider(activeMeta.id)}
                disabled={testingProvider === activeMeta.id}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {testingProvider === activeMeta.id ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Testing {activeMeta.shortLabel}...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Result Toast/Banner for this Provider */}
          {testResults[activeMeta.id] && (
            <div className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
              testResults[activeMeta.id]?.success
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                : 'bg-red-50/90 border-red-200 text-red-950'
            }`}>
              {testResults[activeMeta.id]?.success ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold">
                    {testResults[activeMeta.id]?.success
                      ? `${activeMeta.shortLabel} Connection Successful!`
                      : `${activeMeta.shortLabel} Verification Failed`}
                  </p>
                  {testResults[activeMeta.id]?.freeStatus && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                      {testResults[activeMeta.id]?.freeStatus}
                    </span>
                  )}
                </div>
                <p className="mt-1 opacity-90 whitespace-pre-line leading-relaxed">
                  {testResults[activeMeta.id]?.success
                    ? testResults[activeMeta.id]?.message
                    : testResults[activeMeta.id]?.error}
                </p>
                {testResults[activeMeta.id]?.latencyMs !== undefined && (
                  <p className="mt-1 text-[11px] font-mono opacity-80">
                    Response latency: {testResults[activeMeta.id]?.latencyMs}ms • Tested Model: {testResults[activeMeta.id]?.model}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Dedicated Provider Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. API Key Field for this provider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-800">
                  {activeMeta.shortLabel} API Key
                  <span className="ml-1.5 text-[10px] text-indigo-600 font-medium">({activeMeta.keyField})</span>
                </label>
                <a
                  href={activeMeta.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-semibold"
                >
                  <span>{activeMeta.portalLabel}</span>
                  <ExternalLink size={10} />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKeys[activeMeta.id] ? 'text' : 'password'}
                  value={(settings[activeMeta.keyField] as string) || ''}
                  onChange={(e) => handleChange(activeMeta.keyField, e.target.value)}
                  placeholder={`Paste your personal ${activeMeta.shortLabel} API key here`}
                  className="w-full px-4 py-2.5 pr-10 font-mono text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(activeMeta.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showKeys[activeMeta.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                This key is stored separately for {activeMeta.shortLabel} and will not be overwritten by other providers.
              </p>
            </div>

            {/* 2. Endpoint / Base URL Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-800">
                  Base URL / Endpoint
                  <span className="ml-1.5 text-[10px] text-gray-400 font-normal">(/chat/completions)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(currentEndpoint, `url-${activeMeta.id}`)}
                  className="text-[11px] text-[#1a3a5c] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {copiedField === `url-${activeMeta.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedField === `url-${activeMeta.id}` ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {activeMeta.baseUrlOptions ? (
                <select
                  value={currentEndpoint}
                  onChange={(e) => {
                    const val = e.target.value
                    setProviderBaseUrls(prev => ({ ...prev, [activeMeta.id]: val }))
                    if (activeMeta.baseUrlField) handleChange(activeMeta.baseUrlField, val)
                  }}
                  className="w-full px-4 py-2.5 font-mono text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent bg-white cursor-pointer"
                >
                  {activeMeta.baseUrlOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={currentEndpoint}
                  onChange={(e) => {
                    const val = e.target.value
                    setProviderBaseUrls(prev => ({ ...prev, [activeMeta.id]: val }))
                    if (activeMeta.baseUrlField) handleChange(activeMeta.baseUrlField, val)
                  }}
                  className="w-full px-4 py-2.5 font-mono text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent bg-slate-50/50"
                />
              )}
              <p className="text-[11px] text-gray-400">
                Default: <code className="text-slate-600 font-mono text-[10px]">{activeMeta.defaultBaseUrl}</code>
              </p>
            </div>

            {/* 3. Model Selector for this provider */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-800">
                  Model Selection for {activeMeta.shortLabel}
                </label>
                <span className="text-[10px] font-mono text-gray-500">
                  Active Model: <strong className="text-indigo-900">{currentSelectedModel}</strong>
                </span>
              </div>

              {/* Quick Pick Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-gray-400 font-medium">Quick Picks:</span>
                {activeMeta.models.map((m) => {
                  const isSelected = currentSelectedModel === m.value
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => {
                        setProviderModels(prev => ({ ...prev, [activeMeta.id]: m.value }))
                        if (activeMeta.modelField) handleChange(activeMeta.modelField, m.value)
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#1a3a5c] text-white border-[#1a3a5c] font-bold shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span>{m.value}</span>
                      {m.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {m.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Custom Model Input */}
              <div className="pt-1">
                <input
                  type="text"
                  value={currentSelectedModel}
                  onChange={(e) => {
                    const val = e.target.value
                    setProviderModels(prev => ({ ...prev, [activeMeta.id]: val }))
                    if (activeMeta.modelField) handleChange(activeMeta.modelField, val)
                  }}
                  placeholder={`Type custom ${activeMeta.shortLabel} model name (e.g. ${activeMeta.defaultModel})`}
                  className="w-full px-4 py-2 font-mono text-xs border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#1a3a5c] bg-slate-50/40"
                />
              </div>
            </div>
          </div>

          {/* Quick Integration Examples for this selected Provider */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Code2 size={14} className="text-[#1a3a5c]" />
                <span>Quick Code Examples for {activeMeta.shortLabel}</span>
              </p>

              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                {(['curl', 'python', 'node'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveSnippetTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      activeSnippetTab === tab
                        ? 'bg-white text-[#1a3a5c] shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python' : 'Node.js'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-slate-900 rounded-2xl p-4 text-slate-200 font-mono text-xs overflow-x-auto shadow-inner">
              <button
                type="button"
                onClick={() => handleCopy(codeSnippets[activeSnippetTab], 'snippet')}
                className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedField === 'snippet' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedField === 'snippet' ? 'Copied' : 'Copy'}</span>
              </button>
              <pre className="pr-16">{codeSnippets[activeSnippetTab]}</pre>
            </div>
          </div>
        </div>

        {/* Secondary / Fallback Providers (Collapsible) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <button
            type="button"
            onClick={() => setShowFallbacks(!showFallbacks)}
            className="w-full flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1a3a5c] flex items-center justify-center font-bold">
                <Server size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#1a3a5c] transition-colors">
                  Additional Fallback AI Providers (Optional)
                </h3>
                <p className="text-xs text-gray-400">
                  Moonshot Kimi, Cerebras, and legacy cascade keys
                </p>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-gray-600">
              {showFallbacks ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {showFallbacks && (
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <p className="text-xs text-gray-500">
                If the primary provider is unavailable or hits rate limits, the translation and assistant cascade can automatically fallback through these configured options.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kimi */}
                <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Moonshot Kimi API Key</label>
                    <a href="https://platform.moonshot.cn" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">moonshot.cn</a>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys.kimi ? 'text' : 'password'}
                      value={settings.kimiApiKey || ''}
                      onChange={(e) => handleChange('kimiApiKey', e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('kimi')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showKeys.kimi ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Cerebras */}
                <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Cerebras API Key</label>
                    <a href="https://cerebras.ai" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">cerebras.ai</a>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys.cerebras ? 'text' : 'password'}
                      value={settings.cerebrasApiKey || ''}
                      onChange={(e) => handleChange('cerebrasApiKey', e.target.value)}
                      placeholder="csk-..."
                      className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('cerebras')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showKeys.cerebras ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Images Migration Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Download size={16} className="text-primary-600" />
                Product Image Migration
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Download external product images, convert to WebP, and re-host locally or to Cloudflare R2.
              </p>
            </div>
            <Link
              href="/admin/tools/images"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Open Full Tool <ExternalLink size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-400 block font-medium">External URLs remaining</span>
              <span className="text-lg font-bold text-amber-600">
                {imageStats ? imageStats.external.toLocaleString() : '...'}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-400 block font-medium">Local / Re-hosted URLs</span>
              <span className="text-lg font-bold text-green-600">
                {imageStats ? imageStats.local.toLocaleString() : '...'}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-400 block font-medium">Last run</span>
              <span className="text-xs font-semibold text-gray-700 block mt-1">
                {imageStats?.lastRunAt ? new Date(imageStats.lastRunAt).toLocaleDateString() : 'Never'}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-400 block font-medium">Progress</span>
              <span className="text-xs font-semibold uppercase text-gray-700 block mt-1">
                {imageStats?.lastRunStatus || '—'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/admin/tools/images"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Eye size={14} />
              Preview
            </Link>
            <Link
              href="/admin/tools/images"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download size={14} />
              Download & Re-host Images
            </Link>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={saving}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] hover:from-[#152e4a] hover:to-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/10 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving All Settings...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}