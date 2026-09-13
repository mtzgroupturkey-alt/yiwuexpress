'use client'

import { useState, useEffect } from 'react'
import {
  Tag, Plus, RefreshCw, ChevronRight, Percent, DollarSign,
  Calendar, CheckCircle2, Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'
import Link from 'next/link'

interface DiscountItem {
  id: string
  code: string
  description: string | null
  discountType: string
  value: number
  targetMode: string
  minSpend: number | null
  minQuantity: number | null
  usedCount: number
  isActive: boolean
  startDate: string
  endDate: string | null
}

export default function DiscountsPage() {
  const { dict, locale } = useAdminLocale()
  const [loading, setLoading] = useState(true)
  const [discounts, setDiscounts] = useState<DiscountItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    value: 10,
    targetMode: 'BOTH',
    minSpend: 0,
    minQuantity: 0,
  })

  const fetchDiscounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/discounts')
      const json = await res.json()
      if (json.success && json.data) {
        setDiscounts(json.data)
      }
    } catch (err) {
      console.error('Failed to load discounts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiscounts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (json.success) {
        setShowModal(false)
        setFormData({
          code: '',
          description: '',
          discountType: 'PERCENTAGE',
          value: 10,
          targetMode: 'BOTH',
          minSpend: 0,
          minQuantity: 0,
        })
        fetchDiscounts()
      } else {
        alert(json.error || 'Failed to save discount')
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Promotions & Contract Discounts
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure coupons, wholesale volume discounts, and B2B vs B2C promotional pricing rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDiscounts} disabled={loading} className="rounded-xl gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)} className="rounded-xl text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={14} />
            New Discount Code
          </Button>
        </div>
      </div>

      {/* Discounts Table */}
      <Card className="rounded-2xl border-gray-200/80 overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {discounts.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">No discounts configured yet.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Target Channel</th>
                  <th className="py-3 px-4">Rules</th>
                  <th className="py-3 px-4 text-center">Redemptions</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{d.code}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {d.discountType === 'PERCENTAGE' ? `${d.value}%` : `$${d.value}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                        {d.targetMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-[11px]">
                      {d.minSpend ? `Min spend: $${d.minSpend} ` : ''}
                      {d.minQuantity ? `Min qty: ${d.minQuantity}` : 'No limits'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-700">{d.usedCount}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {d.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Create Discount Code</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WHOLESALE15"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 uppercase font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Value</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Target Mode</label>
                <select
                  value={formData.targetMode}
                  onChange={(e) => setFormData({ ...formData, targetMode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                >
                  <option value="BOTH">Both (Wholesale + Retail)</option>
                  <option value="WHOLESALE">Wholesale Only (B2B)</option>
                  <option value="RETAIL">Retail Only (B2C)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                  Save Coupon
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
