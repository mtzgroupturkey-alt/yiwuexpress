'use client'

import React, { useState, useMemo } from 'react'
import {
  Settings2,
  Box,
  Layers,
  Grid3X3,
  CheckCircle2,
  Loader2,
  Plus,
  Minus,
  Sparkles,
  Info,
  Copy,
  Check,
  ArrowDown,
  Warehouse as WarehouseIcon,
  Sliders,
  Maximize2,
  Eye,
  Tag,
  Truck,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'

export interface InspectorItemLayout {
  bays?: number
  levels?: number
  rows?: number
  cols?: number
  subParts?: number
  laneRows?: number
  laneCols?: number
  sections?: number
}

export interface InspectorItem {
  itemType: 'RACK' | 'FLOOR' | 'LANE'
  baseCode: string
  title: string
  zoneId?: string
  layout: InspectorItemLayout
}

interface WarehouseItemLayoutModalProps {
  item: InspectorItem | null
  onClose: () => void
  onSave: (payload: {
    itemType: 'RACK' | 'FLOOR' | 'LANE'
    baseCode: string
    layout: InspectorItemLayout
  }) => void
  isSaving: boolean
  dict?: any
}

// Preset configurations for rapid 1-click setup
const RACK_PRESETS = [
  { label: 'Standard (4×3)', bays: 4, levels: 3, desc: '12 Slots • 4 Bays × 3 Levels' },
  { label: 'High-Bay (6×4)', bays: 6, levels: 4, desc: '24 Slots • High density' },
  { label: 'Compact (2×2)', bays: 2, levels: 2, desc: '4 Slots • Small buffer' },
  { label: 'Long Line (8×3)', bays: 8, levels: 3, desc: '24 Slots • Aisle run' },
]

const FLOOR_PRESETS = [
  { label: 'Single Bay (1×1)', rows: 1, cols: 1, desc: '1 Full Bay Space' },
  { label: 'Dual Split (1×2)', rows: 1, cols: 2, desc: '2 Pallet Spots (A, B)' },
  { label: 'Standard Grid (2×2)', rows: 2, cols: 2, desc: '4 Pallet Spots (A1-B2)' },
  { label: '2×3 Grid (2×3)', rows: 2, cols: 3, desc: '6 Pallets • 2 Rows × 3 Cols' },
  { label: '3×3 Block (3×3)', rows: 3, cols: 3, desc: '9 Pallets • 3 Rows × 3 Cols' },
  { label: '4×2 Deep (4×2)', rows: 4, cols: 2, desc: '8 Pallets • 4 Rows × 2 Cols' },
]

const LANE_PRESETS = [
  { label: 'Single (1×1)', laneRows: 1, laneCols: 1, desc: '1 Direct Slot • 1 Track × 1 Stop' },
  { label: 'Dual Track (2×2)', laneRows: 2, laneCols: 2, desc: '4 Slots • 2 Tracks × 2 Stops (2R × 2C)' },
  { label: '3-Deep (3×1)', laneRows: 3, laneCols: 1, desc: '3 Depth Stops • 1 Track (3R × 1C)' },
  { label: 'Dual Track (3×2)', laneRows: 3, laneCols: 2, desc: '6 Slots • 2 Tracks × 3 Stops (3R × 2C)' },
  { label: 'Dual Track 4-Deep (4×2)', laneRows: 4, laneCols: 2, desc: '8 Slots • 2 Tracks × 4 Stops (4R × 2C)' },
  { label: '5-Deep (5×1)', laneRows: 5, laneCols: 1, desc: '5 Depth Stops • 1 Track (5R × 1C)' },
  { label: 'Triple Track 4-Deep (4×3)', laneRows: 4, laneCols: 3, desc: '12 Slots • 3 Tracks × 4 Stops (4R × 3C)' },
]

export function WarehouseItemLayoutModal({
  item,
  onClose,
  onSave,
  isSaving,
  dict,
}: WarehouseItemLayoutModalProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'codes'>('visual')
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [codeFilter, setCodeFilter] = useState('')

  // Local state for layout configuration
  const [localLayout, setLocalLayout] = useState<{
    bays: number
    levels: number
    rows: number
    cols: number
    laneRows: number
    laneCols: number
  }>({
    bays: 4,
    levels: 3,
    rows: 2,
    cols: 2,
    laneRows: 3,
    laneCols: 1,
  })

  // Sync state when item changes
  React.useEffect(() => {
    if (item) {
      const initialBays = Math.max(1, Math.min(20, Number(item.layout.bays) || 4))
      const initialLevels = Math.max(1, Math.min(10, Number(item.layout.levels) || 3))
      
      // Calculate Floor Rows & Cols
      let initialRows = Number(item.layout.rows)
      let initialCols = Number(item.layout.cols)
      if (!initialRows && !initialCols) {
        const sub = Number(item.layout.subParts) || 1
        if (sub <= 1) {
          initialRows = 1
          initialCols = 1
        } else if (sub === 2) {
          initialRows = 1
          initialCols = 2
        } else if (sub === 4) {
          initialRows = 2
          initialCols = 2
        } else if (sub === 6) {
          initialRows = 2
          initialCols = 3
        } else {
          initialRows = 1
          initialCols = sub
        }
      }
      initialRows = Math.max(1, Math.min(10, initialRows || 1))
      initialCols = Math.max(1, Math.min(10, initialCols || 1))

      // Calculate Lane Rows (Depth Stops) & Cols (Tracks)
      let initialLaneRows = Number(item.layout.laneRows) || Number(item.layout.rows)
      let initialLaneCols = Number(item.layout.laneCols) || Number(item.layout.cols)
      if (!initialLaneRows && !initialLaneCols) {
        const sec = Number(item.layout.sections) || 1
        if (sec <= 1) {
          initialLaneRows = 1
          initialLaneCols = 1
        } else if (sec === 2) {
          initialLaneRows = 2
          initialLaneCols = 1
        } else if (sec === 4) {
          initialLaneRows = 2
          initialLaneCols = 2
        } else if (sec === 6) {
          initialLaneRows = 3
          initialLaneCols = 2
        } else if (sec === 8) {
          initialLaneRows = 4
          initialLaneCols = 2
        } else if (sec === 12) {
          initialLaneRows = 4
          initialLaneCols = 3
        } else {
          initialLaneRows = sec
          initialLaneCols = 1
        }
      }
      initialLaneRows = Math.max(1, Math.min(20, initialLaneRows || 3))
      initialLaneCols = Math.max(1, Math.min(10, initialLaneCols || 1))

      setLocalLayout({
        bays: initialBays,
        levels: initialLevels,
        rows: initialRows,
        cols: initialCols,
        laneRows: initialLaneRows,
        laneCols: initialLaneCols,
      })
      setHoveredSlot(null)
      setActiveTab('visual')
      setCodeFilter('')
    }
  }, [item])

  // Calculate generated codes based on current localLayout
  const generatedCodes = useMemo(() => {
    if (!item) return []
    const codes: {
      code: string
      label: string
      bay?: number
      level?: number
      row?: number
      col?: number
      track?: number
      stop?: number
    }[] = []

    if (item.itemType === 'RACK') {
      const { bays, levels } = localLayout
      for (let b = 1; b <= bays; b++) {
        const bPad = b < 10 ? `0${b}` : `${b}`
        for (let l = 1; l <= levels; l++) {
          const lPad = l < 10 ? `0${l}` : `${l}`
          const code = `${item.baseCode}-${bPad}-${lPad}`
          codes.push({
            code,
            label: `Bay ${bPad}, Level ${lPad}`,
            bay: b,
            level: l,
          })
        }
      }
    } else if (item.itemType === 'FLOOR') {
      const { rows, cols } = localLayout
      if (rows === 1 && cols === 1) {
        codes.push({
          code: item.baseCode,
          label: `Single Floor Space (Full Bay)`,
          row: 1,
          col: 1,
        })
      } else if (rows === 1 && cols > 1) {
        for (let c = 1; c <= cols; c++) {
          const letter = String.fromCharCode(64 + c)
          const code = `${item.baseCode}-${letter}`
          codes.push({
            code,
            label: `Column ${letter} (Spot ${c})`,
            row: 1,
            col: c,
          })
        }
      } else if (rows > 1 && cols === 1) {
        for (let r = 1; r <= rows; r++) {
          const letter = String.fromCharCode(64 + r)
          const code = `${item.baseCode}-${letter}`
          codes.push({
            code,
            label: `Row ${letter} (Spot ${r})`,
            row: r,
            col: 1,
          })
        }
      } else {
        for (let r = 1; r <= rows; r++) {
          const rowLetter = String.fromCharCode(64 + r)
          for (let c = 1; c <= cols; c++) {
            const code = `${item.baseCode}-${rowLetter}${c}`
            codes.push({
              code,
              label: `Row ${rowLetter}, Col ${c} (Spot ${rowLetter}${c})`,
              row: r,
              col: c,
            })
          }
        }
      }
    } else if (item.itemType === 'LANE') {
      const { laneRows, laneCols } = localLayout
      if (laneCols === 1 && laneRows === 1) {
        codes.push({
          code: item.baseCode,
          label: `Single Direct Lane`,
          track: 1,
          stop: 1,
        })
      } else if (laneCols === 1 && laneRows > 1) {
        for (let r = 1; r <= laneRows; r++) {
          const sPad = r < 10 ? `0${r}` : `${r}`
          const code = `${item.baseCode}-${sPad}`
          codes.push({
            code,
            label: `Depth Stop ${sPad}`,
            track: 1,
            stop: r,
          })
        }
      } else if (laneCols > 1 && laneRows === 1) {
        for (let c = 1; c <= laneCols; c++) {
          const code = `${item.baseCode}-T${c}`
          codes.push({
            code,
            label: `Track ${c} (Col ${c}, Row 1)`,
            track: c,
            stop: 1,
            row: 1,
            col: c,
          })
        }
      } else {
        for (let c = 1; c <= laneCols; c++) {
          for (let r = 1; r <= laneRows; r++) {
            const sPad = r < 10 ? `0${r}` : `${r}`
            const code = `${item.baseCode}-T${c}-${sPad}`
            codes.push({
              code,
              label: `Track ${c}, Depth Stop ${sPad} (Row ${r}, Col ${c})`,
              track: c,
              stop: r,
              row: r,
              col: c,
            })
          }
        }
      }
    }

    return codes
  }, [item, localLayout])

  const filteredCodes = useMemo(() => {
    if (!codeFilter.trim()) return generatedCodes
    const q = codeFilter.toLowerCase()
    return generatedCodes.filter((c) => c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q))
  }, [generatedCodes, codeFilter])

  const totalSlots = generatedCodes.length

  const handleCopyAll = () => {
    const text = generatedCodes.map((c) => c.code).join('\n')
    navigator.clipboard.writeText(text)
    setCopiedAll(true)
    toast.success(`Copied ${totalSlots} location codes to clipboard!`)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const handleApplyPreset = (preset: any) => {
    if (!item) return
    if (item.itemType === 'RACK') {
      setLocalLayout((prev) => ({ ...prev, bays: preset.bays, levels: preset.levels }))
    } else if (item.itemType === 'FLOOR') {
      setLocalLayout((prev) => ({ ...prev, rows: preset.rows, cols: preset.cols }))
    } else if (item.itemType === 'LANE') {
      setLocalLayout((prev) => ({ ...prev, laneRows: preset.laneRows, laneCols: preset.laneCols }))
    }
  }

  const handleSubmit = () => {
    if (!item) return
    onSave({
      itemType: item.itemType,
      baseCode: item.baseCode,
      layout: {
        bays: localLayout.bays,
        levels: localLayout.levels,
        rows: item.itemType === 'LANE' ? localLayout.laneRows : localLayout.rows,
        cols: item.itemType === 'LANE' ? localLayout.laneCols : localLayout.cols,
        subParts: localLayout.rows * localLayout.cols,
        laneRows: localLayout.laneRows,
        laneCols: localLayout.laneCols,
        sections: localLayout.laneRows * localLayout.laneCols,
      },
    })
  }

  if (!item) return null

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden p-0 flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center font-bold shadow-xs">
              {item.itemType === 'RACK' ? (
                <Layers className="w-6 h-6 text-blue-300" />
              ) : item.itemType === 'FLOOR' ? (
                <Box className="w-6 h-6 text-amber-300" />
              ) : (
                <Truck className="w-6 h-6 text-emerald-300" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-blue-500 text-white shadow-xs">
                  {item.baseCode}
                </span>
                <DialogTitle className="text-base sm:text-lg font-black text-white tracking-tight">
                  {item.title || `${item.itemType} ${item.baseCode}`}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-950/80 border-blue-500/40"
                >
                  {item.itemType === 'RACK'
                    ? dict?.warehouses?.palletRackType || 'Pallet Rack'
                    : item.itemType === 'FLOOR'
                    ? dict?.warehouses?.floorBayType || 'Floor Staging Bay'
                    : dict?.warehouses?.bulkLaneType || 'Bulk Storage Lane'}
                </Badge>
              </div>

              <DialogDescription className="text-xs text-slate-300 mt-0.5">
                {item.itemType === 'RACK'
                  ? 'Configure the internal shelf structure. Set horizontal bays and vertical shelf levels to generate slot codes.'
                  : item.itemType === 'FLOOR'
                  ? 'Configure the 2D grid matrix with Row Numbers and Column Numbers for staging pallets.'
                  : 'Configure Sequential Depth Stops (Rows) and Parallel Tracks (Columns) along this bulk flow lane.'}
              </DialogDescription>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-right">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Capacity</div>
              <div className="text-sm font-black text-emerald-400 font-mono">
                {totalSlots} {totalSlots === 1 ? 'Slot' : 'Slots'}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          {/* 1. QUICK PRESETS BAR */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Presets & Standard Templates</span>
              <span className="text-[11px] text-slate-400 font-normal ml-1">
                (Click to instantly apply standard industry layout dimensions)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {item.itemType === 'RACK' &&
                RACK_PRESETS.map((p) => {
                  const isSelected = localLayout.bays === p.bays && localLayout.levels === p.levels
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-[#00407a] shadow-xs ring-1 ring-[#00407a]'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className={`text-xs font-bold ${isSelected ? 'text-[#00407a]' : 'text-slate-800'}`}>
                        {p.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.desc}</div>
                    </button>
                  )
                })}

              {item.itemType === 'FLOOR' &&
                FLOOR_PRESETS.map((p) => {
                  const isSelected = localLayout.rows === p.rows && localLayout.cols === p.cols
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 border-amber-600 shadow-xs ring-1 ring-amber-600'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className={`text-xs font-bold ${isSelected ? 'text-amber-800' : 'text-slate-800'}`}>
                        {p.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.desc}</div>
                    </button>
                  )
                })}

              {item.itemType === 'LANE' &&
                LANE_PRESETS.map((p) => {
                  const isSelected = localLayout.laneRows === p.laneRows && localLayout.laneCols === p.laneCols
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className={`text-xs font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                        {p.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.desc}</div>
                    </button>
                  )
                })}
            </div>
          </div>

          {/* 2. STEPPER & SLIDER CONTROLS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Dimension & Grid Parameters</span>
              <span className="text-[11px] font-medium text-slate-400 normal-case">
                Use buttons, inputs, or range sliders to adjust rows & columns
              </span>
            </div>

            {/* RACK CONTROLS */}
            {item.itemType === 'RACK' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Horizontal Bays (Columns) */}
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Grid3X3 className="w-3.5 h-3.5 text-[#00407a]" />
                        <span>Horizontal Bays (Columns)</span>
                      </Label>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Side-by-side vertical column frames
                      </p>
                    </div>
                    <Badge className="bg-[#00407a] text-white font-mono text-xs px-2 py-0.5">
                      {localLayout.bays} {localLayout.bays === 1 ? 'Bay' : 'Bays'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({ ...prev, bays: Math.max(1, prev.bays - 1) }))
                      }
                      disabled={localLayout.bays <= 1}
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>

                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={localLayout.bays}
                      onChange={(e) =>
                        setLocalLayout((prev) => ({ ...prev, bays: Number(e.target.value) || 1 }))
                      }
                      className="flex-1 accent-[#00407a] cursor-pointer"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({ ...prev, bays: Math.min(20, prev.bays + 1) }))
                      }
                      disabled={localLayout.bays >= 20}
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>
                  </div>
                </div>

                {/* Vertical Levels (Rows) */}
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#00407a]" />
                        <span>Vertical Shelf Levels (Rows/Tiers)</span>
                      </Label>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Number of shelf tiers from bottom level 1 to top
                      </p>
                    </div>
                    <Badge className="bg-[#00407a] text-white font-mono text-xs px-2 py-0.5">
                      {localLayout.levels} {localLayout.levels === 1 ? 'Level' : 'Levels'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({ ...prev, levels: Math.max(1, prev.levels - 1) }))
                      }
                      disabled={localLayout.levels <= 1}
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>

                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={localLayout.levels}
                      onChange={(e) =>
                        setLocalLayout((prev) => ({ ...prev, levels: Number(e.target.value) || 1 }))
                      }
                      className="flex-1 accent-[#00407a] cursor-pointer"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({ ...prev, levels: Math.min(10, prev.levels + 1) }))
                      }
                      disabled={localLayout.levels >= 10}
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* FLOOR BAY CONTROLS (ROWS & COLUMNS) */}
            {item.itemType === 'FLOOR' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Floor Rows */}
                <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        <span>Staging Rows (Depth)</span>
                      </Label>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Sequential row lines (Row A, Row B, Row C...)
                      </p>
                    </div>
                    <Badge className="bg-amber-600 text-white font-mono text-xs px-2 py-0.5">
                      {localLayout.rows} {localLayout.rows === 1 ? 'Row' : 'Rows'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({ ...prev, rows: Math.max(1, prev.rows - 1) }))
                      }
                      disabled={localLayout.rows <= 1}
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>

                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={localLayout.rows}
                      onChange={(e) =>
                        setLocalLayout((prev) => ({ ...prev, rows: Number(e.target.value) || 1 }))
                      }
                      className="flex-1 accent-amber-600 cursor-pointer"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({ ...prev, rows: Math.min(10, prev.rows + 1) }))
                      }
                      disabled={localLayout.rows >= 10}
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>
                  </div>
                </div>

                {/* Floor Columns */}
                <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Grid3X3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Staging Columns (Width)</span>
                      </Label>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Side-by-side pallet spots per row (Col 1, Col 2...)
                      </p>
                    </div>
                    <Badge className="bg-amber-600 text-white font-mono text-xs px-2 py-0.5">
                      {localLayout.cols} {localLayout.cols === 1 ? 'Col' : 'Cols'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({ ...prev, cols: Math.max(1, prev.cols - 1) }))
                      }
                      disabled={localLayout.cols <= 1}
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>

                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={localLayout.cols}
                      onChange={(e) =>
                        setLocalLayout((prev) => ({ ...prev, cols: Number(e.target.value) || 1 }))
                      }
                      className="flex-1 accent-amber-600 cursor-pointer"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({ ...prev, cols: Math.min(10, prev.cols + 1) }))
                      }
                      disabled={localLayout.cols >= 10}
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* BULK LANE CONTROLS (DEPTH STOPS & PARALLEL TRACKS) */}
            {item.itemType === 'LANE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lane Depth Stops (Rows) */}
                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Depth Stops • Sequential Rows (1 - 20)</span>
                      </Label>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Sequential depth staging stops along the drive-in lane
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-800 bg-white font-mono font-bold">
                        ROW
                      </Badge>
                      <Badge className="bg-emerald-600 text-white font-mono text-xs px-2 py-0.5">
                        {localLayout.laneRows} {localLayout.laneRows === 1 ? 'Stop' : 'Stops'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({
                          ...prev,
                          laneRows: Math.max(1, prev.laneRows - 1),
                        }))
                      }
                      disabled={localLayout.laneRows <= 1}
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>

                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={localLayout.laneRows}
                      onChange={(e) =>
                        setLocalLayout((prev) => ({
                          ...prev,
                          laneRows: Number(e.target.value) || 1,
                        }))
                      }
                      className="flex-1 accent-emerald-600 cursor-pointer"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({
                          ...prev,
                          laneRows: Math.min(20, prev.laneRows + 1),
                        }))
                      }
                      disabled={localLayout.laneRows >= 20}
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>
                  </div>
                </div>

                {/* Lane Parallel Tracks (Columns) */}
                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Parallel Tracks • Drive-In Cols (1 - 10)</span>
                      </Label>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Parallel drive-in flow lines (Track 1, Track 2...)
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-800 bg-white font-mono font-bold">
                        COL
                      </Badge>
                      <Badge className="bg-emerald-600 text-white font-mono text-xs px-2 py-0.5">
                        {localLayout.laneCols} {localLayout.laneCols === 1 ? 'Track' : 'Tracks'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({
                          ...prev,
                          laneCols: Math.max(1, prev.laneCols - 1),
                        }))
                      }
                      disabled={localLayout.laneCols <= 1}
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>

                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={localLayout.laneCols}
                      onChange={(e) =>
                        setLocalLayout((prev) => ({
                          ...prev,
                          laneCols: Number(e.target.value) || 1,
                        }))
                      }
                      className="flex-1 accent-emerald-600 cursor-pointer"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-100 shrink-0"
                      onClick={() =>
                        setLocalLayout((prev) => ({
                          ...prev,
                          laneCols: Math.min(10, prev.laneCols + 1),
                        }))
                      }
                      disabled={localLayout.laneCols >= 10}
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-700" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. VISUAL ELEVATION / SCHEMATIC & GENERATED CODES TABS */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Tab Header */}
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('visual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'visual'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-[#00407a]" />
                  <span>Interactive 2D Visual Diagram</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('codes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'codes'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Generated Address Codes</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    {totalSlots}
                  </span>
                </button>
              </div>

              {activeTab === 'codes' && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search codes..."
                    value={codeFilter}
                    onChange={(e) => setCodeFilter(e.target.value)}
                    className="h-7 text-xs w-36 bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAll}
                    className="h-7 text-xs font-semibold gap-1"
                  >
                    {copiedAll ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAll ? 'Copied' : 'Copy All'}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* TAB CONTENT 1: VISUAL DIAGRAM */}
            {activeTab === 'visual' && (
              <div className="p-4 sm:p-5 bg-slate-900 text-white min-h-[260px] flex flex-col justify-center">
                {/* RACK VISUAL ELEVATION */}
                {item.itemType === 'RACK' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-wider">
                          Pallet Racking Elevation View
                        </span>
                        <span className="text-[11px] text-slate-400">
                          (Top shelves at top, ground level 1 at bottom)
                        </span>
                      </div>
                      {hoveredSlot ? (
                        <span className="font-mono text-sky-400 font-bold bg-slate-800 px-2.5 py-0.5 rounded text-xs border border-slate-700">
                          Selected Slot: {hoveredSlot}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Hover on any slot cell for details
                        </span>
                      )}
                    </div>

                    {/* Industrial Steel Rack Frame */}
                    <div className="overflow-x-auto pb-2">
                      <div className="min-w-fit flex flex-col gap-1.5 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                        {/* Render Levels from TOP (localLayout.levels) DOWN to 1 */}
                        {Array.from({ length: localLayout.levels })
                          .map((_, idx) => localLayout.levels - idx)
                          .map((levelNum) => {
                            const lPad = levelNum < 10 ? `0${levelNum}` : `${levelNum}`
                            return (
                              <div key={levelNum} className="flex items-center gap-1.5">
                                {/* Level label pill on left */}
                                <div className="w-14 shrink-0 text-right pr-2 font-mono text-[10px] font-bold text-slate-400">
                                  L{levelNum}
                                </div>

                                {/* Bays across */}
                                <div className="flex items-center gap-1.5 flex-1">
                                  {Array.from({ length: localLayout.bays }).map((_, bIdx) => {
                                    const bayNum = bIdx + 1
                                    const bPad = bayNum < 10 ? `0${bayNum}` : `${bayNum}`
                                    const slotCode = `${item.baseCode}-${bPad}-${lPad}`
                                    const isHovered = hoveredSlot === slotCode

                                    return (
                                      <div
                                        key={bayNum}
                                        onMouseEnter={() => setHoveredSlot(slotCode)}
                                        onMouseLeave={() => setHoveredSlot(null)}
                                        className={`relative flex-1 min-w-[72px] sm:min-w-[90px] h-12 rounded-md border transition-all flex flex-col items-center justify-center cursor-pointer ${
                                          isHovered
                                            ? 'bg-blue-600 border-blue-400 shadow-md scale-105 z-10 text-white'
                                            : 'bg-slate-900/90 border-slate-700/80 hover:border-blue-500 hover:bg-slate-800 text-slate-200'
                                        }`}
                                      >
                                        <div className="absolute bottom-0 inset-x-0 h-1 bg-amber-500 rounded-b-md" />
                                        <div className="text-[10px] font-mono font-bold tracking-tight">
                                          {slotCode}
                                        </div>
                                        <div className="text-[8px] text-slate-400 font-medium">
                                          B{bayNum} • L{levelNum}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}

                        {/* Bay Column Labels on bottom */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
                          <div className="w-14 shrink-0 text-right pr-2 font-mono text-[9px] font-bold text-slate-400 uppercase">
                            Tier
                          </div>
                          <div className="flex items-center gap-1.5 flex-1">
                            {Array.from({ length: localLayout.bays }).map((_, bIdx) => {
                              const bayNum = bIdx + 1
                              return (
                                <div
                                  key={bayNum}
                                  className="flex-1 min-w-[72px] sm:min-w-[90px] text-center font-mono text-[9px] font-bold text-slate-400 uppercase"
                                >
                                  B{bayNum}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* FLOOR VISUAL 2D MATRIX SCHEMATIC (ROWS & COLUMNS) */}
                {item.itemType === 'FLOOR' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-wider">
                          Floor Staging Bay 2D Grid
                        </span>
                        <span className="text-[11px] text-amber-400 font-mono">
                          {localLayout.rows} {localLayout.rows === 1 ? 'Row' : 'Rows'} ×{' '}
                          {localLayout.cols} {localLayout.cols === 1 ? 'Column' : 'Columns'} ={' '}
                          {totalSlots} Pallet Spots
                        </span>
                      </div>
                      {hoveredSlot ? (
                        <span className="font-mono text-amber-300 font-bold bg-slate-800 px-2.5 py-0.5 rounded text-xs border border-amber-600/40">
                          Selected Spot: {hoveredSlot}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Hover on any pallet spot for details
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 bg-slate-950/90 rounded-xl border border-amber-500/30 overflow-x-auto">
                      <div className="min-w-fit flex flex-col gap-2">
                        {/* Column Headers along the top */}
                        <div className="flex items-center gap-2">
                          <div className="w-14 shrink-0" />
                          <div className="flex items-center gap-2 flex-1">
                            {Array.from({ length: localLayout.cols }).map((_, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex-1 min-w-[80px] sm:min-w-[100px] text-center font-mono text-[10px] font-bold text-amber-400/90 uppercase"
                              >
                                Col {cIdx + 1}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Staging Rows */}
                        {Array.from({ length: localLayout.rows }).map((_, rIdx) => {
                          const rowLetter = String.fromCharCode(65 + rIdx)
                          return (
                            <div key={rIdx} className="flex items-center gap-2">
                              {/* Row Label Pill */}
                              <div className="w-14 shrink-0 text-right pr-2 font-mono text-xs font-bold text-amber-400">
                                Row {rowLetter}
                              </div>

                              {/* Row Grid Cells */}
                              <div className="flex items-center gap-2 flex-1">
                                {Array.from({ length: localLayout.cols }).map((_, cIdx) => {
                                  const colNum = cIdx + 1
                                  let spotCode = ''
                                  let spotPill = ''

                                  if (localLayout.rows === 1 && localLayout.cols === 1) {
                                    spotCode = item.baseCode
                                    spotPill = '1'
                                  } else if (localLayout.rows === 1 && localLayout.cols > 1) {
                                    const colLetter = String.fromCharCode(65 + cIdx)
                                    spotCode = `${item.baseCode}-${colLetter}`
                                    spotPill = colLetter
                                  } else if (localLayout.rows > 1 && localLayout.cols === 1) {
                                    spotCode = `${item.baseCode}-${rowLetter}`
                                    spotPill = rowLetter
                                  } else {
                                    spotCode = `${item.baseCode}-${rowLetter}${colNum}`
                                    spotPill = `${rowLetter}${colNum}`
                                  }

                                  const isHovered = hoveredSlot === spotCode

                                  return (
                                    <div
                                      key={cIdx}
                                      onMouseEnter={() => setHoveredSlot(spotCode)}
                                      onMouseLeave={() => setHoveredSlot(null)}
                                      className={`flex-1 min-w-[80px] sm:min-w-[100px] h-16 rounded-lg border-2 transition-all flex flex-col items-center justify-center p-1.5 cursor-pointer relative ${
                                        isHovered
                                          ? 'bg-amber-500/30 border-amber-400 shadow-md scale-105 z-10 text-white'
                                          : 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-400 text-slate-200'
                                      }`}
                                    >
                                      <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                                        {spotPill}
                                      </div>
                                      <span className="font-mono font-bold text-[10px] text-white mt-1">
                                        {spotCode}
                                      </span>
                                      <span className="text-[8px] text-amber-300/80">
                                        R{rowLetter} • C{colNum}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* LANE VISUAL 2D MATRIX SCHEMATIC (TRACKS & DEPTH STOPS) */}
                {item.itemType === 'LANE' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-wider">
                          Drive-In Bulk Lane Flow Yard
                        </span>
                        <span className="text-[11px] text-emerald-400 font-mono">
                          {localLayout.laneCols} {localLayout.laneCols === 1 ? 'Track' : 'Tracks'} ×{' '}
                          {localLayout.laneRows} {localLayout.laneRows === 1 ? 'Stop' : 'Stops'} •{' '}
                          {localLayout.laneRows} Rows × {localLayout.laneCols} Cols ={' '}
                          {totalSlots} Staging Spots
                        </span>
                      </div>
                      {hoveredSlot ? (
                        <span className="font-mono text-emerald-300 font-bold bg-slate-800 px-2.5 py-0.5 rounded text-xs border border-emerald-600/40">
                          Selected Stop: {hoveredSlot}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Hover on any staging stop for details
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 bg-slate-950/90 rounded-xl border border-emerald-500/30 overflow-x-auto">
                      <div className="min-w-fit flex flex-col gap-2">
                        {/* Track Entry Direction Headers */}
                        <div className="flex items-center gap-2">
                          <div className="w-16 shrink-0 text-right pr-2 text-[10px] font-bold text-emerald-400">
                            Entry ⬇️
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            {Array.from({ length: localLayout.laneCols }).map((_, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex-1 min-w-[90px] sm:min-w-[110px] bg-emerald-950/80 border border-emerald-600/50 rounded-md py-1 px-2 text-center flex items-center justify-center gap-1.5"
                              >
                                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="font-mono text-[10px] font-bold text-emerald-300 uppercase">
                                  Track {cIdx + 1} (Col {cIdx + 1})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sequential Depth Stops */}
                        {Array.from({ length: localLayout.laneRows }).map((_, rIdx) => {
                          const stopNum = rIdx + 1
                          const sPad = stopNum < 10 ? `0${stopNum}` : `${stopNum}`

                          return (
                            <div key={rIdx} className="flex items-center gap-2">
                              {/* Stop Label Pill */}
                              <div className="w-16 shrink-0 text-right pr-2 font-mono text-[10px] font-bold text-slate-400">
                                Stop {sPad} (R{stopNum})
                              </div>

                              {/* Stop Cells Across Parallel Tracks */}
                              <div className="flex items-center gap-2 flex-1">
                                {Array.from({ length: localLayout.laneCols }).map((_, cIdx) => {
                                  const trackNum = cIdx + 1
                                  let stopCode = ''
                                  let stopDesc = ''

                                  if (localLayout.laneCols === 1 && localLayout.laneRows === 1) {
                                    stopCode = item.baseCode
                                    stopDesc = 'Single Lane'
                                  } else if (localLayout.laneCols === 1 && localLayout.laneRows > 1) {
                                    stopCode = `${item.baseCode}-${sPad}`
                                    stopDesc = `Stop ${sPad}`
                                  } else if (localLayout.laneCols > 1 && localLayout.laneRows === 1) {
                                    stopCode = `${item.baseCode}-T${trackNum}`
                                    stopDesc = `Track ${trackNum}`
                                  } else {
                                    stopCode = `${item.baseCode}-T${trackNum}-${sPad}`
                                    stopDesc = `Track ${trackNum} • Stop ${sPad}`
                                  }

                                  const isHovered = hoveredSlot === stopCode

                                  return (
                                    <div
                                      key={cIdx}
                                      onMouseEnter={() => setHoveredSlot(stopCode)}
                                      onMouseLeave={() => setHoveredSlot(null)}
                                      className={`flex-1 min-w-[90px] sm:min-w-[110px] h-14 rounded-lg border-2 transition-all flex flex-col items-center justify-center p-1.5 cursor-pointer ${
                                        isHovered
                                          ? 'bg-emerald-500/30 border-emerald-400 shadow-md scale-105 z-10 text-white'
                                          : 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20 hover:border-emerald-400 text-slate-200'
                                      }`}
                                    >
                                      <span className="font-mono font-bold text-[10px] text-white">
                                        {stopCode}
                                      </span>
                                      <span className="text-[8px] text-emerald-300/80 font-medium">
                                        {stopDesc} • R{stopNum}C{trackNum}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: GENERATED CODES LIST */}
            {activeTab === 'codes' && (
              <div className="p-4 sm:p-5 max-h-72 overflow-y-auto space-y-2">
                {filteredCodes.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-8">
                    No codes matching &quot;{codeFilter}&quot;
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredCodes.map((c) => (
                      <div
                        key={c.code}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between hover:border-blue-300 hover:bg-blue-50/40 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xs text-slate-900">
                            {c.code}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            BC-{c.code}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">{c.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <DialogFooter className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Saving will regenerate{' '}
              <strong className="text-slate-900 font-bold font-mono">{totalSlots}</strong> target storage
              slots.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-4 text-xs font-bold"
            >
              {dict?.common?.cancel || 'Cancel'}
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-[#00407a] hover:bg-blue-800 text-white text-xs font-bold h-9 px-5 gap-1.5 shadow-sm cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {dict?.warehouses?.applyChangesRegenerate ||
                  `Save & Generate ${totalSlots} Slots`}
              </span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
