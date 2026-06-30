'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, RefreshCw, Plus, Edit2, Save, X, Calendar, History, Check, AlertCircle, Download, Zap, Trash2 } from 'lucide-react'

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  symbolPosition: string
  decimalPlaces: number
  isBase: boolean
  isActive: boolean
  exchangeRate: number | null
  exchangeRateUpdatedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ExchangeRateHistory {
  id: string
  fromCurrency: string
  toCurrency: string
  rate: number
  date: string
  source: string | null
  notes: string | null
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [history, setHistory] = useState<ExchangeRateHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRate, setEditRate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<'currencies' | 'history'>('currencies')
  const [syncing, setSyncing] = useState(false)
  const [apiConfigured, setApiConfigured] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    symbolPosition: 'before',
    decimalPlaces: 2,
    exchangeRate: 1,
    isActive: true
  })

  useEffect(() => {
    loadCurrencies()
    loadHistory()
    checkApiConfig()
  }, [])

  const loadCurrencies = async () => {
    try {
      const res = await fetch('/api/currencies')
      const data = await res.json()
      if (data.success) {
        setCurrencies(data.data)
      }
    } catch (error) {
      console.error('Failed to load currencies:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/admin/currencies/history')
      const data = await res.json()
      if (data.success) {
        setHistory(data.data)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const checkApiConfig = async () => {
    try {
      const res = await fetch('/api/admin/currencies/sync')
      const data = await res.json()
      setApiConfigured(data.configured)
    } catch (error) {
      console.error('Failed to check API config:', error)
      setApiConfigured(false)
    }
  }

  const handleSyncRates = async () => {
    setSyncing(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/currencies/sync', {
        method: 'POST'
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `${data.message}. Refreshing...` 
        })
        
        // Reload data after successful sync
        await loadCurrencies()
        await loadHistory()
        
        setTimeout(() => setMessage(null), 5000)
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to sync exchange rates. Please try again.' 
      })
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleAdd = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      symbolPosition: 'before',
      decimalPlaces: 2,
      exchangeRate: 1,
      isActive: true
    })
    setShowAddDialog(true)
  }

  const handleEditCurrency = (currency: Currency) => {
    setSelectedCurrency(currency)
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      symbolPosition: currency.symbolPosition,
      decimalPlaces: currency.decimalPlaces,
      exchangeRate: currency.exchangeRate || 1,
      isActive: currency.isActive
    })
    setShowEditDialog(true)
  }

  const handleDeleteCurrency = (currency: Currency) => {
    setSelectedCurrency(currency)
    setShowDeleteDialog(true)
  }

  const handleSaveAdd = async () => {
    if (!formData.code || !formData.name || !formData.symbol) {
      setMessage({ type: 'error', text: 'Please fill all required fields' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Currency added successfully!' })
        setShowAddDialog(false)
        await loadCurrencies()
        await loadHistory()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to add currency' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add currency' })
      console.error('Add error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedCurrency) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/currencies/${selectedCurrency.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Currency updated successfully!' })
        setShowEditDialog(false)
        await loadCurrencies()
        await loadHistory()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update currency' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update currency' })
      console.error('Update error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedCurrency) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/currencies/${selectedCurrency.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Currency deleted successfully!' })
        setShowDeleteDialog(false)
        await loadCurrencies()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete currency' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete currency' })
      console.error('Delete error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (currency: Currency) => {
    setEditingId(currency.id)
    setEditRate(currency.exchangeRate?.toString() || '')
    setEditNotes('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditRate('')
    setEditNotes('')
  }

  const handleSave = async (currency: Currency) => {
    if (!editRate || parseFloat(editRate) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid exchange rate' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/currencies/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currency.code,
          rate: parseFloat(editRate),
          notes: editNotes || `Updated ${currency.code} rate`
        })
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: `${currency.code} rate updated successfully!` })
        setEditingId(null)
        setEditRate('')
        setEditNotes('')
        await loadCurrencies()
        await loadHistory()
        
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update rate' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update exchange rate' })
      console.error('Update error:', error)
    } finally {
      setSaving(false)
    }
  }

  const baseCurrency = currencies.find(c => c.isBase)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading currencies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Currency Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage exchange rates and currency settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            title="Add new currency"
          >
            <Plus size={18} />
            <span>Add Currency</span>
          </button>
          {apiConfigured && (
            <button
              onClick={handleSyncRates}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sync rates from exchangerate-api.com"
            >
              {syncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>Sync Rates</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={() => {
              loadCurrencies()
              loadHistory()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Currencies</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{currencies.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Currencies</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{currencies.filter(c => c.isActive).length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Check size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Base Currency</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{baseCurrency?.code || 'N/A'}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-purple-600">{baseCurrency?.symbol || '$'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Rate Updates</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{history.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('currencies')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'currencies'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign size={18} />
              <span>Currencies</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <History size={18} />
              <span>Exchange Rate History</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'currencies' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Currency</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Symbol</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Exchange Rate</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Updated</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currencies.map((currency) => {
                  const isEditing = editingId === currency.id
                  const isBase = currency.isBase

                  return (
                    <tr key={currency.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {currency.symbol}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{currency.name}</p>
                            {isBase && (
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">BASE</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-gray-700">{currency.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{currency.symbol} ({currency.symbolPosition})</span>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              step="0.0001"
                              value={editRate}
                              onChange={(e) => setEditRate(e.target.value)}
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Rate"
                            />
                            <input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Notes (optional)"
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-gray-900">
                              {currency.exchangeRate ? currency.exchangeRate.toFixed(4) : 'N/A'}
                            </p>
                            {!isBase && currency.exchangeRate && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                1 {baseCurrency?.code} = {currency.exchangeRate} {currency.code}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>
                            {currency.exchangeRateUpdatedAt
                              ? new Date(currency.exchangeRateUpdatedAt).toLocaleDateString()
                              : 'Never'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {currency.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSave(currency)}
                                disabled={saving || isBase}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Save"
                              >
                                <Save size={18} />
                              </button>
                              <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(currency)}
                                disabled={isBase}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isBase ? 'Cannot edit base currency rate' : 'Edit exchange rate'}
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleEditCurrency(currency)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Edit currency details"
                              >
                                <Edit2 size={18} className="fill-current" />
                              </button>
                              <button
                                onClick={() => handleDeleteCurrency(currency)}
                                disabled={isBase}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isBase ? 'Cannot delete base currency' : 'Delete currency'}
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Currency Pair</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <History size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>No exchange rate history yet</p>
                    </td>
                  </tr>
                ) : (
                  history.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{new Date(record.date).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-gray-900">{record.fromCurrency}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-mono font-semibold text-gray-900">{record.toCurrency}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{record.rate.toFixed(4)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {record.source || 'manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{record.notes || '-'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">About Exchange Rates</h3>
            <ul className="space-y-1.5 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span><strong>{baseCurrency?.code}</strong> is the base currency. All rates are relative to 1 {baseCurrency?.code}.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Exchange rates are used for purchase orders and sales orders to calculate profit in base currency.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>All rate changes are logged in the history for audit purposes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Base currency rate is always 1.0 and cannot be changed.</span>
              </li>
              {apiConfigured && (
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span><strong>Auto-sync enabled:</strong> Click "Sync Rates" to fetch latest rates from exchangerate-api.com instantly.</span>
                </li>
              )}
              {!apiConfigured && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">⚠</span>
                  <span><strong>API not configured:</strong> Add EXCHANGE_RATE_API_KEY to .env.local to enable automatic rate updates.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Add Currency Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add New Currency</h2>
              <button
                onClick={() => setShowAddDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., EUR"
                  maxLength={3}
                />
                <p className="text-xs text-gray-500 mt-1">3-letter ISO currency code</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Euro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., €"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol Position
                </label>
                <select
                  value={formData.symbolPosition}
                  onChange={(e) => setFormData({ ...formData, symbolPosition: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="before">Before (e.g., $100)</option>
                  <option value="after">After (e.g., 100€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decimal Places
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={formData.decimalPlaces}
                  onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exchange Rate to {baseCurrency?.code}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1 {baseCurrency?.code} = {formData.exchangeRate} {formData.code || 'XXX'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowAddDialog(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdd}
                disabled={saving}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Add Currency</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Currency Dialog */}
      {showEditDialog && selectedCurrency && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit Currency</h2>
              <button
                onClick={() => setShowEditDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Currency code cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Euro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., €"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol Position
                </label>
                <select
                  value={formData.symbolPosition}
                  onChange={(e) => setFormData({ ...formData, symbolPosition: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="before">Before (e.g., $100)</option>
                  <option value="after">After (e.g., 100€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decimal Places
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={formData.decimalPlaces}
                  onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {!selectedCurrency.isBase && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exchange Rate to {baseCurrency?.code}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1 {baseCurrency?.code} = {formData.exchangeRate} {formData.code}
                  </p>
                </div>
              )}

              {selectedCurrency.isBase && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Base Currency:</strong> Exchange rate is always 1.0 and cannot be changed.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Currency Dialog */}
      {showDeleteDialog && selectedCurrency && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Delete Currency</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{selectedCurrency.name} ({selectedCurrency.code})</strong>?
              </p>

              {selectedCurrency.isBase && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 mb-1">Cannot Delete Base Currency</p>
                      <p className="text-sm text-red-800">
                        This is the base currency for your system. You cannot delete it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!selectedCurrency.isBase && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900 mb-1">Warning</p>
                      <p className="text-sm text-yellow-800">
                        This action cannot be undone. The currency will be permanently deleted.
                      </p>
                      <p className="text-sm text-yellow-800 mt-2">
                        <strong>Note:</strong> You cannot delete a currency if it's being used in any orders, purchase orders, or products.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {!selectedCurrency.isBase && (
                <button
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      <span>Delete Currency</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
