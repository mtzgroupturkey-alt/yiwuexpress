'use client'

import { useState } from 'react'
import { Database, Download, Upload, Archive, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [importStats, setImportStats] = useState<any>(null)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setMessage(null)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setMessage({ type: 'error', text: 'Please log in to export data' })
        return
      }

      const response = await fetch('/api/admin/backup', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `yiwuexpress-backup-${new Date().toISOString().split('T')[0]}.json`

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessage({ type: 'success', text: 'Backup exported successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to export backup' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setMessage(null)
      setImportStats(null)

      const token = localStorage.getItem('token')
      if (!token) {
        setMessage({ type: 'error', text: 'Please log in to import data' })
        return
      }

      // Read file content
      const fileContent = await file.text()
      const backupData = JSON.parse(fileContent)

      // Confirm with user
      const confirmImport = window.confirm(
        `This will import:\n` +
        `- ${backupData.statistics?.services || 0} services\n` +
        `- ${backupData.statistics?.quotes || 0} quotes\n` +
        `- ${backupData.statistics?.shipments || 0} shipments\n` +
        `- ${backupData.statistics?.companyInfo || 0} company records\n` +
        `- ${backupData.statistics?.systemSettings || 0} system settings\n\n` +
        `Do you want to proceed?`
      )

      if (!confirmImport) {
        setIsImporting(false)
        return
      }

      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: backupData.data,
          clearExisting: false, // Don't clear existing data by default
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()
      setImportStats(result.imported)
      setMessage({ type: 'success', text: result.message })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to import backup' })
    } finally {
      setIsImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

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

      {/* Message Display */}
      {message && (
        <div className={`rounded-xl p-4 flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="text-emerald-600 flex-shrink-0" size={20} />
          ) : (
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-emerald-900' : 'text-red-900'
            }`}>
              {message.text}
            </p>
            {importStats && (
              <div className="mt-2 text-xs text-emerald-700 space-y-1">
                <p>✓ Services: {importStats.services}</p>
                <p>✓ Quotes: {importStats.quotes}</p>
                <p>✓ Shipments: {importStats.shipments}</p>
                <p>✓ Company Info: {importStats.companyInfo}</p>
                <p>✓ System Settings: {importStats.systemSettings}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-50">
            <Download size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
            <p className="text-sm text-gray-500">Download a complete backup of all system data</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Export includes:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• All users (excluding passwords)</li>
              <li>• Services and pricing</li>
              <li>• Quotes and requests</li>
              <li>• Shipments and tracking</li>
              <li>• Company information</li>
              <li>• System settings</li>
            </ul>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Exporting...
              </>
            ) : (
              <>
                <Download size={20} />
                Export Backup (JSON)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-50">
            <Upload size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Import Data</h3>
            <p className="text-sm text-gray-500">Restore data from a backup file</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              Important Notes
            </h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Importing will add data without deleting existing records</li>
              <li>• Duplicate IDs will be skipped automatically</li>
              <li>• Make sure the backup file is in valid JSON format</li>
              <li>• Always create a backup before importing</li>
            </ul>
          </div>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
              id="backup-file-input"
            />
            <label
              htmlFor="backup-file-input"
              className={`block w-full py-3 px-4 ${
                isImporting ? 'bg-gray-400' : 'bg-amber-600 hover:bg-amber-700'
              } text-white font-semibold rounded-lg shadow transition-colors cursor-pointer text-center`}
            >
              {isImporting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Importing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload size={20} />
                  Choose Backup File to Import
                </span>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-start gap-3">
          <Archive className="text-gray-600 flex-shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Best Practices</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Create regular backups (weekly recommended)</li>
              <li>• Store backups in a secure location</li>
              <li>• Test restore procedures periodically</li>
              <li>• Keep multiple backup versions</li>
              <li>• Backup files are in JSON format and human-readable</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}