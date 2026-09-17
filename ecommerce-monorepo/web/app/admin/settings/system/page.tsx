'use client'

import { useState, useEffect } from 'react'
import {
  Cog, Key, Loader2, Save, Eye, EyeOff, Globe,
  Check, Copy, Sparkles, Server, Zap, RefreshCw,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
  Terminal, Code2, ShieldAlert
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'

interface SystemSettings {
  id?: string
  // OpenAI-Compatible Gateway
  openaiApiKey?: string
  openaiBaseUrl?: string
  openaiModel?: string
  primaryAiProvider?: string
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

export default function SystemSettingsPage() {
  const { dict, locale } = useAdminLocale()
  const [settings, setSettings] = useState<SystemSettings>({
    openaiBaseUrl: 'https://llm.gcat.ir/v1',
    openaiModel: 'auto/best-chat',
    primaryAiProvider: 'openai',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showFallbacks, setShowFallbacks] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'python' | 'node'>('curl')

  // Live Connection Tester state
  const [testingAi, setTestingAi] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    latencyMs?: number
    message?: string
    error?: string
    model?: string
  } | null>(null)

  const [showKeys, setShowKeys] = useState({
    openai: false,
    openrouter: false,
    gemini: false,
    deepseek: false,
    qwen: false,
    kimi: false,
    cerebras: false,
  })

  useEffect(() => {
    fetchSettings()
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
        primaryAiProvider: data.primaryAiProvider || 'openai',
      })
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
      const response = await fetch('/api/admin/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error('Failed to save settings')
      
      const result = await response.json()
      toast.success('System settings saved successfully!')
      setSettings(result.data)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const toggleShowKey = (key: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldKey)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleTestConnection = async () => {
    if (!settings.openaiApiKey || !settings.openaiApiKey.trim()) {
      toast.error('Please enter an API Key to test the connection')
      return
    }

    setTestingAi(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/settings/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.openaiApiKey,
          baseUrl: settings.openaiBaseUrl || 'https://llm.gcat.ir/v1',
          model: settings.openaiModel || 'gpt-4o',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({
          success: true,
          latencyMs: data.latencyMs,
          message: data.message || `Connected in ${data.latencyMs}ms!`,
          model: data.model,
        })
        toast.success(`Connected successfully (${data.latencyMs}ms)!`)
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Connection failed',
          latencyMs: data.latencyMs,
        })
        toast.error(data.error || 'Connection failed')
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Network request failed',
      })
      toast.error('Failed to test connection')
    } finally {
      setTestingAi(false)
    }
  }

  const currentBaseUrl = settings.openaiBaseUrl || 'https://llm.gcat.ir/v1'
  const currentModel = settings.openaiModel || 'gpt-4o'
  const displayKey = settings.openaiApiKey ? (showKeys.openai ? settings.openaiApiKey : 'YOUR_API_KEY') : 'YOUR_API_KEY'

  const codeSnippets = {
    curl: `curl ${currentBaseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${displayKey}" \\
  -d '{
    "model": "${currentModel}",
    "messages": [{"role": "user", "content": "Hello G-CAT!"}]
  }'`,
    python: `from openai import OpenAI

client = OpenAI(
    api_key="${displayKey}",
    base_url="${currentBaseUrl}"
)

response = client.chat.completions.create(
    model="${currentModel}",
    messages=[{"role": "user", "content": "Translate to Russian & Chinese"}]
)
print(response.choices[0].message.content)`,
    node: `import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "${displayKey}",
  baseURL: "${currentBaseUrl}",
});

const completion = await openai.chat.completions.create({
  model: "${currentModel}",
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
            <span className="text-[#1a3a5c]">API Keys & Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            API Keys &amp; Endpoint
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your personal gateway credentials, custom base URL, and AI translation models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            OpenAI Compatible
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Primary Card: OpenAI-Compatible Gateway */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Globe size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>API Base URL &amp; Endpoint</span>
                </h2>
                <p className="text-xs text-gray-500">
                  OpenAI-compatible gateway endpoint for any client, SDK, or automatic translation tool
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingAi}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {testingAi ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Testing Gateway...</span>
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

          {/* Test Result Toast/Banner */}
          {testResult && (
            <div className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
              testResult.success
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-red-50/80 border-red-200 text-red-900'
            }`}>
              {testResult.success ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold">
                  {testResult.success ? 'Gateway Connection Successful!' : 'Connection Verification Failed'}
                </p>
                <p className="mt-0.5 opacity-90">
                  {testResult.success ? testResult.message : testResult.error}
                </p>
                {testResult.latencyMs !== undefined && (
                  <p className="mt-1 text-[11px] font-mono opacity-80">
                    Response latency: {testResult.latencyMs}ms {testResult.model ? `• Model: ${testResult.model}` : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Base URL Field */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <span>API Base URL</span>
                  <span className="text-[10px] text-gray-400 font-normal">(Endpoint root for /chat/completions)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(settings.openaiBaseUrl || 'https://llm.gcat.ir/v1', 'baseUrl')}
                  className="text-xs text-[#1a3a5c] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {copiedField === 'baseUrl' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedField === 'baseUrl' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={settings.openaiBaseUrl || ''}
                  onChange={(e) => handleChange('openaiBaseUrl', e.target.value)}
                  placeholder="https://llm.gcat.ir/v1"
                  className="w-full px-4 py-2.5 font-mono text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent bg-slate-50/50"
                />
              </div>

              {/* Quick Base URL Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-gray-400 font-medium">Presets:</span>
                {[
                  { label: 'G-CAT Gateway (Default)', url: 'https://llm.gcat.ir/v1' },
                  { label: 'Official OpenAI', url: 'https://api.openai.com/v1' },
                  { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
                ].map((p) => (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => handleChange('openaiBaseUrl', p.url)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                      settings.openaiBaseUrl === p.url
                        ? 'bg-blue-50 text-[#1a3a5c] border-blue-200 font-bold'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key Field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">
                API Key
                <span className="ml-1.5 text-[10px] text-emerald-600 font-medium">(Used for auto-translation)</span>
              </label>
              <div className="relative">
                <input
                  type={showKeys.openai ? 'text' : 'password'}
                  value={settings.openaiApiKey || ''}
                  onChange={(e) => handleChange('openaiApiKey', e.target.value)}
                  placeholder="Enter your API Key..."
                  className="w-full px-4 py-2.5 pr-10 font-mono text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('openai')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showKeys.openai ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Paste your personal token or gateway key from your portal.
              </p>
            </div>

            {/* Model Name Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700">
                  Model Name
                  <span className="ml-1.5 text-[10px] text-emerald-600 font-medium">(Gateway Auto Models)</span>
                </label>
                <span className="text-[10px] font-mono text-gray-400">Selected: {settings.openaiModel || 'auto/best-chat'}</span>
              </div>

              {/* Quick Dropdown Select */}
              <div className="relative">
                <select
                  value={settings.openaiModel || 'auto/best-chat'}
                  onChange={(e) => handleChange('openaiModel', e.target.value)}
                  className="w-full px-4 py-2.5 font-mono text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent bg-white cursor-pointer"
                >
                  <optgroup label="Auto Models (From Your Gateway Portal)">
                    <option value="auto/best-chat">auto/best-chat (★ Recommended for Translation & Chat)</option>
                    <option value="auto/best-fast">auto/best-fast (⚡ Fastest Translation)</option>
                    <option value="auto/pro-chat">auto/pro-chat (💎 Pro Multi-Language Quality)</option>
                    <option value="auto/best-coding">auto/best-coding (Best Coding)</option>
                    <option value="auto/best-reasoning">auto/best-reasoning (Deep Reasoning)</option>
                    <option value="auto/best-vision">auto/best-vision (Vision & Images)</option>
                    <option value="auto/best-coding-fast">auto/best-coding-fast (Fast Coding)</option>
                    <option value="auto/pro-coding">auto/pro-coding (Pro Coding)</option>
                    <option value="auto/pro-reasoning">auto/pro-reasoning (Pro Reasoning)</option>
                    <option value="auto/pro-vision">auto/pro-vision (Pro Vision)</option>
                  </optgroup>
                  <optgroup label="Direct Provider Models (If configured on gateway)">
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                    <option value="deepseek-chat">deepseek-chat</option>
                  </optgroup>
                </select>
              </div>

              {/* Custom Input for any other model */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={settings.openaiModel || ''}
                  onChange={(e) => handleChange('openaiModel', e.target.value)}
                  placeholder="Or type custom model (e.g. auto/best-chat)"
                  className="flex-1 px-3 py-1.5 font-mono text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#1a3a5c] bg-slate-50/50"
                />
              </div>

              {/* Quick Model Presets Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400 font-medium">Quick Picks:</span>
                {[
                  { label: 'auto/best-chat', badge: '★ Translation' },
                  { label: 'auto/best-fast', badge: '⚡ Fast' },
                  { label: 'auto/pro-chat', badge: '💎 Pro' },
                  { label: 'auto/best-coding', badge: 'Code' },
                  { label: 'auto/best-reasoning', badge: 'Reason' },
                ].map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => handleChange('openaiModel', m.label)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-colors cursor-pointer flex items-center gap-1 ${
                      settings.openaiModel === m.label
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>{m.label}</span>
                    <span className="text-[9px] opacity-75 font-sans">({m.badge})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Integration Examples (Matching screenshot tabs) */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Code2 size={14} className="text-[#1a3a5c]" />
                <span>Quick Integration Examples</span>
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
                  Alternative / Fallback AI Providers (Optional)
                </h3>
                <p className="text-xs text-gray-400">
                  OpenRouter, Google Gemini, DeepSeek, Alibaba Qwen, Moonshot Kimi, Cerebras
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
                If the primary OpenAI gateway is unavailable or rate-limited, the translation engine will automatically cascade through these configured fallbacks.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OpenRouter */}
                <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">OpenRouter API Key</label>
                    <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">openrouter.ai</a>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys.openrouter ? 'text' : 'password'}
                      value={settings.openrouterApiKey || ''}
                      onChange={(e) => handleChange('openrouterApiKey', e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('openrouter')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showKeys.openrouter ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Gemini */}
                <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Google Gemini API Key</label>
                    <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">AI Studio</a>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys.gemini ? 'text' : 'password'}
                      value={settings.geminiApiKey || ''}
                      onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                      placeholder="AIza..."
                      className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('gemini')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showKeys.gemini ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* DeepSeek */}
                <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">DeepSeek API Key</label>
                    <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">deepseek.com</a>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys.deepseek ? 'text' : 'password'}
                      value={settings.deepseekApiKey || ''}
                      onChange={(e) => handleChange('deepseekApiKey', e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('deepseek')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showKeys.deepseek ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Alibaba Qwen */}
                <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Alibaba Qwen API Key</label>
                    <a href="https://dashscope.aliyun.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">aliyun.com</a>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys.qwen ? 'text' : 'password'}
                      value={settings.qwenApiKey || ''}
                      onChange={(e) => handleChange('qwenApiKey', e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('qwen')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showKeys.qwen ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

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
                      className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg bg-white"
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
                      className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg bg-white"
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
                <span>Saving Settings...</span>
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