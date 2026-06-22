'use client'

import { Database, Download, Upload, Archive, Clock, HardDrive } from 'lucide-react'

export default function BackupPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Backup & Export</h2>
            <p className="text-sm text-gray-500">Manage data backups and export options</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
          <Database size={32} className="text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Management</h3>
        <p className="text-gray-500 mb-6">Backup scheduling and data export tools will be available here.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { icon: Download, label: 'Export Data' },
            { icon: Upload, label: 'Import Data' },
            { icon: Archive, label: 'Archives' },
            { icon: Clock, label: 'Scheduled Backups' },
            { icon: HardDrive, label: 'Storage' },
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