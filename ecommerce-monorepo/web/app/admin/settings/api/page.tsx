'use client'

import { Key, Code, Webhook, Shield, Globe, Settings } from 'lucide-react'

export default function ApiSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
            <Key size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">API Settings</h2>
            <p className="text-sm text-gray-500">Manage API keys, webhooks, and integrations</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
          <Key size={32} className="text-purple-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">API Management</h3>
        <p className="text-gray-500 mb-6">API key management and third-party integrations will be available here.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { icon: Code, label: 'API Keys' },
            { icon: Webhook, label: 'Webhooks' },
            { icon: Shield, label: 'Rate Limiting' },
            { icon: Globe, label: 'CORS Settings' },
            { icon: Settings, label: 'Integrations' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <Icon size={20} className="text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}