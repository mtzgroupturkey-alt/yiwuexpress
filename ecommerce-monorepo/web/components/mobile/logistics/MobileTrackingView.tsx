'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { 
  Search, 
  Package, 
  Truck, 
  Ship, 
  Plane, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'
import { MobileHeader } from '../MobileHeader'
import { EmptyState } from '../EmptyState'

export interface TrackingEvent {
  id: string
  title: string
  location?: string
  timestamp: string
  completed: boolean
  current?: boolean
  description?: string
}

export interface ShipmentDetails {
  trackingNumber: string
  status: string
  statusText?: string
  origin: string
  destination: string
  transportMode?: 'sea' | 'air' | 'rail' | 'road'
  carrier?: string
  vesselOrFlight?: string
  containerNumber?: string
  estimatedDelivery?: string
  weightKg?: number
  volumeCbm?: number
  events: TrackingEvent[]
}

interface MobileTrackingViewProps {
  shipment?: ShipmentDetails | null
  searchTerm: string
  onSearch: (trackingCode: string) => void
  isLoading?: boolean
  error?: string | null
  onBack?: () => void
  className?: string
}

export function MobileTrackingView({
  shipment,
  searchTerm,
  onSearch,
  isLoading = false,
  error = null,
  onBack,
  className = '',
}: MobileTrackingViewProps) {
  const router = useRouter()
  const locale = useLocale()
  const [inputVal, setInputVal] = useState(searchTerm)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputVal.trim()) {
      onSearch(inputVal.trim())
    }
  }

  const getModeIcon = (mode?: string) => {
    switch (mode) {
      case 'air':
        return Plane
      case 'sea':
        return Ship
      default:
        return Truck
    }
  }

  const ModeIcon = getModeIcon(shipment?.transportMode)

  return (
    <div
      data-testid="mobile-tracking-view"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] pb-24 ${className}`}
    >
      {/* 1. Header */}
      <MobileHeader
        showBack={true}
        onBack={onBack || (() => router.push(`/${locale}`))}
        title={locale === 'zh' ? '物流轨迹追踪' : locale === 'ru' ? 'Отслеживание груза' : 'Cargo Tracking'}
        showSearchToggle={false}
      />

      {/* 2. Tracking Input Card */}
      <div className="p-3.5">
        <form onSubmit={handleSearchSubmit} className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-3.5 shadow-2xs space-y-2.5">
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
            {locale === 'zh'
              ? '输入运单号 / 提单号 (B/L)'
              : locale === 'ru'
              ? 'Введите номер накладной или контейнера'
              : 'Tracking Number or Bill of Lading (B/L)'}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value.toUpperCase())}
                placeholder="e.g. YW-8892401-CN"
                className="w-full min-h-[48px] pl-10 pr-3 text-xs uppercase font-mono font-bold bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className="min-h-[48px] px-5 rounded-xl bg-[#00407a] dark:bg-primary-600 text-white font-bold text-xs flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            >
              {isLoading
                ? locale === 'zh' ? '查询中...' : locale === 'ru' ? 'Поиск...' : 'Tracking...'
                : locale === 'zh' ? '查询' : locale === 'ru' ? 'Найти' : 'Track'}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-3.5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Shipment Found Details */}
      {shipment && (
        <div className="px-3.5 space-y-3.5">
          {/* Status Banner Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider font-mono">
                {shipment.trackingNumber}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {shipment.statusText || shipment.status}
              </span>
            </div>

            {/* Route Path (Origin -> Destination) */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Origin</p>
                <p className="font-bold text-gray-900 dark:text-white truncate">{shipment.origin}</p>
              </div>
              <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 px-2 shrink-0">
                <ModeIcon className="w-4 h-4" />
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Destination</p>
                <p className="font-bold text-gray-900 dark:text-white truncate">{shipment.destination}</p>
              </div>
            </div>

            {/* Vessel / ETA Badges */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-[11px] text-gray-600 dark:text-slate-300">
              {shipment.vesselOrFlight && (
                <div>
                  <span className="text-gray-400">Carrier / Vessel: </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{shipment.vesselOrFlight}</span>
                </div>
              )}
              {shipment.estimatedDelivery && (
                <div>
                  <span className="text-gray-400">Est. Arrival: </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{shipment.estimatedDelivery}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Milestones Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400">
              {locale === 'zh' ? '物流轨迹明细' : locale === 'ru' ? 'История перемещений' : 'Tracking Milestones'}
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-slate-800">
              {shipment.events.map((ev) => (
                <div key={ev.id} className="relative text-xs">
                  {/* Status node */}
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f172a] shadow-xs ${
                      ev.current
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950'
                        : ev.completed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-300 dark:bg-slate-700 text-transparent'
                    }`}
                  >
                    {ev.completed ? <CheckCircle2 className="w-3 h-3" /> : null}
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={`font-bold ${
                          ev.current
                            ? 'text-primary-600 dark:text-primary-400 font-extrabold'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {ev.title}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {ev.timestamp}
                      </span>
                    </div>
                    {ev.location && (
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{ev.location}</span>
                      </p>
                    )}
                    {ev.description && (
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Initial Empty State when no shipment searched yet */}
      {!shipment && !error && !isLoading && (
        <div className="pt-8 px-4">
          <EmptyState
            icon={<Package className="w-8 h-8 text-primary-600" />}
            title={locale === 'zh' ? '随时掌握货运动态' : locale === 'ru' ? 'Отслеживайте международный груз' : 'Real-time Cargo Tracking'}
            description={
              locale === 'zh'
                ? '支持中国义乌/宁波始发海运柜号、空运提单及国际铁运全程GPS节点追踪。'
                : locale === 'ru'
                ? 'Введите номер отслеживания контейнера или авианакладной для просмотра детального маршрута.'
                : 'Enter your tracking code or container number to view full international transit milestones.'
            }
          />
        </div>
      )}
    </div>
  )
}
