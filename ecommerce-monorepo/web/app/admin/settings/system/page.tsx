'use client'

import { useState, useEffect } from 'react'
import { Cog, Key, Loader2, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface SystemSettings {
  id?: string
  openrouterApiKey?: string
  geminiApiKey?: string
  deepseekApiKey?: string
  qwenApiKey?: string
  kimiApiKey?: string
  timezone?: string
  language?: string
  currency?: string
  emailNotifications?: boolean
  smsNotifications?: boolean
  maintenanceMode?: boolean
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKeys, setShowKeys] = useState({
    openrouter: false,
    gemini: false,
    deepseek: false,
    qwen: false,
    kimi: false,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/system')
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()
      setSettings(data)
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
      toast.success('Settings saved successfully!')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600">
            <Cog size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
            <p className="text-sm text-gray-500">Configure AI translation API keys and system preferences</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI Translation API Keys */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Key size={20} className="text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">AI Translation API Keys</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Configure API keys for automatic translation services. Keys are stored securely and used for multi-language content.
          </p>

          <div className="space-y-4">
            {/* OpenRouter API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenRouter API Key
                <span className="ml-2 text-xs text-gray-500">(Primary - Free tier available)</span>
              </label>
              <div className="relative">
                <input
                  type={showKeys.openrouter ? 'text' : 'password'}
                  value={settings.openrouterApiKey || ''}
                  onChange={(e) => handleChange('openrouterApiKey', e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('openrouter')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys.openrouter ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Get your free API key at: <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">openrouter.ai</a>
              </p>
            </div>

            {/* Gemini API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Gemini API Key
                <span className="ml-2 text-xs text-gray-500">(Tier 1 - Free tier available)</span>
              </label>
              <div className="relative">
                <input
                  type={showKeys.gemini ? 'text' : 'password'}
                  value={settings.geminiApiKey || ''}
                  onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('gemini')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys.gemini ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Get your API key at: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a>
              </p>
            </div>

            {/* DeepSeek API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DeepSeek API Key
                <span className="ml-2 text-xs text-gray-500">(Tier 2 - Failover)</span>
              </label>
              <div className="relative">
                <input
                  type={showKeys.deepseek ? 'text' : 'password'}
                  value={settings.deepseekApiKey || ''}
                  onChange={(e) => handleChange('deepseekApiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('deepseek')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys.deepseek ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Get your API key at: <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">platform.deepseek.com</a>
              </p>
            </div>

            {/* Qwen API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alibaba Qwen API Key
                <span className="ml-2 text-xs text-gray-500">(Tier 3 - Failover)</span>
              </label>
              <div className="relative">
                <input
                  type={showKeys.qwen ? 'text' : 'password'}
                  value={settings.qwenApiKey || ''}
                  onChange={(e) => handleChange('qwenApiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('qwen')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys.qwen ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Get your API key at: <a href="https://dashscope.aliyun.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">dashscope.aliyun.com</a>
              </p>
            </div>

            {/* Kimi API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moonshot Kimi API Key
                <span className="ml-2 text-xs text-gray-500">(Tier 4 - Failover)</span>
              </label>
              <div className="relative">
                <input
                  type={showKeys.kimi ? 'text' : 'password'}
                  value={settings.kimiApiKey || ''}
                  onChange={(e) => handleChange('kimiApiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('kimi')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys.kimi ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Get your API key at: <a href="https://platform.moonshot.cn" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">platform.moonshot.cn</a>
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> The system will try API keys in order (OpenRouter → Gemini → DeepSeek → Qwen → Kimi) until one succeeds. You only need one API key for translations to work.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}