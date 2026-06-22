'use client'

import { Bell, Mail, MessageSquare, Smartphone, Volume2, AlertCircle } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500">Configure email and system notification preferences</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <Bell size={32} className="text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Center</h3>
        <p className="text-gray-500 mb-6">Email templates and notification settings will be available here.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { icon: Mail, label: 'Email Settings' },
            { icon: MessageSquare, label: 'SMS Alerts' },
            { icon: Smartphone, label: 'Push Notifications' },
            { icon: Volume2, label: 'Sound Alerts' },
            { icon: AlertCircle, label: 'System Alerts' },
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