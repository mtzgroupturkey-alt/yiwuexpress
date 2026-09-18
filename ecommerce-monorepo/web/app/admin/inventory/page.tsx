'use client'

import React, { useState, useEffect, useCallback, useMemo, useTransition, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  PlusCircle,
  Filter,
  CheckCircle2,
  AlertCircle,
  Warehouse as WarehouseIcon,
  Layers,
  AlertTriangle,
  FileText,
  DollarSign,
  Truck,
  Check,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  ExternalLink,
  ClipboardList,
  Inbox,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Barcode,
  Tag,
  Box,
  CheckSquare,
  Square,
  Grid,
  ArrowRightLeft,
  Ship,
  Train,
  Plane,
  Clock,
  X,
} from 'lucide-react'

interface WarehouseInfo {
  id: string
  name: string
  code: string
  country: string
  city?: string
  isDefaultProcurement?: boolean
  isDefaultSales?: boolean
}

interface WarehouseStock {
  id: string
  warehouseId: string
  quantity: number
  reservedQty: number
  availableQty: number
  avgCost: number
  reorderPoint: number
  isLowStock: boolean
  locationCode?: string | null
  locationPath?: string | null
  warehouse: WarehouseInfo
  slot: {
    id: string
    code: string
    bay?: {
      code: string
      zone?: {
        code: string
        name: string
      }
    }
  } | null
  product: {
    id: string
    name: string
    sku: string
    thumbnail?: string | null
    stock: number
    costPrice: number | null
    price: number
    weightKg?: number
    images?: string[]
  }
}

interface StockMovement {
  id: string
  type: string
  quantity: number
  unitCost: number | null
  reference: string | null
  notes: string | null
  createdAt: string
  warehouse?: WarehouseInfo | null
  product: {
    id: string
    name: string
    sku: string
    stock: number
  } | null
  variant: {
    id: string
    sku: string
    stock: number
  } | null
}

interface PurchaseOrderItem {
  id: string
  productId?: string | null
  variantId?: string | null
  productName?: string
  productSku?: string
  variantName?: string | null
  variantAttributes?: any
  quantity: number
  receivedQuantity?: number
  receivedQty?: number
  unitPrice?: number
  unitCost?: number
  total?: number
  totalCost?: number
  notes?: string | null
  product?: {
    id: string
    name: string
    sku: string
    thumbnail?: string | null
    stock: number
    images?: string[]
    warehouseStocks?: Array<{
      id: string
      warehouseId: string
      locationCode?: string | null
      locationPath?: string | null
      quantity: number
      warehouse?: {
        name: string
        code: string
      } | null
      slot?: {
        id: string
        code: string
      } | null
    }>
  } | null
  variant?: {
    id: string
    sku: string
    stock: number
  } | null
}

interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  warehouseId?: string | null
  status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'
  currency: string
  subtotal: number
  shippingCost: number
  taxAmount: number
  totalAmount: number
  isPaid: boolean
  paidAt?: string | null
  paymentMethod?: string | null
  invoiceNumber?: string | null
  expectedDate?: string | null
  receivedAt?: string | null
  notes?: string | null
  trackingNumber?: string | null
  createdAt: string
  updatedAt: string
  supplier: {
    id: string
    name: string
    code: string
    contactName?: string | null
    email?: string | null
    phone?: string | null
  }
  destinationWarehouseId?: string | null
  destinationWarehouse?: WarehouseInfo | null
  warehouse?: WarehouseInfo | null
  items: PurchaseOrderItem[]
  _count?: {
    items: number
  }
}

interface ContainerItemInfo {
  id: string
  quantity: number
  receivedQty?: number | null
  receivedQuantity?: number | null
  damagedQty?: number | null
  rejectedQty?: number | null
  unitCost: number
  totalCost?: number | null
  landedCostPerUnit?: number | null
  weight?: number | null
  cbm?: number | null
  qualityNotes?: string | null
  productName?: string | null
  productSku?: string | null
  product: {
    id: string
    name: string
    sku: string
    thumbnail?: string | null
  }
}

interface ContainerInfo {
  id: string
  containerNumber: string
  sealNumber?: string | null
  shippingLine?: string | null
  origin: string
  destination: string
  routeType: string
  departureDate?: string | null
  arrivalDate?: string | null
  status: string
  customsStatus?: string
  totalCost?: number | null
  destinationWarehouseId?: string | null
  destinationWarehouse?: WarehouseInfo | null
  sourceWarehouseId?: string | null
  sourceWarehouse?: WarehouseInfo | null
  carrier?: { id: string; name: string; code?: string } | string | null
  agent?: { id: string; name: string; company?: string } | null
  items: ContainerItemInfo[]
  purchaseOrders?: { id: string; poNumber: string; supplier?: { name: string } }[]
  orders?: { id: string; orderNumber: string }[]
  _count?: { items: number }
}

// Universal helper to parse slot coordinates into Rack, Bay, and Level
function parseSlotCoord(rawCode: string) {
  if (!rawCode) return { rackLabel: '', groupLabel: 'Floor', levelLabel: 'General', fullLabel: 'General Floor', cleanCode: '' }
  const code = rawCode.trim()

  // 1. Explicit path format: e.g. "Rack R2 > Bay 02 > Level 01" or "Rack R1 > Bay 1 > Level 3"
  const explicitPathMatch = code.match(/Rack\s+([A-Z0-9]+)[^0-9]+Bay\s*(\d+)[^0-9]+Level\s*(\d+)/i)
  if (explicitPathMatch) {
    const rawR = explicitPathMatch[1].toUpperCase()
    const rack = rawR.startsWith('R') ? rawR : `R${rawR}`
    const bayNum = Math.min(50, Math.max(1, parseInt(explicitPathMatch[2], 10)))
    const levelNum = Math.min(20, Math.max(1, parseInt(explicitPathMatch[3], 10)))
    return {
      rackLabel: rack,
      groupLabel: `Bay ${bayNum}`,
      levelLabel: `Level ${levelNum}`,
      fullLabel: `${rack} > Bay ${String(bayNum).padStart(2, '0')} > Level ${String(levelNum).padStart(2, '0')}`,
      cleanCode: `${rack}-${String(bayNum).padStart(2, '0')}-${String(levelNum).padStart(2, '0')}`,
    }
  }

  // 2. Floor Bay explicit path: e.g. "Floor Bay FL-01 > Row A > Col 1" or "Floor Bay FL-01 > Slot FL-01-A1"
  const floorPathMatch = code.match(/(?:Floor\s+Bay\s+)?(FL-\d+)[^A-Z0-9]+(?:Row\s+([A-Z]+)[^0-9]+Col\s*(\d+)|Slot\s*([A-Z0-9-]+))/i)
  if (floorPathMatch) {
    const fb = floorPathMatch[1].toUpperCase()
    const row = floorPathMatch[2]?.toUpperCase()
    const col = floorPathMatch[3]
    const slot = floorPathMatch[4] || (row && col ? `${fb}-${row}${col}` : fb)
    return {
      rackLabel: 'Floor Staging',
      groupLabel: `${fb}${row ? ` · Row ${row}` : ''}`,
      levelLabel: col ? `Col ${col}` : `Slot ${slot}`,
      fullLabel: `${fb} > ${row ? `Row ${row} > Col ${col}` : `Slot ${slot}`}`,
      cleanCode: slot,
    }
  }

  // 3. Bulk Lane explicit path: e.g. "Bulk Lane BL-01 > Slot BL-01-01"
  const lanePathMatch = code.match(/(?:Bulk\s+Lane\s+)?(BL-\d+)[^A-Z0-9]+Slot\s*([A-Z0-9-]+)/i)
  if (lanePathMatch) {
    const ln = lanePathMatch[1].toUpperCase()
    const slot = lanePathMatch[2]
    return {
      rackLabel: 'Bulk Lane',
      groupLabel: ln,
      levelLabel: `Slot ${slot}`,
      fullLabel: `${ln} > Slot ${slot}`,
      cleanCode: slot,
    }
  }

  // 4. Standard rack slot code e.g. R2-02-01 or CN-YW-Z-STOR-R1-01-03
  const rackCodeMatch = code.match(/(?:^|[^A-Z0-9])([A-Z]*\d+)-(\d+)-(\d+)(?:[^A-Z0-9]|$)/i)
  if (rackCodeMatch) {
    const rawR = rackCodeMatch[1].toUpperCase()
    const rack = rawR.startsWith('R') ? rawR : `R${rawR}`
    const bayNum = Math.min(50, Math.max(1, parseInt(rackCodeMatch[2], 10)))
    const levelNum = Math.min(20, Math.max(1, parseInt(rackCodeMatch[3], 10)))
    return {
      rackLabel: rack,
      groupLabel: `Bay ${bayNum}`,
      levelLabel: `Level ${levelNum}`,
      fullLabel: `${rack} > Bay ${String(bayNum).padStart(2, '0')} > Level ${String(levelNum).padStart(2, '0')}`,
      cleanCode: `${rack}-${String(bayNum).padStart(2, '0')}-${String(levelNum).padStart(2, '0')}`,
    }
  }

  // 5. Format with Rack and Slots (e.g. "Rack R2 > Slots: 04-04" or "Rack R2 > 04-04")
  const rackWithSlotsMatch = code.match(/(?:Rack\s+)?([A-Z0-9]+)[^0-9]+(?:Slots?:\s*)?(\d+)[-_/](\d+)/i)
  if (rackWithSlotsMatch) {
    const rawR = rackWithSlotsMatch[1].toUpperCase()
    const rack = rawR.startsWith('R') ? rawR : `R${rawR}`
    const bayNum = Math.min(50, Math.max(1, parseInt(rackWithSlotsMatch[2], 10)))
    const levelNum = Math.min(20, Math.max(1, parseInt(rackWithSlotsMatch[3], 10)))
    return {
      rackLabel: rack,
      groupLabel: `Bay ${bayNum}`,
      levelLabel: `Level ${levelNum}`,
      fullLabel: `${rack} > Bay ${String(bayNum).padStart(2, '0')} > Level ${String(levelNum).padStart(2, '0')}`,
      cleanCode: `${rack}-${String(bayNum).padStart(2, '0')}-${String(levelNum).padStart(2, '0')}`,
    }
  }

  // 6. Floor 2D format: FL-01-A1 -> Row A, Col 1
  const floor2DMatch = code.match(/([A-Z0-9]+-[A-Z0-9]+)-([A-Z]+)(\d+)/i)
  if (floor2DMatch) {
    return {
      rackLabel: 'Floor Staging',
      groupLabel: `${floor2DMatch[1]} · Row ${floor2DMatch[2]}`,
      levelLabel: `Col ${floor2DMatch[3]}`,
      fullLabel: `${floor2DMatch[1]} > Row ${floor2DMatch[2]} > Col ${floor2DMatch[3]}`,
      cleanCode: code,
    }
  }

  // 7. Floor / Lane 1D format: FL-01-A or BL-01-01
  const floor1DMatch = code.match(/([A-Z0-9]+-[A-Z0-9]+)-([A-Z0-9]+)/i)
  if (floor1DMatch) {
    return {
      rackLabel: 'Floor / Lane',
      groupLabel: floor1DMatch[1],
      levelLabel: `Slot ${floor1DMatch[2]}`,
      fullLabel: `${floor1DMatch[1]} > Slot ${floor1DMatch[2]}`,
      cleanCode: code,
    }
  }

  // 8. Generic two-digit coordinates: e.g. "04-04" or "Slots: 04-04"
  const digitsPairMatch = code.match(/(\d+)[-_/](\d+)/)
  if (digitsPairMatch) {
    const bayNum = Math.min(50, Math.max(1, parseInt(digitsPairMatch[1], 10)))
    const levelNum = Math.min(20, Math.max(1, parseInt(digitsPairMatch[2], 10)))
    return {
      rackLabel: 'Rack',
      groupLabel: `Bay ${bayNum}`,
      levelLabel: `Level ${levelNum}`,
      fullLabel: `Bay ${bayNum} > Level ${levelNum}`,
      cleanCode: `${String(bayNum).padStart(2, '0')}-${String(levelNum).padStart(2, '0')}`,
    }
  }

  // 9. Check if code has Level or Bay anywhere
  const fallbackLevelMatch = code.match(/Level\s*(\d+)/i)
  const fallbackBayMatch = code.match(/Bay\s*(\d+)/i)
  const fallbackRackMatch = code.match(/Rack\s*([A-Z0-9]+)/i)
  if (fallbackRackMatch || fallbackBayMatch || fallbackLevelMatch) {
    const rawR = (fallbackRackMatch ? fallbackRackMatch[1] : 'R1').toUpperCase()
    const rack = rawR.startsWith('R') ? rawR : `R${rawR}`
    const bayNum = fallbackBayMatch ? Math.min(50, Math.max(1, parseInt(fallbackBayMatch[1], 10))) : 1
    const levelNum = fallbackLevelMatch ? Math.min(20, Math.max(1, parseInt(fallbackLevelMatch[1], 10))) : 1
    return {
      rackLabel: rack,
      groupLabel: `Bay ${bayNum}`,
      levelLabel: `Level ${levelNum}`,
      fullLabel: `${rack} > Bay ${String(bayNum).padStart(2, '0')} > Level ${String(levelNum).padStart(2, '0')}`,
      cleanCode: `${rack}-${String(bayNum).padStart(2, '0')}-${String(levelNum).padStart(2, '0')}`,
    }
  }

  return { rackLabel: 'Storage', groupLabel: 'Floor', levelLabel: 'General', fullLabel: code, cleanCode: code }
}

interface ParsedSlot {
  id: string
  code: string
  bayCode: string
  bayNum: number
  level: number
  isOccupied: boolean
  stocksCount: number
  slotObj: any
}

interface ParsedRack {
  code: string
  title: string
  bays: Array<{ code: string; bayNum: number; level: number; slots: any[] }>
  levels: number[]
  allSlots: ParsedSlot[]
}

interface ParsedFloorLane {
  code: string
  name: string
  slots: any[]
}

interface ParsedWarehouseHierarchy {
  racks: ParsedRack[]
  floors: ParsedFloorLane[]
  lanes: ParsedFloorLane[]
  allSlots: ParsedSlot[]
}

function parseWarehouseHierarchy(warehouseLayout: any): ParsedWarehouseHierarchy {
  if (!warehouseLayout?.zones || warehouseLayout.zones.length === 0) {
    return { racks: [], floors: [], lanes: [], allSlots: [] }
  }

  const racks: ParsedRack[] = []
  const floors: ParsedFloorLane[] = []
  const lanes: ParsedFloorLane[] = []
  const allSlots: ParsedSlot[] = []

  warehouseLayout.zones.forEach((zone: any) => {
    const rackGroups: Record<string, any[]> = {}
    ;(zone.bays || []).forEach((b: any) => {
      const rName =
        b.rack ||
        b.code.match(/^R\d+/)?.[0] ||
        b.code.match(/-R\d+/)?.[0]?.replace('-', '') ||
        zone.code.match(/^R\d+/)?.[0] ||
        (zone.type === 'STORAGE' && b.code.startsWith('R') ? b.code.split('-')[0] : null)

      if (rName) {
        if (!rackGroups[rName]) rackGroups[rName] = []
        rackGroups[rName].push(b)
      } else if (b.code.startsWith('FL-') || zone.code.includes('FLOOR') || zone.name?.toLowerCase().includes('floor')) {
        floors.push({
          code: b.code,
          name: b.name || b.code,
          slots: b.slots || [],
        })
        ;(b.slots || []).forEach((s: any) => {
          allSlots.push({
            id: s.id,
            code: s.code,
            bayCode: b.code,
            bayNum: 1,
            level: 1,
            isOccupied: s.stocks && s.stocks.length > 0,
            stocksCount: s.stocks?.reduce((acc: number, st: any) => acc + (st.quantity || 0), 0) || 0,
            slotObj: s,
          })
        })
      } else if (b.code.startsWith('BL-') || zone.code.includes('LANE') || zone.code.includes('BULK') || zone.code.includes('SHIP')) {
        lanes.push({
          code: b.code,
          name: b.name || b.code,
          slots: b.slots || [],
        })
        ;(b.slots || []).forEach((s: any) => {
          allSlots.push({
            id: s.id,
            code: s.code,
            bayCode: b.code,
            bayNum: 1,
            level: 1,
            isOccupied: s.stocks && s.stocks.length > 0,
            stocksCount: s.stocks?.reduce((acc: number, st: any) => acc + (st.quantity || 0), 0) || 0,
            slotObj: s,
          })
        })
      }
    })

    Object.keys(rackGroups).forEach((rName) => {
      const bays = rackGroups[rName]
      const rackSlots: ParsedSlot[] = []
      const levelSet = new Set<number>()

      bays.forEach((b: any) => {
        const bNumMatch = b.code.match(/\d+$/)
        const bayNum = bNumMatch ? parseInt(bNumMatch[0], 10) : 1
        if (b.level) levelSet.add(b.level)
        ;(b.slots || []).forEach((s: any) => {
          const parts = s.code.split('-')
          const sLevel = parseInt(parts[parts.length - 1], 10) || b.level || 1
          const sBay = parseInt(parts[parts.length - 2], 10) || bayNum
          levelSet.add(sLevel)
          const isOccupied = s.stocks && s.stocks.length > 0
          const slotItem: ParsedSlot = {
            id: s.id,
            code: s.code,
            bayCode: b.code,
            bayNum: sBay,
            level: sLevel,
            isOccupied,
            stocksCount: s.stocks?.reduce((acc: number, st: any) => acc + (st.quantity || 0), 0) || 0,
            slotObj: s,
          }
          rackSlots.push(slotItem)
          allSlots.push(slotItem)
        })
      })

      const sortedLevels = Array.from(levelSet).sort((a, b) => a - b)
      racks.push({
        code: rName,
        title: `Rack ${rName}`,
        bays: bays.map((b: any) => {
          const bNumMatch = b.code.match(/\d+$/)
          return {
            code: b.code,
            bayNum: bNumMatch ? parseInt(bNumMatch[0], 10) : 1,
            level: b.level || 1,
            slots: b.slots || [],
          }
        }),
        levels: sortedLevels.length > 0 ? sortedLevels : [1, 2, 3],
        allSlots: rackSlots,
      })
    })
  })

    return { racks, floors, lanes, allSlots }
}

// Universal helper to build a 2D matrix (Rows × Columns) for any slot collection (Floor, Lane, or Rack)
function compute2DGrid(slots: any[]) {
  if (!slots || slots.length === 0) {
    return { matrix: [] as any[][], rowLabels: [] as string[], colLabels: [] as string[] }
  }

  // 1. Check for letter+number pattern like -A1, -A2, -B1, -B2...
  const rowLetterSet = new Set<string>()
  const colNumSet = new Set<string>()
  let isLetterNumber = false

  slots.forEach((s: any) => {
    const code = s.code || ''
    const match = code.match(/[-_]([A-Za-z])(\d+)$/)
    if (match) {
      isLetterNumber = true
      rowLetterSet.add(match[1].toUpperCase())
      colNumSet.add(match[2])
    }
  })

  if (isLetterNumber && rowLetterSet.size > 0 && colNumSet.size > 0) {
    const sortedRowLetters = Array.from(rowLetterSet).sort()
    const sortedColNums = Array.from(colNumSet).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

    const matrix: any[][] = []
    const rowLabels: string[] = []
    const colLabels = sortedColNums.map((c) => `Col ${String(c).padStart(2, '0')}`)

    sortedRowLetters.forEach((rLetter, rIdx) => {
      rowLabels.push(`Row ${rLetter}`)
      matrix[rIdx] = []
      sortedColNums.forEach((cNum, cIdx) => {
        const found = slots.find((s: any) => {
          const code = s.code || ''
          return (
            code.endsWith(`-${rLetter}${cNum}`) ||
            code.endsWith(`_${rLetter}${cNum}`) ||
            code.endsWith(`${rLetter}${cNum}`)
          )
        })
        matrix[rIdx][cIdx] = found || null
      })
    })

    return { matrix, rowLabels, colLabels }
  }

  // 2. Check for number-number pattern like -01-01, -01-02 or 1-1, 1-2
  const rowNumSet = new Set<number>()
  const colNumSet2 = new Set<number>()
  let isNumNum = false

  slots.forEach((s: any) => {
    const code = s.code || ''
    const match = code.match(/[-_](\d+)[-_/](\d+)$/)
    if (match) {
      isNumNum = true
      rowNumSet.add(parseInt(match[1], 10))
      colNumSet2.add(parseInt(match[2], 10))
    }
  })

  if (isNumNum && rowNumSet.size > 0 && colNumSet2.size > 0) {
    const sortedRowNums = Array.from(rowNumSet).sort((a, b) => a - b)
    const sortedColNums = Array.from(colNumSet2).sort((a, b) => a - b)

    const matrix: any[][] = []
    const rowLabels: string[] = []
    const colLabels = sortedColNums.map((c) => `Col ${String(c).padStart(2, '0')}`)

    sortedRowNums.forEach((rNum, rIdx) => {
      rowLabels.push(`Row ${String(rNum).padStart(2, '0')}`)
      matrix[rIdx] = []
      sortedColNums.forEach((cNum, cIdx) => {
        const found = slots.find((s: any) => {
          const code = s.code || ''
          return (
            code.endsWith(`-${rNum}-${cNum}`) ||
            code.endsWith(`-${String(rNum).padStart(2, '0')}-${String(cNum).padStart(2, '0')}`)
          )
        })
        matrix[rIdx][cIdx] = found || null
      })
    })

    return { matrix, rowLabels, colLabels }
  }

  // 3. Natural sequence: Calculate optimal Rows × Cols
  const sortedSlots = [...slots].sort((a: any, b: any) =>
    (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
  )
  const count = sortedSlots.length
  let cols = 3
  if (count <= 3) cols = Math.max(1, count)
  else if (count === 4) cols = 2
  else if (count === 6) cols = 3
  else if (count === 8) cols = 4
  else if (count === 9) cols = 3
  else if (count === 10) cols = 5
  else if (count === 12) cols = 4
  else if (count % 4 === 0 && count > 12) cols = 4
  else if (count % 3 === 0 && count > 12) cols = 3
  else cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(count))))

  const rows = Math.ceil(count / cols)
  const matrix: any[][] = []
  const rowLabels: string[] = []
  const colLabels: string[] = Array.from({ length: cols }, (_, i) => `Col ${String(i + 1).padStart(2, '0')}`)

  for (let r = 0; r < rows; r++) {
    rowLabels.push(`Row ${r + 1}`)
    matrix[r] = []
    for (let c = 0; c < cols; c++) {
      const slotIdx = r * cols + c
      matrix[r][c] = slotIdx < count ? sortedSlots[slotIdx] : null
    }
  }

  return { matrix, rowLabels, colLabels }
}

// Card component displaying full physical structure (Rack / Floor / Lane) with colorized putted slot
function StockStructureCard({
  item,
  layout,
  isLoading,
  activeStructureTab,
  onSelectStructureTab,
  onClose,
  onRelocate,
}: {
  item: WarehouseStock
  layout: any
  isLoading: boolean
  activeStructureTab?: string
  onSelectStructureTab: (tab: string) => void
  onClose: () => void
  onRelocate?: (item: WarehouseStock, targetSlot?: { slotId?: string; locationCode?: string; locationPath?: string }) => void
}) {
  const [showAllStructures, setShowAllStructures] = useState(false)
  const rawSlotCode = item.locationPath || item.locationCode || item.slot?.code || ''
  const parsed = parseSlotCoord(rawSlotCode)

  const targetRackName = useMemo(() => {
    // 1. Check if rawSlotCode or item.locationCode or item.slot?.code specifies a rack
    const explicitMatch =
      rawSlotCode.match(/(?:Rack\s+)([A-Z0-9]+)/i) ||
      (item.locationCode || '').match(/^([A-Z]*\d+)-/i) ||
      (item.slot?.code || '').match(/^([A-Z]*\d+)-/i) ||
      rawSlotCode.match(/^([A-Z]*\d+)-/i)
    if (explicitMatch) {
      const r = explicitMatch[1].toUpperCase()
      return r.startsWith('R') ? r : `R${r}`
    }
    const rLabel = (parsed.rackLabel || '').replace(/^Rack\s+/i, '').trim()
    if (rLabel && !['Storage', 'Floor', 'Rack', 'Bulk Lane', 'Floor / Lane'].includes(rLabel)) {
      return rLabel.toUpperCase().startsWith('R') ? rLabel.toUpperCase() : `R${rLabel}`
    }
    return 'R1'
  }, [rawSlotCode, item.locationCode, item.slot?.code, parsed.rackLabel])

  const targetBayNum = useMemo(() => {
    const bayMatch = rawSlotCode.match(/Bay\s*(\d+)/i)
    if (bayMatch) return Math.min(50, Math.max(1, parseInt(bayMatch[1], 10)))
    const pGroupMatch = parsed.groupLabel.match(/Bay\s*(\d+)/i)
    if (pGroupMatch) return Math.min(50, Math.max(1, parseInt(pGroupMatch[1], 10)))
    const codeMatch = (item.locationCode || rawSlotCode).match(/(?:^|[_-])(?:[A-Z0-9]+-)?(\d+)-(\d+)/i)
    if (codeMatch) return Math.min(50, Math.max(1, parseInt(codeMatch[1], 10)))
    return 1
  }, [rawSlotCode, parsed.groupLabel, item.locationCode])

  const targetLevelNum = useMemo(() => {
    const lvlMatch = rawSlotCode.match(/Level\s*(\d+)/i)
    if (lvlMatch) return Math.min(20, Math.max(1, parseInt(lvlMatch[1], 10)))
    const pLvlMatch = parsed.levelLabel.match(/Level\s*(\d+)/i)
    if (pLvlMatch) return Math.min(20, Math.max(1, parseInt(pLvlMatch[1], 10)))
    const codeMatch = (item.locationCode || rawSlotCode).match(/(?:^|[_-])(?:[A-Z0-9]+-)?(\d+)-(\d+)/i)
    if (codeMatch) return Math.min(20, Math.max(1, parseInt(codeMatch[2], 10)))
    return 1
  }, [rawSlotCode, parsed.levelLabel, item.locationCode])

  const whModel = useMemo(() => {
    return parseWarehouseHierarchy(layout)
  }, [layout])

  // Determine if the item is stored in a Floor, Lane, or Rack structure
  const isFloorItem = useMemo(() => {
    const rawUpper = rawSlotCode.toUpperCase()
    const itemCodeUpper = (item.slot?.code || '').toUpperCase()
    const bayCodeUpper = (item.slot?.bay?.code || '').toUpperCase()
    const locCodeUpper = (item.locationCode || '').toUpperCase()
    return (
      rawUpper.includes('FL-') ||
      rawUpper.includes('FLOOR') ||
      itemCodeUpper.includes('FL-') ||
      itemCodeUpper.includes('FLOOR') ||
      bayCodeUpper.includes('FL-') ||
      locCodeUpper.includes('FL-') ||
      whModel.floors.some(
        (f) =>
          rawUpper.includes(f.code.toUpperCase()) ||
          itemCodeUpper.includes(f.code.toUpperCase()) ||
          bayCodeUpper === f.code.toUpperCase()
      )
    )
  }, [rawSlotCode, item, whModel.floors])

  const isLaneItem = useMemo(() => {
    const rawUpper = rawSlotCode.toUpperCase()
    const itemCodeUpper = (item.slot?.code || '').toUpperCase()
    const bayCodeUpper = (item.slot?.bay?.code || '').toUpperCase()
    const locCodeUpper = (item.locationCode || '').toUpperCase()
    return (
      rawUpper.includes('BL-') ||
      rawUpper.includes('LANE') ||
      rawUpper.includes('BULK') ||
      itemCodeUpper.includes('BL-') ||
      itemCodeUpper.includes('LANE') ||
      bayCodeUpper.includes('BL-') ||
      locCodeUpper.includes('BL-') ||
      whModel.lanes.some(
        (l) =>
          rawUpper.includes(l.code.toUpperCase()) ||
          itemCodeUpper.includes(l.code.toUpperCase()) ||
          bayCodeUpper === l.code.toUpperCase()
      )
    )
  }, [rawSlotCode, item, whModel.lanes])

  // Build navigation tabs for available physical structures in this warehouse
  const tabs = useMemo(() => {
    const list: Array<{
      id: string
      label: string
      type: 'RACK' | 'FLOOR' | 'LANE'
      holdsItem: boolean
      slotsCount: number
    }> = []

    if (whModel.racks.length > 0) {
      whModel.racks.forEach((r) => {
        const holds =
          !isFloorItem &&
          !isLaneItem &&
          (r.code.toUpperCase() === targetRackName.toUpperCase() ||
            rawSlotCode.toUpperCase().includes(r.code.toUpperCase()) ||
            Boolean(item.slot?.code && item.slot.code.toUpperCase().startsWith(r.code.toUpperCase())))
        list.push({
          id: r.code,
          label: `Rack ${r.code}`,
          type: 'RACK',
          holdsItem: holds,
          slotsCount: r.allSlots.length,
        })
      })
    } else if (!isFloorItem && !isLaneItem) {
      list.push({
        id: targetRackName,
        label: `Rack ${targetRackName}`,
        type: 'RACK',
        holdsItem: true,
        slotsCount: 9,
      })
    }

    whModel.floors.forEach((f) => {
      const holds =
        isFloorItem &&
        (rawSlotCode.toUpperCase().includes(f.code.toUpperCase()) ||
          Boolean(item.slot?.code && item.slot.code.toUpperCase().includes(f.code.toUpperCase())) ||
          Boolean(item.slot?.bay?.code && item.slot.bay.code.toUpperCase() === f.code.toUpperCase()) ||
          Boolean(item.locationCode && item.locationCode.toUpperCase().includes(f.code.toUpperCase())))
      list.push({
        id: f.code,
        label: f.name || `Floor Bay ${f.code}`,
        type: 'FLOOR',
        holdsItem: holds,
        slotsCount: f.slots.length,
      })
    })

    whModel.lanes.forEach((l) => {
      const holds =
        isLaneItem &&
        (rawSlotCode.toUpperCase().includes(l.code.toUpperCase()) ||
          Boolean(item.slot?.code && item.slot.code.toUpperCase().includes(l.code.toUpperCase())) ||
          Boolean(item.slot?.bay?.code && item.slot.bay.code.toUpperCase() === l.code.toUpperCase()) ||
          Boolean(item.locationCode && item.locationCode.toUpperCase().includes(l.code.toUpperCase())))
      list.push({
        id: l.code,
        label: l.name || `Bulk Lane ${l.code}`,
        type: 'LANE',
        holdsItem: holds,
        slotsCount: l.slots.length,
      })
    })

    // If floor item but no floors in model, add a fallback floor entry
    if (isFloorItem && !list.some((t) => t.type === 'FLOOR')) {
      const flMatch = rawSlotCode.match(/FL-\d+/i)?.[0]?.toUpperCase() || 'FL-01'
      list.push({
        id: flMatch,
        label: `Floor Bay ${flMatch}`,
        type: 'FLOOR',
        holdsItem: true,
        slotsCount: 6,
      })
    }

    // If lane item but no lanes in model, add a fallback lane entry
    if (isLaneItem && !list.some((t) => t.type === 'LANE')) {
      const blMatch = rawSlotCode.match(/BL-\d+/i)?.[0]?.toUpperCase() || 'BL-01'
      list.push({
        id: blMatch,
        label: `Bulk Lane ${blMatch}`,
        type: 'LANE',
        holdsItem: true,
        slotsCount: 6,
      })
    }

    return list
  }, [whModel, targetRackName, rawSlotCode, item.slot?.code, item.slot?.bay?.code, item.locationCode, isFloorItem, isLaneItem])

  // Only the registered structures where this product is placed:
  const registeredTabs = useMemo(() => {
    const matched = tabs.filter((t) => t.holdsItem)
    if (matched.length > 0) return matched
    if (isFloorItem) {
      const floorTab = tabs.find((t) => t.type === 'FLOOR')
      if (floorTab) return [floorTab]
    }
    if (isLaneItem) {
      const laneTab = tabs.find((t) => t.type === 'LANE')
      if (laneTab) return [laneTab]
    }
    const defaultTab = tabs.find((t) => t.id.toUpperCase() === targetRackName.toUpperCase()) || tabs[0]
    return defaultTab ? [defaultTab] : []
  }, [tabs, targetRackName, isFloorItem, isLaneItem])

  // Displayed structures: By default, ONLY show registered rack or lane or floor!
  const displayedTabs = useMemo(() => {
    if (showAllStructures) return tabs
    if (registeredTabs.length > 0) return registeredTabs
    return tabs.slice(0, 1)
  }, [showAllStructures, tabs, registeredTabs])

  const activeTabId =
    activeStructureTab || (registeredTabs[0]?.id || displayedTabs[0]?.id || targetRackName)
  const activeTabObj =
    displayedTabs.find((t) => t.id === activeTabId) ||
    displayedTabs[0] || {
      id: targetRackName,
      label: `Rack ${targetRackName}`,
      type: 'RACK' as const,
      holdsItem: true,
      slotsCount: 9,
    }

  const activeRack = whModel.racks.find((r) => r.code === activeTabId)

  // Compute Bay numbers (horizontal columns)
  const bayNumbers = useMemo(() => {
    if (activeRack && activeRack.bays.length > 0) {
      const nums = Array.from(new Set(activeRack.bays.map((b) => b.bayNum))).sort((a, b) => a - b)
      if (nums.length > 0) return nums
    }
    const maxBay = Math.min(20, Math.max(3, targetBayNum))
    return Array.from({ length: maxBay }, (_, i) => i + 1)
  }, [activeRack, targetBayNum])

  // Compute Level numbers (vertical shelf rows) - Top shelf to ground shelf
  const levelNumbers = useMemo(() => {
    if (activeRack && activeRack.levels.length > 0) {
      const nums = [...activeRack.levels].sort((a, b) => b - a)
      if (nums.length > 0) return nums
    }
    const maxLevel = Math.min(10, Math.max(3, targetLevelNum))
    const lvls: number[] = []
    for (let l = maxLevel; l >= 1; l--) {
      lvls.push(l)
    }
    return lvls
  }, [activeRack, targetLevelNum])

  const renderRackCell = (bayNum: number, levelNum: number) => {
    const isTargetRack =
      (activeRack?.code || activeTabId).toUpperCase() === targetRackName.toUpperCase() ||
      rawSlotCode.toUpperCase().includes((activeRack?.code || activeTabId).toUpperCase())

    const slotObj = activeRack?.allSlots.find((s) => s.bayNum === bayNum && s.level === levelNum)
    const slotCode = slotObj?.code || `${activeTabId}-${String(bayNum).padStart(2, '0')}-${String(levelNum).padStart(2, '0')}`

    const isMatchingBayLevel =
      (bayNum === targetBayNum && levelNum === targetLevelNum) ||
      rawSlotCode.includes(`${String(bayNum).padStart(2, '0')}-${String(levelNum).padStart(2, '0')}`) ||
      rawSlotCode.includes(`${bayNum}-${levelNum}`)

    const isSlotIdMatch = Boolean(item.slot?.id && slotObj?.id && slotObj.id === item.slot.id)
    const isSlotCodeMatch = Boolean(
      (item.slot?.code && slotObj?.code && slotObj.code.toLowerCase() === item.slot.code.toLowerCase()) ||
      (item.locationCode && slotObj?.code && slotObj.code.toLowerCase() === item.locationCode.toLowerCase()) ||
      (slotCode && rawSlotCode.toLowerCase().includes(slotCode.toLowerCase()))
    )
    const isProductStockMatch = Boolean(
      slotObj?.slotObj?.stocks?.some(
        (st: any) =>
          st.productId === item.product.id ||
          st.product?.id === item.product.id ||
          st.product?.sku === item.product.sku
      )
    )

    const isPuttedSlot = (isTargetRack && isMatchingBayLevel) || isSlotIdMatch || isSlotCodeMatch || isProductStockMatch

    if (isPuttedSlot) {
      return (
        <div
          key={`bay-${bayNum}-lvl-${levelNum}`}
          className="relative flex flex-col justify-between bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white rounded-xl p-3 border-2 border-emerald-300 ring-4 ring-emerald-400/50 shadow-md min-h-[110px] transform hover:scale-[1.02] transition-all z-10"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="font-mono text-xs font-black tracking-wide flex items-center gap-1 text-emerald-100">
              <MapPin className="w-3.5 h-3.5 text-white animate-bounce flex-shrink-0" />
              <span>{slotCode}</span>
            </span>
            <span className="bg-white text-emerald-900 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
              ✓ PUTTED
            </span>
          </div>
          <div className="my-1">
            <div className="text-base font-black tracking-tight font-mono text-white flex items-baseline gap-1">
              <span>{item.quantity.toLocaleString()}</span>
              <span className="text-xs font-bold text-emerald-200">PCS STOCKED</span>
            </div>
            <div className="text-[11px] text-emerald-50 font-semibold truncate mt-0.5" title={item.product.name}>
              {item.product.name}
            </div>
            <div className="text-[10px] text-emerald-200 font-mono">
              SKU: {item.product.sku}
            </div>
          </div>
          <div className="text-[10px] text-emerald-100/90 font-medium pt-1.5 border-t border-emerald-500/60 flex items-center justify-between">
            <span>Avail: {item.availableQty}</span>
            <span>Avg: ${(item.avgCost || item.product.costPrice || 0).toFixed(2)}</span>
          </div>
          {onRelocate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRelocate(item)
              }}
              className="mt-2 w-full py-1 px-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border border-white/30 transition shadow-2xs cursor-pointer"
              title="Relocate this stock to another shelf"
            >
              <ArrowRightLeft className="w-3 h-3 text-emerald-100" />
              <span>Move Shelf</span>
            </button>
          )}
        </div>
      )
    }

    if (slotObj && slotObj.stocksCount > 0) {
      const otherProdName = slotObj.slotObj?.stocks?.[0]?.product?.name || 'Assorted'
      const otherSku = slotObj.slotObj?.stocks?.[0]?.product?.sku || ''
      return (
        <div
          key={`bay-${bayNum}-lvl-${levelNum}`}
          className="flex flex-col justify-between bg-blue-50/90 hover:bg-blue-100/80 border border-blue-200/90 rounded-xl p-3 min-h-[110px] text-slate-700 transition shadow-2xs"
        >
          <div className="flex items-center justify-between gap-1 text-[11px] font-bold font-mono">
            <span className="text-blue-900">{slotCode}</span>
            <span className="text-[9px] font-semibold text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded">
              Occupied
            </span>
          </div>
          <div className="my-1">
            <div className="text-xs font-black text-slate-800 font-mono">
              {slotObj.stocksCount.toLocaleString()} pcs
            </div>
            <div className="text-[10px] text-slate-600 truncate font-medium mt-0.5" title={otherProdName}>
              {otherProdName}
            </div>
            {otherSku && <div className="text-[9px] text-slate-400 font-mono">{otherSku}</div>}
          </div>
          <div className="text-[9px] text-slate-400 font-mono pt-1 border-t border-blue-100/80 flex items-center justify-between">
            <span>Bay {bayNum}</span>
            <span>Level {levelNum}</span>
          </div>
        </div>
      )
    }

    const bayFormatted = String(bayNum).padStart(2, '0')
    const levelFormatted = String(levelNum).padStart(2, '0')
    const defaultSlotCode = `${activeTabId}-${bayFormatted}-${levelFormatted}`
    const finalSlotCode = slotCode || defaultSlotCode

    return (
      <div
        key={`bay-${bayNum}-lvl-${levelNum}`}
        onClick={() => {
          if (onRelocate) {
            onRelocate(item, {
              slotId: slotObj?.id,
              locationCode: finalSlotCode,
              locationPath: `Rack ${activeTabId} > Bay ${bayFormatted} > Level ${levelFormatted}`,
            })
          }
        }}
        className={`group flex flex-col justify-between bg-white/70 hover:bg-emerald-50/60 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-3 min-h-[110px] text-slate-400 transition ${
          onRelocate ? 'cursor-pointer hover:shadow-xs' : ''
        }`}
        title={onRelocate ? `Click to relocate ${item.product.name} here (${finalSlotCode})` : undefined}
      >
        <div className="flex items-center justify-between gap-1 text-[11px] font-mono font-bold text-slate-500 group-hover:text-emerald-700">
          <span>{finalSlotCode}</span>
          {onRelocate && (
            <span className="hidden group-hover:inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              <ArrowRightLeft className="w-2.5 h-2.5" /> Move Here
            </span>
          )}
        </div>
        <div className="my-1 text-center">
          <span className="inline-block text-[10px] font-semibold text-slate-400 group-hover:text-emerald-700 bg-slate-100/80 group-hover:bg-emerald-100/80 px-2 py-0.5 rounded transition">
            Empty Slot
          </span>
        </div>
        <div className="text-[9px] text-slate-400 group-hover:text-emerald-600 font-mono text-center pt-1 border-t border-slate-100 group-hover:border-emerald-200 flex items-center justify-between">
          <span>Bay {bayNum}</span>
          <span>Level {levelNum}</span>
        </div>
      </div>
    )
  }

  const renderGridCell = (
    s: any,
    key: string,
    fallbackType: string,
    isFirstSlotCandidate: boolean,
    hasSpecificMatch: boolean
  ) => {
    if (!s) {
      return (
        <div
          key={key}
          className="min-h-[110px] rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30 flex items-center justify-center text-slate-300 font-mono text-[10px]"
        >
          —
        </div>
      )
    }

    const isExactMatch = Boolean(
      (item.slot?.id && s.id === item.slot.id) ||
        (s.code && rawSlotCode.toLowerCase().includes(s.code.toLowerCase())) ||
        (s.code && (item.slot?.code || '').toLowerCase().includes(s.code.toLowerCase())) ||
        (item.locationCode && s.code.toLowerCase() === item.locationCode.toLowerCase()) ||
        s.stocks?.some(
          (st: any) =>
            st.productId === item.product.id ||
            st.product?.id === item.product.id ||
            st.product?.sku === item.product.sku
        )
    )

    const isPutted = isExactMatch || (!hasSpecificMatch && isFirstSlotCandidate)

    if (isPutted) {
      return (
        <div
          key={key}
          className="relative flex flex-col justify-between bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white rounded-xl p-3 border-2 border-emerald-300 ring-4 ring-emerald-400/50 shadow-md min-h-[110px] transform hover:scale-[1.02] transition-all z-10"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="font-mono text-xs font-black tracking-wide flex items-center gap-1 text-emerald-100">
              <MapPin className="w-3.5 h-3.5 text-white animate-bounce flex-shrink-0" />
              <span>{s.code}</span>
            </span>
            <span className="bg-white text-emerald-900 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
              ✓ PUTTED
            </span>
          </div>
          <div className="my-1">
            <div className="text-base font-black tracking-tight font-mono text-white flex items-baseline gap-1">
              <span>{item.quantity.toLocaleString()}</span>
              <span className="text-xs font-bold text-emerald-200">PCS STOCKED</span>
            </div>
            <div className="text-[11px] text-emerald-50 font-semibold truncate mt-0.5" title={item.product.name}>
              {item.product.name}
            </div>
            <div className="text-[10px] text-emerald-200 font-mono">
              SKU: {item.product.sku}
            </div>
          </div>
          <div className="text-[10px] text-emerald-100/90 font-medium pt-1.5 border-t border-emerald-500/60 flex items-center justify-between">
            <span>Avail: {item.availableQty}</span>
            <span>Avg: ${(item.avgCost || item.product.costPrice || 0).toFixed(2)}</span>
          </div>
          {onRelocate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRelocate(item)
              }}
              className="mt-2 w-full py-1 px-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border border-white/30 transition shadow-2xs cursor-pointer"
              title="Relocate this stock to another shelf"
            >
              <ArrowRightLeft className="w-3 h-3 text-emerald-100" />
              <span>Move Shelf</span>
            </button>
          )}
        </div>
      )
    }

    if (s.stocks && s.stocks.length > 0) {
      const otherProdName = s.stocks[0]?.product?.name || 'Assorted'
      const otherSku = s.stocks[0]?.product?.sku || ''
      const qty = s.stocks?.reduce((acc: number, st: any) => acc + (st.quantity || 0), 0) || 0
      return (
        <div
          key={key}
          className="flex flex-col justify-between bg-blue-50/90 hover:bg-blue-100/80 border border-blue-200/90 rounded-xl p-3 min-h-[110px] text-slate-700 transition shadow-2xs"
        >
          <div className="flex items-center justify-between gap-1 text-[11px] font-bold font-mono">
            <span className="text-blue-900">{s.code}</span>
            <span className="text-[9px] font-semibold text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded">
              Occupied
            </span>
          </div>
          <div className="my-1">
            <div className="text-xs font-black text-slate-800 font-mono">
              {qty.toLocaleString()} pcs
            </div>
            <div className="text-[10px] text-slate-600 truncate font-medium mt-0.5" title={otherProdName}>
              {otherProdName}
            </div>
            {otherSku && <div className="text-[9px] text-slate-400 font-mono">{otherSku}</div>}
          </div>
          <div className="text-[9px] text-slate-400 font-mono pt-1 border-t border-blue-100/80 flex items-center justify-between">
            <span>{fallbackType}</span>
            <span>Occupied</span>
          </div>
        </div>
      )
    }

    return (
      <div
        key={key}
        onClick={() => {
          if (onRelocate) {
            onRelocate(item, {
              slotId: s.id,
              locationCode: s.code,
              locationPath: `${fallbackType} > Slot ${s.code}`,
            })
          }
        }}
        className={`group flex flex-col justify-between bg-white/70 hover:bg-emerald-50/60 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-3 min-h-[110px] text-slate-400 transition ${
          onRelocate ? 'cursor-pointer hover:shadow-xs' : ''
        }`}
        title={onRelocate ? `Click to relocate ${item.product.name} here (${s.code})` : undefined}
      >
        <div className="flex items-center justify-between gap-1 text-[11px] font-mono font-bold text-slate-500 group-hover:text-emerald-700">
          <span>{s.code}</span>
          {onRelocate && (
            <span className="hidden group-hover:inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              <ArrowRightLeft className="w-2.5 h-2.5" /> Move Here
            </span>
          )}
        </div>
        <div className="my-1 text-center">
          <span className="inline-block text-[10px] font-semibold text-slate-400 group-hover:text-emerald-700 bg-slate-100/80 group-hover:bg-emerald-100/80 px-2 py-0.5 rounded transition">
            Empty Slot
          </span>
        </div>
        <div className="text-[9px] text-slate-400 group-hover:text-emerald-600 font-mono text-center pt-1 border-t border-slate-100 group-hover:border-emerald-200 flex items-center justify-between">
          <span>{fallbackType}</span>
          <span>Available</span>
        </div>
      </div>
    )
  }

  const renderFloorView = () => {
    const floorObj = whModel.floors.find((f) => f.code === activeTabId) || whModel.floors[0]
    const slots = floorObj?.slots || []

    const hasSpecificMatch = slots.some((s: any) => {
      return Boolean(
        (item.slot?.id && s.id === item.slot.id) ||
          (s.code && rawSlotCode.toLowerCase().includes(s.code.toLowerCase())) ||
          (s.code && (item.slot?.code || '').toLowerCase().includes(s.code.toLowerCase())) ||
          (item.locationCode && s.code.toLowerCase() === item.locationCode.toLowerCase()) ||
          s.stocks?.some(
            (st: any) =>
              st.productId === item.product.id ||
              st.product?.id === item.product.id ||
              st.product?.sku === item.product.sku
          )
      )
    })

    if (slots.length === 0) {
      return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              <span className="font-mono font-black uppercase text-slate-900">
                Floor Staging Zone: {floorObj?.name || floorObj?.code || activeTabId}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Open Staging Area</span>
          </div>
          <div className="p-2">
            <div className="relative flex flex-col justify-between bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white rounded-xl p-4 border-2 border-emerald-300 ring-4 ring-emerald-400/50 shadow-md max-w-sm">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="font-mono text-xs font-black tracking-wide flex items-center gap-1 text-emerald-100">
                  <MapPin className="w-3.5 h-3.5 text-white animate-bounce flex-shrink-0" />
                  <span>{floorObj?.name || floorObj?.code || activeTabId}</span>
                </span>
                <span className="bg-white text-emerald-900 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
                  ✓ PUTTED
                </span>
              </div>
              <div className="my-1">
                <div className="text-base font-black tracking-tight font-mono text-white flex items-baseline gap-1">
                  <span>{item.quantity.toLocaleString()}</span>
                  <span className="text-xs font-bold text-emerald-200">PCS STOCKED</span>
                </div>
                <div className="text-[11px] text-emerald-50 font-semibold truncate mt-0.5" title={item.product.name}>
                  {item.product.name}
                </div>
                <div className="text-[10px] text-emerald-200 font-mono">
                  SKU: {item.product.sku}
                </div>
              </div>
              <div className="text-[10px] text-emerald-100/90 font-medium pt-1.5 border-t border-emerald-500/60 flex items-center justify-between">
                <span>Avail: {item.availableQty}</span>
                <span>Avg: ${(item.avgCost || item.product.costPrice || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const { matrix, rowLabels, colLabels } = compute2DGrid(slots)
    const firstNonNullSlot = matrix.flat().find(Boolean)

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center justify-between mb-3 min-w-[500px]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {floorObj?.name || `Floor ${activeTabId}`} Elevation & Layout
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              ({rowLabels.length} Rows × {colLabels.length} Columns)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Vertical: Staging Rows (Depth) • Horizontal: Slot Columns (Width)
          </span>
        </div>

        <div className="min-w-[600px]">
          {/* Column headers row */}
          <div
            className="grid gap-2.5 mb-2.5 items-center"
            style={{
              gridTemplateColumns: `80px repeat(${colLabels.length}, minmax(130px, 1fr))`,
            }}
          >
            <div className="text-right pr-3 text-[10px] font-mono font-bold text-slate-400 uppercase">
              Staging Row
            </div>
            {colLabels.map((colName, cIdx) => (
              <div
                key={`floor-hdr-col-${cIdx}`}
                className="text-center font-mono font-black text-xs text-blue-900 bg-blue-50/80 border border-blue-100 py-1.5 rounded-lg"
              >
                {colName}
              </div>
            ))}
          </div>

          {/* Row rows with cells */}
          <div className="space-y-2.5">
            {matrix.map((rowCells, rIdx) => (
              <div
                key={`floor-row-${rIdx}`}
                className="grid gap-2.5 items-stretch"
                style={{
                  gridTemplateColumns: `80px repeat(${colLabels.length}, minmax(130px, 1fr))`,
                }}
              >
                {/* Row label */}
                <div className="flex flex-col justify-center items-end pr-3 border-r border-slate-200/80">
                  <span className="font-mono text-xs font-black text-slate-800">
                    {rowLabels[rIdx]}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">
                    Floor Row
                  </span>
                </div>

                {/* Cells for each column in this row */}
                {rowCells.map((s, cIdx) =>
                  renderGridCell(
                    s,
                    `floor-cell-${rIdx}-${cIdx}`,
                    'Floor Staging',
                    s === firstNonNullSlot,
                    hasSpecificMatch
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderLaneView = () => {
    const laneObj = whModel.lanes.find((l) => l.code === activeTabId) || whModel.lanes[0]
    const slots = laneObj?.slots || []

    const hasSpecificMatch = slots.some((s: any) => {
      return Boolean(
        (item.slot?.id && s.id === item.slot.id) ||
          (s.code && rawSlotCode.toLowerCase().includes(s.code.toLowerCase())) ||
          (s.code && (item.slot?.code || '').toLowerCase().includes(s.code.toLowerCase())) ||
          (item.locationCode && s.code.toLowerCase() === item.locationCode.toLowerCase()) ||
          s.stocks?.some(
            (st: any) =>
              st.productId === item.product.id ||
              st.product?.id === item.product.id ||
              st.product?.sku === item.product.sku
          )
      )
    })

    if (slots.length === 0) {
      return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-purple-600" />
              <span className="font-mono font-black uppercase text-slate-900">
                Bulk Storage Lane: {laneObj?.name || laneObj?.code || activeTabId}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Open Storage Lane</span>
          </div>
          <div className="p-2">
            <div className="relative flex flex-col justify-between bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white rounded-xl p-4 border-2 border-emerald-300 ring-4 ring-emerald-400/50 shadow-md max-w-sm">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="font-mono text-xs font-black tracking-wide flex items-center gap-1 text-emerald-100">
                  <MapPin className="w-3.5 h-3.5 text-white animate-bounce flex-shrink-0" />
                  <span>{laneObj?.name || laneObj?.code || activeTabId}</span>
                </span>
                <span className="bg-white text-emerald-900 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
                  ✓ PUTTED
                </span>
              </div>
              <div className="my-1">
                <div className="text-base font-black tracking-tight font-mono text-white flex items-baseline gap-1">
                  <span>{item.quantity.toLocaleString()}</span>
                  <span className="text-xs font-bold text-emerald-200">PCS STOCKED</span>
                </div>
                <div className="text-[11px] text-emerald-50 font-semibold truncate mt-0.5" title={item.product.name}>
                  {item.product.name}
                </div>
                <div className="text-[10px] text-emerald-200 font-mono">
                  SKU: {item.product.sku}
                </div>
              </div>
              <div className="text-[10px] text-emerald-100/90 font-medium pt-1.5 border-t border-emerald-500/60 flex items-center justify-between">
                <span>Avail: {item.availableQty}</span>
                <span>Avg: ${(item.avgCost || item.product.costPrice || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const { matrix, rowLabels, colLabels } = compute2DGrid(slots)
    const firstNonNullSlot = matrix.flat().find(Boolean)

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center justify-between mb-3 min-w-[500px]">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {laneObj?.name || `Lane ${activeTabId}`} Elevation & Layout
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              ({rowLabels.length} Rows × {colLabels.length} Columns)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Vertical: Storage Lane Rows (Length) • Horizontal: Slot Columns (Width)
          </span>
        </div>

        <div className="min-w-[600px]">
          {/* Column headers row */}
          <div
            className="grid gap-2.5 mb-2.5 items-center"
            style={{
              gridTemplateColumns: `80px repeat(${colLabels.length}, minmax(130px, 1fr))`,
            }}
          >
            <div className="text-right pr-3 text-[10px] font-mono font-bold text-slate-400 uppercase">
              Lane Row
            </div>
            {colLabels.map((colName, cIdx) => (
              <div
                key={`lane-hdr-col-${cIdx}`}
                className="text-center font-mono font-black text-xs text-blue-900 bg-blue-50/80 border border-blue-100 py-1.5 rounded-lg"
              >
                {colName}
              </div>
            ))}
          </div>

          {/* Row rows with cells */}
          <div className="space-y-2.5">
            {matrix.map((rowCells, rIdx) => (
              <div
                key={`lane-row-${rIdx}`}
                className="grid gap-2.5 items-stretch"
                style={{
                  gridTemplateColumns: `80px repeat(${colLabels.length}, minmax(130px, 1fr))`,
                }}
              >
                {/* Row label */}
                <div className="flex flex-col justify-center items-end pr-3 border-r border-slate-200/80">
                  <span className="font-mono text-xs font-black text-slate-800">
                    {rowLabels[rIdx]}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">
                    Bulk Row
                  </span>
                </div>

                {/* Cells for each column in this row */}
                {rowCells.map((s, cIdx) =>
                  renderGridCell(
                    s,
                    `lane-cell-${rIdx}-${cIdx}`,
                    'Bulk Lane',
                    s === firstNonNullSlot,
                    hasSpecificMatch
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-slate-100/80 border border-blue-200/90 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-200 font-sans">
      {/* Card Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <WarehouseIcon className="w-4 h-4 text-blue-600" />
              <span>{item.warehouse.name} ({item.warehouse.code})</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{item.warehouse.country}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100/80 text-emerald-900 px-3 py-1 rounded-lg border border-emerald-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Assigned Slot:</span>
              <span className="font-mono font-black">{parsed.fullLabel}</span>
            </span>

            {isLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 animate-pulse bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Loading physical layout...
              </span>
            )}
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">{item.product.name}</span>
            <span className="font-mono text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded text-[11px]">
              SKU: {item.product.sku}
            </span>
            <span className="text-emerald-700 font-extrabold font-mono">
              {item.quantity.toLocaleString()} pcs stored
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-center">
          {onRelocate && (
            <button
              type="button"
              onClick={() => onRelocate(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition shadow-2xs"
              title="Relocate this stock to another shelf or zone"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-700" />
              <span>Move Shelf</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-2xs"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Hide Structure</span>
          </button>
        </div>
      </div>

      {/* Structure Header / Tabs: Only show registered rack or lane or floor */}
      {displayedTabs.length === 1 ? (
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-semibold text-slate-700 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-blue-900 font-bold">
              <WarehouseIcon className="w-4 h-4 text-blue-600" />
              <span>Registered Location:</span>
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-mono font-black text-xs flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {displayedTabs[0].label}
            </span>
            <span className="text-slate-400">•</span>
            {isFloorItem || isLaneItem ? (
              <span className="text-slate-600 font-mono font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Slot: {parsed.fullLabel || rawSlotCode}</span>
              </span>
            ) : (
              <span className="text-slate-600 font-mono">
                Bay {targetBayNum} • Level {targetLevelNum} ({parsed.cleanCode || rawSlotCode})
              </span>
            )}
            <span className="text-slate-400">•</span>
            <span className="text-emerald-700 font-mono font-black">
              {item.quantity.toLocaleString()} pcs stored
            </span>
          </div>

          {tabs.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllStructures((prev) => !prev)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline transition"
            >
              {showAllStructures ? 'Show Registered Location Only' : `View other warehouse zones (${tabs.length})`}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1 flex-shrink-0">
              <Grid className="w-3.5 h-3.5 text-slate-400" />
              Physical Structure:
            </span>
            {displayedTabs.map((tab) => {
              const isActive = tab.id === activeTabId
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectStructureTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {tab.holdsItem && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  <span>{tab.label}</span>
                  {tab.holdsItem && (
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${isActive ? 'bg-blue-700 text-emerald-200' : 'bg-emerald-100 text-emerald-800'}`}>
                      REGISTERED
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {tabs.length > displayedTabs.length && (
            <button
              type="button"
              onClick={() => setShowAllStructures((prev) => !prev)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline transition ml-auto"
            >
              {showAllStructures ? 'Show Registered Only' : `View other areas (${tabs.length})`}
            </button>
          )}
        </div>
      )}

      {/* Main Structure Body */}
      {activeTabObj.type === 'FLOOR' ? (
        renderFloorView()
      ) : activeTabObj.type === 'LANE' ? (
        renderLaneView()
      ) : (
        /* RACK 2D ELEVATION MATRIX */
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
          <div className="flex items-center justify-between mb-3 min-w-[500px]">
            <div className="flex items-center gap-2">
              <WarehouseIcon className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {activeRack?.title || `Rack ${activeTabId}`} Elevation
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                ({bayNumbers.length} Bays × {levelNumbers.length} Levels)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Vertical: Shelf Level (Ground L1 → Top) • Horizontal: Bay Columns
            </span>
          </div>

          <div className="min-w-[600px]">
            {/* Level rows with cells (L3 down to L1, so from ground up is L1, L2, L3) */}
            <div className="space-y-2.5">
              {levelNumbers.map((l) => (
                <div
                  key={`row-lvl-${l}`}
                  className="grid gap-2.5 items-stretch"
                  style={{
                    gridTemplateColumns: `80px repeat(${bayNumbers.length}, minmax(130px, 1fr))` ,
                  }}
                >
                  {/* Level label */}
                  <div className="flex flex-col justify-center items-end pr-3 border-r border-slate-200/80">
                    <span className="font-mono text-xs font-black text-slate-800">
                      L{l}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">
                      {l === Math.max(...levelNumbers)
                        ? 'Top Shelf'
                        : l === 1
                        ? 'Ground Shelf'
                        : 'Mid Shelf'}
                    </span>
                  </div>

                  {/* Cells for each Bay */}
                  {bayNumbers.map((b) => renderRackCell(b, l))}
                </div>
              ))}
            </div>

            {/* Bay column headers across bottom of the shelf */}
            <div
              className="grid gap-2.5 mt-2.5 pt-2.5 border-t border-slate-200/80 items-center"
              style={{
                gridTemplateColumns: `80px repeat(${bayNumbers.length}, minmax(130px, 1fr))` ,
              }}
            >
              <div className="text-right pr-3 text-[10px] font-mono font-bold text-slate-400 uppercase">
                Tier
              </div>
              {bayNumbers.map((b) => (
                <div
                  key={`hdr-bay-${b}`}
                  className="text-center font-mono font-black text-xs text-blue-900 bg-blue-50/80 border border-blue-100 py-1.5 rounded-lg"
                >
                  B{b}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 text-xs border-t border-slate-200 text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-400 ring-2 ring-emerald-300/70"></div>
            <span className="font-bold text-emerald-800">
              Putted / Stocked Slot for this product ({item.quantity.toLocaleString()} pcs)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-300"></div>
            <span>Occupied by other inventory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-50 border-2 border-dashed border-slate-300"></div>
            <span>Empty / Available slot</span>
          </div>
        </div>

        <div className="font-mono text-[11px] text-slate-400">
          Raw Slot Code: {rawSlotCode || 'General Floor'}
        </div>
      </div>
    </div>
  )
}

function InventoryContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Tab State
  const initialTab = (searchParams.get('tab') as 'stocks' | 'inbound' | 'movements' | 'shelves') || 'stocks'
  const [activeTab, setActiveTab] = useState<'stocks' | 'inbound' | 'movements' | 'shelves'>(initialTab)

  // Synchronize activeTab with URL 'tab' search parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['stocks', 'inbound', 'movements', 'shelves'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    }
  }, [searchParams])

  // Clean tab switcher that updates URL history without triggering full page RSC navigations
  const handleTabChange = useCallback((newTab: 'stocks' | 'inbound' | 'movements' | 'shelves') => {
    setActiveTab(newTab)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      params.set('tab', newTab)
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    }
  }, [])

  // Shelves & Structures Tab State
  const [shelvesWarehouseId, setShelvesWarehouseId] = useState<string>('')
  const [shelvesStructureFilter, setShelvesStructureFilter] = useState<'ALL' | 'RACK' | 'FLOOR' | 'LANE'>('ALL')
  const [shelvesFocusedStructure, setShelvesFocusedStructure] = useState<string | null>(null)
  const [shelvesSearch, setShelvesSearch] = useState('')
  const [selectedSlotDetail, setSelectedSlotDetail] = useState<{
    slot: any
    structureTitle: string
    structureType: 'RACK' | 'FLOOR' | 'LANE'
    products: Array<{
      id: string
      name: string
      sku: string
      thumbnail?: string | null
      quantity: number
      availableQty?: number
      reservedQty?: number
      costPrice?: number | null
      price?: number
      locationCode?: string
      locationPath?: string
    }>
  } | null>(null)

  // Warehouses metadata
  const [warehouses, setWarehouses] = useState<WarehouseInfo[]>([])

  // Selected warehouse query param ('cn', 'by', or warehouseId or '')
  const currentWarehouseParam = searchParams.get('warehouse') || ''

  // Stocks tab state
  const [stocks, setStocks] = useState<WarehouseStock[]>([])
  const [stocksLoading, setStocksLoading] = useState(true)
  const [stockSearch, setStockSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [expandedStockSlots, setExpandedStockSlots] = useState<Record<string, boolean>>({})
  const [stockStructureActiveTab, setStockStructureActiveTab] = useState<Record<string, string>>({})
  const [warehouseLayoutCache, setWarehouseLayoutCache] = useState<Record<string, any>>({})
  const [loadingLayouts, setLoadingLayouts] = useState<Record<string, boolean>>({})

  // Inbound / Purchased Invoices tab state
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [poLoading, setPoLoading] = useState(false)
  const [poSearch, setPoSearch] = useState('')
  const [poStatusFilter, setPoStatusFilter] = useState('ALL_INBOUND') // 'ALL_INBOUND', 'CONFIRMED', 'SHIPPED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'ALL'
  const [poPaidFilter, setPoPaidFilter] = useState('ALL') // 'ALL', 'PAID', 'UNPAID'
  const [expandedPoSlots, setExpandedPoSlots] = useState<Record<string, boolean>>({})
  const [expandedItemSlots, setExpandedItemSlots] = useState<Record<string, boolean>>({})

  // Fetch layout on demand when a user expands a stock row
  const fetchWarehouseLayoutForStock = useCallback(async (warehouseId: string, force = false) => {
    if (!warehouseId || (!force && warehouseLayoutCache[warehouseId]) || loadingLayouts[warehouseId]) return
    setLoadingLayouts((prev) => ({ ...prev, [warehouseId]: true }))
    try {
      const res = await fetch(`/api/admin/warehouses/${warehouseId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setWarehouseLayoutCache((prev) => ({ ...prev, [warehouseId]: data.data }))
      }
    } catch (err) {
      console.error('Failed to fetch warehouse layout', err)
    } finally {
      setLoadingLayouts((prev) => ({ ...prev, [warehouseId]: false }))
    }
  }, [warehouseLayoutCache, loadingLayouts])

  const toggleStockStructure = (stockId: string, warehouseId: string) => {
    setExpandedStockSlots((prev) => {
      const isCurrentlyOpen = !prev[stockId]
      if (isCurrentlyOpen) {
        fetchWarehouseLayoutForStock(warehouseId)
      }
      return { ...prev, [stockId]: isCurrentlyOpen }
    })
  }

  // Group an array of slot objects by Rack & Bay for visual 2D matrix structure
  const groupSlotsByStructure = (slots: Array<{ code: string; quantity?: number; productName?: string }>) => {
    const racks: Record<string, { rackLabel: string; bays: Record<string, { bayLabel: string; items: any[] }> }> = {}

    slots.forEach((s) => {
      const parsed = parseSlotCoord(s.code)
      const rKey = parsed.rackLabel || 'General'
      const bKey = parsed.groupLabel || 'Bay 1'

      if (!racks[rKey]) {
        racks[rKey] = { rackLabel: rKey, bays: {} }
      }
      if (!racks[rKey].bays[bKey]) {
        racks[rKey].bays[bKey] = { bayLabel: bKey, items: [] }
      }
      racks[rKey].bays[bKey].items.push({ ...s, parsed })
    })

    return Object.values(racks).map((r) => ({
      rackLabel: r.rackLabel,
      bays: Object.values(r.bays).map((b) => ({
        bayLabel: b.bayLabel,
        // Sort levels vertically from highest shelf to ground (e.g. Level 3 -> Level 2 -> Level 1)
        items: [...b.items].sort((a, b) => {
          const numA = parseInt(a.parsed.levelLabel.replace(/\D/g, ''), 10) || 0
          const numB = parseInt(b.parsed.levelLabel.replace(/\D/g, ''), 10) || 0
          return numB - numA
        }),
      })),
    }))
  }

  // Movements tab state
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [movementSearch, setMovementSearch] = useState('')
  const [movementType, setMovementType] = useState('')
  const [movementPage, setMovementPage] = useState(1)
  const [movementTotalPages, setMovementTotalPages] = useState(1)

  // Inbound Intake Channel (POs vs Containers)
  const [inboundSource, setInboundSource] = useState<'pos' | 'containers'>('pos')

  // Containers Inbound & Intake State
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [containersLoading, setContainersLoading] = useState(false)
  const [containerSearch, setContainerSearch] = useState('')
  const [containerRouteFilter, setContainerRouteFilter] = useState('ALL')
  const [containerStatusFilter, setContainerStatusFilter] = useState('ALL')
  const [expandedContainerIds, setExpandedContainerIds] = useState<Record<string, boolean>>({})

  // Modal: Unload & Receive Container into Warehouse
  const [selectedContainerToReceive, setSelectedContainerToReceive] = useState<ContainerInfo | null>(null)
  const [containerTargetWarehouseId, setContainerTargetWarehouseId] = useState<string>('')
  const [containerItemSlots, setContainerItemSlots] = useState<
    Record<
      string,
      {
        receivedQty: number
        damagedQty: number
        rejectedQty: number
        qualityNotes: string
        slotId?: string | null
        locationCode?: string
        locationPath?: string
      }
    >
  >({})
  const [containerBatchLocationCode, setContainerBatchLocationCode] = useState('')
  const [containerSubmitting, setContainerSubmitting] = useState(false)

  // Modal: Receive Purchase Order Items
  const [selectedPoToReceive, setSelectedPoToReceive] = useState<PurchaseOrder | null>(null)
  const [targetWarehouseIdForPo, setTargetWarehouseIdForPo] = useState('')
  const [receivingItemsMap, setReceivingItemsMap] = useState<Record<string, number>>({})
  const [receiveNotes, setReceiveNotes] = useState('')
  const [receivingSubmitting, setReceivingSubmitting] = useState(false)
  // Location coordinates for PO receive
  const [receiveLane, setReceiveLane] = useState('')
  const [receiveRack, setReceiveRack] = useState('')
  const [receiveFloor, setReceiveFloor] = useState('')

  // Layout data and slot selection for PO receive
  const [warehouseLayout, setWarehouseLayout] = useState<any>(null)
  const [layoutLoading, setLayoutLoading] = useState(false)
  const [locationMode, setLocationMode] = useState<'RACK' | 'FLOOR' | 'LANE' | 'CUSTOM'>('RACK')
  const [selectedRack, setSelectedRack] = useState<string>('')
  const [selectedBay, setSelectedBay] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedSlotCodes, setSelectedSlotCodes] = useState<string[]>([])
  const [itemCustomSlots, setItemCustomSlots] = useState<
    Record<
      string,
      {
        slotCode?: string
        slotId?: string
        locationCode?: string
        locationPath?: string
        lane?: string
        rack?: string
        floor?: string
        allocations?: Array<{ slotCode: string; quantity: number }>
      }
    >
  >({})
  const [rowAssignQty, setRowAssignQty] = useState<Record<string, number>>({})
  const [itemDamagedQty, setItemDamagedQty] = useState<Record<string, number>>({})
  const [itemDamagedNotes, setItemDamagedNotes] = useState<Record<string, string>>({})
  const [showDamagedInput, setShowDamagedInput] = useState<Record<string, boolean>>({})
  const [containerItemShelvedLocations, setContainerItemShelvedLocations] = useState<Record<string, Array<{ slotCode: string; quantity: number }>>>({})

  // Modal: Quick / Standalone Direct Intake & Stock Adjustment
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false)
  const [intakeWarehouseId, setIntakeWarehouseId] = useState('')
  const [intakeProductId, setIntakeProductId] = useState('')
  const [intakeQuantity, setIntakeQuantity] = useState<number>(1)
  const [intakeUnitCost, setIntakeUnitCost] = useState<string>('')
  const [intakeType, setIntakeType] = useState<'PURCHASE_RECEIPT' | 'ADJUSTMENT_IN' | 'INITIAL'>('PURCHASE_RECEIPT')
  const [intakeReason, setIntakeReason] = useState('')
  const [intakeSubmitting, setIntakeSubmitting] = useState(false)
  // Location coordinates for direct intake
  const [intakeLane, setIntakeLane] = useState('')
  const [intakeRack, setIntakeRack] = useState('')
  const [intakeFloor, setIntakeFloor] = useState('')

  // Modal: Shelf-to-shelf Stock Relocation
  const [isRelocateModalOpen, setIsRelocateModalOpen] = useState(false)
  const [relocateStockItem, setRelocateStockItem] = useState<WarehouseStock | null>(null)
  const [relocateTargetType, setRelocateTargetType] = useState<'RACK' | 'FLOOR' | 'LANE' | 'CUSTOM'>('RACK')
  const [relocateTargetRack, setRelocateTargetRack] = useState('R1')
  const [relocateTargetBay, setRelocateTargetBay] = useState('1')
  const [relocateTargetLevel, setRelocateTargetLevel] = useState('1')
  const [relocateTargetFloorBay, setRelocateTargetFloorBay] = useState('FL-01')
  const [relocateTargetFloorSlot, setRelocateTargetFloorSlot] = useState('')
  const [relocateTargetLane, setRelocateTargetLane] = useState('BL-01')
  const [relocateTargetLaneSlot, setRelocateTargetLaneSlot] = useState('')
  const [relocateCustomCode, setRelocateCustomCode] = useState('')
  const [relocateCustomPath, setRelocateCustomPath] = useState('')
  const [relocateSlotId, setRelocateSlotId] = useState<string | null>(null)
  const [relocateQuantity, setRelocateQuantity] = useState<number>(1)
  const [relocateMaxQuantity, setRelocateMaxQuantity] = useState<number>(1)
  const [relocateSourceSlotCode, setRelocateSourceSlotCode] = useState<string | null>(null)
  const [relocateNotes, setRelocateNotes] = useState('')
  const [relocateSubmitting, setRelocateSubmitting] = useState(false)

  const openRelocateModal = (
    item: WarehouseStock,
    prefillTarget?: { slotId?: string; locationCode?: string; locationPath?: string },
    sourceContext?: { slotId?: string; locationCode?: string; maxQty?: number }
  ) => {
    setRelocateStockItem(item)
    const effMaxQty = sourceContext?.maxQty && sourceContext.maxQty > 0 ? sourceContext.maxQty : item.quantity
    setRelocateQuantity(effMaxQty)
    setRelocateMaxQuantity(effMaxQty)
    setRelocateSourceSlotCode(sourceContext?.locationCode || null)
    setRelocateNotes('')
    setRelocateSlotId(prefillTarget?.slotId || null)

    if (item.warehouseId && !warehouseLayoutCache[item.warehouseId]) {
      fetchWarehouseLayoutForStock(item.warehouseId)
    }

    if (prefillTarget?.locationCode) {
      const code = prefillTarget.locationCode.toUpperCase()
      if (code.includes('FL-') || code.includes('FLOOR')) {
        setRelocateTargetType('FLOOR')
        const flMatch = code.match(/FL-\d+/i)?.[0]?.toUpperCase() || 'FL-01'
        setRelocateTargetFloorBay(flMatch)
        setRelocateTargetFloorSlot(prefillTarget.locationCode)
      } else if (code.includes('BL-') || code.includes('LANE')) {
        setRelocateTargetType('LANE')
        const blMatch = code.match(/BL-\d+/i)?.[0]?.toUpperCase() || 'BL-01'
        setRelocateTargetLane(blMatch)
        setRelocateTargetLaneSlot(prefillTarget.locationCode)
      } else if (code.startsWith('R') || code.includes('RACK')) {
        setRelocateTargetType('RACK')
        const rMatch = code.match(/R\d+/i)?.[0]?.toUpperCase() || 'R1'
        setRelocateTargetRack(rMatch)
        const parts = code.split(/[-_]/)
        if (parts.length >= 3) {
          setRelocateTargetBay(String(parseInt(parts[1], 10) || 1))
          setRelocateTargetLevel(String(parseInt(parts[2], 10) || 1))
        }
      } else {
        setRelocateTargetType('CUSTOM')
        setRelocateCustomCode(prefillTarget.locationCode)
        setRelocateCustomPath(prefillTarget.locationPath || prefillTarget.locationCode)
      }
    } else {
      const cur = (item.locationCode || item.locationPath || '').toUpperCase()
      if (cur.includes('FL-') || cur.includes('FLOOR')) {
        setRelocateTargetType('FLOOR')
        const flMatch = cur.match(/FL-\d+/i)?.[0]?.toUpperCase() || 'FL-01'
        setRelocateTargetFloorBay(flMatch)
        setRelocateTargetFloorSlot(`${flMatch}-A1`)
      } else if (cur.includes('BL-') || cur.includes('LANE')) {
        setRelocateTargetType('LANE')
        const blMatch = cur.match(/BL-\d+/i)?.[0]?.toUpperCase() || 'BL-01'
        setRelocateTargetLane(blMatch)
        setRelocateTargetLaneSlot(`${blMatch}-01`)
      } else {
        setRelocateTargetType('RACK')
        const rMatch = cur.match(/R\d+/i)?.[0]?.toUpperCase() || 'R1'
        setRelocateTargetRack(rMatch)
      }
    }

    setIsRelocateModalOpen(true)
  }

  // Warehouse hierarchy model for relocation target selection
  const relocateWarehouseModel = useMemo(() => {
    if (!relocateStockItem?.warehouseId) {
      return { racks: [], floors: [], lanes: [], allSlots: [] }
    }
    const layout = warehouseLayoutCache[relocateStockItem.warehouseId]
    return parseWarehouseHierarchy(layout)
  }, [relocateStockItem?.warehouseId, warehouseLayoutCache])

  const currentRelocateRackObj = useMemo(() => {
    if (relocateWarehouseModel.racks.length === 0) return null
    return (
      relocateWarehouseModel.racks.find((r: any) => r.code === relocateTargetRack) ||
      relocateWarehouseModel.racks[0]
    )
  }, [relocateWarehouseModel.racks, relocateTargetRack])

  const currentRelocateFloorObj = useMemo(() => {
    if (relocateWarehouseModel.floors.length === 0) return null
    return (
      relocateWarehouseModel.floors.find((f: any) => f.code === relocateTargetFloorBay) ||
      relocateWarehouseModel.floors[0]
    )
  }, [relocateWarehouseModel.floors, relocateTargetFloorBay])

  const currentRelocateLaneObj = useMemo(() => {
    if (relocateWarehouseModel.lanes.length === 0) return null
    return (
      relocateWarehouseModel.lanes.find((l: any) => l.code === relocateTargetLane) ||
      relocateWarehouseModel.lanes[0]
    )
  }, [relocateWarehouseModel.lanes, relocateTargetLane])

  const computedRelocateTarget = useMemo(() => {
    if (relocateTargetType === 'RACK') {
      const rName = (relocateTargetRack || currentRelocateRackObj?.code || 'R1').trim()
      const bNum = String(parseInt(relocateTargetBay || '1', 10) || 1).padStart(2, '0')
      const lNum = String(parseInt(relocateTargetLevel || '1', 10) || 1).padStart(2, '0')
      return {
        code: `${rName}-${bNum}-${lNum}`,
        path: `Rack ${rName} > Bay ${bNum} > Level ${lNum}`,
      }
    }
    if (relocateTargetType === 'FLOOR') {
      const fb = (relocateTargetFloorBay || currentRelocateFloorObj?.code || 'FL-01').trim()
      const slot = (relocateTargetFloorSlot || fb).trim()
      return {
        code: slot,
        path: `Floor Bay ${fb}${slot && slot !== fb ? ` > Slot ${slot}` : ''}`,
      }
    }
    if (relocateTargetType === 'LANE') {
      const ln = (relocateTargetLane || currentRelocateLaneObj?.code || 'BL-01').trim()
      const slot = (relocateTargetLaneSlot || ln).trim()
      return {
        code: slot,
        path: `Bulk Lane ${ln}${slot && slot !== ln ? ` > Slot ${slot}` : ''}`,
      }
    }
    return {
      code: (relocateCustomCode || 'CUSTOM').trim(),
      path: (relocateCustomPath || relocateCustomCode || 'Custom Storage Location').trim(),
    }
  }, [
    relocateTargetType,
    relocateTargetRack,
    currentRelocateRackObj,
    relocateTargetBay,
    relocateTargetLevel,
    relocateTargetFloorBay,
    currentRelocateFloorObj,
    relocateTargetFloorSlot,
    relocateTargetLane,
    currentRelocateLaneObj,
    relocateTargetLaneSlot,
    relocateCustomCode,
    relocateCustomPath,
  ])

  const handleRelocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!relocateStockItem) return

    setRelocateSubmitting(true)
    try {
      const finalCode = computedRelocateTarget.code
      const finalPath = computedRelocateTarget.path

      if (!finalCode) {
        showToast('Please specify a destination shelf location code', 'error')
        setRelocateSubmitting(false)
        return
      }

      const res = await fetch('/api/admin/inventory/relocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockId: relocateStockItem.id,
          productId: relocateStockItem.product.id,
          warehouseId: relocateStockItem.warehouseId,
          sourceLocationCode: relocateSourceSlotCode || null,
          targetSlotId: relocateSlotId || null,
          targetLocationCode: finalCode,
          targetLocationPath: finalPath,
          quantity: relocateQuantity,
          notes: relocateNotes,
        }),
      })

      const data = await res.json()
      if (data.success) {
        showToast(data.message || 'Stock successfully relocated', 'success')
        setIsRelocateModalOpen(false)

        // Clear warehouse layout cache to refresh physical slots
        const whId = relocateStockItem.warehouseId
        setWarehouseLayoutCache((prev) => {
          const next = { ...prev }
          delete next[whId]
          return next
        })

        // Refresh stock list and layout
        await fetchStocks()
        fetchWarehouseLayoutForStock(whId)
      } else {
        showToast(data.error || 'Failed to relocate stock', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing relocation', 'error')
    } finally {
      setRelocateSubmitting(false)
    }
  }

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Handle warehouse selector change & keep URL in sync
  const handleWarehouseChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set('warehouse', val)
    } else {
      params.delete('warehouse')
    }
    startTransition(() => {
      router.push(`/admin/inventory?${params.toString()}`)
    })
  }

  // Fetch stocks and warehouse list
  const fetchStocks = useCallback(async () => {
    setStocksLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentWarehouseParam) params.set('warehouse', currentWarehouseParam)
      if (stockSearch) params.set('search', stockSearch)
      if (lowStockOnly) params.set('lowStock', 'true')

      const res = await fetch(`/api/admin/inventory?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setStocks(data.data || [])
        if (data.warehouses && data.warehouses.length > 0) {
          setWarehouses(data.warehouses)
        }
      } else {
        showToast(data.error || 'Failed to fetch inventory', 'error')
      }
    } catch {
      showToast('Network error while loading inventory', 'error')
    } finally {
      setStocksLoading(false)
    }
  }, [currentWarehouseParam, stockSearch, lowStockOnly])

  // Fetch Inbound Purchase Orders / Invoices
  const fetchPurchaseOrders = useCallback(async () => {
    setPoLoading(true)
    try {
      const params = new URLSearchParams()
      if (poSearch) params.set('search', poSearch)

      if (poStatusFilter === 'ALL_INBOUND') {
        params.set('status', 'CONFIRMED,SHIPPED,PARTIALLY_RECEIVED')
      } else if (poStatusFilter !== 'ALL') {
        params.set('status', poStatusFilter)
      }

      if (poPaidFilter === 'PAID') params.set('isPaid', 'true')
      if (poPaidFilter === 'UNPAID') params.set('isPaid', 'false')

      if (currentWarehouseParam) {
        params.set('warehouse', currentWarehouseParam)
      }

      const res = await fetch(`/api/admin/purchase-orders?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setPurchaseOrders(data.data || [])
      } else {
        showToast(data.error || 'Failed to load purchase orders', 'error')
      }
    } catch {
      showToast('Network error while loading purchase orders', 'error')
    } finally {
      setPoLoading(false)
    }
  }, [poSearch, poStatusFilter, poPaidFilter, currentWarehouseParam])

  // Fetch containers for inbound cargo intake
  const fetchContainers = useCallback(async () => {
    setContainersLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('notReceivedOnly', 'true')
      if (currentWarehouseParam) {
        params.set('warehouse', currentWarehouseParam)
      }
      if (containerSearch) {
        params.set('search', containerSearch)
      }
      if (containerRouteFilter && containerRouteFilter !== 'ALL') {
        params.set('routeType', containerRouteFilter)
      }
      if (containerStatusFilter && containerStatusFilter !== 'ALL') {
        params.set('status', containerStatusFilter)
      }

      const res = await fetch(`/api/admin/containers?${params.toString()}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setContainers(data.data)
      } else {
        setContainers([])
      }
    } catch {
      showToast('Network error while loading containers', 'error')
    } finally {
      setContainersLoading(false)
    }
  }, [currentWarehouseParam, containerSearch, containerRouteFilter, containerStatusFilter])

  // Fetch movements
  const fetchMovements = useCallback(async () => {
    setMovementsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', movementPage.toString())
      params.set('limit', '25')
      if (movementSearch) params.set('search', movementSearch)
      if (movementType) params.set('type', movementType)
      if (currentWarehouseParam) params.set('warehouse', currentWarehouseParam)

      const res = await fetch(`/api/admin/inventory/movements?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setMovements(data.data || [])
        setMovementTotalPages(data.pagination?.totalPages || 1)
      } else {
        showToast(data.error || 'Failed to fetch movements', 'error')
      }
    } catch {
      showToast('Network error while loading movements', 'error')
    } finally {
      setMovementsLoading(false)
    }
  }, [movementPage, movementSearch, movementType, currentWarehouseParam])

  // Initial load and sync with params
  useEffect(() => {
    fetchStocks()
  }, [fetchStocks])

  useEffect(() => {
    if (activeTab === 'inbound') {
      fetchPurchaseOrders()
      fetchContainers()
    } else if (activeTab === 'movements') {
      fetchMovements()
    }
  }, [activeTab, fetchPurchaseOrders, fetchContainers, fetchMovements])

  // Categorize warehouses strictly by country
  const chinaWarehouses = warehouses.filter(
    (w) => w.code.toUpperCase().startsWith('CN') || w.country.toLowerCase().includes('china')
  )
  const belarusWarehouses = warehouses.filter(
    (w) => w.code.toUpperCase().startsWith('BY') || w.country.toLowerCase().includes('belarus')
  )

  const isChinaActive =
    currentWarehouseParam.toLowerCase() === 'cn' ||
    chinaWarehouses.some(
      (w) =>
        w.id === currentWarehouseParam ||
        w.code.toLowerCase() === currentWarehouseParam.toLowerCase()
    )

  const isBelarusActive =
    currentWarehouseParam.toLowerCase() === 'by' ||
    belarusWarehouses.some(
      (w) =>
        w.id === currentWarehouseParam ||
        w.code.toLowerCase() === currentWarehouseParam.toLowerCase()
    )

  // Strictly filter displayed warehouses based on current selection:
  // When China is selected, show ONLY China warehouses.
  // When Belarus is selected, show ONLY Belarus warehouses.
  // When All is selected, show all.
  const displayedWarehouses = isChinaActive
    ? chinaWarehouses
    : isBelarusActive
    ? belarusWarehouses
    : warehouses

  // Active warehouse object helper
  const selectedWarehouse = warehouses.find(
    (w) =>
      w.code.toLowerCase() === currentWarehouseParam.toLowerCase() ||
      w.id === currentWarehouseParam ||
      (currentWarehouseParam.toLowerCase() === 'cn' && (w.code === 'CN-YW' || w.country.toLowerCase() === 'china')) ||
      (currentWarehouseParam.toLowerCase() === 'by' && (w.code === 'BY-MS' || w.country.toLowerCase() === 'belarus'))
  )

  // Strictly filter items by warehouse/country so no other country's warehouse appears on the page
  const filteredStocks = useMemo(() => {
    if (isChinaActive) {
      return stocks.filter((s) => {
        const c = (s.warehouse?.code || '').toUpperCase()
        const country = (s.warehouse?.country || '').toLowerCase()
        return c.startsWith('CN') || country.includes('china')
      })
    }
    if (isBelarusActive) {
      return stocks.filter((s) => {
        const c = (s.warehouse?.code || '').toUpperCase()
        const country = (s.warehouse?.country || '').toLowerCase()
        return c.startsWith('BY') || country.includes('belarus')
      })
    }
    return stocks
  }, [stocks, isChinaActive, isBelarusActive])

  // Synchronize shelvesWarehouseId with active warehouse selection
  useEffect(() => {
    if (selectedWarehouse?.id) {
      setShelvesWarehouseId(selectedWarehouse.id)
    } else if (displayedWarehouses.length > 0 && (!shelvesWarehouseId || !displayedWarehouses.some((w) => w.id === shelvesWarehouseId))) {
      setShelvesWarehouseId(displayedWarehouses[0].id)
    } else if (warehouses.length > 0 && !shelvesWarehouseId) {
      setShelvesWarehouseId(warehouses[0].id)
    }
  }, [selectedWarehouse, displayedWarehouses, warehouses, shelvesWarehouseId])

  // Fetch layout whenever shelvesWarehouseId is set or when activeTab switches to 'shelves'
  useEffect(() => {
    if (shelvesWarehouseId) {
      fetchWarehouseLayoutForStock(shelvesWarehouseId)
    }
  }, [shelvesWarehouseId, fetchWarehouseLayoutForStock, activeTab])

  // Reset focused structure whenever active shelves warehouse changes
  useEffect(() => {
    setShelvesFocusedStructure(null)
  }, [shelvesWarehouseId])

  // Hierarchy model for the Shelves tab
  const shelvesWarehouseModel = useMemo(() => {
    const layout = (shelvesWarehouseId && warehouseLayoutCache[shelvesWarehouseId]) ||
      (warehouseLayout && warehouseLayout.id === shelvesWarehouseId ? warehouseLayout : null)
    if (!layout) {
      return { racks: [], floors: [], lanes: [], allSlots: [] }
    }
    return parseWarehouseHierarchy(layout)
  }, [shelvesWarehouseId, warehouseLayoutCache, warehouseLayout])

  const currentShelvesWarehouse = useMemo(() => {
    return warehouses.find((w) => w.id === shelvesWarehouseId) || selectedWarehouse || warehouses[0]
  }, [warehouses, shelvesWarehouseId, selectedWarehouse])

  // Retrieve products for any slot in the warehouse
  const getProductsForSlot = useCallback((slot: any) => {
    if (!slot) return []
    const productsMap = new Map<string, {
      id: string
      name: string
      sku: string
      thumbnail?: string | null
      quantity: number
      availableQty?: number
      reservedQty?: number
      costPrice?: number | null
      price?: number
      locationCode?: string
      locationPath?: string
    }>()

    // 1. From slot.slotObj.stocks OR raw slot.stocks (loaded from warehouse API)
    const slotStocks = slot.slotObj?.stocks || slot.stocks || []
    if (Array.isArray(slotStocks)) {
      slotStocks.forEach((st: any) => {
        const prod = st.product
        const pId = prod?.id || st.productId || st.id
        if (pId) {
          const existing = productsMap.get(pId)
          if (existing) {
            existing.quantity += (st.quantity || 0)
          } else {
            productsMap.set(pId, {
              id: pId,
              name: prod?.name || st.productName || 'Unknown Product',
              sku: prod?.sku || st.productSku || '',
              thumbnail: prod?.thumbnail || null,
              quantity: st.quantity || 0,
              availableQty: st.availableQty ?? st.quantity,
              reservedQty: st.reservedQty ?? 0,
              costPrice: st.avgCost ?? null,
              price: prod?.price ?? 0,
              locationCode: slot.code,
              locationPath: `Slot ${slot.code}`,
            })
          }
        }
      })
    }

    // 2. Cross-reference with filteredStocks
    if (slot.code || slot.id) {
      const slotCodeUpper = (slot.code || '').toUpperCase()
      filteredStocks.forEach((st) => {
        let isMatch = false
        let slotAllocQty = st.quantity

        if (st.locationCode && slot.code) {
          const locUpper = st.locationCode.toUpperCase()
          const allocRegex = new RegExp(`(?:^|,\\s*)${slotCodeUpper}\\s*\\((\\d+)\\)`, 'i')
          const allocMatch = locUpper.match(allocRegex)
          if (allocMatch) {
            isMatch = true
            slotAllocQty = parseInt(allocMatch[1], 10) || 0
          } else if (locUpper === slotCodeUpper) {
            isMatch = true
          }
        }

        if (!isMatch && ((st.slot?.id && slot.id && st.slot.id === slot.id) ||
            (st.slot?.code && slot.code && st.slot.code.toUpperCase() === slotCodeUpper))) {
          if (!st.locationCode || !st.locationCode.includes('(')) {
            isMatch = true
          }
        }

        if (isMatch && st.product && slotAllocQty > 0) {
          const pId = st.product.id
          const existing = productsMap.get(pId)
          if (existing) {
            existing.quantity = slotAllocQty
            existing.thumbnail = existing.thumbnail || st.product.thumbnail
            existing.costPrice = existing.costPrice ?? st.avgCost
            existing.price = existing.price || st.product.price
          } else {
            productsMap.set(pId, {
              id: pId,
              name: st.product.name,
              sku: st.product.sku,
              thumbnail: st.product.thumbnail || null,
              quantity: slotAllocQty,
              availableQty: slotAllocQty,
              reservedQty: st.reservedQty,
              costPrice: st.avgCost,
              price: st.product.price,
              locationCode: slot.code,
              locationPath: st.locationPath || `Slot ${slot.code}`,
            })
          }
        }
      })
    }

    return Array.from(productsMap.values())
  }, [filteredStocks])

  const handleOpenSlotDetail = (slot: any, structureTitle: string, structureType: 'RACK' | 'FLOOR' | 'LANE') => {
    const products = getProductsForSlot(slot)
    setSelectedSlotDetail({
      slot,
      structureTitle,
      structureType,
      products,
    })
  }

  // Statistics for Shelves & Structures Tab
  const shelvesStats = useMemo(() => {
    const { racks, floors, lanes, allSlots } = shelvesWarehouseModel
    const totalSlots = allSlots.length
    let occupiedSlotsCount = 0
    let totalStockedUnits = 0

    allSlots.forEach((slot) => {
      const prods = getProductsForSlot(slot)
      const hasProds = prods.length > 0 || slot.isOccupied || (slot.stocksCount || 0) > 0
      if (hasProds) {
        occupiedSlotsCount++
        const prodsTotal = prods.reduce((sum, p) => sum + (p.quantity || 0), 0)
        const units = prodsTotal > 0 ? prodsTotal : (slot.stocksCount || 0)
        totalStockedUnits += units
      }
    })

    const emptySlotsCount = Math.max(0, totalSlots - occupiedSlotsCount)
    const occupancyPercent = totalSlots > 0 ? Math.round((occupiedSlotsCount / totalSlots) * 100) : 0

    return {
      totalStructures: racks.length + floors.length + lanes.length,
      racksCount: racks.length,
      floorsCount: floors.length,
      lanesCount: lanes.length,
      totalSlots,
      occupiedSlotsCount,
      emptySlotsCount,
      occupancyPercent,
      totalStockedUnits,
    }
  }, [shelvesWarehouseModel, getProductsForSlot])

  // Filtered structures for Shelves & Structures Tab
  const filteredShelvesStructures = useMemo(() => {
    let { racks, floors, lanes } = shelvesWarehouseModel

    if (shelvesStructureFilter === 'RACK') {
      floors = []
      lanes = []
    } else if (shelvesStructureFilter === 'FLOOR') {
      racks = []
      lanes = []
    } else if (shelvesStructureFilter === 'LANE') {
      racks = []
      floors = []
    }

    if (shelvesFocusedStructure) {
      racks = racks.filter((r) => r.code === shelvesFocusedStructure || r.title === shelvesFocusedStructure)
      floors = floors.filter((f) => f.code === shelvesFocusedStructure || f.name === shelvesFocusedStructure)
      lanes = lanes.filter((l) => l.code === shelvesFocusedStructure || l.name === shelvesFocusedStructure)
    }

    if (shelvesSearch.trim()) {
      const q = shelvesSearch.trim().toLowerCase()
      racks = racks.filter((r) => {
        if (r.code?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q)) return true
        return (r.allSlots || []).some((s) => {
          if (s.code?.toLowerCase().includes(q)) return true
          const prods = getProductsForSlot(s)
          return prods.some((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
        })
      })
      floors = floors.filter((f) => {
        if (f.code?.toLowerCase().includes(q) || (f.name && f.name.toLowerCase().includes(q))) return true
        return (f.slots || []).some((s: any) => {
          if ((s.code || '').toLowerCase().includes(q)) return true
          const prods = getProductsForSlot(s)
          return prods.some((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
        })
      })
      lanes = lanes.filter((l) => {
        if (l.code?.toLowerCase().includes(q) || (l.name && l.name.toLowerCase().includes(q))) return true
        return (l.slots || []).some((s: any) => {
          if ((s.code || '').toLowerCase().includes(q)) return true
          const prods = getProductsForSlot(s)
          return prods.some((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
        })
      })
    }

    return { racks, floors, lanes }
  }, [shelvesWarehouseModel, shelvesStructureFilter, shelvesFocusedStructure, shelvesSearch, getProductsForSlot])

  const filteredPurchaseOrders = useMemo(() => {
    if (isChinaActive) {
      return purchaseOrders.filter((po) => {
        const wh = po.destinationWarehouse || po.warehouse
        if (!wh) return true // default unassigned POs to China procurement hub
        const c = (wh.code || '').toUpperCase()
        const country = (wh.country || '').toLowerCase()
        return c.startsWith('CN') || country.includes('china')
      })
    }
    if (isBelarusActive) {
      return purchaseOrders.filter((po) => {
        const wh = po.destinationWarehouse || po.warehouse
        if (!wh) return false
        const c = (wh.code || '').toUpperCase()
        const country = (wh.country || '').toLowerCase()
        return c.startsWith('BY') || country.includes('belarus')
      })
    }
    return purchaseOrders
  }, [purchaseOrders, isChinaActive, isBelarusActive])

  const filteredMovements = useMemo(() => {
    if (isChinaActive) {
      return movements.filter((m) => {
        const c = (m.warehouse?.code || '').toUpperCase()
        const country = (m.warehouse?.country || '').toLowerCase()
        return c.startsWith('CN') || country.includes('china')
      })
    }
    if (isBelarusActive) {
      return movements.filter((m) => {
        const c = (m.warehouse?.code || '').toUpperCase()
        const country = (m.warehouse?.country || '').toLowerCase()
        return c.startsWith('BY') || country.includes('belarus')
      })
    }
    return movements
  }, [movements, isChinaActive, isBelarusActive])

  // Strictly filter incoming containers by destination country/warehouse
  // And strictly exclude containers that have already been unloaded into warehouse
  const filteredContainers = useMemo(() => {
    return containers.filter((c) => {
      // 1. Strictly exclude unloaded / received containers
      if (c.status === 'WAREHOUSE_RECEIVED' || c.status === 'DELIVERED' || c.status === 'CANCELLED') {
        return false
      }

      // 2. Strict country / warehouse matching
      if (isBelarusActive) {
        const destWh = c.destinationWarehouse
        const cCode = (destWh?.code || '').toUpperCase()
        const country = (destWh?.country || c.destination || '').toLowerCase()
        return (
          cCode.startsWith('BY') ||
          country.includes('belarus') ||
          country.includes('minsk') ||
          belarusWarehouses.some((bw) => bw.id === c.destinationWarehouseId)
        )
      }

      if (isChinaActive) {
        const destWh = c.destinationWarehouse
        const cCode = (destWh?.code || '').toUpperCase()
        const country = (destWh?.country || c.destination || '').toLowerCase()
        return (
          cCode.startsWith('CN') ||
          country.includes('china') ||
          country.includes('yiwu') ||
          chinaWarehouses.some((cw) => cw.id === c.destinationWarehouseId)
        )
      }

      return true
    })
  }, [containers, isChinaActive, isBelarusActive, belarusWarehouses, chinaWarehouses])

  // Automatically default to Inbound Containers when viewing Belarus distribution center
  useEffect(() => {
    if (isBelarusActive) {
      setInboundSource('containers')
    } else {
      setInboundSource('pos')
    }
  }, [isBelarusActive])

  // Target warehouse for receiving (shared between PO receive and Container unload)
  const activeReceivingWarehouseId = selectedContainerToReceive
    ? containerTargetWarehouseId
    : targetWarehouseIdForPo

  // Fetch full warehouse layout (zones, bays, slots, stocks) when target warehouse changes
  useEffect(() => {
    if (!activeReceivingWarehouseId) {
      setWarehouseLayout(null)
      return
    }
    let isCancelled = false
    setLayoutLoading(true)
    fetch(`/api/admin/warehouses/${activeReceivingWarehouseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && data.data) {
          setWarehouseLayout(data.data)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setLayoutLoading(false)
      })
    return () => {
      isCancelled = true
    }
  }, [activeReceivingWarehouseId])

  // Parse structured warehouse hierarchy (racks, bays, levels, floors, lanes, slots)
  const warehouseModel = useMemo(() => {
    return parseWarehouseHierarchy(warehouseLayout)
  }, [warehouseLayout])

  // Automatically select first rack when layout loads
  useEffect(() => {
    if (warehouseModel.racks.length > 0) {
      if (!selectedRack || !warehouseModel.racks.some((r: any) => r.code === selectedRack)) {
        setSelectedRack(warehouseModel.racks[0].code)
      }
    }
  }, [warehouseModel.racks, selectedRack])

  // Sync selected rack with receive coordinates
  useEffect(() => {
    if (locationMode === 'RACK' && selectedRack) {
      setReceiveRack(selectedRack)
    }
  }, [selectedRack, locationMode])

  useEffect(() => {
    if (locationMode === 'RACK') {
      setReceiveLane(selectedBay || '')
    }
  }, [selectedBay, locationMode])

  useEffect(() => {
    if (locationMode === 'RACK') {
      setReceiveFloor(selectedLevel || '')
    }
  }, [selectedLevel, locationMode])

  // Active rack object
  const currentRackObj = useMemo(() => {
    return warehouseModel.racks.find((r: any) => r.code === selectedRack) || warehouseModel.racks[0]
  }, [warehouseModel.racks, selectedRack])

  // Compute Bay × Level 2D matrix structure matching warehouse rack shape
  const rackGridData = useMemo(() => {
    if (!currentRackObj || !currentRackObj.allSlots) {
      return { bayMap: new Map<number, Map<number, any>>(), bayNumbers: [] as number[], levelNumbers: [] as number[] }
    }
    const bayMap = new Map<number, Map<number, any>>()
    currentRackObj.allSlots.forEach((slot: any) => {
      const parts = slot.code.split('-')
      const bay = slot.bayNum || parseInt(parts[parts.length - 2], 10) || 0
      const level = slot.level || parseInt(parts[parts.length - 1], 10) || 0
      if (!bayMap.has(bay)) bayMap.set(bay, new Map())
      bayMap.get(bay)!.set(level, slot)
    })
    const bayNumbers = Array.from(bayMap.keys()).sort((a: number, b: number) => a - b)
    const levelNumbers = Array.from(
      new Set(
        currentRackObj.allSlots.map((s: any) => {
          const p = s.code.split('-')
          return s.level || parseInt(p[p.length - 1], 10) || 0
        })
      )
    ).sort((a: any, b: any) => (b as number) - (a as number)) as number[]

    return { bayMap, bayNumbers, levelNumbers }
  }, [currentRackObj])

  // Active floor and lane objects
  const currentFloorObj = useMemo(() => {
    return warehouseModel.floors.find((f: any) => f.code === receiveFloor) || warehouseModel.floors[0]
  }, [warehouseModel.floors, receiveFloor])

  const currentLaneObj = useMemo(() => {
    return warehouseModel.lanes.find((l: any) => l.code === receiveLane) || warehouseModel.lanes[0]
  }, [warehouseModel.lanes, receiveLane])

  // Compute Col × Row 2D matrix structure for Ground Floor slots
  const floorGridData = useMemo(() => {
    if (!currentFloorObj || !currentFloorObj.slots || currentFloorObj.slots.length === 0) {
      return { matrix: [] as any[][], rowNumbers: [] as number[], colNumbers: [] as number[], rowLabels: [] as string[] }
    }

    const slots = currentFloorObj.slots.map((s: any) => ({
      id: s.id,
      code: s.code,
      bayCode: currentFloorObj.code,
      isOccupied: s.stocks && s.stocks.length > 0,
      stocksCount: s.stocks?.reduce((acc: number, st: any) => acc + (st.quantity || 0), 0) || 0,
      slotObj: s,
    }))

    // Check if slots have 2D letter+number format like -A1, -A2, -B1...
    let has2D = false
    const rowSet = new Set<string>()
    const colSet = new Set<string>()

    slots.forEach((s: any) => {
      const code = s.code || ''
      const m2D = code.match(/-([A-Z])(\d+)$/i)
      if (m2D) {
        has2D = true
        rowSet.add(m2D[1].toUpperCase())
        colSet.add(m2D[2])
      }
    })

    if (has2D && rowSet.size > 0 && colSet.size > 0) {
      const sortedRowLetters = Array.from(rowSet).sort()
      const sortedColNums = Array.from(colSet).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

      const matrix: any[][] = []
      const rowLabels: string[] = []

      sortedRowLetters.forEach((rLetter, rIdx) => {
        rowLabels.push(`Row ${rLetter}`)
        matrix[rIdx] = []
        sortedColNums.forEach((cNum, cIdx) => {
          const found = slots.find((s: any) => (s.code || '').endsWith(`-${rLetter}${cNum}`))
          matrix[rIdx][cIdx] = found || null
        })
      })

      const rowNumbers = matrix.map((_, idx) => idx + 1)
      const colNumbers = sortedColNums.map((_, idx) => idx + 1)
      return { matrix, rowNumbers, colNumbers, rowLabels }
    }

    // Standard sequence format (e.g. FL-01-A ... FL-01-F, or FL-01-01 ... FL-01-06)
    // Sort naturally by code
    const sortedSlots = [...slots].sort((a: any, b: any) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }))
    const count = sortedSlots.length
    let cols = 3
    if (count <= 3) cols = Math.max(1, count)
    else if (count === 4) cols = 2
    else if (count === 6) cols = 3
    else if (count === 8) cols = 4
    else if (count === 9) cols = 3
    else if (count === 10) cols = 5
    else if (count === 12) cols = 4
    else if (count % 4 === 0 && count > 12) cols = 4
    else if (count % 3 === 0 && count > 12) cols = 3
    else cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(count))))

    const rows = Math.ceil(count / cols)
    const matrix: any[][] = []
    const rowLabels: string[] = []

    for (let r = 0; r < rows; r++) {
      rowLabels.push(`R${r + 1}`)
      matrix[r] = []
      for (let c = 0; c < cols; c++) {
        const slotIdx = r * cols + c
        matrix[r][c] = slotIdx < count ? sortedSlots[slotIdx] : null
      }
    }

    const rowNumbers = Array.from({ length: rows }, (_, idx) => idx + 1)
    const colNumbers = Array.from({ length: cols }, (_, idx) => idx + 1)
    return { matrix, rowNumbers, colNumbers, rowLabels }
  }, [currentFloorObj])

  // Compute Col × Row 2D matrix structure for Bulk Lane slots
  const laneGridData = useMemo(() => {
    if (!currentLaneObj || !currentLaneObj.slots || currentLaneObj.slots.length === 0) {
      return { matrix: [] as any[][], rowNumbers: [] as number[], colNumbers: [] as number[], rowLabels: [] as string[] }
    }

    const slots = currentLaneObj.slots.map((s: any) => ({
      id: s.id,
      code: s.code,
      bayCode: currentLaneObj.code,
      isOccupied: s.stocks && s.stocks.length > 0,
      stocksCount: s.stocks?.reduce((acc: number, st: any) => acc + (st.quantity || 0), 0) || 0,
      slotObj: s,
    }))

    const sortedSlots = [...slots].sort((a: any, b: any) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }))
    const count = sortedSlots.length
    let cols = 3
    if (count <= 3) cols = Math.max(1, count)
    else if (count === 4) cols = 2
    else if (count === 6) cols = 3
    else if (count === 8) cols = 4
    else if (count === 9) cols = 3
    else if (count === 10) cols = 5
    else if (count === 12) cols = 4
    else if (count % 4 === 0 && count > 12) cols = 4
    else if (count % 3 === 0 && count > 12) cols = 3
    else cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(count))))

    const rows = Math.ceil(count / cols)
    const matrix: any[][] = []
    const rowLabels: string[] = []

    for (let r = 0; r < rows; r++) {
      rowLabels.push(`R${r + 1}`)
      matrix[r] = []
      for (let c = 0; c < cols; c++) {
        const slotIdx = r * cols + c
        matrix[r][c] = slotIdx < count ? sortedSlots[slotIdx] : null
      }
    }

    const rowNumbers = Array.from({ length: rows }, (_, idx) => idx + 1)
    const colNumbers = Array.from({ length: cols }, (_, idx) => idx + 1)
    return { matrix, rowNumbers, colNumbers, rowLabels }
  }, [currentLaneObj])

  // Exact slots displayed based on current location mode and filters
  const displayedSlots = useMemo(() => {
    if (locationMode === 'RACK') {
      if (!currentRackObj) return []
      return currentRackObj.allSlots.filter((slot: any) => {
        if (selectedBay && slot.bayCode !== selectedBay && String(slot.bayNum) !== selectedBay) return false
        if (selectedLevel && String(slot.level) !== String(selectedLevel)) return false
        return true
      })
    } else if (locationMode === 'FLOOR') {
      const fl = warehouseModel.floors.find((f: any) => f.code === receiveFloor) || warehouseModel.floors[0]
      return (
        fl?.slots?.map((s: any) => ({
          id: s.id,
          code: s.code,
          bayCode: fl.code,
          bayNum: 1,
          level: 1,
          isOccupied: s.stocks && s.stocks.length > 0,
          stocksCount: s.stocks?.reduce((acc: number, st: any) => acc + (st.quantity || 0), 0) || 0,
          slotObj: s,
        })) || []
      )
    } else if (locationMode === 'LANE') {
      const ln = warehouseModel.lanes.find((l: any) => l.code === receiveLane) || warehouseModel.lanes[0]
      return (
        ln?.slots?.map((s: any) => ({
          id: s.id,
          code: s.code,
          bayCode: ln.code,
          bayNum: 1,
          level: 1,
          isOccupied: s.stocks && s.stocks.length > 0,
          stocksCount: s.stocks?.reduce((acc: number, st: any) => acc + (st.quantity || 0), 0) || 0,
          slotObj: s,
        })) || []
      )
    }
    return []
  }, [locationMode, currentRackObj, selectedBay, selectedLevel, warehouseModel, receiveFloor, receiveLane])

  // Toggle single slot selection
  const handleToggleSlotCode = (code: string) => {
    setSelectedSlotCodes((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code)
      } else {
        return [...prev, code]
      }
    })
  }

  // Select all filtered slots
  const handleSelectAllFilteredSlots = () => {
    const codes = displayedSlots.map((s: any) => s.code)
    setSelectedSlotCodes((prev) => Array.from(new Set([...prev, ...codes])))
  }

  // Select all empty slots
  const handleSelectAllEmptySlots = () => {
    const emptyCodes = displayedSlots.filter((s: any) => !s.isOccupied).map((s: any) => s.code)
    setSelectedSlotCodes((prev) => Array.from(new Set([...prev, ...emptyCodes])))
  }

  // Clear slot selections
  const handleClearSelectedSlots = () => {
    setSelectedSlotCodes([])
  }

  // Toggle all slots in a specific Bay
  const handleToggleBaySlots = (bayNum: number) => {
    if (!currentRackObj) return
    const baySlots = currentRackObj.allSlots.filter(
      (s: any) =>
        s.bayNum === bayNum ||
        s.code.includes(`-${String(bayNum).padStart(2, '0')}-`) ||
        s.code.includes(`-${bayNum}-`)
    )
    const bayCodes = baySlots.map((s: any) => s.code)
    if (bayCodes.length === 0) return
    const allSelected = bayCodes.every((c: string) => selectedSlotCodes.includes(c))
    if (allSelected) {
      setSelectedSlotCodes((prev) => prev.filter((c: string) => !bayCodes.includes(c)))
    } else {
      setSelectedSlotCodes((prev) => Array.from(new Set([...prev, ...bayCodes])))
    }
  }

  // Toggle all slots in a specific Level
  const handleToggleLevelSlots = (levelNum: number) => {
    if (!currentRackObj) return
    const levelSlots = currentRackObj.allSlots.filter(
      (s: any) =>
        s.level === levelNum ||
        s.code.endsWith(`-${String(levelNum).padStart(2, '0')}`) ||
        s.code.endsWith(`-${levelNum}`)
    )
    const levelCodes = levelSlots.map((s: any) => s.code)
    if (levelCodes.length === 0) return
    const allSelected = levelCodes.every((c: string) => selectedSlotCodes.includes(c))
    if (allSelected) {
      setSelectedSlotCodes((prev) => prev.filter((c: string) => !levelCodes.includes(c)))
    } else {
      setSelectedSlotCodes((prev) => Array.from(new Set([...prev, ...levelCodes])))
    }
  }

  // Toggle all slots in a specific Floor Row
  const handleToggleFloorRow = (rowIdx: number) => {
    const rowSlots = (floorGridData.matrix[rowIdx - 1] || []).filter(Boolean)
    const rowCodes = rowSlots.map((s: any) => s.code)
    if (rowCodes.length === 0) return
    const allSelected = rowCodes.every((c: string) => selectedSlotCodes.includes(c))
    if (allSelected) {
      setSelectedSlotCodes((prev) => prev.filter((c: string) => !rowCodes.includes(c)))
    } else {
      setSelectedSlotCodes((prev) => Array.from(new Set([...prev, ...rowCodes])))
    }
  }

  // Toggle all slots in a specific Floor Col
  const handleToggleFloorCol = (colIdx: number) => {
    const colSlots = floorGridData.matrix.map((row) => row[colIdx - 1]).filter(Boolean)
    const colCodes = colSlots.map((s: any) => s.code)
    if (colCodes.length === 0) return
    const allSelected = colCodes.every((c: string) => selectedSlotCodes.includes(c))
    if (allSelected) {
      setSelectedSlotCodes((prev) => prev.filter((c: string) => !colCodes.includes(c)))
    } else {
      setSelectedSlotCodes((prev) => Array.from(new Set([...prev, ...colCodes])))
    }
  }

  // Toggle all slots in a specific Lane Row
  const handleToggleLaneRow = (rowIdx: number) => {
    const rowSlots = (laneGridData.matrix[rowIdx - 1] || []).filter(Boolean)
    const rowCodes = rowSlots.map((s: any) => s.code)
    if (rowCodes.length === 0) return
    const allSelected = rowCodes.every((c: string) => selectedSlotCodes.includes(c))
    if (allSelected) {
      setSelectedSlotCodes((prev) => prev.filter((c: string) => !rowCodes.includes(c)))
    } else {
      setSelectedSlotCodes((prev) => Array.from(new Set([...prev, ...rowCodes])))
    }
  }

  // Toggle all slots in a specific Lane Col
  const handleToggleLaneCol = (colIdx: number) => {
    const colSlots = laneGridData.matrix.map((row) => row[colIdx - 1]).filter(Boolean)
    const colCodes = colSlots.map((s: any) => s.code)
    if (colCodes.length === 0) return
    const allSelected = colCodes.every((c: string) => selectedSlotCodes.includes(c))
    if (allSelected) {
      setSelectedSlotCodes((prev) => prev.filter((c: string) => !colCodes.includes(c)))
    } else {
      setSelectedSlotCodes((prev) => Array.from(new Set([...prev, ...colCodes])))
    }
  }

  // Distribute selected slots 1-by-1 across all line items
  // Helper to get active inbound items from either PO receive or Container unload modal
  const getActiveInboundItems = () => {
    if (selectedPoToReceive) {
      return selectedPoToReceive.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        prevHandled: it.receivedQuantity ?? it.receivedQty ?? 0,
        productName: it.product?.name || it.productName || 'Line Item',
        productSku: it.product?.sku || it.productSku || 'SKU',
      }))
    }
    if (selectedContainerToReceive) {
      return selectedContainerToReceive.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        prevHandled: (it.receivedQty || 0) + (it.damagedQty || 0) + (it.rejectedQty || 0),
        productName: it.product.name,
        productSku: it.product.sku,
      }))
    }
    return []
  }

  // Parse slot coordinates into Bay / Level structure matching warehouse matrix
  const parseAllocationCoord = (code: string) => {
    if (!code) return { groupLabel: 'Floor', levelLabel: code, fullLabel: code }
    // Rack format: R1-01-03 -> Bay 1 (B1), Level 3 (L3)
    const rackMatch = code.match(/^([A-Z0-9]+)-(\d+)-(\d+)$/i)
    if (rackMatch) {
      const bayNum = parseInt(rackMatch[2], 10)
      const levelNum = parseInt(rackMatch[3], 10)
      return {
        groupLabel: `B${bayNum}`,
        levelLabel: `L${levelNum}`,
        fullLabel: `B${bayNum} · L${levelNum}`,
      }
    }
    // Floor 2D format: FL-01-A1 -> Row A, Col 1
    const floor2DMatch = code.match(/^([A-Z0-9]+-[A-Z0-9]+)-([A-Z]+)(\d+)$/i)
    if (floor2DMatch) {
      return {
        groupLabel: `Row ${floor2DMatch[2]}`,
        levelLabel: `C${floor2DMatch[3]}`,
        fullLabel: `Row ${floor2DMatch[2]} · C${floor2DMatch[3]}`,
      }
    }
    // Floor 1D format: FL-01-A
    const floor1DMatch = code.match(/^([A-Z0-9]+-[A-Z0-9]+)-([A-Z0-9]+)$/i)
    if (floor1DMatch) {
      return {
        groupLabel: floor1DMatch[1],
        levelLabel: `Slot ${floor1DMatch[2]}`,
        fullLabel: `${floor1DMatch[1]} · Slot ${floor1DMatch[2]}`,
      }
    }
    return { groupLabel: 'General', levelLabel: code, fullLabel: code }
  }

  // Group allocated slots by their Bay / Row header to mirror the Shelves & Slots addressing grid
  const groupAllocationsByBay = (allocs: any[]) => {
    const groups: { [key: string]: { bayLabel: string; items: any[] } } = {}
    allocs.forEach((a: any) => {
      const { groupLabel, levelLabel } = parseAllocationCoord(a.slotCode)
      if (!groups[groupLabel]) {
        groups[groupLabel] = { bayLabel: groupLabel, items: [] }
      }
      groups[groupLabel].items.push({ ...a, levelLabel })
    })
    return Object.values(groups)
  }

  // Distribute selected slots 1-by-1 across all line items
  const handleDistributeSlotsAcrossItems = () => {
    const items = getActiveInboundItems()
    if (items.length === 0) return
    const slotsToUse = selectedSlotCodes.length > 0 ? selectedSlotCodes : displayedSlots.map((s: any) => s.code)
    if (slotsToUse.length === 0) {
      showToast('No slots available to distribute', 'error')
      return
    }
    const newMap: Record<string, any> = {}
    items.forEach((item, idx) => {
      const assignedCode = slotsToUse[idx % slotsToUse.length]
      const foundSlot = warehouseModel.allSlots.find((s: any) => s.code === assignedCode)
      newMap[item.id] = {
        slotCode: assignedCode,
        slotId: foundSlot?.id,
        locationCode: assignedCode,
        locationPath: `Rack ${selectedRack || foundSlot?.bayCode || 'R1'} > Slot ${assignedCode}`,
        rack: selectedRack,
        lane: receiveLane,
        floor: receiveFloor,
      }
    })
    setItemCustomSlots(newMap)
    showToast(
      `Distributed slots across ${items.length} line items (1 per item)`,
      'success'
    )
  }

  // Apply batch location to all items
  const handleApplyBatchToAllItems = () => {
    const items = getActiveInboundItems()
    if (items.length === 0) return
    const batchCode =
      selectedSlotCodes.length > 0
        ? selectedSlotCodes.join(', ')
        : receiveRack
        ? `R-${receiveRack}`
        : undefined
    const batchPath =
      selectedSlotCodes.length > 0
        ? `Rack ${selectedRack || 'R1'} > Slots: ${selectedSlotCodes.join(', ')}`
        : receiveRack
        ? `Rack ${receiveRack}`
        : 'General Floor'

    const newMap: Record<string, any> = {}
    items.forEach((item) => {
      newMap[item.id] = {
        slotCode: batchCode,
        locationCode: batchCode,
        locationPath: batchPath,
        rack: selectedRack || receiveRack,
        lane: receiveLane,
        floor: receiveFloor,
      }
    })
    setItemCustomSlots(newMap)
    showToast('Applied batch location to all items', 'success')
  }

  // Register entered quantity into selected slot(s) for a specific line item:
  // - If 1 slot selected: all qty assigned to it
  // - If multiple slots selected: divides equally across all selected slots
  // - Remainder stays as unassigned remainder so user can select another slot and put the remainder into it
  const handleRegisterQtyToSlots = (itemId: string, customQty?: number) => {
    const items = getActiveInboundItems()
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const remaining = Math.max(0, item.quantity - item.prevHandled)
    const receiveNow = receivingItemsMap[item.id] ?? remaining

    const currentData = itemCustomSlots[itemId] || {}
    const currentAllocations: { slotCode: string; quantity: number }[] = [...(currentData.allocations || [])]
    const currentAllocated = currentAllocations.reduce((sum, a) => sum + (a.quantity || 0), 0)
    const unassignedRemainder = Math.max(0, receiveNow - currentAllocated)

    // Determine quantity to allocate
    let qtyToAllocate =
      customQty !== undefined
        ? customQty
        : (rowAssignQty[itemId] !== undefined && rowAssignQty[itemId] > 0
            ? rowAssignQty[itemId]
            : (unassignedRemainder > 0 ? unassignedRemainder : receiveNow))

    if (qtyToAllocate <= 0) {
      showToast('Please enter a valid quantity greater than 0 to register', 'error')
      return
    }

    // Determine target slots
    let targetSlots: string[] = selectedSlotCodes.length > 0 ? [...selectedSlotCodes] : []
    if (targetSlots.length === 0 && currentData.slotCode && !currentData.slotCode.includes(',')) {
      targetSlots = [currentData.slotCode]
    }

    if (targetSlots.length === 0) {
      if (selectedRack || receiveRack) {
        targetSlots = [`Rack ${selectedRack || receiveRack}`]
      } else if (receiveLane) {
        targetSlots = [`Lane ${receiveLane}`]
      } else if (receiveFloor) {
        targetSlots = [`Floor ${receiveFloor}`]
      } else {
        targetSlots = ['General Floor']
      }
    }

    const numSlots = targetSlots.length

    if (numSlots === 1) {
      const slotCode = targetSlots[0]
      const existingIdx = currentAllocations.findIndex((a) => a.slotCode === slotCode)
      if (existingIdx >= 0) {
        currentAllocations[existingIdx].quantity += qtyToAllocate
      } else {
        currentAllocations.push({ slotCode, quantity: qtyToAllocate })
      }
      showToast(`Registered ${qtyToAllocate} pcs to slot ${slotCode}`, 'success')
    } else {
      // Multiple slots: DIVIDE EQUALLY
      const equalShare = Math.floor(qtyToAllocate / numSlots)
      const remainder = qtyToAllocate % numSlots

      if (equalShare <= 0) {
        showToast(
          `Quantity ${qtyToAllocate} cannot be divided equally across ${numSlots} slots (minimum 1 per slot)`,
          'error'
        )
        return
      }

      targetSlots.forEach((slotCode) => {
        const existingIdx = currentAllocations.findIndex((a) => a.slotCode === slotCode)
        if (existingIdx >= 0) {
          currentAllocations[existingIdx].quantity += equalShare
        } else {
          currentAllocations.push({ slotCode, quantity: equalShare })
        }
      })

      const totalSplit = equalShare * numSlots
      if (remainder > 0) {
        showToast(
          `Divided ${totalSplit} pcs equally across ${numSlots} slots (${equalShare} pcs each). Remainder: ${remainder} pcs left to put into slot.`,
          'success'
        )
      } else {
        showToast(
          `Divided ${totalSplit} pcs equally across ${numSlots} slots (${equalShare} pcs each). 100% assigned!`,
          'success'
        )
      }
    }

    // Updated total allocated
    const newTotalAllocated = currentAllocations.reduce((sum, a) => sum + (a.quantity || 0), 0)
    const combinedSlotCodes = currentAllocations.map((a) => `${a.slotCode} (${a.quantity})`).join(', ')

    setItemCustomSlots((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        allocations: currentAllocations,
        slotCode: combinedSlotCodes,
        locationCode: combinedSlotCodes,
        locationPath: `Rack ${selectedRack || 'R1'} > Slots: ${combinedSlotCodes}`,
        rack: selectedRack || receiveRack,
        lane: receiveLane,
        floor: receiveFloor,
      },
    }))

    // Update receivingItemsMap to record that this item is assigned for receipt
    setReceivingItemsMap((prev) => ({
      ...prev,
      [itemId]: newTotalAllocated,
    }))

    // Set row assign input to whatever unassigned remainder is left from line's total pending units
    const lineTotalRemaining = Math.max(0, item.quantity - item.prevHandled)
    const newRemainder = Math.max(0, lineTotalRemaining - newTotalAllocated)
    setRowAssignQty((prev) => ({
      ...prev,
      [itemId]: newRemainder,
    }))
  }

  // Remove a specific slot allocation for an item
  const handleRemoveSlotAllocation = (itemId: string, slotCodeToRemove: string) => {
    const currentData = itemCustomSlots[itemId]
    if (!currentData || !currentData.allocations) return

    const updated = currentData.allocations.filter((a: any) => a.slotCode !== slotCodeToRemove)
    if (updated.length === 0) {
      setItemCustomSlots((prev) => {
        const copy = { ...prev }
        delete copy[itemId]
        return copy
      })
      setReceivingItemsMap((prev) => {
        const copy = { ...prev }
        delete copy[itemId]
        return copy
      })
    } else {
      const combinedSlotCodes = updated.map((a: any) => `${a.slotCode} (${a.quantity})`).join(', ')
      setItemCustomSlots((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          allocations: updated,
          slotCode: combinedSlotCodes,
          locationCode: combinedSlotCodes,
          locationPath: `Rack ${selectedRack || 'R1'} > Slots: ${combinedSlotCodes}`,
        },
      }))
      const newAlloc = updated.reduce((sum: number, a: any) => sum + (a.quantity || 0), 0)
      setReceivingItemsMap((prev) => ({
        ...prev,
        [itemId]: newAlloc,
      }))
    }

    // Recalculate remainder
    const items = getActiveInboundItems()
    const item = items.find((i) => i.id === itemId)
    const remaining = Math.max(0, (item?.quantity ?? 0) - (item?.prevHandled ?? 0))
    const newAllocated = updated.reduce((sum: number, a: any) => sum + (a.quantity || 0), 0)
    setRowAssignQty((prev) => ({
      ...prev,
      [itemId]: Math.max(0, remaining - newAllocated),
    }))
  }

  // Clear all slot allocations for an item
  const handleClearItemAllocations = (itemId: string) => {
    setItemCustomSlots((prev) => {
      const copy = { ...prev }
      delete copy[itemId]
      return copy
    })
    setReceivingItemsMap((prev) => {
      const copy = { ...prev }
      delete copy[itemId]
      return copy
    })
    const items = getActiveInboundItems()
    const item = items.find((i) => i.id === itemId)
    const remaining = Math.max(0, (item?.quantity ?? 0) - (item?.prevHandled ?? 0))
    setRowAssignQty((prev) => ({
      ...prev,
      [itemId]: remaining,
    }))
  }

  // Split selected slots equally across all items
  const handleEqualSplitAcrossItemsAndSlots = () => {
    const items = getActiveInboundItems()
    if (items.length === 0 || selectedSlotCodes.length === 0) {
      showToast('Please select at least 1 slot in the matrix above', 'error')
      return
    }

    const numSlots = selectedSlotCodes.length
    const newCustomSlots: Record<string, any> = { ...itemCustomSlots }
    const newRowAssign: Record<string, number> = {}

    items.forEach((item) => {
      const remaining = Math.max(0, item.quantity - item.prevHandled)
      const receiveNow = receivingItemsMap[item.id] ?? remaining
      if (receiveNow <= 0) return

      const equalShare = Math.floor(receiveNow / numSlots)
      const remainder = receiveNow % numSlots

      if (equalShare <= 0) return

      const allocations = selectedSlotCodes.map((code) => ({
        slotCode: code,
        quantity: equalShare,
      }))

      const combinedSlotCodes = allocations.map((a) => `${a.slotCode} (${a.quantity})`).join(', ')

      newCustomSlots[item.id] = {
        allocations,
        slotCode: combinedSlotCodes,
        locationCode: combinedSlotCodes,
        locationPath: `Rack ${selectedRack || 'R1'} > Slots: ${combinedSlotCodes}`,
        rack: selectedRack || receiveRack,
        lane: receiveLane,
        floor: receiveFloor,
      }
      newRowAssign[item.id] = remainder
    })

    setItemCustomSlots(newCustomSlots)
    setRowAssignQty((prev) => ({ ...prev, ...newRowAssign }))
    showToast(`Equally divided selected slots (${selectedSlotCodes.join(', ')}) across line items`, 'success')
  }

  // Open Receive PO Modal
  const handleOpenReceivePo = (po: PurchaseOrder) => {
    setSelectedPoToReceive(po)
    setSelectedContainerToReceive(null)
    // Prepopulate rowAssignQty with remaining pending quantities for quick 1-click assignment
    const initialMap: Record<string, number> = {}
    po.items.forEach((item) => {
      const rec = item.receivedQuantity ?? item.receivedQty ?? 0
      const remaining = Math.max(0, item.quantity - rec)
      initialMap[item.id] = remaining
    })
    // Start receivingItemsMap as EMPTY so ONLY explicitly assigned rows will be saved!
    setReceivingItemsMap({})
    setRowAssignQty(initialMap)
    setReceiveNotes(
      po.invoiceNumber ? `Received against Invoice #${po.invoiceNumber}` : `Received from PO ${po.poNumber}`
    )

    // Choose target warehouse: PO warehouse, or default CN warehouse, or default BY warehouse, or first available
    const defaultChinaWh =
      chinaWarehouses.find((w) => w.isDefaultProcurement || w.code === 'CN-YW') || chinaWarehouses[0]
    const defaultBelarusWh = belarusWarehouses.find((w) => w.code === 'BY-MS') || belarusWarehouses[0]

    let defaultWhId = po.warehouseId || ''
    if (!defaultWhId) {
      if (isChinaActive) defaultWhId = defaultChinaWh?.id || ''
      else if (isBelarusActive) defaultWhId = defaultBelarusWh?.id || ''
      else defaultWhId = defaultChinaWh?.id || warehouses[0]?.id || ''
    }
    setTargetWarehouseIdForPo(defaultWhId)

    // Reset location & slot selections
    setLocationMode('RACK')
    setSelectedRack('')
    setSelectedBay('')
    setSelectedLevel('')
    setSelectedSlotCodes([])
    setItemCustomSlots({})
    setReceiveLane('')
    setReceiveRack('')
    setReceiveFloor('')
  }

  // 1-Click fill 100% of remaining quantities
  const handleFillAllRemaining = () => {
    const items = getActiveInboundItems()
    if (items.length === 0) return
    const allMap: Record<string, number> = {}
    const newCustom: Record<string, any> = { ...itemCustomSlots }

    items.forEach((item) => {
      const remaining = Math.max(0, item.quantity - item.prevHandled)
      if (remaining <= 0) return
      allMap[item.id] = remaining

      const defaultLoc =
        selectedSlotCodes.length > 0
          ? selectedSlotCodes[0]
          : receiveRack
          ? `Rack ${receiveRack}`
          : receiveLane
          ? `Lane ${receiveLane}`
          : receiveFloor
          ? `Floor ${receiveFloor}`
          : 'General Floor'

      newCustom[item.id] = {
        allocations: [{ slotCode: defaultLoc, quantity: remaining }],
        slotCode: defaultLoc,
        locationCode: defaultLoc,
        locationPath: defaultLoc,
        rack: selectedRack || receiveRack,
        lane: receiveLane,
        floor: receiveFloor,
      }
    })
    setReceivingItemsMap(allMap)
    setItemCustomSlots(newCustom)
    showToast('Allocated 100% remaining quantities across all items', 'success')
  }

  // Submit Received PO Items
  const handleConfirmReceivePo = async () => {
    if (!selectedPoToReceive) return

    // Compute batch location strings
    let batchLocCode: string | undefined = undefined
    let batchLocPath: string | undefined = undefined

    if (selectedSlotCodes.length > 0) {
      batchLocCode = selectedSlotCodes.join(', ')
      const rackName = selectedRack || receiveRack || 'R1'
      batchLocPath = `Rack ${rackName} > Slots: ${selectedSlotCodes.join(', ')}`
    } else if (receiveLane || receiveRack || receiveFloor) {
      const partsCode: string[] = []
      const partsPath: string[] = []
      if (receiveLane) {
        partsCode.push(`L-${receiveLane}`)
        partsPath.push(`Lane ${receiveLane}`)
      }
      if (receiveRack) {
        partsCode.push(`R-${receiveRack}`)
        partsPath.push(`Rack ${receiveRack}`)
      }
      if (receiveFloor) {
        partsCode.push(`F-${receiveFloor}`)
        partsPath.push(`Floor ${receiveFloor}`)
      }
      batchLocCode = partsCode.join('/')
      batchLocPath = partsPath.join(' > ')
    }

    // Collect ONLY assigned / registered items with quantity > 0
    const itemsToSubmit = selectedPoToReceive.items
      .map((item) => {
        const itemCustom = itemCustomSlots[item.id]
        const allocations = itemCustom?.allocations || []
        const totalAllocated = allocations.reduce((sum: number, a: any) => sum + (a.quantity || 0), 0)
        const receiveQty = totalAllocated > 0 ? totalAllocated : (receivingItemsMap[item.id] || 0)

        // If this product was NOT assigned, do not submit it
        if (receiveQty <= 0) return null

        let locCode = itemCustom?.locationCode || itemCustom?.slotCode || batchLocCode
        let locPath = itemCustom?.locationPath || batchLocPath

        if (allocations.length > 0) {
          locCode = allocations.map((a: any) => `${a.slotCode} (${a.quantity})`).join(', ')
          locPath = `Rack ${selectedRack || itemCustom?.rack || 'R1'} > Slots: ${locCode}`
        }

        const resolvedSlotId =
          itemCustom?.slotId ||
          (allocations.length === 1
            ? warehouseModel.allSlots.find((s: any) => s.code === allocations[0]?.slotCode)?.id
            : undefined) ||
          (selectedSlotCodes.length === 1
            ? warehouseModel.allSlots.find((s: any) => s.code === selectedSlotCodes[0])?.id
            : undefined)

        return {
          id: item.id,
          receivedQuantity: receiveQty,
          lane: itemCustom?.lane || receiveLane.trim() || undefined,
          rack: itemCustom?.rack || receiveRack.trim() || undefined,
          floor: itemCustom?.floor || receiveFloor.trim() || undefined,
          locationCode: locCode,
          locationPath: locPath,
          slotId: resolvedSlotId,
        }
      })
      .filter(Boolean) as any[]

    if (itemsToSubmit.length === 0) {
      showToast('Please assign at least one product row to warehouse slots before confirming receipt', 'error')
      return
    }

    setReceivingSubmitting(true)
    try {
      const res = await fetch(`/api/admin/purchase-orders/${selectedPoToReceive.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToSubmit,
          warehouseId: targetWarehouseIdForPo || undefined,
          notes: receiveNotes,
          lane: receiveLane.trim() || undefined,
          rack: receiveRack.trim() || undefined,
          floor: receiveFloor.trim() || undefined,
          locationCode: batchLocCode,
          locationPath: batchLocPath,
        }),
      })
      const data = await res.json()

      if (data.success || data.purchaseOrder) {
        showToast(`Successfully registered ${itemsToSubmit.length} products into warehouse stock!`, 'success')
        setSelectedPoToReceive(null)
        // Refresh active views
        fetchPurchaseOrders()
        fetchStocks()
        if (activeTab === 'movements') fetchMovements()
      } else {
        showToast(data.error || 'Failed to record received items', 'error')
      }
    } catch {
      showToast('Error recording shipment receipt', 'error')
    } finally {
      setReceivingSubmitting(false)
    }
  }

  // Open modal to unload & receive container cargo
  const openReceiveContainerModal = (container: ContainerInfo) => {
    setSelectedContainerToReceive(container)
    const defWhId =
      container.destinationWarehouseId ||
      (isBelarusActive ? belarusWarehouses[0]?.id : displayedWarehouses[0]?.id) ||
      warehouses[0]?.id ||
      ''
    setContainerTargetWarehouseId(defWhId)

    const initialMap: Record<
      string,
      {
        receivedQty: number
        damagedQty: number
        rejectedQty: number
        qualityNotes: string
        slotId?: string | null
        locationCode?: string
        locationPath?: string
      }
    > = {}

    container.items.forEach((it) => {
      initialMap[it.id] = {
        receivedQty: it.quantity,
        damagedQty: 0,
        rejectedQty: 0,
        qualityNotes: '',
        slotId: null,
        locationCode: '',
        locationPath: '',
      }
    })

    const initialRowAssign: Record<string, number> = {}
    container.items.forEach((it) => {
      const prevHandled = (it.receivedQty || 0) + (it.damagedQty || 0) + (it.rejectedQty || 0)
      const remainingQty = Math.max(0, it.quantity - prevHandled)
      initialRowAssign[it.id] = remainingQty
    })

    setContainerItemSlots(initialMap)
    setContainerBatchLocationCode('')
    setSelectedSlotCodes([])
    setItemCustomSlots({})
    setReceivingItemsMap({})
    setRowAssignQty(initialRowAssign)
    setItemDamagedQty({})
    setItemDamagedNotes({})
    setShowDamagedInput({})
    setReceiveNotes('')
    setReceiveLane('')
    setReceiveRack('')
    setReceiveFloor('')
    setLocationMode('RACK')

    const initialShelvedLocs: Record<string, Array<{ slotCode: string; quantity: number }>> = {}
    container.items.forEach((it) => {
      const rec = it.receivedQty || 0
      if (rec > 0) {
        const pId = it.product?.id || (it as any).productId
        const matchingStock = stocks.find(
          (s) =>
            (s.productId === pId || s.product?.id === pId) &&
            (!defWhId || s.warehouseId === defWhId)
        )
        const code = matchingStock?.locationPath || matchingStock?.locationCode || matchingStock?.slot?.code
        if (code) {
          initialShelvedLocs[it.id] = [{ slotCode: code, quantity: rec }]
        } else {
          initialShelvedLocs[it.id] = [{ slotCode: 'General DC Floor', quantity: rec }]
        }
      }
    })
    setContainerItemShelvedLocations(initialShelvedLocs)

    if (stocks.length === 0) fetchStocks()
    if (movements.length === 0) fetchMovements()

    if (defWhId && !warehouseLayoutCache[defWhId]) {
      fetchWarehouseLayoutForStock(defWhId)
    }
  }

  // Active computed shelving coordinate for container receive
  const computedSelectedContainerShelf = useMemo(() => {
    if (selectedSlotCodes.length > 0) {
      const first = selectedSlotCodes[0]
      const parsed = parseSlotCoord(first)
      return {
        code: first,
        path: parsed.fullLabel || `Slot ${first}`,
      }
    }
    if (locationMode === 'RACK') {
      const r = selectedRack || currentRackObj?.code || 'R1'
      const b = selectedBay ? String(parseInt(selectedBay, 10)).padStart(2, '0') : '01'
      const l = selectedLevel ? String(parseInt(selectedLevel, 10)).padStart(2, '0') : '01'
      return {
        code: `${r}-${b}-${l}`,
        path: `Rack ${r} > Bay ${b} > Level ${l}`,
      }
    }
    if (locationMode === 'FLOOR') {
      const fb = currentFloorObj?.code || 'FL-01'
      return {
        code: `${fb}-A1`,
        path: `Floor Bay ${fb} > Slot ${fb}-A1`,
      }
    }
    if (locationMode === 'LANE') {
      const ln = receiveLane || currentLaneObj?.code || warehouseModel.lanes[0]?.code || 'BL-01'
      return {
        code: ln,
        path: `Bulk Staging Lane ${ln}`,
        isMulti: false,
      }
    }
    // CUSTOM
    const parts = [receiveLane, receiveRack, receiveFloor].filter(Boolean)
    const code = parts.join('-') || 'GEN-01'
    return {
      code,
      path: `Custom Location ${code}`,
      isMulti: false,
    }
  }, [
    selectedSlotCodes,
    locationMode,
    selectedRack,
    selectedBay,
    selectedLevel,
    receiveFloor,
    receiveLane,
    receiveRack,
    warehouseModel,
  ])

  // Assign slot to single container line item
  const handleAssignSlotToContainerItem = (itemId: string, slotCodeOverride?: string) => {
    const code = slotCodeOverride || selectedSlotCodes[0] || computedSelectedContainerShelf.code
    if (!code) {
      showToast('Please select a shelf slot coordinate first', 'error')
      return
    }

    const resolvedSlotId = warehouseModel.allSlots.find((s: any) => s.code === code)?.id || null
    const path = computedSelectedContainerShelf.path || `Slot ${code}`

    setContainerItemSlots((prev) => {
      const currentItem = selectedContainerToReceive?.items.find((it) => it.id === itemId)
      const prevHandled = ((currentItem?.receivedQty || 0) + (currentItem?.damagedQty || 0) + (currentItem?.rejectedQty || 0))
      const remainingQty = currentItem ? Math.max(0, currentItem.quantity - prevHandled) : 0

      return {
        ...prev,
        [itemId]: {
          ...(prev[itemId] || {
            receivedQty: remainingQty,
            damagedQty: 0,
            rejectedQty: 0,
            qualityNotes: '',
          }),
          slotId: resolvedSlotId,
          locationCode: code,
          locationPath: path,
        },
      }
    })
    showToast(`Assigned shelf slot "${code}" to product`, 'success')
  }

  // Remove slot from single container line item
  const handleRemoveSlotFromContainerItem = (itemId: string) => {
    setContainerItemSlots((prev) => {
      if (!prev[itemId]) return prev
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          slotId: null,
          locationCode: '',
          locationPath: '',
        },
      }
    })
  }

  // Batch quick-apply currently selected slot to all active lines
  const handleApplySelectedSlotToAllContainerItems = () => {
    const code = selectedSlotCodes[0] || computedSelectedContainerShelf.code
    if (!code) {
      showToast('Please select or specify a shelf slot coordinate first', 'error')
      return
    }
    if (!selectedContainerToReceive) return

    const resolvedSlotId = warehouseModel.allSlots.find((s: any) => s.code === code)?.id || null
    const path = computedSelectedContainerShelf.path || `Slot ${code}`

    setContainerItemSlots((prev) => {
      const copy = { ...prev }
      selectedContainerToReceive.items.forEach((it) => {
        const prevHandled = (it.receivedQty || 0) + (it.damagedQty || 0) + (it.rejectedQty || 0)
        const remainingQty = Math.max(0, it.quantity - prevHandled)
        if (remainingQty === 0) return // Skip already finished lines

        copy[it.id] = {
          ...(copy[it.id] || {
            receivedQty: remainingQty,
            damagedQty: 0,
            rejectedQty: 0,
            qualityNotes: '',
          }),
          slotId: resolvedSlotId,
          locationCode: code,
          locationPath: path,
        }
      })
      return copy
    })
    showToast(`Assigned shelf slot "${code}" to pending cargo lines`, 'success')
  }

  // Distribute selected slots 1 per line item
  const handleDistributeSlotsAcrossContainerItems = () => {
    if (!selectedContainerToReceive || selectedSlotCodes.length === 0) {
      showToast('Please select at least 1 slot from the grid first', 'error')
      return
    }
    setContainerItemSlots((prev) => {
      const copy = { ...prev }
      const pendingItems = selectedContainerToReceive.items.filter((it) => {
        const prevHandled = (it.receivedQty || 0) + (it.damagedQty || 0) + (it.rejectedQty || 0)
        return it.quantity - prevHandled > 0
      })

      pendingItems.forEach((it, idx) => {
        const prevHandled = (it.receivedQty || 0) + (it.damagedQty || 0) + (it.rejectedQty || 0)
        const remainingQty = Math.max(0, it.quantity - prevHandled)
        const slotCode = selectedSlotCodes[idx % selectedSlotCodes.length]
        const resolvedSlotId = warehouseModel.allSlots.find((s: any) => s.code === slotCode)?.id || null
        copy[it.id] = {
          ...(copy[it.id] || {
            receivedQty: remainingQty,
            damagedQty: 0,
            rejectedQty: 0,
            qualityNotes: '',
          }),
          slotId: resolvedSlotId,
          locationCode: slotCode,
          locationPath: `Slot ${slotCode}`,
        }
      })
      return copy
    })
    showToast(`Distributed ${selectedSlotCodes.length} slot(s) across pending line items`, 'success')
  }

  // Handle Unload Container form submission
  const handleReceiveContainerSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedContainerToReceive) return

    let batchLocCode: string | undefined = undefined
    let batchLocPath: string | undefined = undefined

    if (selectedSlotCodes.length > 0) {
      batchLocCode = selectedSlotCodes.join(', ')
      const rackName = selectedRack || receiveRack || 'R1'
      batchLocPath = `Rack ${rackName} > Slots: ${selectedSlotCodes.join(', ')}`
    } else if (receiveLane || receiveRack || receiveFloor) {
      const partsCode: string[] = []
      const partsPath: string[] = []
      if (receiveLane) {
        partsCode.push(`L-${receiveLane}`)
        partsPath.push(`Lane ${receiveLane}`)
      }
      if (receiveRack) {
        partsCode.push(`R-${receiveRack}`)
        partsPath.push(`Rack ${receiveRack}`)
      }
      if (receiveFloor) {
        partsCode.push(`F-${receiveFloor}`)
        partsPath.push(`Floor ${receiveFloor}`)
      }
      batchLocCode = partsCode.join('/')
      batchLocPath = partsPath.join(' > ')
    }

    // Collect assigned items (sound quantity > 0 OR damaged quantity > 0)
    const itemsToSubmit = selectedContainerToReceive.items
      .map((item) => {
        const itemCustom = itemCustomSlots[item.id]
        const allocations = itemCustom?.allocations || []
        const totalAllocated = allocations.reduce((sum: number, a: any) => sum + (a.quantity || 0), 0)
        const unloadQty = totalAllocated > 0 ? totalAllocated : (receivingItemsMap[item.id] || 0)
        const damagedQty = itemDamagedQty[item.id] || 0
        const itemNotes = itemDamagedNotes[item.id] || receiveNotes || null

        // If this product was NOT assigned sound units AND has no damaged units, do not submit it
        if (unloadQty <= 0 && damagedQty <= 0) return null

        let locCode = itemCustom?.locationCode || itemCustom?.slotCode || batchLocCode
        let locPath = itemCustom?.locationPath || batchLocPath

        if (allocations.length > 0) {
          locCode = allocations.map((a: any) => `${a.slotCode} (${a.quantity})`).join(', ')
          locPath = `Rack ${selectedRack || itemCustom?.rack || 'R1'} > Slots: ${locCode}`
        }

        const resolvedSlotId =
          itemCustom?.slotId ||
          (allocations.length === 1
            ? warehouseModel.allSlots.find((s: any) => s.code === allocations[0]?.slotCode)?.id
            : undefined) ||
          (selectedSlotCodes.length === 1
            ? warehouseModel.allSlots.find((s: any) => s.code === selectedSlotCodes[0])?.id
            : undefined)

        return {
          itemId: item.id,
          productName: item.product.name,
          receivedQty: unloadQty,
          damagedQty: damagedQty,
          rejectedQty: 0,
          qualityNotes: itemNotes,
          slotId: resolvedSlotId || null,
          locationCode: locCode || null,
          locationPath: locPath || (locCode ? `Slot ${locCode}` : null),
        }
      })
      .filter(Boolean) as {
        itemId: string
        productName: string
        receivedQty: number
        damagedQty: number
        rejectedQty: number
        qualityNotes: string | null
        slotId: string | null
        locationCode: string | null
        locationPath: string | null
      }[]

    if (itemsToSubmit.length === 0) {
      showToast('Please assign shelving slots or designate damaged units before confirming unload', 'error')
      return
    }

    const missingShelf = itemsToSubmit.find((it) => it.receivedQty > 0 && !it.locationCode && !it.slotId && !it.locationPath)
    if (missingShelf) {
      showToast(`Please assign a shelf location (RACK, FLOOR, or LANE) for "${missingShelf.productName}".`, 'error')
      return
    }

    setContainerSubmitting(true)
    try {
      const res = await fetch(`/api/admin/containers/${selectedContainerToReceive.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: containerTargetWarehouseId || undefined,
          items: itemsToSubmit,
        }),
      })

      const data = await res.json()
      if (data.success) {
        // Refresh containers, stocks, and movements in background
        fetchContainers()
        fetchStocks()
        if (activeTab === 'movements') fetchMovements()

        if (data.data?.isFullyUnloaded) {
          showToast(
            data.data?.message || `Container ${selectedContainerToReceive.containerNumber} fully unloaded and completed!`,
            'success'
          )
          setSelectedContainerToReceive(null)
        } else {
          // PARTIAL UNLOAD: Keep form open till all products are defined and unloaded!
          const updatedItems = selectedContainerToReceive.items.map((it) => {
            const submitted = itemsToSubmit.find((s) => s.itemId === it.id)
            if (submitted) {
              const prevRec = it.receivedQty || 0
              const prevDam = it.damagedQty || 0
              return {
                ...it,
                receivedQty: prevRec + submitted.receivedQty,
                damagedQty: prevDam + (submitted.damagedQty || 0),
              }
            }
            return it
          })

          const updatedContainer = {
            ...selectedContainerToReceive,
            status: data.data?.status || 'ARRIVED',
            items: updatedItems,
          }

          setSelectedContainerToReceive(updatedContainer)

          // Set default row assign input to remaining sound quantities
          const nextRowAssign: Record<string, number> = {}
          updatedItems.forEach((it) => {
            const prevHandled = (it.receivedQty || 0) + (it.damagedQty || 0) + (it.rejectedQty || 0)
            const rem = Math.max(0, it.quantity - prevHandled)
            nextRowAssign[it.id] = rem
          })

          // Append newly shelved locations into containerItemShelvedLocations
          setContainerItemShelvedLocations((prev) => {
            const next = { ...prev }
            itemsToSubmit.forEach((s) => {
              if (s.receivedQty > 0) {
                const itemCustom = itemCustomSlots[s.itemId]
                const allocs = itemCustom?.allocations || []
                if (allocs.length > 0) {
                  next[s.itemId] = [...(next[s.itemId] || []), ...allocs]
                } else if (s.locationCode || s.locationPath) {
                  next[s.itemId] = [
                    ...(next[s.itemId] || []),
                    { slotCode: s.locationCode || s.locationPath || 'General Floor', quantity: s.receivedQty },
                  ]
                }
              }
            })
            return next
          })

          setItemCustomSlots({})
          setReceivingItemsMap({})
          setRowAssignQty(nextRowAssign)
          setItemDamagedQty({})
          setItemDamagedNotes({})
          setShowDamagedInput({})
          setSelectedSlotCodes([])

          const totalShelvedBatch = itemsToSubmit.reduce((sum, i) => sum + (i.receivedQty || 0), 0)
          const totalDamagedBatch = itemsToSubmit.reduce((sum, i) => sum + (i.damagedQty || 0), 0)
          showToast(
            `Shelved ${totalShelvedBatch} pcs${totalDamagedBatch > 0 ? ` (${totalDamagedBatch} marked damaged)` : ''} into warehouse! Remaining products ready to define and shelve below.`,
            'success'
          )
        }
      } else {
        showToast(data.error || 'Failed to unload container into warehouse', 'error')
      }
    } catch {
      showToast('Error unloading container into warehouse', 'error')
    } finally {
      setContainerSubmitting(false)
    }
  }

  // Quick Standalone Stock Intake Submission
  const handleDirectIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!intakeProductId) {
      showToast('Please select a product', 'error')
      return
    }
    if (!intakeQuantity || intakeQuantity === 0) {
      showToast('Quantity cannot be zero', 'error')
      return
    }

    setIntakeSubmitting(true)
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: intakeProductId,
          warehouseId: intakeWarehouseId || undefined,
          quantity: Number(intakeQuantity),
          type: intakeType,
          unitCost: intakeUnitCost ? parseFloat(intakeUnitCost) : undefined,
          reason: intakeReason || `Manual intake to ${selectedWarehouse?.name || 'hub'}`,
          lane: intakeLane.trim() || undefined,
          rack: intakeRack.trim() || undefined,
          floor: intakeFloor.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        showToast('Inventory updated and logged successfully', 'success')
        setIsIntakeModalOpen(false)
        setIntakeProductId('')
        setIntakeQuantity(1)
        setIntakeUnitCost('')
        setIntakeReason('')
        setIntakeLane('')
        setIntakeRack('')
        setIntakeFloor('')
        fetchStocks()
        if (activeTab === 'movements') fetchMovements()
      } else {
        showToast(data.error || 'Failed to update inventory', 'error')
      }
    } catch {
      showToast('Network error during inventory intake', 'error')
    } finally {
      setIntakeSubmitting(false)
    }
  }

  // Summary Metrics calculated from strictly filtered dataset
  const totalStockUnits = filteredStocks.reduce((acc, s) => acc + s.quantity, 0)
  const totalStockValue = filteredStocks.reduce((acc, s) => acc + s.quantity * (s.avgCost || s.product?.costPrice || 0), 0)
  const lowStockCount = filteredStocks.filter((s) => s.isLowStock || s.quantity <= (s.reorderPoint || 10)).length
  const pendingInboundCount = filteredPurchaseOrders.filter((po) => ['CONFIRMED', 'SHIPPED', 'PARTIALLY_RECEIVED'].includes(po.status)).length
  const pendingContainersCount = filteredContainers.length
  const totalActiveInbound = isBelarusActive ? pendingContainersCount : pendingInboundCount

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-red-600 text-white shadow-red-600/20'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isChinaActive
                ? '🇨🇳 China Warehouse - Inventory & Logistics Hub'
                : isBelarusActive
                ? '🇧🇾 Belarus Warehouse - Distribution Center'
                : 'Inventory & Inbound Intake'}
            </h1>
            {isChinaActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                {selectedWarehouse ? `${selectedWarehouse.name} (${selectedWarehouse.code})` : 'China Central Facilities (CN)'}
              </span>
            ) : isBelarusActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                {selectedWarehouse ? `${selectedWarehouse.name} (${selectedWarehouse.code})` : 'Belarus Facilities (BY)'}
              </span>
            ) : selectedWarehouse ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                <MapPin className="w-3.5 h-3.5" />
                {selectedWarehouse.name} ({selectedWarehouse.code})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                All Facilities
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {isChinaActive
              ? 'Real-time hub balances, shelving coordinates, and cargo management for China facilities.'
              : isBelarusActive
              ? 'Real-time hub balances, shelving coordinates, and cargo management for Belarus facilities.'
              : 'Monitor real-time hub balances, filter purchased supplier invoices, and register incoming container & parcel shipments.'}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'stocks') fetchStocks()
              else if (activeTab === 'inbound') {
                fetchPurchaseOrders()
                fetchContainers()
              } else fetchMovements()
            }}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${stocksLoading || poLoading || movementsLoading || containersLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              const defaultWh =
                selectedWarehouse ||
                (isChinaActive
                  ? chinaWarehouses[0]
                  : isBelarusActive
                  ? belarusWarehouses[0]
                  : warehouses[0])
              setIntakeWarehouseId(defaultWh ? defaultWh.id : '')
              setIsIntakeModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Direct Intake / Adjustment</span>
          </button>
        </div>
      </div>

      {/* Warehouse Facility Selector Bar - Strictly Isolated by Country */}
      <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        {isChinaActive ? (
          /* China Warehouse Facility Header & Hub Switcher (No other countries shown) */
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🇨🇳</span>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>China Warehouse Facilities</span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {chinaWarehouses.length} Active Hub{chinaWarehouses.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Switch between facilities in China or view combined China balances
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleWarehouseChange('cn')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentWarehouseParam.toLowerCase() === 'cn'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All China Facilities (CN)
              </button>

              {chinaWarehouses.map((wh) => {
                const isSpecificSelected =
                  currentWarehouseParam.toLowerCase() === wh.code.toLowerCase() ||
                  currentWarehouseParam === wh.id

                return (
                  <button
                    key={wh.id}
                    onClick={() => handleWarehouseChange(wh.code.toLowerCase())}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSpecificSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{wh.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSpecificSelected ? 'bg-blue-700/50 text-blue-100' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {wh.code}
                    </span>
                    {wh.isDefaultProcurement && (
                      <span
                        className={`text-[9px] px-1 rounded ${
                          isSpecificSelected ? 'bg-emerald-500/80 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        Procure Hub
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ) : isBelarusActive ? (
          /* Belarus Warehouse Facility Header & Hub Switcher (No other countries shown) */
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🇧🇾</span>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Belarus Warehouse Facilities</span>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {belarusWarehouses.length} Active Hub{belarusWarehouses.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Switch between facilities in Belarus or view combined Belarus balances
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleWarehouseChange('by')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentWarehouseParam.toLowerCase() === 'by'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Belarus Facilities (BY)
              </button>

              {belarusWarehouses.map((wh) => {
                const isSpecificSelected =
                  currentWarehouseParam.toLowerCase() === wh.code.toLowerCase() ||
                  currentWarehouseParam === wh.id

                return (
                  <button
                    key={wh.id}
                    onClick={() => handleWarehouseChange(wh.code.toLowerCase())}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSpecificSelected
                        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{wh.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSpecificSelected ? 'bg-amber-700/50 text-amber-100' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {wh.code}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* General Global View when no specific warehouse country is chosen */
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Country Facility Selection:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleWarehouseChange('cn')}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <span>🇨🇳 China Warehouses</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-slate-200 text-slate-600">
                    {chinaWarehouses.length}
                  </span>
                </button>

                <button
                  onClick={() => handleWarehouseChange('by')}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <span>🇧🇾 Belarus Warehouses</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-slate-200 text-slate-600">
                    {belarusWarehouses.length}
                  </span>
                </button>

                <button
                  onClick={() => handleWarehouseChange('')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-white shadow-sm"
                >
                  🌐 All Facilities ({warehouses.length})
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold mr-1">All Active Facilities:</span>
              {warehouses.map((wh) => (
                <button
                  key={wh.id}
                  onClick={() => handleWarehouseChange(wh.code.toLowerCase())}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <span>{wh.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-200 text-slate-600">
                    {wh.code}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">On-Hand Units</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalStockUnits.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <span>Across {filteredStocks.length} SKU line items</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Stock Valuation</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">Based on weighted average unit cost</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Low Stock Alerts</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
          <div className="mt-1 text-xs text-slate-500">Items under facility reorder threshold</div>
        </div>

        <div
          onClick={() => handleTabChange('inbound')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase group-hover:text-blue-600 transition-colors">
              {isBelarusActive ? 'Inbound Freight Containers' : 'Inbound Purchases & Cargo'}
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100">
              {isBelarusActive ? <Ship className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {isBelarusActive ? `${filteredContainers.length} Containers` : `${pendingInboundCount} Active`}
          </div>
          <div className="mt-1 text-xs text-blue-600 font-medium flex items-center gap-1">
            <span>
              {isBelarusActive
                ? `${filteredContainers.length} container${filteredContainers.length === 1 ? '' : 's'} awaiting unload`
                : 'Click to register received cargo'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="border-b border-slate-100 flex flex-wrap items-center justify-between px-6 pt-3">
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleTabChange('stocks')}
              className={`pb-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'stocks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Warehouse Stock Balances</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
                {filteredStocks.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('inbound')}
              className={`pb-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'inbound'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {isBelarusActive ? <Ship className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
              <span>{isBelarusActive ? 'Inbound Containers & Cargo' : 'Inbound Purchases & Cargo'}</span>
              {(isBelarusActive ? filteredContainers.length : pendingInboundCount) > 0 && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  {isBelarusActive
                    ? `${filteredContainers.length} container${filteredContainers.length === 1 ? '' : 's'}`
                    : `${pendingInboundCount} awaiting intake`}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('movements')}
              className={`pb-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'movements'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Stock Movement Audit Ledger</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
                {filteredMovements.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('shelves')}
              className={`pb-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'shelves'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Shelves &amp; Rack Structures</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
                {shelvesWarehouseModel.racks.length + shelvesWarehouseModel.floors.length + shelvesWarehouseModel.lanes.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: Warehouse Stock Balances */}
        {activeTab === 'stocks' && (
          <div className="p-6">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Search by product name, SKU, or slot code..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="flex items-center gap-2 text-sm text-slate-600 select-none cursor-pointer bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200/80 transition">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Low Stock Warnings Only</span>
                </label>
              </div>
            </div>

            {/* Stocks Table */}
            {stocksLoading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Loading warehouse inventory balances...</p>
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No inventory records found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  {currentWarehouseParam
                    ? `There are currently no items tracked for ${selectedWarehouse?.name || currentWarehouseParam}.`
                    : 'No inventory items match your current search criteria.'}
                </p>
                <button
                  onClick={() => setIsIntakeModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  Register First Product
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-3.5 w-12 text-center rounded-l-xl">#</th>
                      <th className="py-3 px-4">Product / SKU</th>
                      <th className="py-3 px-4">Warehouse Hub</th>
                      <th className="py-3 px-4">Slot Location</th>
                      <th className="py-3 px-4 text-right">Physical On-Hand</th>
                      <th className="py-3 px-4 text-right">Allocated / Reserved</th>
                      <th className="py-3 px-4 text-right">Available Qty</th>
                      <th className="py-3 px-4 text-right">Weighted Avg Cost</th>
                      <th className="py-3 px-4 text-center rounded-r-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredStocks.map((item, index) => {
                      const isExpanded = Boolean(expandedStockSlots[item.id])
                      const slotDisplay = item.locationPath || item.locationCode || item.slot?.code || ''
                      const parsedCoord = parseSlotCoord(slotDisplay)

                      return (
                        <React.Fragment key={item.id}>
                          <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-blue-50/20' : ''}`}>
                            <td className="py-3.5 px-3.5 text-center text-xs font-mono font-medium text-slate-400">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900">{item.product.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {item.product.sku}
                                </span>
                                {item.isLowStock && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    <AlertTriangle className="w-3 h-3" /> Low Stock
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-800">{item.warehouse.name}</div>
                              <div className="text-xs text-slate-400 font-mono">{item.warehouse.code} • {item.warehouse.country}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              {slotDisplay ? (
                                <button
                                  type="button"
                                  onClick={() => toggleStockStructure(item.id, item.warehouseId)}
                                  className="group inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-all text-left shadow-2xs"
                                  title="Click to view full Rack / Floor structure and colorized slot"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                  <span className="font-mono font-bold">
                                    {parsedCoord.fullLabel || slotDisplay}
                                  </span>
                                  <span className="text-emerald-600 ml-0.5">
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">General Floor</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold text-slate-900 font-mono">
                              {item.quantity.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                              {item.reservedQty.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono">
                              <span
                                className={`font-semibold ${
                                  item.availableQty > 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                {item.availableQty.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                              ${(item.avgCost || item.product.costPrice || 0).toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleStockStructure(item.id, item.warehouseId)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                                    isExpanded
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                      : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200'
                                  }`}
                                  title={`View physical ${
                                    slotDisplay.toUpperCase().includes('FL-') || slotDisplay.toUpperCase().includes('FLOOR')
                                      ? 'floor staging'
                                      : slotDisplay.toUpperCase().includes('BL-') || slotDisplay.toUpperCase().includes('LANE')
                                      ? 'storage lane'
                                      : 'shelf rack'
                                  } structure and slot location`}
                                >
                                  <Grid className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-600" />
                                  <span>
                                    {isExpanded
                                      ? `Hide ${
                                          slotDisplay.toUpperCase().includes('FL-') || slotDisplay.toUpperCase().includes('FLOOR')
                                            ? 'Floor'
                                            : slotDisplay.toUpperCase().includes('BL-') || slotDisplay.toUpperCase().includes('LANE')
                                            ? 'Lane'
                                            : 'Rack'
                                        }`
                                      : `View ${
                                          slotDisplay.toUpperCase().includes('FL-') || slotDisplay.toUpperCase().includes('FLOOR')
                                            ? 'Floor'
                                            : slotDisplay.toUpperCase().includes('BL-') || slotDisplay.toUpperCase().includes('LANE')
                                            ? 'Lane'
                                            : 'Rack'
                                        }`}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openRelocateModal(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-300 rounded-lg transition"
                                  title="Move this stock to another shelf, bay, floor, or lane"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Move Shelf</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setIntakeProductId(item.product.id)
                                    setIntakeWarehouseId(item.warehouseId)
                                    setIsIntakeModalOpen(true)
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  Adjust / Intake
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDABLE PHYSICAL SHELF & RACK STRUCTURE */}
                          {isExpanded && (
                            <tr key={`${item.id}-structure-row`} className="bg-slate-50/50">
                              <td colSpan={9} className="p-3 sm:p-4">
                                <StockStructureCard
                                  item={item}
                                  layout={warehouseLayoutCache[item.warehouseId]}
                                  isLoading={Boolean(loadingLayouts[item.warehouseId])}
                                  activeStructureTab={stockStructureActiveTab[item.id]}
                                  onSelectStructureTab={(tab) =>
                                    setStockStructureActiveTab((prev) => ({ ...prev, [item.id]: tab }))
                                  }
                                  onClose={() => toggleStockStructure(item.id, item.warehouseId)}
                                  onRelocate={openRelocateModal}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Inbound Purchased Invoices & POs / Containers */}
        {activeTab === 'inbound' && (
          <div className="p-6">
            {/* Inbound Intake Channel Switcher: Purchase Orders vs Containers */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setInboundSource('pos')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    inboundSource === 'pos'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Inbound Purchase Orders</span>
                  <span className="text-[11px] px-2 py-0.2 rounded-full font-mono bg-blue-50 text-blue-700 font-bold border border-blue-100">
                    {filteredPurchaseOrders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInboundSource('containers')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    inboundSource === 'containers'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Ship className="w-4 h-4 text-blue-600" />
                  <span>Inbound From Containers</span>
                  <span className="text-[11px] px-2 py-0.2 rounded-full font-mono bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                    {filteredContainers.length}
                  </span>
                </button>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">Intake Channel:</span>
                <span>
                  {inboundSource === 'containers'
                    ? `Showing freight containers arriving into ${selectedWarehouse?.name || (isBelarusActive ? 'Belarus' : 'active hub')} (unloaded containers excluded)`
                    : `Showing direct purchase invoices arriving into ${selectedWarehouse?.name || 'active hub'}`}
                </span>
              </div>
            </div>

            {/* CHANNEL 1: Inbound Purchase Orders */}
            {inboundSource === 'pos' && (
              <>
                <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                  type="text"
                  value={poSearch}
                  onChange={(e) => setPoSearch(e.target.value)}
                  placeholder="Search invoice #, PO #, or supplier..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Status Filter */}
                <select
                  value={poStatusFilter}
                  onChange={(e) => setPoStatusFilter(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL_INBOUND">Inbound Pending (Confirmed / Shipped / Partial)</option>
                  <option value="CONFIRMED">Confirmed by Supplier</option>
                  <option value="SHIPPED">Shipped / In Transit</option>
                  <option value="PARTIALLY_RECEIVED">Partially Received</option>
                  <option value="RECEIVED">Fully Received / Closed</option>
                  <option value="ALL">All PO Records</option>
                </select>

                {/* Paid Filter */}
                <select
                  value={poPaidFilter}
                  onChange={(e) => setPoPaidFilter(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">All Invoices</option>
                  <option value="PAID">Paid Invoices Only</option>
                  <option value="UNPAID">Unpaid Invoices</option>
                </select>
              </div>
            </div>

            {/* PO List */}
            {poLoading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Searching inbound purchase invoices...</p>
              </div>
            ) : filteredPurchaseOrders.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No matching purchase invoices found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Try adjusting status or payment filters, or register a direct product intake manually.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPurchaseOrders.map((po, poIndex) => {
                  const totalOrdered = po.items.reduce((acc, i) => acc + (i.quantity || 0), 0)
                  const totalReceived = po.items.reduce(
                    (acc, i) => acc + (i.receivedQuantity ?? i.receivedQty ?? 0),
                    0
                  )
                  const percentReceived = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0
                  const isFullyReceived = totalOrdered > 0 ? totalReceived >= totalOrdered : po.status === 'RECEIVED'
                  const isPartiallyReceived = totalReceived > 0 && !isFullyReceived
                  const displayStatus = isFullyReceived
                    ? 'RECEIVED'
                    : isPartiallyReceived
                    ? 'PARTIALLY_RECEIVED'
                    : po.status

                  return (
                    <div
                      key={po.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="inline-flex items-center justify-center font-mono text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                #{poIndex + 1}
                              </span>
                              <span className="font-bold text-slate-900 text-base font-mono">{po.poNumber}</span>
                              {po.invoiceNumber && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                                  Invoice: #{po.invoiceNumber}
                                </span>
                              )}
                              <span
                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                  displayStatus === 'RECEIVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : displayStatus === 'PARTIALLY_RECEIVED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : displayStatus === 'SHIPPED'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {displayStatus === 'PARTIALLY_RECEIVED'
                                  ? 'PARTIALLY RECEIVED'
                                  : displayStatus}
                              </span>

                              {/* Shelved Slots Quick View Toggle */}
                              {totalReceived > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedPoSlots((prev) => ({
                                      ...prev,
                                      [po.id]: !prev[po.id],
                                    }))
                                  }
                                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                                    expandedPoSlots[po.id]
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                                  }`}
                                  title="View all warehouse shelves, racks & slots where this order is stored"
                                >
                                  <Grid className="w-3.5 h-3.5" />
                                  <span>{expandedPoSlots[po.id] ? 'Hide Shelving Matrix' : 'View Shelving Matrix'}</span>
                                  {expandedPoSlots[po.id] ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <strong className="text-slate-700">{po.supplier.name}</strong>
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                Created: {new Date(po.createdAt).toLocaleDateString()}
                              </span>
                              {po.warehouse && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  Target: {po.warehouse.name} ({po.warehouse.code})
                                </span>
                              )}
                              {po.trackingNumber && (
                                <span className="flex items-center gap-1 font-mono text-slate-600">
                                  <Barcode className="w-3.5 h-3.5" />
                                  Tracking: {po.trackingNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action and Amount */}
                        <div className="flex items-center gap-4 lg:self-center justify-between lg:justify-end">
                          <div className="text-right">
                            <div className="text-base font-bold text-slate-900 font-mono">
                              ${(po.totalAmount ?? po.subtotal ?? po.items?.reduce((acc, i) => acc + ((i.unitPrice ?? i.unitCost ?? 0) * (i.quantity || 0)), 0) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-slate-500">
                              {totalReceived} of {totalOrdered} items received ({percentReceived}%)
                            </div>
                          </div>

                          {!isFullyReceived ? (
                            <button
                              onClick={() => handleOpenReceivePo(po)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-emerald-600/20"
                            >
                              <Inbox className="w-4 h-4" />
                              <span>{isPartiallyReceived ? 'Receive Remaining' : 'Receive into Hub'}</span>
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200">
                              <Check className="w-4 h-4" />
                              <span>Receipt Complete</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PO-LEVEL EXPANDABLE SHELVING MATRIX: Shows all racks, bays & levels for this entire order */}
                      {expandedPoSlots[po.id] && (() => {
                        // Gather all allocated slots across all line items in this PO
                        const allPoSlots: Array<{ code: string; quantity: number; productName: string }> = []
                        po.items.forEach((line) => {
                          const lineRecv = line.receivedQuantity ?? line.receivedQty ?? 0
                          if (lineRecv <= 0) return
                          const matchingStocks = line.product?.warehouseStocks || []
                          const targetStock =
                            (po.destinationWarehouseId
                              ? matchingStocks.find((s) => s.warehouseId === po.destinationWarehouseId)
                              : null) ||
                            matchingStocks.find((s) => s.locationCode || s.locationPath || s.slot?.code) ||
                            matchingStocks[0]
                          const code = targetStock?.locationPath || targetStock?.locationCode || targetStock?.slot?.code
                          if (code) {
                            allPoSlots.push({
                              code,
                              quantity: lineRecv,
                              productName: line.product?.name || line.productName || 'Item',
                            })
                          }
                        })

                        const rackGroups = groupSlotsByStructure(allPoSlots)

                        return (
                          <div className="mt-4 p-4 bg-slate-50/90 border border-blue-200/80 rounded-xl animate-in fade-in duration-200">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                              <div className="flex items-center gap-2">
                                <Grid className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                  All Shelving &amp; Slot Addresses for {po.poNumber}
                                </span>
                                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                                  {totalReceived} pcs shelved across {allPoSlots.length} slot allocation{allPoSlots.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">
                                Structure: Rack &gt; Bay (Horizontal) &gt; Level (Vertical)
                              </span>
                            </div>

                            {rackGroups.length === 0 ? (
                              <div className="text-xs text-slate-400 italic py-2">
                                Stored on general staging floor (no specific rack slots assigned).
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {rackGroups.map((rg) => (
                                  <div key={rg.rackLabel} className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                                    <div className="text-xs font-extrabold text-blue-900 mb-2 flex items-center gap-1.5">
                                      <WarehouseIcon className="w-3.5 h-3.5 text-blue-600" />
                                      <span>{rg.rackLabel}</span>
                                    </div>
                                    <div className="flex flex-row items-start gap-2.5 flex-wrap">
                                      {rg.bays.map((bg) => (
                                        <div
                                          key={bg.bayLabel}
                                          className="inline-flex flex-col bg-white border border-blue-200 rounded-md overflow-hidden text-[10px] min-w-[120px]"
                                        >
                                          <div className="text-center font-bold text-blue-800 bg-blue-50/90 border-b border-blue-100 px-2.5 py-1 font-mono">
                                            {bg.bayLabel}
                                          </div>
                                          <div className="flex flex-col p-1.5 gap-1.5">
                                            {bg.items.map((it, idx) => (
                                              <div
                                                key={idx}
                                                className="flex flex-col bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-100 transition"
                                              >
                                                <div className="flex items-center justify-between gap-2">
                                                  <span className="font-bold text-slate-800 font-mono">
                                                    {it.parsed.levelLabel}:
                                                  </span>
                                                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[9px]">
                                                    {it.quantity} pcs
                                                  </span>
                                                </div>
                                                <div className="text-[10px] text-slate-600 truncate mt-0.5 font-medium" title={it.productName}>
                                                  {it.productName}
                                                </div>
                                                <div className="text-[9px] font-mono text-slate-400 mt-0.2">
                                                  {it.code}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Line Items List preview */}
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-400 font-medium border-b border-slate-100">
                              <th className="py-2 px-2 text-center w-8">#</th>
                              <th className="py-2 text-left">Item / SKU</th>
                              <th className="py-2 text-right">Ordered</th>
                              <th className="py-2 text-right">Received</th>
                              <th className="py-2 text-right">Remaining</th>
                              <th className="py-2 text-left px-2">Shelved Slot / Address</th>
                              <th className="py-2 text-right">Unit Price</th>
                              <th className="py-2 text-right">Total Line</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-mono">
                            {po.items.map((line, lineIdx) => {
                              const lineReceived = line.receivedQuantity ?? line.receivedQty ?? 0
                              const remaining = Math.max(0, line.quantity - lineReceived)
                              const unitCost = line.unitPrice ?? line.unitCost ?? 0
                              const totalCost = line.total ?? line.totalCost ?? (unitCost * line.quantity)
                              const productName = line.product?.name || line.productName || 'Line Item'
                              const productSku = line.product?.sku || line.productSku || 'SKU'

                              // Resolve physical warehouse slot addressing
                              const matchingStocks = line.product?.warehouseStocks || []
                              const targetStock =
                                (po.destinationWarehouseId
                                  ? matchingStocks.find((s) => s.warehouseId === po.destinationWarehouseId)
                                  : null) ||
                                matchingStocks.find((s) => s.locationCode || s.locationPath || s.slot?.code) ||
                                matchingStocks[0]

                              const slotDisplay =
                                targetStock?.locationPath ||
                                targetStock?.locationCode ||
                                targetStock?.slot?.code

                              const isItemExpanded = expandedItemSlots[line.id]

                              return (
                                <React.Fragment key={line.id}>
                                  <tr
                                    onClick={() => {
                                      if (lineReceived > 0) {
                                        setExpandedItemSlots((prev) => ({
                                          ...prev,
                                          [line.id]: !prev[line.id],
                                        }))
                                      }
                                    }}
                                    className={`text-slate-700 transition-colors ${
                                      lineReceived > 0 ? 'cursor-pointer hover:bg-blue-50/40' : ''
                                    }`}
                                  >
                                    <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px]">
                                      {lineIdx + 1}
                                    </td>
                                    <td className="py-2 font-sans">
                                      <div className="flex items-center gap-1.5">
                                        {lineReceived > 0 && (
                                          <span className="text-slate-400 hover:text-blue-600">
                                            {isItemExpanded ? (
                                              <ChevronUp className="w-3.5 h-3.5" />
                                            ) : (
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            )}
                                          </span>
                                        )}
                                        <span className="font-semibold text-slate-900">{productName}</span>
                                        <span className="text-slate-400 ml-1 font-mono text-[11px]">[{productSku}]</span>
                                      </div>
                                    </td>
                                    <td className="py-2 text-right">{line.quantity}</td>
                                    <td className="py-2 text-right text-emerald-600 font-semibold">{lineReceived}</td>
                                    <td className="py-2 text-right">
                                      <span className={remaining > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}>
                                        {remaining}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2 text-left font-sans">
                                      {lineReceived > 0 ? (
                                        slotDisplay ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 transition">
                                            <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                            <span className="font-mono">{slotDisplay}</span>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                            <span>General Floor</span>
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[11px] text-slate-400 italic">Pending intake</span>
                                      )}
                                    </td>
                                    <td className="py-2 text-right">${unitCost.toFixed(2)}</td>
                                    <td className="py-2 text-right font-semibold text-slate-900">${totalCost.toFixed(2)}</td>
                                  </tr>

                                  {/* ROW-LEVEL EXPANDED SHELF ADDRESSING: Shows Bay / Level matrix for this specific product */}
                                  {isItemExpanded && lineReceived > 0 && (() => {
                                    const parsed = parseSlotCoord(slotDisplay || '')
                                    return (
                                      <tr className="bg-slate-50/70 border-b border-slate-100">
                                        <td colSpan={8} className="py-2.5 px-4 font-sans">
                                          <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                              <span>Shelving Coordinate:</span>
                                            </div>

                                            {/* Visual Rack > Bay > Level breakdown */}
                                            <div className="inline-flex items-center border border-blue-200 rounded-md bg-white overflow-hidden shadow-2xs text-[11px]">
                                              <div className="bg-blue-600 text-white font-extrabold px-2 py-1 flex items-center gap-1">
                                                <WarehouseIcon className="w-3 h-3" />
                                                <span>{parsed.rackLabel || 'Rack R1'}</span>
                                              </div>
                                              <div className="bg-blue-50 text-blue-900 font-bold px-2 py-1 border-r border-blue-100">
                                                {parsed.groupLabel}
                                              </div>
                                              <div className="px-2 py-1 font-extrabold text-blue-700">
                                                {parsed.levelLabel}
                                              </div>
                                              <div className="bg-emerald-50 text-emerald-800 font-mono font-bold px-2 py-1 border-l border-emerald-200">
                                                {lineReceived} pcs stored
                                              </div>
                                            </div>

                                            <span className="text-[11px] text-slate-400 font-mono">
                                              Raw Code: {slotDisplay || 'N/A'}
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  })()}
                                </React.Fragment>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            </>
            )}

            {/* CHANNEL 2: Inbound Freight Containers */}
            {inboundSource === 'containers' && (
              <>
                <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={containerSearch}
                      onChange={(e) => setContainerSearch(e.target.value)}
                      placeholder="Search container #, carrier, route..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Route Type Filter */}
                    <select
                      value={containerRouteFilter}
                      onChange={(e) => setContainerRouteFilter(e.target.value)}
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="ALL">All Transport Modes</option>
                      <option value="SEA">🚢 Sea Freight</option>
                      <option value="RAIL">🚂 Rail Freight</option>
                      <option value="AIR">✈️ Air Cargo</option>
                      <option value="ROAD">🚛 Road Freight</option>
                    </select>

                    {/* Status Filter (Excluding already unloaded containers) */}
                    <select
                      value={containerStatusFilter}
                      onChange={(e) => setContainerStatusFilter(e.target.value)}
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="ALL">All Active Inbound (Not Unloaded)</option>
                      <option value="ARRIVED">Arrived at Destination Hub</option>
                      <option value="CUSTOMS_CLEARED">Customs Cleared</option>
                      <option value="AT_CUSTOMS">At Customs Inspection</option>
                      <option value="IN_TRANSIT">In Transit / En Route</option>
                      <option value="DEPARTED">Departed Origin Port</option>
                      <option value="LOADING">Loading at Origin Hub</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => fetchContainers()}
                      disabled={containersLoading}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition shadow-2xs disabled:opacity-50"
                      title="Refresh containers"
                    >
                      <RefreshCw className={`w-4 h-4 ${containersLoading ? 'animate-spin text-blue-600' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Empty State */}
                {filteredContainers.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-2xs">
                      <Ship className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      No Pending Inbound Containers for {selectedWarehouse?.name || (isBelarusActive ? 'Belarus Hub' : 'Active Warehouse')}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                      Only containers routed to this country and destination warehouse that are awaiting intake are shown here. Containers that have already been unloaded into warehouse shelves are strictly archived.
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200">
                      <span>✓ Unloaded containers are strictly excluded from inbound queue</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContainers.map((container, cIdx) => {
                      const isExpanded = !!expandedContainerIds[container.id]
                      const totalUnits = container.items.reduce((sum, it) => sum + (it.quantity || 0), 0)
                      const totalValuation = container.items.reduce(
                        (sum, it) => sum + (it.totalCost || (it.quantity * it.unitCost) || 0),
                        0
                      )
                      const shelvedItemsCount = container.items.filter((it) => {
                        const handled = (it.receivedQty || 0) + (it.damagedQty || 0) + (it.rejectedQty || 0)
                        return handled >= it.quantity
                      }).length
                      const isPartiallyShelved = shelvedItemsCount > 0 && shelvedItemsCount < container.items.length

                      // Route Mode Badge Helper
                      const getRouteBadge = (route: string) => {
                        switch (route?.toUpperCase()) {
                          case 'SEA':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                                <Ship className="w-3.5 h-3.5 text-cyan-600" />
                                <span>Sea Freight</span>
                              </span>
                            )
                          case 'RAIL':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Train className="w-3.5 h-3.5 text-amber-600" />
                                <span>Rail Freight</span>
                              </span>
                            )
                          case 'AIR':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                <Plane className="w-3.5 h-3.5 text-purple-600" />
                                <span>Air Cargo</span>
                              </span>
                            )
                          default:
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Road Freight</span>
                              </span>
                            )
                        }
                      }

                      // Status Badge Helper
                      const getStatusBadge = (status: string) => {
                        switch (status?.toUpperCase()) {
                          case 'ARRIVED':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>ARRIVED AT HUB</span>
                              </span>
                            )
                          case 'CUSTOMS_CLEARED':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Customs Cleared</span>
                              </span>
                            )
                          case 'AT_CUSTOMS':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>At Customs</span>
                              </span>
                            )
                          case 'IN_TRANSIT':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                                <span>In Transit</span>
                              </span>
                            )
                          case 'DEPARTED':
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                <ArrowUpRight className="w-3.5 h-3.5 text-sky-600" />
                                <span>Departed Port</span>
                              </span>
                            )
                          default:
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                <span>{status}</span>
                              </span>
                            )
                        }
                      }

                      return (
                        <div
                          key={container.id}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden"
                        >
                          {/* Container Summary Card Header */}
                          <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100">
                            <div className="flex items-start gap-3.5">
                              {/* Sequence Number */}
                              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-800 flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-2xs mt-0.5">
                                #{cIdx + 1}
                              </div>

                              <div>
                                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                                  <span className="font-mono font-black text-base text-slate-900 tracking-tight">
                                    {container.containerNumber}
                                  </span>
                                  {getRouteBadge(container.routeType)}
                                  {isPartiallyShelved ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                                      <span>PARTIALLY UNLOADED ({shelvedItemsCount}/{container.items.length} lines shelved)</span>
                                    </span>
                                  ) : (
                                    getStatusBadge(container.status)
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                  {container.carrier && (
                                    <span className="flex items-center gap-1 font-medium text-slate-700">
                                      <WarehouseIcon className="w-3.5 h-3.5 text-slate-400" />
                                      {typeof container.carrier === 'string' ? container.carrier : container.carrier.name}
                                    </span>
                                  )}
                                  <span className="text-slate-300">•</span>
                                  <span className="flex items-center gap-1 text-slate-600">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>
                                      {container.origin} ➔ {container.destinationWarehouse?.name || container.destination}
                                    </span>
                                  </span>
                                  {container.arrivalDate && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="flex items-center gap-1 text-slate-600 font-mono">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        ETA: {new Date(container.arrivalDate).toLocaleDateString()}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Metrics & Action Buttons */}
                            <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                              <div className="flex items-center gap-4 mr-2">
                                <div className="text-right">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Manifest Cargo
                                  </div>
                                  <div className="text-sm font-black font-mono text-slate-900">
                                    {totalUnits.toLocaleString()} pcs
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    {container.items.length} line items
                                  </div>
                                </div>

                                {totalValuation > 0 && (
                                  <div className="text-right hidden sm:block border-l border-slate-100 pl-4">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Landed Value
                                    </div>
                                    <div className="text-sm font-black font-mono text-emerald-700">
                                      ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-[11px] text-slate-400">Declared Value</div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedContainerIds((prev) => ({
                                      ...prev,
                                      [container.id]: !prev[container.id],
                                    }))
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition"
                                  title="View cargo lines"
                                >
                                  <span>{isExpanded ? 'Hide Cargo' : 'View Cargo'}</span>
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openReceiveContainerModal(container)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                                >
                                  <ArrowDownLeft className="w-4 h-4" />
                                  <span>{shelvedItemsCount > 0 ? `Continue Unload (${container.items.length - shelvedItemsCount} left)` : 'Unload & Stock into Warehouse'}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Cargo Items Table (Collapsible) */}
                          {isExpanded && (
                            <div className="p-4 bg-slate-50/60 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-3 px-1">
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                  <Box className="w-4 h-4 text-blue-600" />
                                  <span>Container Manifest Lines ({container.items.length})</span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Click "Unload & Stock into Warehouse" to record intake into physical shelving slots
                                </span>
                              </div>

                              <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                                      <th className="py-2.5 px-3.5 w-12 text-center">#</th>
                                      <th className="py-2.5 px-3.5">Product & SKU</th>
                                      <th className="py-2.5 px-3.5 text-right">Manifest Units</th>
                                      <th className="py-2.5 px-3.5 text-right">Unit Cost</th>
                                      <th className="py-2.5 px-3.5 text-right">Total Valuation</th>
                                      <th className="py-2.5 px-3.5 text-right">Weight / Volume</th>
                                      <th className="py-2.5 px-3.5 text-center">Intake Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-medium">
                                    {container.items.map((it, itIdx) => {
                                      const lineTotal = it.totalCost || (it.quantity * it.unitCost)
                                      const recQty = it.receivedQty || 0
                                      const isShelved = recQty >= it.quantity
                                      const isPartial = recQty > 0 && recQty < it.quantity
                                      return (
                                        <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                                          <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-400">
                                            #{itIdx + 1}
                                          </td>
                                          <td className="py-3 px-3.5">
                                            <div className="flex items-center gap-2.5">
                                              {it.product.thumbnail ? (
                                                <img
                                                  src={it.product.thumbnail}
                                                  alt={it.product.name}
                                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                                />
                                              ) : (
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                  <Package className="w-4 h-4" />
                                                </div>
                                              )}
                                              <div className="min-w-0">
                                                <div className="font-bold text-slate-900 truncate max-w-xs" title={it.product.name}>
                                                  {it.product.name}
                                                </div>
                                                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                                  {it.product.sku}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                                            {it.quantity.toLocaleString()} pcs
                                          </td>
                                          <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                                            ${it.unitCost?.toFixed(2) || '0.00'}
                                          </td>
                                          <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                                            ${lineTotal?.toFixed(2) || '0.00'}
                                          </td>
                                          <td className="py-3 px-3.5 text-right text-slate-500 font-mono text-[11px]">
                                            {it.weight ? `${it.weight} kg` : '-'} {it.cbm ? `· ${it.cbm} m³` : ''}
                                          </td>
                                          <td className="py-3 px-3.5 text-center">
                                            {isShelved ? (
                                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                <span>Shelved ({recQty} pcs)</span>
                                              </span>
                                            ) : isPartial ? (
                                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                                                <Clock className="w-3 h-3 text-blue-600" />
                                                <span>Partially Shelved ({recQty}/{it.quantity} pcs)</span>
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                <span>Awaiting Unload</span>
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 3: Stock Movements Audit Ledger */}
        {activeTab === 'movements' && (
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={movementSearch}
                  onChange={(e) => setMovementSearch(e.target.value)}
                  placeholder="Search SKU, product or reference..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none"
                >
                  <option value="">All Movement Types</option>
                  <option value="PURCHASE_RECEIPT">Purchase Receipt (Inbound)</option>
                  <option value="ADJUSTMENT_IN">Adjustment In</option>
                  <option value="ADJUSTMENT_OUT">Adjustment Out</option>
                  <option value="SALE">Order Sale</option>
                  <option value="TRANSFER_IN">Transfer In</option>
                  <option value="TRANSFER_OUT">Transfer Out</option>
                </select>
              </div>
            </div>

            {movementsLoading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Loading stock audit ledger...</p>
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No stock movements found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-3.5 w-12 text-center rounded-l-xl">#</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Warehouse</th>
                      <th className="py-3 px-4">Product / SKU</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4 text-right">Unit Cost</th>
                      <th className="py-3 px-4 rounded-r-xl">Reference / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredMovements.map((m, index) => {
                      const isPositive = m.quantity > 0
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3.5 text-center text-xs font-mono font-medium text-slate-400">
                            {index + 1}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {new Date(m.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                            {m.warehouse?.name || 'Central Hub'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{m.product?.name || 'N/A'}</div>
                            <div className="text-xs text-slate-400 font-mono">{m.product?.sku}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {isPositive ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              {m.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
                              {isPositive ? `+${m.quantity}` : m.quantity}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                            {m.unitCost ? `$${m.unitCost.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {m.reference && <div className="font-medium text-slate-700">{m.reference}</div>}
                            {m.notes && <div className="text-slate-400 truncate max-w-xs">{m.notes}</div>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Shelves & Storage Structures Layout */}
        {activeTab === 'shelves' && (
          <div className="p-6 space-y-6">
            {/* 1. Facility / Warehouse Selector Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <WarehouseIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">Warehouse Storage &amp; Shelves Overview</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                    Live Layout
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Interactive view of pallet racks, bulk lanes, and floor bays. Click any slot to view stocked products or manage placement.
                </p>
              </div>

              {/* Warehouse selector pills */}
              <div className="flex flex-wrap items-center gap-2">
                {(displayedWarehouses.length > 0 ? displayedWarehouses : warehouses).map((wh) => {
                  const isSelected = shelvesWarehouseId === wh.id
                  const flag =
                    wh.country.toLowerCase().includes('china') || wh.code.startsWith('CN')
                      ? '🇨🇳'
                      : wh.country.toLowerCase().includes('belarus') || wh.code.startsWith('BY')
                      ? '🇧🇾'
                      : '🏢'

                  return (
                    <button
                      key={`shelves-wh-${wh.id}`}
                      type="button"
                      onClick={() => {
                        setShelvesWarehouseId(wh.id)
                        setShelvesFocusedStructure(null)
                        fetchWarehouseLayoutForStock(wh.id)
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span className="text-sm">{flag}</span>
                      <span>{wh.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {wh.code}
                      </span>
                    </button>
                  )
                })}

                <a
                  href={`/admin/settings/warehouses?tab=layout&warehouse=${shelvesWarehouseId || ''}`}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 transition flex items-center gap-1.5 ml-auto sm:ml-0"
                  title="Configure and manage physical warehouse dimensions, racks, and bays in settings"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Configure Layout in Settings</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* 2. Key Metrics Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Structures */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Storage Structures</span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {shelvesStats.totalStructures}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">units</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-indigo-700">{shelvesStats.racksCount} Racks</span>
                  <span>•</span>
                  <span className="font-semibold text-amber-700">{shelvesStats.floorsCount} Floors</span>
                  <span>•</span>
                  <span className="font-semibold text-purple-700">{shelvesStats.lanesCount} Lanes</span>
                </div>
              </div>

              {/* Total Addressable Slots */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Storage Slots</span>
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                    <Grid className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {shelvesStats.totalSlots}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">locations</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Addressable inventory slots in facility
                </div>
              </div>

              {/* Occupied Capacity */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Occupied Capacity</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Box className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-700 font-mono">
                      {shelvesStats.occupiedSlotsCount}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ {shelvesStats.totalSlots} slots</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {shelvesStats.occupancyPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${shelvesStats.occupancyPercent}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500 font-mono">
                  {shelvesStats.totalStockedUnits.toLocaleString()} total units stocked
                </div>
              </div>

              {/* Available Empty Slots */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Slots</span>
                  <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-sky-700 font-mono">
                    {shelvesStats.emptySlotsCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">available</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  {100 - shelvesStats.occupancyPercent}% space ready for inbound placement
                </div>
              </div>
            </div>

            {/* 3. Filtering & Search Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
              {/* Structure type filter tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShelvesStructureFilter('ALL')
                    setShelvesFocusedStructure(null)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    shelvesStructureFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  All Structures ({shelvesStats.totalStructures})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShelvesStructureFilter('RACK')
                    setShelvesFocusedStructure(null)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    shelvesStructureFilter === 'RACK'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Pallet Racks ({shelvesStats.racksCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShelvesStructureFilter('FLOOR')
                    setShelvesFocusedStructure(null)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    shelvesStructureFilter === 'FLOOR'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Floor Bays ({shelvesStats.floorsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShelvesStructureFilter('LANE')
                    setShelvesFocusedStructure(null)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    shelvesStructureFilter === 'LANE'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Bulk Lanes ({shelvesStats.lanesCount})</span>
                </button>
              </div>

              {/* Search Box & Legend */}
              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={shelvesSearch}
                    onChange={(e) => setShelvesSearch(e.target.value)}
                    placeholder="Search rack, slot, product SKU..."
                    className="w-full pl-8 pr-8 py-1.5 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {shelvesSearch && (
                    <button
                      type="button"
                      onClick={() => setShelvesSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Legend badges */}
                <div className="hidden xl:flex items-center gap-3 text-xs text-slate-500 font-medium pl-2 border-l border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-500 ring-2 ring-emerald-300" />
                    <span>Occupied</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-white border-2 border-dashed border-slate-300" />
                    <span>Empty Available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Structure Jump Bar (if multiple structures exist) */}
            {shelvesStats.totalStructures > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-medium flex-shrink-0 text-[11px] uppercase tracking-wider">
                  Quick Focus:
                </span>
                <button
                  type="button"
                  onClick={() => setShelvesFocusedStructure(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 cursor-pointer ${
                    shelvesFocusedStructure === null
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Show All ({shelvesStats.totalStructures})
                </button>
                {shelvesWarehouseModel.racks.map((r) => (
                  <button
                    key={`focus-rack-${r.code}`}
                    type="button"
                    onClick={() => {
                      setShelvesStructureFilter('ALL')
                      setShelvesFocusedStructure(shelvesFocusedStructure === r.code ? null : r.code)
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 cursor-pointer flex items-center gap-1 ${
                      shelvesFocusedStructure === r.code
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>{r.title}</span>
                  </button>
                ))}
                {shelvesWarehouseModel.floors.map((f) => (
                  <button
                    key={`focus-floor-${f.code}`}
                    type="button"
                    onClick={() => {
                      setShelvesStructureFilter('ALL')
                      setShelvesFocusedStructure(shelvesFocusedStructure === f.code ? null : f.code)
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 cursor-pointer flex items-center gap-1 ${
                      shelvesFocusedStructure === f.code
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Grid className="w-3 h-3" />
                    <span>{f.name || f.code}</span>
                  </button>
                ))}
                {shelvesWarehouseModel.lanes.map((l) => (
                  <button
                    key={`focus-lane-${l.code}`}
                    type="button"
                    onClick={() => {
                      setShelvesStructureFilter('ALL')
                      setShelvesFocusedStructure(shelvesFocusedStructure === l.code ? null : l.code)
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 cursor-pointer flex items-center gap-1 ${
                      shelvesFocusedStructure === l.code
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Truck className="w-3 h-3" />
                    <span>{l.name || l.code}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 4. Layout Display Area */}
            {loadingLayouts[shelvesWarehouseId] && shelvesStats.totalStructures === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <p className="text-sm font-semibold text-slate-700">Loading warehouse layout and physical structures...</p>
                <p className="text-xs text-slate-400 mt-1">Fetching racks, bays, lanes, and slot inventory data</p>
              </div>
            ) : shelvesStats.totalStructures === 0 ? (
              <div className="py-16 px-6 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <Layers className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800">No Physical Structures Configured Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  This warehouse does not have any racks, floors, or bulk lanes defined yet. You can create zones and storage structures in Warehouse Settings.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fetchWarehouseLayoutForStock(shelvesWarehouseId, true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reload Layout</span>
                  </button>
                  <a
                    href={`/admin/settings/warehouses?tab=layout&warehouse=${shelvesWarehouseId || ''}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Configure Warehouse Layout &amp; Racks</span>
                  </a>
                </div>
              </div>
            ) : filteredShelvesStructures.racks.length === 0 &&
              filteredShelvesStructures.floors.length === 0 &&
              filteredShelvesStructures.lanes.length === 0 ? (
              <div className="py-16 px-6 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-base font-bold text-slate-800">No Storage Structures Match Filter</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  {shelvesSearch
                    ? `No structures or slots matched "${shelvesSearch}".`
                    : `No storage structures found matching filter "${shelvesStructureFilter}".`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShelvesStructureFilter('ALL')
                    setShelvesFocusedStructure(null)
                    setShelvesSearch('')
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All Structure Filters</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 4A. PALLET RACKS */}
                {filteredShelvesStructures.racks.map((rack) => {
                  const bayNums = Array.from(
                    new Set(
                      rack.bays.length > 0
                        ? rack.bays.map((b) => b.bayNum)
                        : rack.allSlots.map((s) => s.bayNum)
                    )
                  ).sort((a, b) => a - b)
                  const finalBayNums = bayNums.length > 0 ? bayNums : [1, 2, 3]

                  // Levels sorted descending: L3, L2, L1 (Ground at bottom)
                  const rackLevels = [...rack.levels].sort((a, b) => b - a)
                  const finalLevels = rackLevels.length > 0 ? rackLevels : [3, 2, 1]

                  const rackOccupiedSlots = rack.allSlots.filter((s) => {
                    const prods = getProductsForSlot(s)
                    return prods.length > 0 || (s.stocksCount || 0) > 0 || s.isOccupied
                  })
                  const rackOccupancyPct = rack.allSlots.length > 0 ? Math.round((rackOccupiedSlots.length / rack.allSlots.length) * 100) : 0

                  return (
                    <div key={`rack-${rack.code}`} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                      {/* Rack Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base">{rack.title}</h3>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                                PALLET RACK
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {finalBayNums.length} Bays across • {finalLevels.length} Shelf Levels high ({rack.allSlots.length} total slots)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-semibold text-slate-700">
                            {rackOccupiedSlots.length} of {rack.allSlots.length} occupied ({rackOccupancyPct}%)
                          </span>
                          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${rackOccupancyPct}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Physical Rack Elevation Grid */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-200 rounded-xl overflow-hidden min-w-[640px]">
                          <tbody>
                            {finalLevels.map((lvl) => {
                              return (
                                <tr key={`rack-${rack.code}-lvl-${lvl}`} className="border-b border-slate-200">
                                  {/* Left Level Indicator Cell */}
                                  <td className="py-3 px-3.5 text-center font-mono text-xs font-bold text-slate-700 bg-slate-100/90 border-r border-slate-200 w-24 whitespace-nowrap">
                                    <div className="flex flex-col items-center">
                                      <span className="font-black text-slate-900 text-sm">L{lvl}</span>
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        {lvl === 1 ? 'Ground' : lvl === finalLevels[0] ? 'Top' : `Level ${lvl}`}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Bays */}
                                  {finalBayNums.map((bNum) => {
                                    const slot = rack.allSlots.find((s) => s.bayNum === bNum && s.level === lvl)
                                    const slotCode =
                                      slot?.code ||
                                      `${rack.code}-${String(bNum).padStart(2, '0')}-${String(lvl).padStart(2, '0')}`
                                    const slotProducts = slot ? getProductsForSlot(slot) : []
                                    const prodsTotal = slotProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)
                                    const totalUnits = prodsTotal > 0 ? prodsTotal : (slot?.stocksCount || 0)
                                    const isOccupied = slotProducts.length > 0 || totalUnits > 0 || Boolean(slot?.isOccupied)

                                    return (
                                      <td
                                        key={`slot-${rack.code}-b${bNum}-l${lvl}`}
                                        className="p-2 border-r border-slate-200 last:border-r-0 align-top"
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleOpenSlotDetail(
                                              slot || {
                                                id: slotCode,
                                                code: slotCode,
                                                bayNum: bNum,
                                                level: lvl,
                                                stocksCount: 0,
                                              },
                                              rack.title,
                                              'RACK'
                                            )
                                          }
                                          className={`w-full text-left rounded-xl p-3 min-h-[95px] flex flex-col justify-between transition-all duration-150 group cursor-pointer border ${
                                            isOccupied
                                              ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-blue-50/60 border-emerald-300 hover:border-emerald-500 hover:shadow-md hover:scale-[1.01]'
                                              : 'bg-white hover:bg-slate-50 border-dashed border-slate-200 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-blue-600 flex items-center gap-1">
                                              <MapPin className="w-3 h-3 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                                              <span>{slotCode}</span>
                                            </span>
                                            {isOccupied ? (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                Occupied
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                                Empty
                                              </span>
                                            )}
                                          </div>

                                          {isOccupied ? (
                                            <div className="my-1">
                                              <div className="text-xs font-black text-slate-900 font-mono flex items-baseline gap-1">
                                                <span>{totalUnits.toLocaleString()}</span>
                                                <span className="text-[10px] font-normal text-slate-500">pcs</span>
                                                {slotProducts.length > 1 && (
                                                  <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-sans font-semibold">
                                                    {slotProducts.length} SKUs
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                                                {slotProducts[0]?.name || 'Stocked Inventory'}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="my-auto py-1 text-center">
                                              <span className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                                                <Box className="w-3 h-3 text-slate-300" />
                                                Available
                                              </span>
                                            </div>
                                          )}

                                          <div className="text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                            <span>B{bNum} • L{lvl}</span>
                                            <span className="text-blue-600 group-hover:underline font-sans font-medium">
                                              {isOccupied ? 'View Products →' : 'Slot Details →'}
                                            </span>
                                          </div>
                                        </button>
                                      </td>
                                    )
                                  })}
                                </tr>
                              )
                            })}
                          </tbody>

                          {/* Footer Row: Tier in left header, Bay 01, Bay 02... in columns */}
                          <tfoot>
                            <tr className="border-t-2 border-slate-300 bg-slate-100/95">
                              <th className="py-2.5 px-3.5 text-center text-xs font-black text-slate-600 uppercase tracking-wider font-mono border-r border-slate-200">
                                Tier
                              </th>
                              {finalBayNums.map((bNum) => (
                                <th
                                  key={`footer-${rack.code}-bay-${bNum}`}
                                  className="py-2.5 px-3 text-center text-xs font-bold text-slate-700 font-mono border-r border-slate-200 last:border-r-0"
                                >
                                  Bay {String(bNum).padStart(2, '0')}
                                </th>
                              ))}
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )
                })}

                {/* 4B. FLOOR STORAGE BAYS */}
                {filteredShelvesStructures.floors.map((floor) => {
                  const grid = compute2DGrid(floor.slots)
                  const floorOccupiedSlots = floor.slots.filter((s: any) => {
                    const prods = getProductsForSlot(s)
                    return prods.length > 0 || (s.stocks && s.stocks.length > 0)
                  })
                  const floorOccupancyPct =
                    floor.slots.length > 0 ? Math.round((floorOccupiedSlots.length / floor.slots.length) * 100) : 0

                  return (
                    <div key={`floor-${floor.code}`} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                      {/* Floor Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                            <Grid className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base">{floor.name || `Floor Bay ${floor.code}`}</h3>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                                FLOOR STORAGE
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {floor.slots.length} addressable floor pallet positions
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-semibold text-slate-700">
                            {floorOccupiedSlots.length} of {floor.slots.length} occupied ({floorOccupancyPct}%)
                          </span>
                          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${floorOccupancyPct}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Floor 2D Matrix */}
                      <div className="overflow-x-auto">
                        <div className="inline-block min-w-full">
                          {grid.matrix.length > 0 ? (
                            <div
                              className="grid gap-3"
                              style={{
                                gridTemplateColumns: `repeat(${Math.max(1, grid.colLabels.length)}, minmax(150px, 1fr))`,
                              }}
                            >
                              {grid.matrix.flatMap((row, rIdx) =>
                                row.map((slot, cIdx) => {
                                  if (!slot) {
                                    return (
                                      <div
                                        key={`empty-floor-grid-${rIdx}-${cIdx}`}
                                        className="min-h-[90px] rounded-xl border border-dashed border-slate-100 bg-slate-50/50 flex items-center justify-center text-slate-300 text-xs font-mono"
                                      >
                                        —
                                      </div>
                                    )
                                  }

                                  const slotProducts = getProductsForSlot(slot)
                                  const hasStocks = slot.stocks && Array.isArray(slot.stocks) && slot.stocks.length > 0
                                  const isOccupied = slotProducts.length > 0 || hasStocks
                                  const prodsTotal = slotProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)
                                  const rawStocksTotal = hasStocks ? slot.stocks.reduce((acc: number, st: any) => acc + (st.quantity || 0), 0) : 0
                                  const totalUnits = prodsTotal > 0 ? prodsTotal : rawStocksTotal

                                  return (
                                    <button
                                      type="button"
                                      key={`floor-slot-${slot.id || slot.code}`}
                                      onClick={() => handleOpenSlotDetail(slot, floor.name || floor.code, 'FLOOR')}
                                      className={`text-left rounded-xl p-3 min-h-[90px] flex flex-col justify-between transition-all duration-150 group cursor-pointer border ${
                                        isOccupied
                                          ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-blue-50/60 border-emerald-300 hover:border-emerald-500 hover:shadow-md hover:scale-[1.01]'
                                          : 'bg-white hover:bg-slate-50 border-dashed border-slate-200 hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-blue-600 flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                                          <span>{slot.code}</span>
                                        </span>
                                        {isOccupied ? (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            Occupied
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                            Empty
                                          </span>
                                        )}
                                      </div>

                                      {isOccupied ? (
                                        <div className="my-1">
                                          <div className="text-xs font-black text-slate-900 font-mono flex items-baseline gap-1">
                                            <span>{totalUnits.toLocaleString()}</span>
                                            <span className="text-[10px] font-normal text-slate-500">pcs</span>
                                          </div>
                                          <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                                            {slotProducts[0]?.name || slot.stocks?.[0]?.product?.name || 'Stocked Items'}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="my-auto py-1 text-center">
                                          <span className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                                            <Box className="w-3 h-3 text-slate-300" />
                                            Available
                                          </span>
                                        </div>
                                      )}

                                      <div className="text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                        <span>{grid.rowLabels[rIdx] || 'Floor'}</span>
                                        <span className="text-blue-600 group-hover:underline font-sans font-medium">
                                          {isOccupied ? 'View Products →' : 'Slot Details →'}
                                        </span>
                                      </div>
                                    </button>
                                  )
                                })
                              )}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-slate-400 text-sm">
                              No slots found in this floor bay.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* 4C. BULK DRIVE-IN LANES */}
                {filteredShelvesStructures.lanes.map((lane) => {
                  const laneSlots = [...lane.slots].sort((a: any, b: any) =>
                    (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
                  )
                  const laneOccupiedSlots = laneSlots.filter((s: any) => {
                    const prods = getProductsForSlot(s)
                    return prods.length > 0 || (s.stocks && s.stocks.length > 0)
                  })
                  const laneOccupancyPct =
                    laneSlots.length > 0 ? Math.round((laneOccupiedSlots.length / laneSlots.length) * 100) : 0

                  return (
                    <div key={`lane-${lane.code}`} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                      {/* Lane Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base">{lane.name || `Bulk Lane ${lane.code}`}</h3>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                                BULK DRIVE-IN LANE
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {laneSlots.length} depth positions for pallets &amp; heavy bulk freight
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-semibold text-slate-700">
                            {laneOccupiedSlots.length} of {laneSlots.length} occupied ({laneOccupancyPct}%)
                          </span>
                          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${laneOccupancyPct}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Lane Track Slots */}
                      <div className="overflow-x-auto">
                        <div className="flex items-stretch gap-3 min-w-max pb-2">
                          <div className="flex flex-col justify-center items-center px-4 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold border border-slate-200">
                            <ArrowRight className="w-4 h-4 text-purple-600 mb-1" />
                            <span>ENTRY</span>
                          </div>

                          {laneSlots.map((slot: any, posIdx: number) => {
                            const slotProducts = getProductsForSlot(slot)
                            const hasStocks = slot.stocks && Array.isArray(slot.stocks) && slot.stocks.length > 0
                            const isOccupied = slotProducts.length > 0 || hasStocks
                            const prodsTotal = slotProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)
                            const rawStocksTotal = hasStocks ? slot.stocks.reduce((acc: number, st: any) => acc + (st.quantity || 0), 0) : 0
                            const totalUnits = prodsTotal > 0 ? prodsTotal : rawStocksTotal

                            return (
                              <button
                                type="button"
                                key={`lane-slot-${slot.id || slot.code}`}
                                onClick={() => handleOpenSlotDetail(slot, lane.name || lane.code, 'LANE')}
                                className={`w-48 text-left rounded-xl p-3 min-h-[90px] flex flex-col justify-between transition-all duration-150 group cursor-pointer border flex-shrink-0 ${
                                  isOccupied
                                    ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-blue-50/60 border-emerald-300 hover:border-emerald-500 hover:shadow-md hover:scale-[1.01]'
                                    : 'bg-white hover:bg-slate-50 border-dashed border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-blue-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                                    <span>{slot.code}</span>
                                  </span>
                                  {isOccupied ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Occupied
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                      Empty
                                    </span>
                                  )}
                                </div>

                                {isOccupied ? (
                                  <div className="my-1">
                                    <div className="text-xs font-black text-slate-900 font-mono flex items-baseline gap-1">
                                      <span>{totalUnits.toLocaleString()}</span>
                                      <span className="text-[10px] font-normal text-slate-500">pcs</span>
                                    </div>
                                    <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                                      {slotProducts[0]?.name || slot.stocks?.[0]?.product?.name || 'Stocked Items'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="my-auto py-1 text-center">
                                    <span className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                                      <Box className="w-3 h-3 text-slate-300" />
                                      Available
                                    </span>
                                  </div>
                                )}

                                <div className="text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                  <span>Depth #{posIdx + 1}</span>
                                  <span className="text-blue-600 group-hover:underline font-sans font-medium">
                                    {isOccupied ? 'View Products →' : 'Slot Details →'}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Receive Purchase Order Items Dialog */}
      {selectedPoToReceive && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Inbox className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Inbound Cargo Receipt
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-mono">Invoice Order Base</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Receive Cargo: {selectedPoToReceive.poNumber}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedPoToReceive(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* SECTION 1: Purchase Order & Invoice Base Information */}
            <div className="mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Purchase Invoice & Order Base</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-slate-400 mb-0.5">PO & Invoice #</div>
                  <div className="font-bold text-slate-900 font-mono text-sm">{selectedPoToReceive.poNumber}</div>
                  <div className="text-blue-600 font-medium mt-0.5">
                    Invoice: #{selectedPoToReceive.invoiceNumber || 'Commercial Invoice'}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-slate-400 mb-0.5">Supplier Partner</div>
                  <div className="font-bold text-slate-900 text-sm truncate">{selectedPoToReceive.supplier.name}</div>
                  <div className="text-slate-500 truncate mt-0.5">
                    {selectedPoToReceive.supplier.contactName || selectedPoToReceive.supplier.email || 'Verified Supplier'}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-slate-400 mb-0.5">Invoice Valuation & Status</div>
                  <div className="font-bold text-slate-900 font-mono text-sm">
                    ${(selectedPoToReceive.totalAmount ?? selectedPoToReceive.subtotal ?? selectedPoToReceive.items?.reduce((acc, i) => acc + ((i.unitPrice ?? i.unitCost ?? 0) * (i.quantity || 0)), 0) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    <span className="text-[10px] text-slate-400">{selectedPoToReceive.currency || 'USD'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {selectedPoToReceive.isPaid ? (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> Paid Invoice
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Unpaid
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500">
                      • {selectedPoToReceive.items.length} line items
                    </span>
                  </div>
                </div>
              </div>

              {/* Destination Warehouse Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Warehouse Hub *
                </label>
                <select
                  value={targetWarehouseIdForPo}
                  onChange={(e) => setTargetWarehouseIdForPo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {displayedWarehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.country === 'China' || w.code.startsWith('CN') ? '🇨🇳' : '🇧🇾'} {w.name} ({w.code} - {w.country}) {w.isDefaultProcurement ? '★ Default Procurement' : ''}
                    </option>
                  ))}
                  {displayedWarehouses.length === 0 &&
                    warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code} - {w.country})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* SECTION 2: Physical Storage Location Coordinates (RACK, LANE, FLOOR & EXACT SLOTS) */}
            <div className="mb-5 bg-gradient-to-b from-blue-50/70 to-indigo-50/40 p-4 rounded-2xl border border-blue-200/90 space-y-3.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-100">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-950">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Physical Shelving Coordinates &amp; Exact Slot Selection</span>
                </div>
                {/* Location Mode Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode('RACK')
                      if (warehouseModel.racks.length > 0 && !selectedRack) {
                        setSelectedRack(warehouseModel.racks[0].code)
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      locationMode === 'RACK'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Rack Shelving ({warehouseModel.racks.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode('FLOOR')
                      if (warehouseModel.floors.length > 0 && !receiveFloor) {
                        setReceiveFloor(warehouseModel.floors[0].code)
                      }
                      setSelectedSlotCodes([])
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      locationMode === 'FLOOR'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Ground Floor ({warehouseModel.floors.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode('LANE')
                      if (warehouseModel.lanes.length > 0 && !receiveLane) {
                        setReceiveLane(warehouseModel.lanes[0].code)
                      }
                      setSelectedSlotCodes([])
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      locationMode === 'LANE'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Bulk Lane ({warehouseModel.lanes.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode('CUSTOM')
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                      locationMode === 'CUSTOM'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'
                    }`}
                  >
                    <span>✏️ Custom</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReceiveLane('')
                      setReceiveRack('')
                      setReceiveFloor('')
                      setSelectedSlotCodes([])
                      setItemCustomSlots({})
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-600 underline ml-1"
                  >
                    Clear / General Floor
                  </button>
                </div>
              </div>

              {layoutLoading && (
                <div className="flex items-center gap-2 text-xs text-blue-700 py-1 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading warehouse layout hierarchy and addressable slots...</span>
                </div>
              )}

              {/* MODE 1: RACK SHELVING (DROPDOWNS & EXACT SLOTS) */}
              {locationMode === 'RACK' && (
                <div className="space-y-3">
                  {/* Visual interactive list of RACKS */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-blue-600" />
                        <span>Select Rack / Shelving Unit ({warehouseModel.racks.length}):</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Click a rack to view its exact Bay × Level structure &amp; slots below
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {warehouseModel.racks.map((r: any) => {
                        const isSelected = (selectedRack || warehouseModel.racks[0]?.code) === r.code
                        const emptyCount = r.allSlots.filter((s: any) => !s.isOccupied).length
                        return (
                          <button
                            key={r.code}
                            type="button"
                            onClick={() => {
                              setSelectedRack(r.code)
                              setSelectedBay('')
                              setSelectedLevel('')
                              setSelectedSlotCodes([])
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                                  }`}
                                >
                                  {r.code}
                                </span>
                                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                  {r.title}
                                </span>
                              </div>
                              {isSelected ? (
                                <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-full shadow-xs">
                                  Selected
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">
                                  {r.allSlots.length} slots
                                </span>
                              )}
                            </div>

                            <div
                              className={`text-[11px] flex items-center justify-between w-full ${
                                isSelected ? 'text-blue-100' : 'text-slate-500'
                              }`}
                            >
                              <span>
                                {r.bays.length} Bays • {r.levels.length} Levels
                              </span>
                              <span
                                className={`font-semibold ${
                                  isSelected
                                    ? 'text-white'
                                    : emptyCount > 0
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                                }`}
                              >
                                {emptyCount} empty
                              </span>
                            </div>
                          </button>
                        )
                      })}
                      {warehouseModel.racks.length === 0 && (
                        <div className="col-span-full py-4 text-center text-xs text-slate-400 italic bg-white rounded-xl border border-slate-200">
                          No racks configured in this warehouse hub yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* EXACT SLOTS BOARD: Visual Interactive Bay × Level Matrix Grid */}
                  <div className="bg-white p-3 rounded-xl border border-blue-200/90 shadow-2xs space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-mono">
                          {currentRackObj?.code || 'R1'}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {currentRackObj?.title || `Rack ${currentRackObj?.code || 'R1'}`}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                          {currentRackObj?.bays?.length || rackGridData.bayNumbers.length || 0} Bays
                        </span>
                        {selectedSlotCodes.length > 0 && (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                            {selectedSlotCodes.length} Selected
                          </span>
                        )}
                      </div>

                      {/* Multi-slot selection buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSelectAllEmptySlots}
                          className="text-[11px] font-medium px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition flex items-center gap-1"
                          title="Select all empty slots in this rack"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Select Empty ({displayedSlots.filter((s: any) => !s.isOccupied).length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSelectAllFilteredSlots}
                          className="text-[11px] font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                        >
                          Select All ({displayedSlots.length})
                        </button>

                        {selectedSlotCodes.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearSelectedSlots}
                            className="text-[11px] font-medium px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Summary metrics matching warehouse settings layout */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pb-1 border-b border-slate-100">
                      <span>
                        Bays Count: <strong className="text-slate-700">{currentRackObj?.bays?.length || rackGridData.bayNumbers.length || 0}</strong> • Levels / Tiers (1 - 10): <strong className="text-slate-700">{rackGridData.levelNumbers.length || currentRackObj?.levels?.length || 0}</strong>
                      </span>
                      <span>
                        Addressable Slots: <strong className="text-slate-700">{currentRackObj?.allSlots?.length || 0}</strong>
                      </span>
                    </div>

                    {/* Shelves & Slots Addressing — Bay (Columns) × Level (Rows) Matrix Grid */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          SHELVES &amp; SLOTS ADDRESSING:
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Bays horizontal (columns) • Levels vertical (ground L1 up to top shelf)
                        </div>
                      </div>

                      {rackGridData.bayNumbers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 italic">
                          No addressable slots configured in this rack.
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-64 overflow-y-auto pr-1 pb-1">
                          {/* Level rows vertically (L3 down to L1, so ground up is L1, L2, L3) */}
                          {rackGridData.levelNumbers.map((lv: number) => {
                            const isLevelFiltered = selectedLevel && String(selectedLevel) === String(lv)

                            return (
                              <div
                                key={lv}
                                className="grid items-center gap-1.5 mb-1.5"
                                style={{
                                  gridTemplateColumns: `42px repeat(${rackGridData.bayNumbers.length}, minmax(88px, 1fr))`,
                                }}
                              >
                                {/* Level label down the left */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleLevelSlots(lv)}
                                  title={`Click to toggle all slots on Level ${lv}`}
                                  className={`text-[10px] font-bold pr-2 text-right whitespace-nowrap py-1 rounded transition cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 ${
                                    isLevelFiltered ? 'text-blue-700 bg-blue-50 font-extrabold' : 'text-slate-400'
                                  }`}
                                >
                                  L{lv}
                                </button>

                                {/* Bay slot cells across horizontally */}
                                {rackGridData.bayNumbers.map((bay: number) => {
                                  const slot = rackGridData.bayMap.get(bay)?.get(lv)
                                  if (!slot) {
                                    return (
                                      <div
                                        key={bay}
                                        className="h-11 rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
                                      />
                                    )
                                  }

                                  const isSelected = selectedSlotCodes.includes(slot.code)
                                  const isBayFiltered =
                                    selectedBay &&
                                    (selectedBay === `B-${String(bay).padStart(2, '0')}` ||
                                      selectedBay === String(bay) ||
                                      selectedBay.endsWith(String(bay)))
                                  const isMatchingFilter =
                                    (!selectedBay || isBayFiltered) &&
                                    (!selectedLevel || String(selectedLevel) === String(lv))

                                  return (
                                    <button
                                      key={bay}
                                      type="button"
                                      onClick={() => handleToggleSlotCode(slot.code)}
                                      className={`px-1.5 py-1 rounded-lg text-[10px] font-mono border transition-all flex flex-col items-center justify-center gap-0.5 min-h-[44px] relative cursor-pointer group ${
                                        isSelected
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300 font-bold'
                                          : slot.isOccupied
                                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 font-semibold hover:border-blue-400'
                                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                      } ${!isMatchingFilter ? 'opacity-40 hover:opacity-100' : ''}`}
                                      title={`Slot: ${slot.code} • ${slot.isOccupied ? `${slot.stocksCount} in stock` : 'Empty'}`}
                                    >
                                      <div className="flex items-center gap-1">
                                        {isSelected ? (
                                          <Check className="w-3 h-3 text-white stroke-[3]" />
                                        ) : (
                                          <Tag
                                            size={9}
                                            className={
                                              slot.isOccupied
                                                ? 'text-emerald-500'
                                                : 'text-slate-300 group-hover:text-blue-500'
                                            }
                                          />
                                        )}
                                        <span className="leading-none text-[10px] tracking-tight">{slot.code}</span>
                                      </div>

                                      <div className="flex items-center gap-1 text-[8px] leading-tight">
                                        {isSelected ? (
                                          <span className="text-blue-100 font-sans font-bold">Selected</span>
                                        ) : slot.isOccupied ? (
                                          <span className="text-emerald-700 flex items-center gap-0.5 font-sans">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <span>{slot.stocksCount} stock</span>
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-sans">Empty</span>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )
                          })}

                          {/* Bay column headers across bottom of shelf */}
                          <div
                            className="grid text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1.5 border-t border-slate-200/80"
                            style={{
                              gridTemplateColumns: `42px repeat(${rackGridData.bayNumbers.length}, minmax(88px, 1fr))`,
                            }}
                          >
                            <div className="pr-2 text-right text-[9px] text-slate-400 font-bold self-center">TIER</div>
                            {rackGridData.bayNumbers.map((bay: number) => {
                              const isBayFiltered =
                                selectedBay &&
                                (selectedBay === `B-${String(bay).padStart(2, '0')}` ||
                                  selectedBay === String(bay) ||
                                  selectedBay.endsWith(String(bay)))
                              return (
                                <button
                                  key={bay}
                                  type="button"
                                  onClick={() => handleToggleBaySlots(bay)}
                                  title={`Click to toggle all slots in Bay ${bay}`}
                                  className={`text-center py-1 rounded transition font-bold cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 ${
                                    isBayFiltered ? 'text-blue-700 bg-blue-50 font-extrabold' : 'text-slate-600'
                                  }`}
                                >
                                  B{bay}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Multi-slot high-productivity distribution strip */}
                    {selectedSlotCodes.length > 0 && (
                      <div className="pt-2 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-blue-50/60 -mx-3 -mb-3 p-2.5 rounded-b-xl">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-blue-900">
                            ✓ {selectedSlotCodes.length} Slot{selectedSlotCodes.length > 1 ? 's' : ''} Selected:
                          </span>
                          <span className="font-mono font-semibold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 max-w-sm truncate">
                            {selectedSlotCodes.join(', ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDistributeSlotsAcrossItems}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 transition"
                            title="Distribute 1 slot per product line item"
                          >
                            <span>⚡ Distribute 1 Slot / Item</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleApplyBatchToAllItems}
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-bold text-[11px] border border-blue-300 transition"
                            title="Assign this multi-slot batch to all line items"
                          >
                            <span>📍 Apply to All</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 2: GROUND FLOOR STAGING */}
              {locationMode === 'FLOOR' && (
                <div className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-blue-600" />
                      <span>Select Ground Floor Staging Area ({warehouseModel.floors.length}):</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Ideal for heavy pallets, oversized cargo &amp; rapid cross-docking
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {warehouseModel.floors.map((fl: any) => {
                      const isSelected = receiveFloor === fl.code
                      const emptyCount = fl.slots?.filter((s: any) => !s.stocks || s.stocks.length === 0).length || 0
                      return (
                        <button
                          key={fl.code}
                          type="button"
                          onClick={() => {
                            setReceiveFloor(fl.code)
                            setReceiveRack('')
                            setReceiveLane('')
                            setSelectedSlotCodes([])
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}
                              >
                                {fl.code}
                              </span>
                              <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {fl.name || `Floor ${fl.code}`}
                              </span>
                            </div>
                            {isSelected ? (
                              <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-full shadow-xs">
                                Selected
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">
                                {fl.slots?.length || 0} slots
                              </span>
                            )}
                          </div>

                          <div
                            className={`text-[11px] flex items-center justify-between w-full ${
                              isSelected ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            <span>Staging Zone</span>
                            <span
                              className={`font-semibold ${
                                isSelected ? 'text-white' : emptyCount > 0 ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {emptyCount} empty
                            </span>
                          </div>
                        </button>
                      )
                    })}
                    {warehouseModel.floors.length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                        No ground floor zones configured in this hub.
                      </div>
                    )}
                  </div>

                  {/* EXACT SLOTS BOARD: Visual Interactive Ground Floor Col × Row Matrix Grid */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md font-mono">
                          {currentFloorObj?.code || receiveFloor}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {currentFloorObj?.name || `Floor ${currentFloorObj?.code || receiveFloor}`}
                        </span>
                        {selectedSlotCodes.length > 0 && (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                            {selectedSlotCodes.length} Selected
                          </span>
                        )}
                      </div>

                      {/* Multi-slot selection buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSelectAllEmptySlots}
                          className="text-[11px] font-medium px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                          title="Select all empty slots in this floor zone"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Select Empty ({displayedSlots.filter((s: any) => !s.isOccupied).length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSelectAllFilteredSlots}
                          className="text-[11px] font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                        >
                          Select All ({displayedSlots.length})
                        </button>

                        {selectedSlotCodes.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearSelectedSlots}
                            className="text-[11px] font-medium px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md transition cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Summary metrics matching warehouse rack/floor layout */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pb-1 border-b border-slate-100">
                      <span>
                        Rows (Depth): <strong className="text-slate-700">{floorGridData.rowNumbers.length}</strong> • Columns (Width): <strong className="text-slate-700">{floorGridData.colNumbers.length}</strong>
                      </span>
                      <span>
                        Addressable Slots: <strong className="text-slate-700">{currentFloorObj?.slots?.length || displayedSlots.length}</strong>
                      </span>
                    </div>

                    {/* Ground Floor Staging Slots Matrix (COL × ROW) */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        FLOOR STAGING SLOTS ADDRESSING (COL × ROW MATRIX):
                      </div>

                      {floorGridData.rowNumbers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 italic">
                          No addressable ground slots configured in this floor zone.
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-64 overflow-y-auto pr-1 pb-1">
                          {/* Column headers row */}
                          <div
                            className="grid text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"
                            style={{
                              gridTemplateColumns: `36px repeat(${floorGridData.colNumbers.length}, minmax(88px, 1fr))`,
                            }}
                          >
                            <div className="pr-2 text-right"></div>
                            {floorGridData.colNumbers.map((colNum: number) => (
                              <button
                                key={colNum}
                                type="button"
                                onClick={() => handleToggleFloorCol(colNum)}
                                title={`Click to toggle all slots in Column ${colNum}`}
                                className="text-center py-0.5 rounded transition font-bold cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 text-slate-400"
                              >
                                C{colNum}
                              </button>
                            ))}
                          </div>

                          {/* Row rows */}
                          {floorGridData.rowNumbers.map((rowNum: number) => {
                            const rowLabel = floorGridData.rowLabels[rowNum - 1] || `R${rowNum}`
                            return (
                              <div
                                key={rowNum}
                                className="grid items-center gap-1.5 mb-1.5"
                                style={{
                                  gridTemplateColumns: `36px repeat(${floorGridData.colNumbers.length}, minmax(88px, 1fr))`,
                                }}
                              >
                                {/* Row label */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleFloorRow(rowNum)}
                                  title={`Click to toggle all slots in ${rowLabel}`}
                                  className="text-[10px] font-bold pr-2 text-right whitespace-nowrap py-1 rounded transition cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 text-slate-400"
                                >
                                  {rowLabel}
                                </button>

                                {/* Slot cells */}
                                {floorGridData.colNumbers.map((colNum: number) => {
                                  const slot = floorGridData.matrix[rowNum - 1]?.[colNum - 1]
                                  if (!slot) {
                                    return (
                                      <div
                                        key={colNum}
                                        className="h-11 rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
                                      />
                                    )
                                  }

                                  const isSelected = selectedSlotCodes.includes(slot.code)

                                  return (
                                    <button
                                      key={slot.code}
                                      type="button"
                                      onClick={() => handleToggleSlotCode(slot.code)}
                                      className={`px-1.5 py-1 rounded-lg text-[10px] font-mono border transition-all flex flex-col items-center justify-center gap-0.5 min-h-[44px] relative cursor-pointer group ${
                                        isSelected
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300 font-bold'
                                          : slot.isOccupied
                                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 font-semibold hover:border-blue-400'
                                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                      }`}
                                      title={`Slot: ${slot.code} • ${slot.isOccupied ? `${slot.stocksCount} in stock` : 'Empty'}`}
                                    >
                                      <div className="flex items-center gap-1">
                                        {isSelected ? (
                                          <Check className="w-3 h-3 text-white stroke-[3]" />
                                        ) : (
                                          <Tag
                                            size={9}
                                            className={
                                              slot.isOccupied
                                                ? 'text-emerald-500'
                                                : 'text-slate-300 group-hover:text-blue-500'
                                            }
                                          />
                                        )}
                                        <span className="leading-none text-[10px] tracking-tight">{slot.code}</span>
                                      </div>

                                      <div className="flex items-center gap-1 text-[8px] leading-tight">
                                        {isSelected ? (
                                          <span className="text-blue-100 font-sans font-bold">Selected</span>
                                        ) : slot.isOccupied ? (
                                          <span className="text-emerald-700 flex items-center gap-0.5 font-sans">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <span>{slot.stocksCount} stock</span>
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-sans">Empty</span>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Multi-slot high-productivity distribution strip */}
                    {selectedSlotCodes.length > 0 && (
                      <div className="pt-2 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-blue-50/60 -mx-3.5 -mb-3.5 p-2.5 rounded-b-xl">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-blue-900">
                            ✓ {selectedSlotCodes.length} Slot{selectedSlotCodes.length > 1 ? 's' : ''} Selected:
                          </span>
                          <span className="font-mono font-semibold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 max-w-sm truncate">
                            {selectedSlotCodes.join(', ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDistributeSlotsAcrossItems}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 transition cursor-pointer"
                            title="Distribute 1 slot per product line item"
                          >
                            <span>⚡ Distribute 1 Slot / Item</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleApplyBatchToAllItems}
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-bold text-[11px] border border-blue-300 transition cursor-pointer"
                            title="Assign this multi-slot batch to all line items"
                          >
                            <span>📍 Apply to All</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 3: BULK SHIPPING LANE */}
              {locationMode === 'LANE' && (
                <div className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Select Bulk Shipping Lane / Aisle ({warehouseModel.lanes.length}):</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Direct truck/container staging &amp; bulk consolidation
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {warehouseModel.lanes.map((ln: any) => {
                      const isSelected = receiveLane === ln.code
                      const emptyCount = ln.slots?.filter((s: any) => !s.stocks || s.stocks.length === 0).length || 0
                      return (
                        <button
                          key={ln.code}
                          type="button"
                          onClick={() => {
                            setReceiveLane(ln.code)
                            setReceiveRack('')
                            setReceiveFloor('')
                            setSelectedSlotCodes([])
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}
                              >
                                {ln.code}
                              </span>
                              <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {ln.name || `Lane ${ln.code}`}
                              </span>
                            </div>
                            {isSelected ? (
                              <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-full shadow-xs">
                                Selected
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">
                                {ln.slots?.length || 0} slots
                              </span>
                            )}
                          </div>

                          <div
                            className={`text-[11px] flex items-center justify-between w-full ${
                              isSelected ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            <span>Loading Lane</span>
                            <span
                              className={`font-semibold ${
                                isSelected ? 'text-white' : emptyCount > 0 ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {emptyCount} empty
                            </span>
                          </div>
                        </button>
                      )
                    })}
                    {warehouseModel.lanes.length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                        No bulk lanes configured in this hub.
                      </div>
                    )}
                  </div>

                  {/* EXACT SLOTS BOARD: Visual Interactive Bulk Lane Col × Row Matrix Grid */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-mono">
                          {currentLaneObj?.code || receiveLane}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {currentLaneObj?.name || `Lane ${currentLaneObj?.code || receiveLane}`}
                        </span>
                        {selectedSlotCodes.length > 0 && (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                            {selectedSlotCodes.length} Selected
                          </span>
                        )}
                      </div>

                      {/* Multi-slot selection buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSelectAllEmptySlots}
                          className="text-[11px] font-medium px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                          title="Select all empty slots in this shipping lane"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Select Empty ({displayedSlots.filter((s: any) => !s.isOccupied).length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSelectAllFilteredSlots}
                          className="text-[11px] font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                        >
                          Select All ({displayedSlots.length})
                        </button>

                        {selectedSlotCodes.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearSelectedSlots}
                            className="text-[11px] font-medium px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md transition cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Summary metrics matching warehouse lane layout */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pb-1 border-b border-slate-100">
                      <span>
                        Rows (Depth): <strong className="text-slate-700">{laneGridData.rowNumbers.length}</strong> • Columns (Width): <strong className="text-slate-700">{laneGridData.colNumbers.length}</strong>
                      </span>
                      <span>
                        Addressable Slots: <strong className="text-slate-700">{currentLaneObj?.slots?.length || displayedSlots.length}</strong>
                      </span>
                    </div>

                    {/* Bulk Shipping Lane Slots Matrix (COL × ROW) */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        BULK LANE SLOTS ADDRESSING (COL × ROW MATRIX):
                      </div>

                      {laneGridData.rowNumbers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 italic">
                          No addressable slots configured in this bulk lane.
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-64 overflow-y-auto pr-1 pb-1">
                          {/* Column headers row */}
                          <div
                            className="grid text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"
                            style={{
                              gridTemplateColumns: `36px repeat(${laneGridData.colNumbers.length}, minmax(88px, 1fr))`,
                            }}
                          >
                            <div className="pr-2 text-right"></div>
                            {laneGridData.colNumbers.map((colNum: number) => (
                              <button
                                key={colNum}
                                type="button"
                                onClick={() => handleToggleLaneCol(colNum)}
                                title={`Click to toggle all slots in Column ${colNum}`}
                                className="text-center py-0.5 rounded transition font-bold cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 text-slate-400"
                              >
                                C{colNum}
                              </button>
                            ))}
                          </div>

                          {/* Row rows */}
                          {laneGridData.rowNumbers.map((rowNum: number) => {
                            const rowLabel = laneGridData.rowLabels[rowNum - 1] || `R${rowNum}`
                            return (
                              <div
                                key={rowNum}
                                className="grid items-center gap-1.5 mb-1.5"
                                style={{
                                  gridTemplateColumns: `36px repeat(${laneGridData.colNumbers.length}, minmax(88px, 1fr))`,
                                }}
                              >
                                {/* Row label */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleLaneRow(rowNum)}
                                  title={`Click to toggle all slots in ${rowLabel}`}
                                  className="text-[10px] font-bold pr-2 text-right whitespace-nowrap py-1 rounded transition cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 text-slate-400"
                                >
                                  {rowLabel}
                                </button>

                                {/* Slot cells */}
                                {laneGridData.colNumbers.map((colNum: number) => {
                                  const slot = laneGridData.matrix[rowNum - 1]?.[colNum - 1]
                                  if (!slot) {
                                    return (
                                      <div
                                        key={colNum}
                                        className="h-11 rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
                                      />
                                    )
                                  }

                                  const isSelected = selectedSlotCodes.includes(slot.code)

                                  return (
                                    <button
                                      key={slot.code}
                                      type="button"
                                      onClick={() => handleToggleSlotCode(slot.code)}
                                      className={`px-1.5 py-1 rounded-lg text-[10px] font-mono border transition-all flex flex-col items-center justify-center gap-0.5 min-h-[44px] relative cursor-pointer group ${
                                        isSelected
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300 font-bold'
                                          : slot.isOccupied
                                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 font-semibold hover:border-blue-400'
                                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                      }`}
                                      title={`Slot: ${slot.code} • ${slot.isOccupied ? `${slot.stocksCount} in stock` : 'Empty'}`}
                                    >
                                      <div className="flex items-center gap-1">
                                        {isSelected ? (
                                          <Check className="w-3 h-3 text-white stroke-[3]" />
                                        ) : (
                                          <Tag
                                            size={9}
                                            className={
                                              slot.isOccupied
                                                ? 'text-emerald-500'
                                                : 'text-slate-300 group-hover:text-blue-500'
                                            }
                                          />
                                        )}
                                        <span className="leading-none text-[10px] tracking-tight">{slot.code}</span>
                                      </div>

                                      <div className="flex items-center gap-1 text-[8px] leading-tight">
                                        {isSelected ? (
                                          <span className="text-blue-100 font-sans font-bold">Selected</span>
                                        ) : slot.isOccupied ? (
                                          <span className="text-emerald-700 flex items-center gap-0.5 font-sans">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <span>{slot.stocksCount} stock</span>
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-sans">Empty</span>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Multi-slot high-productivity distribution strip */}
                    {selectedSlotCodes.length > 0 && (
                      <div className="pt-2 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-blue-50/60 -mx-3.5 -mb-3.5 p-2.5 rounded-b-xl">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-blue-900">
                            ✓ {selectedSlotCodes.length} Slot{selectedSlotCodes.length > 1 ? 's' : ''} Selected:
                          </span>
                          <span className="font-mono font-semibold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 max-w-sm truncate">
                            {selectedSlotCodes.join(', ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDistributeSlotsAcrossItems}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 transition cursor-pointer"
                            title="Distribute 1 slot per product line item"
                          >
                            <span>⚡ Distribute 1 Slot / Item</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleApplyBatchToAllItems}
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-bold text-[11px] border border-blue-300 transition cursor-pointer"
                            title="Assign this multi-slot batch to all line items"
                          >
                            <span>📍 Apply to All</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 4: CUSTOM COORDINATES */}
              {locationMode === 'CUSTOM' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lane / Aisle
                    </label>
                    <input
                      type="text"
                      value={receiveLane}
                      onChange={(e) => setReceiveLane(e.target.value)}
                      placeholder="e.g., 1, 2, A"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['1', '2', '3', '4', 'A', 'B'].map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setReceiveLane(l)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition ${
                            receiveLane === l
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          Lane {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rack / Bay
                    </label>
                    <input
                      type="text"
                      value={receiveRack}
                      onChange={(e) => setReceiveRack(e.target.value)}
                      placeholder="e.g., A-01, B-02"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['A-01', 'A-02', 'B-01', 'B-02', 'R1', 'R2'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setReceiveRack(r)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition ${
                            receiveRack === r
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          Rack {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Floor / Level
                    </label>
                    <input
                      type="text"
                      value={receiveFloor}
                      onChange={(e) => setReceiveFloor(e.target.value)}
                      placeholder="e.g., 1, 2, 3"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['1', '2', '3', '4'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setReceiveFloor(f)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition ${
                            receiveFloor === f
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          Floor {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Live Location Preview Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80">
                <div className="flex items-center gap-2 text-xs text-emerald-950 font-medium flex-wrap">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Assigned Shelving Location:{' '}
                    {selectedSlotCodes.length > 0 ? (
                      <strong className="font-bold text-emerald-900 font-mono">
                        Rack {selectedRack || receiveRack || 'R1'} &gt; Slots: [{selectedSlotCodes.join(', ')}]
                      </strong>
                    ) : receiveLane || receiveRack || receiveFloor ? (
                      <strong className="font-bold text-emerald-900">
                        {receiveRack ? `Rack ${receiveRack}` : ''}
                        {receiveLane ? ` > Bay/Lane ${receiveLane}` : ''}
                        {receiveFloor ? ` > Level ${receiveFloor}` : ''}
                      </strong>
                    ) : (
                      <em className="text-slate-500 font-normal">General Warehouse Floor (Unassigned)</em>
                    )}
                  </span>
                </div>
                {(selectedSlotCodes.length > 0 || receiveLane || receiveRack || receiveFloor) && (
                  <span className="text-[11px] font-mono bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded font-bold">
                    {selectedSlotCodes.length > 0
                      ? `Slots: ${selectedSlotCodes.join(', ')}`
                      : `Code: L-${receiveLane || '?'}/R-${receiveRack || '?'}/F-${receiveFloor || '?'}`}
                  </span>
                )}
              </div>
            </div>

            {/* SECTION 3: Line Items Receiving Table with Slot Assignments */}
            <div className="mb-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Verify Quantities &amp; Assign to Shelving Slots
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Each product can go into the batch slots or be assigned to a specific shelf slot below
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleFillAllRemaining}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition"
                  >
                    <span>⚡ 1-Click: Receive 100% Remaining</span>
                  </button>

                  {selectedSlotCodes.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handleEqualSplitAcrossItemsAndSlots}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold border border-blue-300 transition cursor-pointer"
                        title={`Divide remaining quantities equally across selected slots (${selectedSlotCodes.join(', ')}) on all items`}
                      >
                        <span>⚡ Equal Split on All Items (÷{selectedSlotCodes.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDistributeSlotsAcrossItems}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-300 transition cursor-pointer"
                        title="Distribute 1 slot per item"
                      >
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Distribute 1 Slot / Item</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-2 min-w-[150px] max-w-[200px]">Product / SKU</th>
                      <th className="py-2 px-1.5 text-right whitespace-nowrap w-12" title="Invoiced Quantity">Inv.</th>
                      <th className="py-2 px-1.5 text-right whitespace-nowrap w-12" title="Previously Received">Recv.</th>
                      <th className="py-2 px-1.5 text-right whitespace-nowrap w-12 text-amber-700" title="Remaining Quantity to Receive">Rem.</th>
                      <th className="py-2 px-2.5">Assigned Shelving Slot &amp; Intake</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPoToReceive.items.map((item, itemIdx) => {
                      const lineReceived = item.receivedQuantity ?? item.receivedQty ?? 0
                      const remaining = Math.max(0, item.quantity - lineReceived)
                      const productName = item.product?.name || item.productName || 'Line Item'
                      const productSku = item.product?.sku || item.productSku || 'SKU'
                      const itemCustom = itemCustomSlots[item.id]
                      const allocations = itemCustom?.allocations || []
                      const totalAllocated = allocations.reduce((sum: number, a: any) => sum + (a.quantity || 0), 0)
                      const unassignedRemainder = allocations.length > 0 ? Math.max(0, remaining - totalAllocated) : 0

                      // Parse slot coordinates into Bay / Level structure matching warehouse matrix
                      const parseSlotCoord = (code: string) => {
                        if (!code) return { groupLabel: 'Floor', levelLabel: code, fullLabel: code }
                        // Rack format: R1-01-03 -> Bay 1 (B1), Level 3 (L3)
                        const rackMatch = code.match(/^([A-Z0-9]+)-(\d+)-(\d+)$/i)
                        if (rackMatch) {
                          const bayNum = parseInt(rackMatch[2], 10)
                          const levelNum = parseInt(rackMatch[3], 10)
                          return {
                            groupLabel: `B${bayNum}`,
                            levelLabel: `L${levelNum}`,
                            fullLabel: `B${bayNum} · L${levelNum}`,
                          }
                        }
                        // Floor 2D format: FL-01-A1 -> Row A, Col 1
                        const floor2DMatch = code.match(/^([A-Z0-9]+-[A-Z0-9]+)-([A-Z]+)(\d+)$/i)
                        if (floor2DMatch) {
                          return {
                            groupLabel: `Row ${floor2DMatch[2]}`,
                            levelLabel: `C${floor2DMatch[3]}`,
                            fullLabel: `Row ${floor2DMatch[2]} · C${floor2DMatch[3]}`,
                          }
                        }
                        // Floor 1D format: FL-01-A
                        const floor1DMatch = code.match(/^([A-Z0-9]+-[A-Z0-9]+)-([A-Z0-9]+)$/i)
                        if (floor1DMatch) {
                          return {
                            groupLabel: floor1DMatch[1],
                            levelLabel: `Slot ${floor1DMatch[2]}`,
                            fullLabel: `${floor1DMatch[1]} · Slot ${floor1DMatch[2]}`,
                          }
                        }
                        return { groupLabel: 'General', levelLabel: code, fullLabel: code }
                      }

                      // Group allocated slots by their Bay / Row header to mirror the Shelves & Slots addressing grid
                      const groupAllocationsByBay = (allocs: any[]) => {
                        const groups: { [key: string]: { bayLabel: string; items: any[] } } = {}
                        allocs.forEach((a: any) => {
                          const { groupLabel, levelLabel } = parseSlotCoord(a.slotCode)
                          if (!groups[groupLabel]) {
                            groups[groupLabel] = { bayLabel: groupLabel, items: [] }
                          }
                          groups[groupLabel].items.push({ ...a, levelLabel })
                        })
                        return Object.values(groups)
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px] align-middle">
                            {itemIdx + 1}
                          </td>
                          <td className="py-2 px-2 align-middle max-w-[200px]">
                            <div className="font-semibold text-slate-900 truncate" title={productName}>
                              {productName}
                            </div>
                            <div className="font-mono text-slate-400 text-[10px]">{productSku}</div>
                          </td>
                          <td className="py-2 px-1.5 text-right font-mono font-medium text-slate-700 align-middle whitespace-nowrap w-12">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-1.5 text-right font-mono text-slate-400 align-middle whitespace-nowrap w-12">
                            {lineReceived}
                          </td>
                          <td className="py-2 px-1.5 text-right font-mono font-bold text-amber-600 align-middle whitespace-nowrap w-12">
                            {remaining}
                          </td>

                          {/* UNIFIED 2-TIER: SHELVED ON TOP, INTAKE FORM ON BOTTOM */}
                          <td className="py-2.5 px-3 align-middle">
                            <div className="space-y-1.5">
                              {/* TOP: Shelved Slots with Bays Horizontal & Levels Vertical */}
                              <div className="flex flex-row items-start gap-2 flex-wrap min-w-0">
                                {allocations.length > 0 ? (
                                  <>
                                    {groupAllocationsByBay(allocations).map((group) => {
                                      // Sort levels vertically from highest shelf to bottom (e.g. L3 -> L2 -> L1)
                                      const sortedLevels = [...group.items].sort((a, b) => {
                                        const numA = parseInt(a.levelLabel.replace(/\D/g, ''), 10) || 0
                                        const numB = parseInt(b.levelLabel.replace(/\D/g, ''), 10) || 0
                                        return numB - numA
                                      })

                                      return (
                                        <div
                                          key={group.bayLabel}
                                          className="inline-flex flex-col bg-white border border-blue-200/90 rounded-md overflow-hidden shadow-2xs text-[10px] min-w-[80px]"
                                        >
                                          {/* Bay Column Header (Horizontal across bays) */}
                                          <div className="text-center font-extrabold text-blue-700 bg-blue-50 border-b border-blue-100 px-2 py-0.5 font-mono">
                                            {group.bayLabel}
                                          </div>

                                          {/* Levels Stacked Vertically inside Bay */}
                                          <div className="flex flex-col p-1 gap-1">
                                            {sortedLevels.map((a: any) => (
                                              <div
                                                key={a.slotCode}
                                                className="inline-flex items-center justify-between gap-1.5 font-mono bg-slate-50 hover:bg-slate-100 px-1.5 py-0.5 rounded transition"
                                                title={`Full Slot Code: ${a.slotCode} (Bay ${group.bayLabel}, Level ${a.levelLabel})`}
                                              >
                                                <span className="font-bold text-slate-800">{a.levelLabel}:</span>
                                                <span className="font-extrabold text-blue-700 bg-white px-1 py-0.2 rounded border border-blue-100">
                                                  {a.quantity} pcs
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => handleRemoveSlotAllocation(item.id, a.slotCode)}
                                                  className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer leading-none"
                                                  title={`Remove ${a.slotCode}`}
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </>
                                ) : (
                                  selectedSlotCodes.length > 0 ? (
                                    <div className="flex flex-row items-start gap-1.5 text-[10px]">
                                      <span className="text-slate-400 font-medium self-center">Target:</span>
                                      {groupAllocationsByBay(selectedSlotCodes.map((code) => ({ slotCode: code, quantity: 0 }))).map((g) => {
                                        const sortedLevels = [...g.items].sort((a, b) => {
                                          const numA = parseInt(a.levelLabel.replace(/\D/g, ''), 10) || 0
                                          const numB = parseInt(b.levelLabel.replace(/\D/g, ''), 10) || 0
                                          return numB - numA
                                        })
                                        return (
                                          <div
                                            key={g.bayLabel}
                                            className="inline-flex flex-col bg-white border border-blue-200 text-blue-900 rounded overflow-hidden font-mono text-[9px] min-w-[50px]"
                                          >
                                            <div className="bg-blue-50 px-1.5 py-0.5 font-extrabold text-blue-700 text-center border-b border-blue-100">
                                              {g.bayLabel}
                                            </div>
                                            <div className="px-1.5 py-0.5 flex flex-col items-center gap-0.5">
                                              {sortedLevels.map((i) => (
                                                <span key={i.levelLabel} className="font-bold text-slate-700">{i.levelLabel}</span>
                                              ))}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : receiveRack || receiveLane ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                                      <MapPin className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />
                                      <span>{receiveRack ? `Rack ${receiveRack}` : 'General Floor'}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">General Floor (No slot assigned)</span>
                                  )
                                )}
                              </div>

                              {/* BOTTOM: Form [-] [1021] [+] [Full] [⚡ Assign (÷2)] [✓ Shelved] [Clear] */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <div className="inline-flex items-center border border-slate-200 rounded bg-white shadow-2xs overflow-hidden h-6">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const activeVal =
                                        allocations.length > 0 && unassignedRemainder > 0 && (rowAssignQty[item.id] === undefined || rowAssignQty[item.id] === 0)
                                          ? unassignedRemainder
                                          : rowAssignQty[item.id] !== undefined
                                          ? rowAssignQty[item.id]
                                          : (unassignedRemainder > 0 ? unassignedRemainder : remaining)
                                      const next = Math.max(0, activeVal - 1)
                                      setRowAssignQty((prev) => ({ ...prev, [item.id]: next }))
                                      if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: next }))
                                    }}
                                    className="w-5 h-full bg-slate-50 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer border-r border-slate-200"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.quantity}
                                    value={
                                      allocations.length > 0 && unassignedRemainder > 0 && (rowAssignQty[item.id] === undefined || rowAssignQty[item.id] === 0)
                                        ? unassignedRemainder
                                        : rowAssignQty[item.id] !== undefined
                                        ? rowAssignQty[item.id]
                                        : (unassignedRemainder > 0 ? unassignedRemainder : remaining)
                                    }
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0
                                      setRowAssignQty((prev) => ({
                                        ...prev,
                                        [item.id]: val,
                                      }))
                                      if (allocations.length === 0) {
                                        setReceivingItemsMap((prev) => ({ ...prev, [item.id]: val }))
                                      }
                                    }}
                                    className="w-16 h-full px-1 text-center font-mono font-bold text-xs bg-white text-slate-900 focus:outline-none"
                                    placeholder="0"
                                    title="Quantity to assign"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const activeVal =
                                        allocations.length > 0 && unassignedRemainder > 0 && (rowAssignQty[item.id] === undefined || rowAssignQty[item.id] === 0)
                                          ? unassignedRemainder
                                          : rowAssignQty[item.id] !== undefined
                                          ? rowAssignQty[item.id]
                                          : (unassignedRemainder > 0 ? unassignedRemainder : remaining)
                                      const next = activeVal + 1
                                      setRowAssignQty((prev) => ({ ...prev, [item.id]: next }))
                                      if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: next }))
                                    }}
                                    className="w-5 h-full bg-slate-50 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer border-l border-slate-200"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* FRACTIONS: [¼] [⅓] [½] [Full] */}
                                <div className="inline-flex items-center border border-slate-200 rounded bg-slate-50 overflow-hidden h-6 divide-x divide-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const base = unassignedRemainder > 0 ? unassignedRemainder : remaining
                                      const val = Math.max(1, Math.round(base * 0.25))
                                      setRowAssignQty((prev) => ({ ...prev, [item.id]: val }))
                                      if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: val }))
                                    }}
                                    disabled={remaining <= 0}
                                    className="px-1.5 h-full text-[10px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition cursor-pointer"
                                    title={`Set to 25% (¼) of remaining (${Math.max(1, Math.round((unassignedRemainder > 0 ? unassignedRemainder : remaining) * 0.25))} pcs)`}
                                  >
                                    ¼
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const base = unassignedRemainder > 0 ? unassignedRemainder : remaining
                                      const val = Math.max(1, Math.round(base / 3))
                                      setRowAssignQty((prev) => ({ ...prev, [item.id]: val }))
                                      if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: val }))
                                    }}
                                    disabled={remaining <= 0}
                                    className="px-1.5 h-full text-[10px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition cursor-pointer"
                                    title={`Set to 33% (⅓) of remaining (${Math.max(1, Math.round((unassignedRemainder > 0 ? unassignedRemainder : remaining) / 3))} pcs)`}
                                  >
                                    ⅓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const base = unassignedRemainder > 0 ? unassignedRemainder : remaining
                                      const val = Math.max(1, Math.round(base * 0.5))
                                      setRowAssignQty((prev) => ({ ...prev, [item.id]: val }))
                                      if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: val }))
                                    }}
                                    disabled={remaining <= 0}
                                    className="px-1.5 h-full text-[10px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition cursor-pointer"
                                    title={`Set to 50% (½) of remaining (${Math.max(1, Math.round((unassignedRemainder > 0 ? unassignedRemainder : remaining) * 0.5))} pcs)`}
                                  >
                                    ½
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const base = unassignedRemainder > 0 ? unassignedRemainder : remaining
                                      setRowAssignQty((prev) => ({ ...prev, [item.id]: base }))
                                      if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: base }))
                                    }}
                                    disabled={remaining <= 0}
                                    className="px-2 h-full text-[10px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-700 transition cursor-pointer"
                                    title={`Set to 100% of remaining (${unassignedRemainder > 0 ? unassignedRemainder : remaining} pcs)`}
                                  >
                                    Full
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentAssignVal =
                                      allocations.length > 0 && unassignedRemainder > 0 && (rowAssignQty[item.id] === undefined || rowAssignQty[item.id] === 0)
                                        ? unassignedRemainder
                                        : rowAssignQty[item.id]
                                    handleRegisterQtyToSlots(item.id, currentAssignVal)
                                  }}
                                  className="h-6 px-2.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-2xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  title={
                                    selectedSlotCodes.length > 1
                                      ? `Divide quantity equally across ${selectedSlotCodes.length} selected slots (${selectedSlotCodes.join(', ')})`
                                      : selectedSlotCodes.length === 1
                                      ? `Assign quantity to slot ${selectedSlotCodes[0]}`
                                      : 'Select slot(s) above from the warehouse matrix to assign'
                                  }
                                >
                                  <span>⚡ Assign{selectedSlotCodes.length > 1 ? ` (÷${selectedSlotCodes.length})` : ''}</span>
                                </button>

                                {/* STATUS DIRECTLY AFTER ASSIGN BUTTON */}
                                {allocations.length > 0 && (
                                  unassignedRemainder > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      <span>{unassignedRemainder} unassigned</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                      <span>✓ Shelved ({totalAllocated} pcs)</span>
                                    </span>
                                  )
                                )}

                                {allocations.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearItemAllocations(item.id)}
                                    className="h-6 px-2 text-[10px] text-slate-400 hover:text-rose-600 rounded cursor-pointer ml-auto"
                                    title="Clear all assigned slots for this product"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 4: Receipt Note & Inspection Check */}
            <div className="mb-6 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Receipt Note / Inspector Memo
              </label>
              <input
                type="text"
                value={receiveNotes}
                onChange={(e) => setReceiveNotes(e.target.value)}
                placeholder="e.g., Box verified undamaged, sealed by inspector..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex flex-wrap gap-1.5">
                {['Cartons Undamaged', 'Seals Verified', 'Barcode Scanned', 'Urgent Shelving'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setReceiveNotes((prev) => (prev ? `${prev} • ${tag}` : tag))
                    }}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPoToReceive(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>

              {(() => {
                const assignedProductsCount = selectedPoToReceive.items.filter((item) => {
                  const itemCustom = itemCustomSlots[item.id]
                  const allocations = itemCustom?.allocations || []
                  const totalAllocated = allocations.reduce((sum: number, a: any) => sum + (a.quantity || 0), 0)
                  return totalAllocated > 0 || (receivingItemsMap[item.id] || 0) > 0
                }).length

                return (
                  <button
                    type="button"
                    disabled={receivingSubmitting || assignedProductsCount === 0}
                    onClick={handleConfirmReceivePo}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {receivingSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Registering into Hub...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {assignedProductsCount > 0
                            ? `Confirm Receipt & Shelve (${assignedProductsCount} product${assignedProductsCount > 1 ? 's' : ''})`
                            : 'Assign at least 1 product to shelve'}
                        </span>
                      </>
                    )}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Direct Intake & Adjustment Modal */}
      {isIntakeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Direct Product Intake & Stock Adjustment</h3>
              </div>
              <button
                onClick={() => setIsIntakeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectIntakeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Warehouse *</label>
                <select
                  value={intakeWarehouseId}
                  onChange={(e) => setIntakeWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {displayedWarehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.country === 'China' || w.code.startsWith('CN') ? '🇨🇳' : '🇧🇾'} {w.name} ({w.code} - {w.country})
                    </option>
                  ))}
                  {displayedWarehouses.length === 0 &&
                    warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code} - {w.country})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product to Register *</label>
                <select
                  value={intakeProductId}
                  onChange={(e) => setIntakeProductId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Product --</option>
                  {stocks.map((s) => (
                    <option key={s.product.id} value={s.product.id}>
                      {s.product.name} (SKU: {s.product.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Physical Shelving Coordinates */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Warehouse Storage Coordinates (Optional)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Lane / Aisle</label>
                    <input
                      type="text"
                      placeholder="e.g. 1"
                      value={intakeLane}
                      onChange={(e) => setIntakeLane(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Rack / Bay</label>
                    <input
                      type="text"
                      placeholder="e.g. A-01"
                      value={intakeRack}
                      onChange={(e) => setIntakeRack(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Floor / Level</label>
                    <input
                      type="text"
                      placeholder="e.g. 1"
                      value={intakeFloor}
                      onChange={(e) => setIntakeFloor(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {(intakeLane || intakeRack || intakeFloor) && (
                  <div className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono font-medium">
                    Location: Lane {intakeLane || '—'} &gt; Rack {intakeRack || '—'} &gt; Floor {intakeFloor || '—'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={intakeQuantity}
                    onChange={(e) => setIntakeQuantity(parseInt(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 14.50"
                    value={intakeUnitCost}
                    onChange={(e) => setIntakeUnitCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Intake Operation Type</label>
                <select
                  value={intakeType}
                  onChange={(e) => setIntakeType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="PURCHASE_RECEIPT">Purchase Receipt (Inbound Factory Arrival)</option>
                  <option value="ADJUSTMENT_IN">Manual Adjustment (Add Quantity)</option>
                  <option value="INITIAL">Initial Inventory Load</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Reference Document</label>
                <input
                  type="text"
                  value={intakeReason}
                  onChange={(e) => setIntakeReason(e.target.value)}
                  placeholder="e.g., Direct factory delivery, sample arrival, carton count check..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIntakeModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={intakeSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-50"
                >
                  {intakeSubmitting ? 'Recording...' : 'Register Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Shelf-to-Shelf Stock Relocation Modal */}
      {isRelocateModalOpen && relocateStockItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Relocate Warehouse Stock</h3>
                  <p className="text-xs text-slate-500">
                    Move inventory between shelves, racks, floor bays, or lanes with live visual verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRelocateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRelocateSubmit} className="space-y-5">
              {/* Product & Current Location Info Banner */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{relocateStockItem.product.name}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-mono text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        SKU: {relocateStockItem.product.sku}
                      </span>
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <WarehouseIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{relocateStockItem.warehouse.name} ({relocateStockItem.warehouse.code} • {relocateStockItem.warehouse.country})</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {relocateSourceSlotCode ? 'Qty in Selected Slot' : 'Current On-Hand'}
                    </span>
                    <span className="text-base font-black font-mono text-emerald-700">
                      {relocateMaxQuantity.toLocaleString()} pcs
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 flex-wrap">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold">Source Location:</span>
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                      {relocateSourceSlotCode || relocateStockItem.locationPath || relocateStockItem.locationCode || relocateStockItem.slot?.code || 'General Floor'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Avail: {relocateStockItem.availableQty} pcs
                  </span>
                </div>
              </div>

              {/* SECTION: Destination Selection (RACK, FLOOR, LANE, CUSTOM) */}
              <div className="bg-gradient-to-b from-blue-50/60 to-indigo-50/30 p-4 rounded-2xl border border-blue-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-blue-100">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-950">
                    <Grid className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Choose Destination Structure &amp; Shelf Slot</span>
                  </div>

                  {/* Mode Pills matching Modal 1 */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setRelocateTargetType('RACK')
                        if (relocateWarehouseModel.racks.length > 0 && !relocateTargetRack) {
                          setRelocateTargetRack(relocateWarehouseModel.racks[0].code)
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        relocateTargetType === 'RACK'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>Rack Shelving ({relocateWarehouseModel.racks.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRelocateTargetType('FLOOR')
                        if (relocateWarehouseModel.floors.length > 0 && !relocateTargetFloorBay) {
                          setRelocateTargetFloorBay(relocateWarehouseModel.floors[0].code)
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        relocateTargetType === 'FLOOR'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span>Ground Floor ({relocateWarehouseModel.floors.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRelocateTargetType('LANE')
                        if (relocateWarehouseModel.lanes.length > 0 && !relocateTargetLane) {
                          setRelocateTargetLane(relocateWarehouseModel.lanes[0].code)
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        relocateTargetType === 'LANE'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Bulk Lane ({relocateWarehouseModel.lanes.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRelocateTargetType('CUSTOM')}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                        relocateTargetType === 'CUSTOM'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'
                      }`}
                    >
                      <span>✏️ Custom</span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: RACK SHELVING (RACK SELECTION + SHELF SLOTS) */}
                {relocateTargetType === 'RACK' && (
                  <div className="space-y-3.5">
                    {/* Step 1: Visual interactive list of Racks */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5 text-blue-600" />
                          <span>1. Select Target Rack ({relocateWarehouseModel.racks.length || 'Default'}):</span>
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Click a rack to view its Bay × Level shelves below
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {(relocateWarehouseModel.racks.length > 0
                          ? relocateWarehouseModel.racks
                          : [
                              { code: 'R1', title: 'Rack R1', allSlots: [], bays: [1, 2, 3], levels: [1, 2, 3] },
                              { code: 'R2', title: 'Rack R2', allSlots: [], bays: [1, 2, 3], levels: [1, 2, 3] },
                            ]
                        ).map((r: any) => {
                          const isSelected = (relocateTargetRack || 'R1') === r.code
                          const emptyCount = r.allSlots?.filter((s: any) => !s.isOccupied).length || 0
                          return (
                            <button
                              key={r.code}
                              type="button"
                              onClick={() => {
                                setRelocateTargetRack(r.code)
                                setRelocateSlotId(null)
                              }}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                                    }`}
                                  >
                                    {r.code}
                                  </span>
                                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                    {r.title || `Rack ${r.code}`}
                                  </span>
                                </div>
                                {isSelected ? (
                                  <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-full shadow-xs">
                                    Selected
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {r.allSlots?.length || 9} slots
                                  </span>
                                )}
                              </div>

                              <div
                                className={`text-[11px] flex items-center justify-between w-full ${
                                  isSelected ? 'text-blue-100' : 'text-slate-500'
                                }`}
                              >
                                <span>
                                  {r.bays?.length || 3} Bays • {r.levels?.length || 3} Levels
                                </span>
                                <span
                                  className={`font-semibold ${
                                    isSelected
                                      ? 'text-white'
                                      : emptyCount > 0
                                      ? 'text-emerald-600'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {emptyCount > 0 ? `${emptyCount} empty` : 'Available'}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Step 2: Bay × Level Coordinates & Exact Shelf Picker */}
                    <div className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>2. Select Shelf Position in Rack {relocateTargetRack || 'R1'} (Levels × Bays):</span>
                        </div>
                        <div className="text-[11px] font-mono text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1.5">
                          <span className="text-slate-500 font-sans font-medium text-[10px]">Destination:</span>
                          <span>{computedRelocateTarget.code}</span>
                        </div>
                      </div>

                      {/* Dropdown selectors for Bay & Level */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Bay Column (Horizontal)
                          </label>
                          <select
                            value={relocateTargetBay}
                            onChange={(e) => {
                              setRelocateTargetBay(e.target.value)
                              setRelocateSlotId(null)
                            }}
                            className="w-full px-3 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          >
                            {(currentRelocateRackObj?.bays?.length
                              ? currentRelocateRackObj.bays.map((b: any) => {
                                  const bNumMatch = b.code ? b.code.match(/\d+$/) : null
                                  return b.bayNum || (bNumMatch ? parseInt(bNumMatch[0], 10) : 1)
                                })
                              : [1, 2, 3, 4, 5, 6]
                            )
                              .filter((v: number, i: number, a: number[]) => a.indexOf(v) === i)
                              .sort((a: number, b: number) => a - b)
                              .map((bNum: number) => (
                                <option key={`bay-${bNum}`} value={String(bNum)}>
                                  Bay {String(bNum).padStart(2, '0')}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Shelf Level (Vertical Tier)
                          </label>
                          <select
                            value={relocateTargetLevel}
                            onChange={(e) => {
                              setRelocateTargetLevel(e.target.value)
                              setRelocateSlotId(null)
                            }}
                            className="w-full px-3 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          >
                            {(currentRelocateRackObj?.levels?.length
                              ? [...currentRelocateRackObj.levels].sort((a: number, b: number) => b - a)
                              : [3, 2, 1]
                            ).map((lvl: number) => (
                              <option key={`lvl-${lvl}`} value={String(lvl)}>
                                Level {String(lvl).padStart(2, '0')} {lvl === 3 ? '(Top Shelf)' : lvl === 2 ? '(Mid Shelf)' : lvl === 1 ? '(Ground Shelf)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Interactive 2D Elevation Matrix (Levels × Bays) */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Grid className="w-3.5 h-3.5 text-blue-600" />
                            <span>Click any shelf slot in the elevation grid:</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Rows = Shelf Levels • Cols = Bay Columns
                          </span>
                        </div>

                        {(() => {
                          const rackBayNums = (currentRelocateRackObj?.bays?.length
                            ? currentRelocateRackObj.bays.map((b: any) => {
                                const bNumMatch = b.code ? b.code.match(/\d+$/) : null
                                return b.bayNum || (bNumMatch ? parseInt(bNumMatch[0], 10) : 1)
                              })
                            : [1, 2, 3, 4, 5, 6]
                          ).filter((v: number, i: number, a: number[]) => a.indexOf(v) === i).sort((a: number, b: number) => a - b)

                          const rackLevels = (currentRelocateRackObj?.levels?.length
                            ? [...currentRelocateRackObj.levels].sort((a: number, b: number) => b - a)
                            : [3, 2, 1])

                          const selectedBayInt = parseInt(relocateTargetBay || '1', 10) || 1
                          const selectedLevelInt = parseInt(relocateTargetLevel || '1', 10) || 1

                          return (
                            <div className="border border-slate-200 rounded-xl overflow-x-auto bg-slate-50/50 p-2.5 shadow-2xs">
                              <div className="min-w-[480px]">
                                {/* Shelf level rows (top shelf L3 down to ground shelf L1, so from floor up it starts L1, L2, L3) */}
                                <div className="space-y-2">
                                  {rackLevels.map((lvlNum: number) => (
                                    <div
                                      key={`matrix-lvl-${lvlNum}`}
                                      className="grid gap-2 items-stretch"
                                      style={{
                                        gridTemplateColumns: `85px repeat(${rackBayNums.length}, minmax(110px, 1fr))`,
                                      }}
                                    >
                                      {/* Level row header */}
                                      <div className="flex flex-col justify-center items-end pr-2.5 border-r border-slate-200">
                                        <span className={`font-mono text-xs font-bold ${selectedLevelInt === lvlNum ? 'text-blue-700' : 'text-slate-800'}`}>
                                          L{lvlNum}
                                        </span>
                                        <span className="text-[9px] text-slate-400 uppercase font-semibold">
                                          {lvlNum === Math.max(...rackLevels) ? 'Top' : lvlNum === 1 ? 'Ground' : 'Mid'}
                                        </span>
                                      </div>

                                      {/* Shelf slots for this level */}
                                      {rackBayNums.map((bNum: number) => {
                                        const slot = currentRelocateRackObj?.allSlots?.find((s: any) => s.bayNum === bNum && s.level === lvlNum)
                                        const cellCode = slot?.code || `${currentRelocateRackObj?.code || 'R1'}-${String(bNum).padStart(2, '0')}-${String(lvlNum).padStart(2, '0')}`
                                        const isSelected =
                                          (selectedBayInt === bNum && selectedLevelInt === lvlNum) ||
                                          computedRelocateTarget.code.toUpperCase() === cellCode.toUpperCase() ||
                                          (relocateSlotId && slot?.id === relocateSlotId)
                                        const isOccupied = slot ? slot.isOccupied : false

                                        return (
                                          <button
                                            key={`cell-${bNum}-${lvlNum}`}
                                            type="button"
                                            onClick={() => {
                                              setRelocateTargetRack(currentRelocateRackObj?.code || 'R1')
                                              setRelocateTargetBay(String(bNum))
                                              setRelocateTargetLevel(String(lvlNum))
                                              setRelocateSlotId(slot?.id || null)
                                            }}
                                            className={`p-2 rounded-lg border text-left font-mono text-xs transition cursor-pointer flex flex-col justify-between gap-1 min-h-[56px] ${
                                              isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300 font-bold transform scale-[1.02]'
                                                : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200 hover:border-blue-300'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-1 w-full">
                                              <span className="truncate text-[11px] font-bold">{cellCode}</span>
                                              {isSelected && <span className="text-[10px] font-black">✓</span>}
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] w-full">
                                              <span className={isSelected ? 'text-blue-100' : 'text-slate-400'}>
                                                B{bNum}·L{lvlNum}
                                              </span>
                                              {isSelected ? (
                                                <span className="text-[9px] bg-white text-blue-800 px-1 py-0.2 rounded font-black">Selected</span>
                                              ) : isOccupied ? (
                                                <span className="text-[9px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-medium border border-blue-100">Occupied</span>
                                              ) : (
                                                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-semibold border border-emerald-100">Empty</span>
                                              )}
                                            </div>
                                          </button>
                                        )
                                      })}
                                    </div>
                                  ))}
                                </div>

                                {/* Bay Columns footer row across bottom of the shelf */}
                                <div
                                  className="grid gap-2 mt-2 pt-2 border-t border-slate-200/80 items-center"
                                  style={{
                                    gridTemplateColumns: `85px repeat(${rackBayNums.length}, minmax(110px, 1fr))`,
                                  }}
                                >
                                  <div className="text-right pr-2.5 text-[10px] font-mono font-bold text-slate-400 uppercase">
                                    Tier
                                  </div>
                                  {rackBayNums.map((bNum: number) => (
                                    <div
                                      key={`hdr-bay-${bNum}`}
                                      className={`text-center font-mono font-bold text-xs py-1 px-2 rounded-lg border transition ${
                                        selectedBayInt === bNum
                                          ? 'bg-blue-100 text-blue-900 border-blue-300 font-black shadow-2xs'
                                          : 'bg-white text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      B{bNum}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE 2: GROUND FLOOR STAGING */}
                {relocateTargetType === 'FLOOR' && (
                  <div className="space-y-3.5">
                    {/* Step 1: Select Floor Bay */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Grid className="w-3.5 h-3.5 text-blue-600" />
                          <span>1. Select Ground Floor Staging Area ({relocateWarehouseModel.floors.length || 'Default'}):</span>
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Ideal for pallet racks, staging zones &amp; heavy cartons
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {(relocateWarehouseModel.floors.length > 0
                          ? relocateWarehouseModel.floors
                          : [
                              { code: 'FL-01', name: 'Floor Bay FL-01', slots: [] },
                              { code: 'FL-02', name: 'Floor Bay FL-02', slots: [] },
                            ]
                        ).map((fl: any) => {
                          const isSelected = (relocateTargetFloorBay || 'FL-01') === fl.code
                          const emptyCount = fl.slots?.filter((s: any) => !s.stocks || s.stocks.length === 0).length || 0
                          return (
                            <button
                              key={fl.code}
                              type="button"
                              onClick={() => {
                                setRelocateTargetFloorBay(fl.code)
                                setRelocateTargetFloorSlot(fl.slots?.[0]?.code || `${fl.code}-A1`)
                                setRelocateSlotId(fl.slots?.[0]?.id || null)
                              }}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                                    }`}
                                  >
                                    {fl.code}
                                  </span>
                                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                    {fl.name || `Floor ${fl.code}`}
                                  </span>
                                </div>
                                {isSelected ? (
                                  <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-full shadow-xs">
                                    Selected
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {fl.slots?.length || 0} slots
                                  </span>
                                )}
                              </div>

                              <div
                                className={`text-[11px] flex items-center justify-between w-full ${
                                  isSelected ? 'text-blue-100' : 'text-slate-500'
                                }`}
                              >
                                <span>Staging Area</span>
                                <span
                                  className={`font-semibold ${
                                    isSelected ? 'text-white' : emptyCount > 0 ? 'text-emerald-600' : 'text-slate-400'
                                  }`}
                                >
                                  {emptyCount > 0 ? `${emptyCount} empty` : 'Open'}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Step 2: Floor Bay 2D Grid Structure (Rows × Columns) */}
                    <div className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>2. Select Ground Slot in {relocateTargetFloorBay || 'FL-01'} (Rows × Columns):</span>
                        </div>
                        <div className="text-[11px] font-mono text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1.5">
                          <span className="text-slate-500 font-sans font-medium text-[10px]">Destination:</span>
                          <span>{relocateTargetFloorSlot || relocateTargetFloorBay}</span>
                        </div>
                      </div>

                      {/* 2D Grid Matrix for Floor Bay */}
                      {(() => {
                        const floorSlots = currentRelocateFloorObj?.slots?.length
                          ? currentRelocateFloorObj.slots
                          : [
                              { id: `${relocateTargetFloorBay || 'FL-01'}-A1`, code: `${relocateTargetFloorBay || 'FL-01'}-A1`, stocks: [] },
                              { id: `${relocateTargetFloorBay || 'FL-01'}-A2`, code: `${relocateTargetFloorBay || 'FL-01'}-A2`, stocks: [] },
                              { id: `${relocateTargetFloorBay || 'FL-01'}-B1`, code: `${relocateTargetFloorBay || 'FL-01'}-B1`, stocks: [] },
                              { id: `${relocateTargetFloorBay || 'FL-01'}-B2`, code: `${relocateTargetFloorBay || 'FL-01'}-B2`, stocks: [] },
                            ]
                        const { matrix, rowLabels, colLabels } = compute2DGrid(floorSlots)

                        return (
                          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-slate-50/50 p-2.5 shadow-2xs">
                            <div className="min-w-[460px]">
                              {/* Column Headers */}
                              <div
                                className="grid gap-2 mb-2 items-center"
                                style={{
                                  gridTemplateColumns: `90px repeat(${colLabels.length}, minmax(110px, 1fr))`,
                                }}
                              >
                                <div className="text-right pr-2 text-[10px] font-mono font-bold text-slate-400 uppercase">
                                  Row \ Col
                                </div>
                                {colLabels.map((colName, cIdx) => (
                                  <div
                                    key={`floor-hdr-col-${cIdx}`}
                                    className="text-center font-mono font-bold text-xs py-1 px-2 rounded-lg border bg-white text-slate-700 border-slate-200 shadow-2xs"
                                  >
                                    {colName}
                                  </div>
                                ))}
                              </div>

                              {/* Rows */}
                              <div className="space-y-2">
                                {matrix.map((rowSlots, rIdx) => (
                                  <div
                                    key={`floor-matrix-row-${rIdx}`}
                                    className="grid gap-2 items-stretch"
                                    style={{
                                      gridTemplateColumns: `90px repeat(${colLabels.length}, minmax(110px, 1fr))`,
                                    }}
                                  >
                                    {/* Row Header */}
                                    <div className="flex flex-col justify-center items-end pr-2 border-r border-slate-200">
                                      <span className="font-mono text-xs font-bold text-slate-800">
                                        {rowLabels[rIdx] || `Row ${rIdx + 1}`}
                                      </span>
                                      <span className="text-[9px] text-slate-400 uppercase font-semibold">
                                        Floor Row
                                      </span>
                                    </div>

                                    {/* Slot Cells */}
                                    {rowSlots.map((slot: any, cIdx: number) => {
                                      if (!slot) {
                                        return (
                                          <div
                                            key={`floor-empty-cell-${rIdx}-${cIdx}`}
                                            className="p-2 rounded-lg border border-dashed border-slate-200 bg-slate-100/40 min-h-[56px] flex items-center justify-center text-[10px] text-slate-300 font-mono"
                                          >
                                            —
                                          </div>
                                        )
                                      }
                                      const cellCode = slot.code
                                      const isSelected =
                                        relocateTargetFloorSlot === cellCode ||
                                        computedRelocateTarget.code.toUpperCase() === cellCode.toUpperCase() ||
                                        (relocateSlotId && slot.id === relocateSlotId)
                                      const isOccupied = slot.stocks && slot.stocks.length > 0

                                      return (
                                        <button
                                          key={`floor-cell-${slot.id || cellCode}`}
                                          type="button"
                                          onClick={() => {
                                            setRelocateTargetFloorSlot(cellCode)
                                            setRelocateSlotId(slot.id || null)
                                          }}
                                          className={`p-2 rounded-lg border text-left font-mono text-xs transition cursor-pointer flex flex-col justify-between gap-1 min-h-[56px] ${
                                            isSelected
                                              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300 font-bold transform scale-[1.02]'
                                              : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200 hover:border-blue-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-1 w-full">
                                            <span className="truncate text-[11px] font-bold">{cellCode}</span>
                                            {isSelected && <span className="text-[10px] font-black">✓</span>}
                                          </div>
                                          <div className="flex items-center justify-between text-[10px] w-full">
                                            <span className={isSelected ? 'text-blue-100' : 'text-slate-400'}>
                                              {rowLabels[rIdx]?.replace('Row ', 'R') || `R${rIdx + 1}`}·C{cIdx + 1}
                                            </span>
                                            {isSelected ? (
                                              <span className="text-[9px] bg-white text-blue-800 px-1 py-0.2 rounded font-black">Selected</span>
                                            ) : isOccupied ? (
                                              <span className="text-[9px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-medium border border-blue-100">Occupied</span>
                                            ) : (
                                              <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-semibold border border-emerald-100">Empty</span>
                                            )}
                                          </div>
                                        </button>
                                      )
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Fallback direct coordinate input */}
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Or type slot coordinate:</span>
                        <input
                          type="text"
                          value={relocateTargetFloorSlot}
                          onChange={(e) => {
                            setRelocateTargetFloorSlot(e.target.value)
                            setRelocateSlotId(null)
                          }}
                          placeholder="e.g. FL-01-A1 or FL-01-B2"
                          className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE 3: BULK STORAGE LANE */}
                {relocateTargetType === 'LANE' && (
                  <div className="space-y-3.5">
                    {/* Step 1: Select Bulk Lane */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-blue-600" />
                          <span>1. Select Bulk Lane ({relocateWarehouseModel.lanes.length || 'Default'}):</span>
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Deep storage lanes for bulk pallets &amp; container cargo
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {(relocateWarehouseModel.lanes.length > 0
                          ? relocateWarehouseModel.lanes
                          : [
                              { code: 'BL-01', name: 'Bulk Lane BL-01', slots: [] },
                              { code: 'BL-02', name: 'Bulk Lane BL-02', slots: [] },
                            ]
                        ).map((ln: any) => {
                          const isSelected = (relocateTargetLane || 'BL-01') === ln.code
                          const emptyCount = ln.slots?.filter((s: any) => !s.stocks || s.stocks.length === 0).length || 0
                          return (
                            <button
                              key={ln.code}
                              type="button"
                              onClick={() => {
                                setRelocateTargetLane(ln.code)
                                setRelocateTargetLaneSlot(ln.slots?.[0]?.code || `${ln.code}-01`)
                                setRelocateSlotId(ln.slots?.[0]?.id || null)
                              }}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                                    }`}
                                  >
                                    {ln.code}
                                  </span>
                                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                    {ln.name || `Lane ${ln.code}`}
                                  </span>
                                </div>
                                {isSelected ? (
                                  <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-full shadow-xs">
                                    Selected
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {ln.slots?.length || 0} slots
                                  </span>
                                )}
                              </div>

                              <div
                                className={`text-[11px] flex items-center justify-between w-full ${
                                  isSelected ? 'text-blue-100' : 'text-slate-500'
                                }`}
                              >
                                <span>Bulk Storage</span>
                                <span
                                  className={`font-semibold ${
                                    isSelected ? 'text-white' : emptyCount > 0 ? 'text-emerald-600' : 'text-slate-400'
                                  }`}
                                >
                                  {emptyCount > 0 ? `${emptyCount} empty` : 'Open'}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Step 2: Lane 2D Grid Structure (Tracks × Positions) */}
                    <div className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>2. Select Bulk Slot in {relocateTargetLane || 'BL-01'} (Rows × Columns):</span>
                        </div>
                        <div className="text-[11px] font-mono text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1.5">
                          <span className="text-slate-500 font-sans font-medium text-[10px]">Destination:</span>
                          <span>{relocateTargetLaneSlot || relocateTargetLane}</span>
                        </div>
                      </div>

                      {/* 2D Grid Matrix for Bulk Lane */}
                      {(() => {
                        const laneSlots = currentRelocateLaneObj?.slots?.length
                          ? currentRelocateLaneObj.slots
                          : [
                              { id: `${relocateTargetLane || 'BL-01'}-01`, code: `${relocateTargetLane || 'BL-01'}-01`, stocks: [] },
                              { id: `${relocateTargetLane || 'BL-01'}-02`, code: `${relocateTargetLane || 'BL-01'}-02`, stocks: [] },
                              { id: `${relocateTargetLane || 'BL-01'}-03`, code: `${relocateTargetLane || 'BL-01'}-03`, stocks: [] },
                              { id: `${relocateTargetLane || 'BL-01'}-04`, code: `${relocateTargetLane || 'BL-01'}-04`, stocks: [] },
                            ]
                        const { matrix, rowLabels, colLabels } = compute2DGrid(laneSlots)

                        return (
                          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-slate-50/50 p-2.5 shadow-2xs">
                            <div className="min-w-[460px]">
                              {/* Column Headers */}
                              <div
                                className="grid gap-2 mb-2 items-center"
                                style={{
                                  gridTemplateColumns: `90px repeat(${colLabels.length}, minmax(110px, 1fr))`,
                                }}
                              >
                                <div className="text-right pr-2 text-[10px] font-mono font-bold text-slate-400 uppercase">
                                  Row \ Col
                                </div>
                                {colLabels.map((colName, cIdx) => (
                                  <div
                                    key={`lane-hdr-col-${cIdx}`}
                                    className="text-center font-mono font-bold text-xs py-1 px-2 rounded-lg border bg-white text-slate-700 border-slate-200 shadow-2xs"
                                  >
                                    {colName}
                                  </div>
                                ))}
                              </div>

                              {/* Rows */}
                              <div className="space-y-2">
                                {matrix.map((rowSlots, rIdx) => (
                                  <div
                                    key={`lane-matrix-row-${rIdx}`}
                                    className="grid gap-2 items-stretch"
                                    style={{
                                      gridTemplateColumns: `90px repeat(${colLabels.length}, minmax(110px, 1fr))`,
                                    }}
                                  >
                                    {/* Row Header */}
                                    <div className="flex flex-col justify-center items-end pr-2 border-r border-slate-200">
                                      <span className="font-mono text-xs font-bold text-slate-800">
                                        {rowLabels[rIdx] || `Row ${rIdx + 1}`}
                                      </span>
                                      <span className="text-[9px] text-slate-400 uppercase font-semibold">
                                        Lane Track
                                      </span>
                                    </div>

                                    {/* Slot Cells */}
                                    {rowSlots.map((slot: any, cIdx: number) => {
                                      if (!slot) {
                                        return (
                                          <div
                                            key={`lane-empty-cell-${rIdx}-${cIdx}`}
                                            className="p-2 rounded-lg border border-dashed border-slate-200 bg-slate-100/40 min-h-[56px] flex items-center justify-center text-[10px] text-slate-300 font-mono"
                                          >
                                            —
                                          </div>
                                        )
                                      }
                                      const cellCode = slot.code
                                      const isSelected =
                                        relocateTargetLaneSlot === cellCode ||
                                        computedRelocateTarget.code.toUpperCase() === cellCode.toUpperCase() ||
                                        (relocateSlotId && slot.id === relocateSlotId)
                                      const isOccupied = slot.stocks && slot.stocks.length > 0

                                      return (
                                        <button
                                          key={`lane-cell-${slot.id || cellCode}`}
                                          type="button"
                                          onClick={() => {
                                            setRelocateTargetLaneSlot(cellCode)
                                            setRelocateSlotId(slot.id || null)
                                          }}
                                          className={`p-2 rounded-lg border text-left font-mono text-xs transition cursor-pointer flex flex-col justify-between gap-1 min-h-[56px] ${
                                            isSelected
                                              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300 font-bold transform scale-[1.02]'
                                              : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200 hover:border-blue-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-1 w-full">
                                            <span className="truncate text-[11px] font-bold">{cellCode}</span>
                                            {isSelected && <span className="text-[10px] font-black">✓</span>}
                                          </div>
                                          <div className="flex items-center justify-between text-[10px] w-full">
                                            <span className={isSelected ? 'text-blue-100' : 'text-slate-400'}>
                                              {rowLabels[rIdx]?.replace('Row ', 'R') || `T${rIdx + 1}`}·C{cIdx + 1}
                                            </span>
                                            {isSelected ? (
                                              <span className="text-[9px] bg-white text-blue-800 px-1 py-0.2 rounded font-black">Selected</span>
                                            ) : isOccupied ? (
                                              <span className="text-[9px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-medium border border-blue-100">Occupied</span>
                                            ) : (
                                              <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-semibold border border-emerald-100">Empty</span>
                                            )}
                                          </div>
                                        </button>
                                      )
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Fallback direct coordinate input */}
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Or type slot coordinate:</span>
                        <input
                          type="text"
                          value={relocateTargetLaneSlot}
                          onChange={(e) => {
                            setRelocateTargetLaneSlot(e.target.value)
                            setRelocateSlotId(null)
                          }}
                          placeholder="e.g. BL-01-01 or BL-01-02"
                          className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE 4: CUSTOM LOCATION ENTRY */}
                {relocateTargetType === 'CUSTOM' && (
                  <div className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>✏️ Free-Form Location Coordinates</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Location Code *
                        </label>
                        <input
                          type="text"
                          value={relocateCustomCode}
                          onChange={(e) => setRelocateCustomCode(e.target.value)}
                          placeholder="e.g. R2-01-03 or FL-02-C1"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Location Path (Human-Readable)
                        </label>
                        <input
                          type="text"
                          value={relocateCustomPath}
                          onChange={(e) => setRelocateCustomPath(e.target.value)}
                          placeholder="e.g. Rack R2 > Bay 01 > Level 03"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Target Shelf Live Preview Banner */}
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 flex-wrap shadow-2xs">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        Target Destination Shelf:
                      </div>
                      <div className="text-xs font-bold text-slate-900 font-mono flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-emerald-950 font-black bg-white px-2 py-0.5 rounded border border-emerald-300">
                          {computedRelocateTarget.code}
                        </span>
                        <span className="text-slate-400 font-sans">•</span>
                        <span className="font-sans font-semibold text-slate-700">
                          {computedRelocateTarget.path}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg shadow-2xs">
                    ✓ Ready to relocate
                  </span>
                </div>
              </div>

              {/* Quantity to Move */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Quantity to Relocate (Units) *</label>
                  <button
                    type="button"
                    onClick={() => setRelocateQuantity(relocateMaxQuantity)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Move All ({relocateMaxQuantity.toLocaleString()} pcs)
                  </button>
                </div>
                <input
                  type="number"
                  min={1}
                  max={relocateMaxQuantity}
                  value={relocateQuantity}
                  onChange={(e) => setRelocateQuantity(Math.min(relocateMaxQuantity, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Reason / Audit Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relocation Reason / Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={relocateNotes}
                  onChange={(e) => setRelocateNotes(e.target.value)}
                  placeholder="e.g., Reorganizing aisle, moving fast-moving items to lower shelf..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRelocateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={relocateSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  {relocateSubmitting ? 'Relocating...' : 'Confirm Relocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Unload & Shelve Container Cargo Dialog */}
      {selectedContainerToReceive && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                  <Ship className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Inbound Cargo Receipt
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-mono">Container Transit Base</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Unload Container: {selectedContainerToReceive.containerNumber}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContainerToReceive(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* SECTION 1: Container Transport & Transit Base Information */}
            <div className="mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-blue-600" />
                <span>Container Transport &amp; Transit Base</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-slate-400 mb-0.5">Container &amp; Seal #</div>
                  <div className="font-bold text-slate-900 font-mono text-sm">{selectedContainerToReceive.containerNumber}</div>
                  <div className="text-blue-600 font-medium mt-0.5">
                    Seal: #{selectedContainerToReceive.sealNumber || 'Verified Seal'}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-slate-400 mb-0.5">Transit Route &amp; Operator</div>
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {selectedContainerToReceive.origin} ➔ {selectedContainerToReceive.destination}
                  </div>
                  <div className="text-slate-500 truncate mt-0.5">
                    {(typeof selectedContainerToReceive.carrier === 'string'
                      ? selectedContainerToReceive.carrier
                      : selectedContainerToReceive.carrier?.name) ||
                      selectedContainerToReceive.shippingLine ||
                      'Ocean / Rail Freight Express'}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-slate-400 mb-0.5">Manifest Summary &amp; Status</div>
                  <div className="font-bold text-slate-900 font-mono text-sm">
                    {selectedContainerToReceive.items.reduce((acc, i) => acc + (i.quantity || 0), 0).toLocaleString()} pcs
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-mono">
                      {selectedContainerToReceive.status}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      • {selectedContainerToReceive.items.length} line items
                    </span>
                  </div>
                </div>
              </div>

              {/* Destination Warehouse Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Warehouse Hub for Received Cargo *
                </label>
                <select
                  value={containerTargetWarehouseId}
                  onChange={(e) => {
                    setContainerTargetWarehouseId(e.target.value)
                    setSelectedSlotCodes([])
                    if (!warehouseLayoutCache[e.target.value]) {
                      fetchWarehouseLayoutForStock(e.target.value)
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {belarusWarehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      🇧🇾 {w.name} ({w.code} - {w.country}) {w.isDefaultSales ? '★ Default Sales DC' : ''}
                    </option>
                  ))}
                  {displayedWarehouses.filter((w) => !belarusWarehouses.some((bw) => bw.id === w.id)).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.country === 'China' || w.code.startsWith('CN') ? '🇨🇳' : '🌐'} {w.name} ({w.code} - {w.country})
                    </option>
                  ))}
                  {displayedWarehouses.length === 0 &&
                    warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code} - {w.country})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* SECTION 2: Physical Storage Location Coordinates (RACK, LANE, FLOOR & EXACT SLOTS) */}
            <div className="mb-5 bg-gradient-to-b from-blue-50/70 to-indigo-50/40 p-4 rounded-2xl border border-blue-200/90 space-y-3.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-100">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-950">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Physical Shelving Coordinates &amp; Exact Slot Selection</span>
                </div>
                {/* Location Mode Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode('RACK')
                      if (warehouseModel.racks.length > 0 && !selectedRack) {
                        setSelectedRack(warehouseModel.racks[0].code)
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      locationMode === 'RACK'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Rack Shelving ({warehouseModel.racks.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode('FLOOR')
                      if (warehouseModel.floors.length > 0 && !receiveFloor) {
                        setReceiveFloor(warehouseModel.floors[0].code)
                      }
                      setSelectedSlotCodes([])
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      locationMode === 'FLOOR'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Ground Floor ({warehouseModel.floors.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode('LANE')
                      if (warehouseModel.lanes.length > 0 && !receiveLane) {
                        setReceiveLane(warehouseModel.lanes[0].code)
                      }
                      setSelectedSlotCodes([])
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      locationMode === 'LANE'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Bulk Lane ({warehouseModel.lanes.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode('CUSTOM')
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                      locationMode === 'CUSTOM'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'
                    }`}
                  >
                    <span>✏️ Custom</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReceiveLane('')
                      setReceiveRack('')
                      setReceiveFloor('')
                      setSelectedSlotCodes([])
                      setItemCustomSlots({})
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-600 underline ml-1"
                  >
                    Clear / General Floor
                  </button>
                </div>
              </div>

              {layoutLoading && (
                <div className="flex items-center gap-2 text-xs text-blue-700 py-1 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading warehouse layout hierarchy and addressable slots...</span>
                </div>
              )}

              {/* MODE 1: RACK SHELVING (DROPDOWNS & EXACT SLOTS) */}
              {locationMode === 'RACK' && (
                <div className="space-y-3">
                  {/* Visual interactive list of RACKS */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-blue-600" />
                        <span>Select Rack / Shelving Unit ({warehouseModel.racks.length}):</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Click a rack to view its exact Bay × Level structure &amp; slots below
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {warehouseModel.racks.map((r: any) => {
                        const isSelected = (selectedRack || warehouseModel.racks[0]?.code) === r.code
                        const emptyCount = r.allSlots.filter((s: any) => !s.isOccupied).length
                        return (
                          <button
                            key={r.code}
                            type="button"
                            onClick={() => {
                              setSelectedRack(r.code)
                              setSelectedBay('')
                              setSelectedLevel('')
                              setSelectedSlotCodes([])
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                                  }`}
                                >
                                  {r.code}
                                </span>
                                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                  {r.title}
                                </span>
                              </div>
                              {isSelected ? (
                                <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-full shadow-xs">
                                  Selected
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">
                                  {r.allSlots.length} slots
                                </span>
                              )}
                            </div>

                            <div
                              className={`text-[11px] flex items-center justify-between w-full ${
                                isSelected ? 'text-blue-100' : 'text-slate-500'
                              }`}
                            >
                              <span>
                                {r.bays.length} Bays • {r.levels.length} Levels
                              </span>
                              <span
                                className={`font-semibold ${
                                  isSelected
                                    ? 'text-white'
                                    : emptyCount > 0
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                                }`}
                              >
                                {emptyCount} empty
                              </span>
                            </div>
                          </button>
                        )
                      })}
                      {warehouseModel.racks.length === 0 && (
                        <div className="col-span-full py-4 text-center text-xs text-slate-400 italic bg-white rounded-xl border border-slate-200">
                          No racks configured in this warehouse hub yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* EXACT SLOTS BOARD: Visual Interactive Bay × Level Matrix Grid */}
                  <div className="bg-white p-3 rounded-xl border border-blue-200/90 shadow-2xs space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-mono">
                          {currentRackObj?.code || 'R1'}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {currentRackObj?.title || `Rack ${currentRackObj?.code || 'R1'}`}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                          {currentRackObj?.bays?.length || rackGridData.bayNumbers.length || 0} Bays
                        </span>
                        {selectedSlotCodes.length > 0 && (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                            {selectedSlotCodes.length} Selected
                          </span>
                        )}
                      </div>

                      {/* Multi-slot selection buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSelectAllEmptySlots}
                          className="text-[11px] font-medium px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition flex items-center gap-1"
                          title="Select all empty slots in this rack"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Select Empty ({displayedSlots.filter((s: any) => !s.isOccupied).length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSelectAllFilteredSlots}
                          className="text-[11px] font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                        >
                          Select All ({displayedSlots.length})
                        </button>

                        {selectedSlotCodes.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearSelectedSlots}
                            className="text-[11px] font-medium px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Summary metrics matching warehouse settings layout */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pb-1 border-b border-slate-100">
                      <span>
                        Bays Count: <strong className="text-slate-700">{currentRackObj?.bays?.length || rackGridData.bayNumbers.length || 0}</strong> • Levels / Tiers (1 - 10): <strong className="text-slate-700">{rackGridData.levelNumbers.length || currentRackObj?.levels?.length || 0}</strong>
                      </span>
                      <span>
                        Addressable Slots: <strong className="text-slate-700">{currentRackObj?.allSlots?.length || 0}</strong>
                      </span>
                    </div>

                    {/* Shelves & Slots Addressing — Bay (Columns) × Level (Rows) Matrix Grid */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          SHELVES &amp; SLOTS ADDRESSING:
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Bays horizontal (columns) • Levels vertical (ground L1 up to top shelf)
                        </div>
                      </div>

                      {rackGridData.bayNumbers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 italic">
                          No addressable slots configured in this rack.
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-64 overflow-y-auto pr-1 pb-1">
                          {/* Level rows vertically (L3 down to L1, so ground up is L1, L2, L3) */}
                          {rackGridData.levelNumbers.map((lv: number) => {
                            const isLevelFiltered = selectedLevel && String(selectedLevel) === String(lv)

                            return (
                              <div
                                key={lv}
                                className="grid items-center gap-1.5 mb-1.5"
                                style={{
                                  gridTemplateColumns: `42px repeat(${rackGridData.bayNumbers.length}, minmax(88px, 1fr))`,
                                }}
                              >
                                {/* Level label down the left */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleLevelSlots(lv)}
                                  title={`Click to toggle all slots on Level ${lv}`}
                                  className={`text-[10px] font-bold pr-2 text-right whitespace-nowrap py-1 rounded transition cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 ${
                                    isLevelFiltered ? 'text-blue-700 bg-blue-50 font-extrabold' : 'text-slate-400'
                                  }`}
                                >
                                  L{lv}
                                </button>

                                {/* Bay slot cells across horizontally */}
                                {rackGridData.bayNumbers.map((bay: number) => {
                                  const slot = rackGridData.bayMap.get(bay)?.get(lv)
                                  if (!slot) {
                                    return (
                                      <div
                                        key={bay}
                                        className="h-11 rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
                                      />
                                    )
                                  }

                                  const isSelected = selectedSlotCodes.includes(slot.code)
                                  const isBayFiltered =
                                    selectedBay &&
                                    (selectedBay === `B-${String(bay).padStart(2, '0')}` ||
                                      selectedBay === String(bay) ||
                                      selectedBay.endsWith(String(bay)))
                                  const isMatchingFilter =
                                    (!selectedBay || isBayFiltered) &&
                                    (!selectedLevel || String(selectedLevel) === String(lv))

                                  return (
                                    <button
                                      key={bay}
                                      type="button"
                                      onClick={() => handleToggleSlotCode(slot.code)}
                                      className={`px-1.5 py-1 rounded-lg text-[10px] font-mono border transition-all flex flex-col items-center justify-center gap-0.5 min-h-[44px] relative cursor-pointer group ${
                                        isSelected
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300 font-bold'
                                          : slot.isOccupied
                                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 font-semibold hover:border-blue-400'
                                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                      } ${!isMatchingFilter ? 'opacity-40 hover:opacity-100' : ''}`}
                                      title={`Slot: ${slot.code} • ${slot.isOccupied ? `${slot.stocksCount} in stock` : 'Empty'}`}
                                    >
                                      <div className="flex items-center gap-1">
                                        {isSelected ? (
                                          <Check className="w-3 h-3 text-white stroke-[3]" />
                                        ) : (
                                          <Tag
                                            size={9}
                                            className={
                                              slot.isOccupied
                                                ? 'text-emerald-500'
                                                : 'text-slate-300 group-hover:text-blue-500'
                                            }
                                          />
                                        )}
                                        <span className="leading-none text-[10px] tracking-tight">{slot.code}</span>
                                      </div>

                                      <div className="flex items-center gap-1 text-[8px] leading-tight">
                                        {isSelected ? (
                                          <span className="text-blue-100 font-sans font-bold">Selected</span>
                                        ) : slot.isOccupied ? (
                                          <span className="text-emerald-700 flex items-center gap-0.5 font-sans">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <span>{slot.stocksCount} stock</span>
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-sans">Empty</span>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )
                          })}

                          {/* Bay column headers across bottom of shelf */}
                          <div
                            className="grid text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1.5 border-t border-slate-200/80"
                            style={{
                              gridTemplateColumns: `42px repeat(${rackGridData.bayNumbers.length}, minmax(88px, 1fr))`,
                            }}
                          >
                            <div className="pr-2 text-right text-[9px] text-slate-400 font-bold self-center">TIER</div>
                            {rackGridData.bayNumbers.map((bay: number) => {
                              const isBayFiltered =
                                selectedBay &&
                                (selectedBay === `B-${String(bay).padStart(2, '0')}` ||
                                  selectedBay === String(bay) ||
                                  selectedBay.endsWith(String(bay)))
                              return (
                                <button
                                  key={bay}
                                  type="button"
                                  onClick={() => handleToggleBaySlots(bay)}
                                  title={`Click to toggle all slots in Bay ${bay}`}
                                  className={`text-center py-1 rounded transition font-bold cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 ${
                                    isBayFiltered ? 'text-blue-700 bg-blue-50 font-extrabold' : 'text-slate-600'
                                  }`}
                                >
                                  B{bay}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Multi-slot high-productivity distribution strip */}
                    {selectedSlotCodes.length > 0 && (
                      <div className="pt-2 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-blue-50/60 -mx-3 -mb-3 p-2.5 rounded-b-xl">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-blue-900">
                            ✓ {selectedSlotCodes.length} Slot{selectedSlotCodes.length > 1 ? 's' : ''} Selected:
                          </span>
                          <span className="font-mono font-semibold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 max-w-sm truncate">
                            {selectedSlotCodes.join(', ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDistributeSlotsAcrossItems}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 transition"
                            title="Distribute 1 slot per product line item"
                          >
                            <span>⚡ Distribute 1 Slot / Item</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleApplyBatchToAllItems}
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-bold text-[11px] border border-blue-300 transition"
                            title="Assign this multi-slot batch to all line items"
                          >
                            <span>📍 Apply to All</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 2: GROUND FLOOR STAGING */}
              {locationMode === 'FLOOR' && (
                <div className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-blue-600" />
                      <span>Select Ground Floor Staging Area ({warehouseModel.floors.length}):</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Ideal for heavy pallets, oversized cargo &amp; rapid cross-docking
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {warehouseModel.floors.map((fl: any) => {
                      const isSelected = receiveFloor === fl.code
                      const emptyCount = fl.slots?.filter((s: any) => !s.stocks || s.stocks.length === 0).length || 0
                      return (
                        <button
                          key={fl.code}
                          type="button"
                          onClick={() => {
                            setReceiveFloor(fl.code)
                            setReceiveRack('')
                            setReceiveLane('')
                            setSelectedSlotCodes([])
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}
                              >
                                {fl.code}
                              </span>
                              <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {fl.name || `Floor ${fl.code}`}
                              </span>
                            </div>
                            {isSelected ? (
                              <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-full shadow-xs">
                                Selected
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">
                                {fl.slots?.length || 0} slots
                              </span>
                            )}
                          </div>

                          <div
                            className={`text-[11px] flex items-center justify-between w-full ${
                              isSelected ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            <span>Staging Zone</span>
                            <span
                              className={`font-semibold ${
                                isSelected ? 'text-white' : emptyCount > 0 ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {emptyCount} empty
                            </span>
                          </div>
                        </button>
                      )
                    })}
                    {warehouseModel.floors.length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                        No ground floor zones configured in this hub.
                      </div>
                    )}
                  </div>

                  {/* EXACT SLOTS BOARD: Visual Interactive Ground Floor Col × Row Matrix Grid */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md font-mono">
                          {currentFloorObj?.code || receiveFloor}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {currentFloorObj?.name || `Floor ${currentFloorObj?.code || receiveFloor}`}
                        </span>
                        {selectedSlotCodes.length > 0 && (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                            {selectedSlotCodes.length} Selected
                          </span>
                        )}
                      </div>

                      {/* Multi-slot selection buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSelectAllEmptySlots}
                          className="text-[11px] font-medium px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                          title="Select all empty slots in this floor zone"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Select Empty ({displayedSlots.filter((s: any) => !s.isOccupied).length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSelectAllFilteredSlots}
                          className="text-[11px] font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                        >
                          Select All ({displayedSlots.length})
                        </button>

                        {selectedSlotCodes.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearSelectedSlots}
                            className="text-[11px] font-medium px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md transition cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Summary metrics matching warehouse rack/floor layout */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pb-1 border-b border-slate-100">
                      <span>
                        Rows (Depth): <strong className="text-slate-700">{floorGridData.rowNumbers.length}</strong> • Columns (Width): <strong className="text-slate-700">{floorGridData.colNumbers.length}</strong>
                      </span>
                      <span>
                        Addressable Slots: <strong className="text-slate-700">{currentFloorObj?.slots?.length || displayedSlots.length}</strong>
                      </span>
                    </div>

                    {/* Ground Floor Staging Slots Matrix (COL × ROW) */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        FLOOR STAGING SLOTS ADDRESSING (COL × ROW MATRIX):
                      </div>

                      {floorGridData.rowNumbers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 italic">
                          No addressable ground slots configured in this floor zone.
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-64 overflow-y-auto pr-1 pb-1">
                          {/* Column headers row */}
                          <div
                            className="grid text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"
                            style={{
                              gridTemplateColumns: `36px repeat(${floorGridData.colNumbers.length}, minmax(88px, 1fr))`,
                            }}
                          >
                            <div className="pr-2 text-right"></div>
                            {floorGridData.colNumbers.map((colNum: number) => (
                              <button
                                key={colNum}
                                type="button"
                                onClick={() => handleToggleFloorCol(colNum)}
                                title={`Click to toggle all slots in Column ${colNum}`}
                                className="text-center py-0.5 rounded transition font-bold cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 text-slate-400"
                              >
                                C{colNum}
                              </button>
                            ))}
                          </div>

                          {/* Row rows */}
                          {floorGridData.rowNumbers.map((rowNum: number) => {
                            const rowLabel = floorGridData.rowLabels[rowNum - 1] || `R${rowNum}`
                            return (
                              <div
                                key={rowNum}
                                className="grid items-center gap-1.5 mb-1.5"
                                style={{
                                  gridTemplateColumns: `36px repeat(${floorGridData.colNumbers.length}, minmax(88px, 1fr))`,
                                }}
                              >
                                {/* Row label */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleFloorRow(rowNum)}
                                  title={`Click to toggle all slots in ${rowLabel}`}
                                  className="text-[10px] font-bold pr-2 text-right whitespace-nowrap py-1 rounded transition cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 text-slate-400"
                                >
                                  {rowLabel}
                                </button>

                                {/* Slot cells */}
                                {floorGridData.colNumbers.map((colNum: number) => {
                                  const slot = floorGridData.matrix[rowNum - 1]?.[colNum - 1]
                                  if (!slot) {
                                    return (
                                      <div
                                        key={colNum}
                                        className="h-11 rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
                                      />
                                    )
                                  }

                                  const isSelected = selectedSlotCodes.includes(slot.code)

                                  return (
                                    <button
                                      key={slot.code}
                                      type="button"
                                      onClick={() => handleToggleSlotCode(slot.code)}
                                      className={`px-1.5 py-1 rounded-lg text-[10px] font-mono border transition-all flex flex-col items-center justify-center gap-0.5 min-h-[44px] relative cursor-pointer group ${
                                        isSelected
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300 font-bold'
                                          : slot.isOccupied
                                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 font-semibold hover:border-blue-400'
                                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                      }`}
                                      title={`Slot: ${slot.code} • ${slot.isOccupied ? `${slot.stocksCount} in stock` : 'Empty'}`}
                                    >
                                      <div className="flex items-center gap-1">
                                        {isSelected ? (
                                          <Check className="w-3 h-3 text-white stroke-[3]" />
                                        ) : (
                                          <Tag
                                            size={9}
                                            className={
                                              slot.isOccupied
                                                ? 'text-emerald-500'
                                                : 'text-slate-300 group-hover:text-blue-500'
                                            }
                                          />
                                        )}
                                        <span className="leading-none text-[10px] tracking-tight">{slot.code}</span>
                                      </div>

                                      <div className="flex items-center gap-1 text-[8px] leading-tight">
                                        {isSelected ? (
                                          <span className="text-blue-100 font-sans font-bold">Selected</span>
                                        ) : slot.isOccupied ? (
                                          <span className="text-emerald-700 flex items-center gap-0.5 font-sans">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <span>{slot.stocksCount} stock</span>
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-sans">Empty</span>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Multi-slot high-productivity distribution strip */}
                    {selectedSlotCodes.length > 0 && (
                      <div className="pt-2 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-blue-50/60 -mx-3.5 -mb-3.5 p-2.5 rounded-b-xl">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-blue-900">
                            ✓ {selectedSlotCodes.length} Slot{selectedSlotCodes.length > 1 ? 's' : ''} Selected:
                          </span>
                          <span className="font-mono font-semibold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 max-w-sm truncate">
                            {selectedSlotCodes.join(', ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDistributeSlotsAcrossItems}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 transition cursor-pointer"
                            title="Distribute 1 slot per product line item"
                          >
                            <span>⚡ Distribute 1 Slot / Item</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleApplyBatchToAllItems}
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-bold text-[11px] border border-blue-300 transition cursor-pointer"
                            title="Assign this multi-slot batch to all line items"
                          >
                            <span>📍 Apply to All</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 3: BULK SHIPPING LANE */}
              {locationMode === 'LANE' && (
                <div className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Select Bulk Shipping Lane / Aisle ({warehouseModel.lanes.length}):</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Direct truck/container staging &amp; bulk consolidation
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {warehouseModel.lanes.map((ln: any) => {
                      const isSelected = receiveLane === ln.code
                      const emptyCount = ln.slots?.filter((s: any) => !s.stocks || s.stocks.length === 0).length || 0
                      return (
                        <button
                          key={ln.code}
                          type="button"
                          onClick={() => {
                            setReceiveLane(ln.code)
                            setReceiveRack('')
                            setReceiveFloor('')
                            setSelectedSlotCodes([])
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}
                              >
                                {ln.code}
                              </span>
                              <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {ln.name || `Lane ${ln.code}`}
                              </span>
                            </div>
                            {isSelected ? (
                              <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-full shadow-xs">
                                Selected
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">
                                {ln.slots?.length || 0} slots
                              </span>
                            )}
                          </div>

                          <div
                            className={`text-[11px] flex items-center justify-between w-full ${
                              isSelected ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            <span>Loading Lane</span>
                            <span
                              className={`font-semibold ${
                                isSelected ? 'text-white' : emptyCount > 0 ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {emptyCount} empty
                            </span>
                          </div>
                        </button>
                      )
                    })}
                    {warehouseModel.lanes.length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                        No bulk lanes configured in this hub.
                      </div>
                    )}
                  </div>

                  {/* EXACT SLOTS BOARD: Visual Interactive Bulk Lane Col × Row Matrix Grid */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-mono">
                          {currentLaneObj?.code || receiveLane}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {currentLaneObj?.name || `Lane ${currentLaneObj?.code || receiveLane}`}
                        </span>
                        {selectedSlotCodes.length > 0 && (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                            {selectedSlotCodes.length} Selected
                          </span>
                        )}
                      </div>

                      {/* Multi-slot selection buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSelectAllEmptySlots}
                          className="text-[11px] font-medium px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                          title="Select all empty slots in this shipping lane"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Select Empty ({displayedSlots.filter((s: any) => !s.isOccupied).length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSelectAllFilteredSlots}
                          className="text-[11px] font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                        >
                          Select All ({displayedSlots.length})
                        </button>

                        {selectedSlotCodes.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearSelectedSlots}
                            className="text-[11px] font-medium px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md transition cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Summary metrics matching warehouse lane layout */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pb-1 border-b border-slate-100">
                      <span>
                        Rows (Depth): <strong className="text-slate-700">{laneGridData.rowNumbers.length}</strong> • Columns (Width): <strong className="text-slate-700">{laneGridData.colNumbers.length}</strong>
                      </span>
                      <span>
                        Addressable Slots: <strong className="text-slate-700">{currentLaneObj?.slots?.length || displayedSlots.length}</strong>
                      </span>
                    </div>

                    {/* Bulk Shipping Lane Slots Matrix (COL × ROW) */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        BULK LANE SLOTS ADDRESSING (COL × ROW MATRIX):
                      </div>

                      {laneGridData.rowNumbers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 italic">
                          No addressable slots configured in this bulk lane.
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-64 overflow-y-auto pr-1 pb-1">
                          {/* Column headers row */}
                          <div
                            className="grid text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"
                            style={{
                              gridTemplateColumns: `36px repeat(${laneGridData.colNumbers.length}, minmax(88px, 1fr))`,
                            }}
                          >
                            <div className="pr-2 text-right"></div>
                            {laneGridData.colNumbers.map((colNum: number) => (
                              <button
                                key={colNum}
                                type="button"
                                onClick={() => handleToggleLaneCol(colNum)}
                                title={`Click to toggle all slots in Column ${colNum}`}
                                className="text-center py-0.5 rounded transition font-bold cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 text-slate-400"
                              >
                                C{colNum}
                              </button>
                            ))}
                          </div>

                          {/* Row rows */}
                          {laneGridData.rowNumbers.map((rowNum: number) => {
                            const rowLabel = laneGridData.rowLabels[rowNum - 1] || `R${rowNum}`
                            return (
                              <div
                                key={rowNum}
                                className="grid items-center gap-1.5 mb-1.5"
                                style={{
                                  gridTemplateColumns: `36px repeat(${laneGridData.colNumbers.length}, minmax(88px, 1fr))`,
                                }}
                              >
                                {/* Row label */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleLaneRow(rowNum)}
                                  title={`Click to toggle all slots in ${rowLabel}`}
                                  className="text-[10px] font-bold pr-2 text-right whitespace-nowrap py-1 rounded transition cursor-pointer hover:text-blue-600 hover:bg-blue-50/70 text-slate-400"
                                >
                                  {rowLabel}
                                </button>

                                {/* Slot cells */}
                                {laneGridData.colNumbers.map((colNum: number) => {
                                  const slot = laneGridData.matrix[rowNum - 1]?.[colNum - 1]
                                  if (!slot) {
                                    return (
                                      <div
                                        key={colNum}
                                        className="h-11 rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
                                      />
                                    )
                                  }

                                  const isSelected = selectedSlotCodes.includes(slot.code)

                                  return (
                                    <button
                                      key={slot.code}
                                      type="button"
                                      onClick={() => handleToggleSlotCode(slot.code)}
                                      className={`px-1.5 py-1 rounded-lg text-[10px] font-mono border transition-all flex flex-col items-center justify-center gap-0.5 min-h-[44px] relative cursor-pointer group ${
                                        isSelected
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-300 font-bold'
                                          : slot.isOccupied
                                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 font-semibold hover:border-blue-400'
                                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                      }`}
                                      title={`Slot: ${slot.code} • ${slot.isOccupied ? `${slot.stocksCount} in stock` : 'Empty'}`}
                                    >
                                      <div className="flex items-center gap-1">
                                        {isSelected ? (
                                          <Check className="w-3 h-3 text-white stroke-[3]" />
                                        ) : (
                                          <Tag
                                            size={9}
                                            className={
                                              slot.isOccupied
                                                ? 'text-emerald-500'
                                                : 'text-slate-300 group-hover:text-blue-500'
                                            }
                                          />
                                        )}
                                        <span className="leading-none text-[10px] tracking-tight">{slot.code}</span>
                                      </div>

                                      <div className="flex items-center gap-1 text-[8px] leading-tight">
                                        {isSelected ? (
                                          <span className="text-blue-100 font-sans font-bold">Selected</span>
                                        ) : slot.isOccupied ? (
                                          <span className="text-emerald-700 flex items-center gap-0.5 font-sans">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <span>{slot.stocksCount} stock</span>
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-sans">Empty</span>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Multi-slot high-productivity distribution strip */}
                    {selectedSlotCodes.length > 0 && (
                      <div className="pt-2 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-blue-50/60 -mx-3.5 -mb-3.5 p-2.5 rounded-b-xl">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-blue-900">
                            ✓ {selectedSlotCodes.length} Slot{selectedSlotCodes.length > 1 ? 's' : ''} Selected:
                          </span>
                          <span className="font-mono font-semibold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 max-w-sm truncate">
                            {selectedSlotCodes.join(', ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDistributeSlotsAcrossItems}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 transition cursor-pointer"
                            title="Distribute 1 slot per product line item"
                          >
                            <span>⚡ Distribute 1 Slot / Item</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleApplyBatchToAllItems}
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-bold text-[11px] border border-blue-300 transition cursor-pointer"
                            title="Assign this multi-slot batch to all line items"
                          >
                            <span>📍 Apply to All</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 4: CUSTOM COORDINATES */}
              {locationMode === 'CUSTOM' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lane / Aisle
                    </label>
                    <input
                      type="text"
                      value={receiveLane}
                      onChange={(e) => setReceiveLane(e.target.value)}
                      placeholder="e.g., 1, 2, A"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['1', '2', '3', '4', 'A', 'B'].map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setReceiveLane(l)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition ${
                            receiveLane === l
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          Lane {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rack / Bay
                    </label>
                    <input
                      type="text"
                      value={receiveRack}
                      onChange={(e) => setReceiveRack(e.target.value)}
                      placeholder="e.g., A-01, B-02"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['A-01', 'A-02', 'B-01', 'B-02', 'R1', 'R2'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setReceiveRack(r)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition ${
                            receiveRack === r
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          Rack {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Floor / Level
                    </label>
                    <input
                      type="text"
                      value={receiveFloor}
                      onChange={(e) => setReceiveFloor(e.target.value)}
                      placeholder="e.g., 1, 2, 3"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['1', '2', '3', '4'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setReceiveFloor(f)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition ${
                            receiveFloor === f
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          Floor {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Live Location Preview Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80">
                <div className="flex items-center gap-2 text-xs text-emerald-950 font-medium flex-wrap">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Assigned Shelving Location:{' '}
                    {selectedSlotCodes.length > 0 ? (
                      <strong className="font-bold text-emerald-900 font-mono">
                        Rack {selectedRack || receiveRack || 'R1'} &gt; Slots: [{selectedSlotCodes.join(', ')}]
                      </strong>
                    ) : receiveLane || receiveRack || receiveFloor ? (
                      <strong className="font-bold text-emerald-900">
                        {receiveRack ? `Rack ${receiveRack}` : ''}
                        {receiveLane ? ` > Bay/Lane ${receiveLane}` : ''}
                        {receiveFloor ? ` > Level ${receiveFloor}` : ''}
                      </strong>
                    ) : (
                      <em className="text-slate-500 font-normal">General Warehouse Floor (Unassigned)</em>
                    )}
                  </span>
                </div>
                {(selectedSlotCodes.length > 0 || receiveLane || receiveRack || receiveFloor) && (
                  <span className="text-[11px] font-mono bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded font-bold">
                    {selectedSlotCodes.length > 0
                      ? `Slots: ${selectedSlotCodes.join(', ')}`
                      : `Code: L-${receiveLane || '?'}/R-${receiveRack || '?'}/F-${receiveFloor || '?'}`}
                  </span>
                )}
              </div>
            </div>

            {/* SECTION 3: Line Items Receiving Table with Slot Assignments */}
            <div className="mb-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Verify Quantities &amp; Assign to Shelving Slots
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Each product can go into the batch slots or be assigned to a specific shelf slot below
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleFillAllRemaining}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition"
                  >
                    <span>⚡ 1-Click: Receive 100% Remaining</span>
                  </button>

                  {selectedSlotCodes.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handleEqualSplitAcrossItemsAndSlots}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold border border-blue-300 transition cursor-pointer"
                        title={`Divide remaining quantities equally across selected slots (${selectedSlotCodes.join(', ')}) on all items`}
                      >
                        <span>⚡ Equal Split on All Items (÷{selectedSlotCodes.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDistributeSlotsAcrossItems}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-300 transition cursor-pointer"
                        title="Distribute 1 slot per item"
                      >
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Distribute 1 Slot / Item</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-2 min-w-[150px] max-w-[200px]">Product / SKU</th>
                      <th className="py-2 px-1.5 text-right whitespace-nowrap w-12" title="Manifested Quantity">Manifest</th>
                      <th className="py-2 px-1.5 text-right whitespace-nowrap w-12" title="Previously Shelved">Shelved</th>
                      <th className="py-2 px-1.5 text-right whitespace-nowrap w-12 text-amber-700" title="Remaining Sound Quantity to Receive">Rem.</th>
                      <th className="py-2 px-2.5">Assigned Shelving Slot &amp; Intake</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedContainerToReceive.items.map((item, itemIdx) => {
                      const lineReceived = item.receivedQuantity ?? item.receivedQty ?? 0
                      const lineDamagedPrev = item.damagedQty || 0
                      const remainingRaw = Math.max(0, item.quantity - lineReceived - lineDamagedPrev)
                      const currentDamaged = itemDamagedQty[item.id] || 0
                      const remainingGood = Math.max(0, remainingRaw - currentDamaged)

                      const productName = item.product?.name || item.productName || 'Line Item'
                      const productSku = item.product?.sku || item.productSku || 'SKU'
                      const itemCustom = itemCustomSlots[item.id]
                      const allocations = itemCustom?.allocations || []
                      const totalAllocated = allocations.reduce((sum: number, a: any) => sum + (a.quantity || 0), 0)
                      const unassignedRemainder = allocations.length > 0 ? Math.max(0, remainingGood - totalAllocated) : 0

                      // Parse slot coordinates into Bay / Level structure matching warehouse matrix
                      const parseSlotCoord = (rawCode: string) => {
                        if (!rawCode) return { groupLabel: 'Floor', levelLabel: 'General DC Floor', fullLabel: 'General DC Floor' }
                        const cleanCode = rawCode.includes(':') ? rawCode.split(':').pop()!.trim() : rawCode.trim()
                        // Rack format: R1-01-03 or R2-04-02 -> Rack R2, Bay 4 (B4), Level 2 (L2)
                        const rackMatch = cleanCode.match(/^([A-Z0-9]+)-(\d+)-(\d+)$/i)
                        if (rackMatch) {
                          const rackName = rackMatch[1]
                          const bayNum = parseInt(rackMatch[2], 10)
                          const levelNum = parseInt(rackMatch[3], 10)
                          return {
                            rackName,
                            groupLabel: `B${bayNum}`,
                            levelLabel: `L${levelNum}`,
                            fullLabel: `Rack ${rackName} · Bay ${bayNum} · Level ${levelNum} [${cleanCode}]`,
                            badgeLabel: `${rackName}-B${bayNum}-L${levelNum}`,
                          }
                        }
                        // Floor 2D format: FL-01-A1 -> Row A, Col 1
                        const floor2DMatch = cleanCode.match(/^([A-Z0-9]+-[A-Z0-9]+)-([A-Z]+)(\d+)$/i)
                        if (floor2DMatch) {
                          return {
                            rackName: floor2DMatch[1],
                            groupLabel: `Row ${floor2DMatch[2]}`,
                            levelLabel: `C${floor2DMatch[3]}`,
                            fullLabel: `Floor ${floor2DMatch[1]} · Row ${floor2DMatch[2]} · Col ${floor2DMatch[3]} [${cleanCode}]`,
                            badgeLabel: cleanCode,
                          }
                        }
                        // Floor 1D format: FL-01-A
                        const floor1DMatch = cleanCode.match(/^([A-Z0-9]+-[A-Z0-9]+)-([A-Z0-9]+)$/i)
                        if (floor1DMatch) {
                          return {
                            rackName: floor1DMatch[1],
                            groupLabel: floor1DMatch[1],
                            levelLabel: `Slot ${floor1DMatch[2]}`,
                            fullLabel: `Floor ${floor1DMatch[1]} · Slot ${floor1DMatch[2]}`,
                            badgeLabel: cleanCode,
                          }
                        }
                        return { groupLabel: 'Floor', levelLabel: cleanCode, fullLabel: cleanCode, badgeLabel: cleanCode }
                      }

                      // Group allocated slots by their Bay / Row header to mirror the Shelves & Slots addressing grid
                      const groupAllocationsByBay = (allocs: any[]) => {
                        const groups: { [key: string]: { bayLabel: string; items: any[] } } = {}
                        allocs.forEach((a: any) => {
                          const { groupLabel, levelLabel } = parseSlotCoord(a.slotCode)
                          if (!groups[groupLabel]) {
                            groups[groupLabel] = { bayLabel: groupLabel, items: [] }
                          }
                          groups[groupLabel].items.push({ ...a, levelLabel })
                        })
                        return Object.values(groups)
                      }

                      // Find where sound stock was shelved (from state or matching inventory stock)
                      const savedShelvedAllocs = containerItemShelvedLocations[item.id] || []
                      const pId = item.product?.id || (item as any).productId
                      const matchingStock = stocks.find(
                        (s) =>
                          (s.productId === pId || s.product?.id === pId) &&
                          (!containerTargetWarehouseId || s.warehouseId === containerTargetWarehouseId)
                      )
                      const stockLoc = matchingStock?.locationPath || matchingStock?.locationCode || matchingStock?.slot?.code

                      const resolvedShelvedLocations: Array<{ slotCode: string; fullLabel: string; quantity?: number }> = []
                      if (savedShelvedAllocs.length > 0) {
                        savedShelvedAllocs.forEach((a) => {
                          const parsed = parseSlotCoord(a.slotCode)
                          resolvedShelvedLocations.push({
                            slotCode: a.slotCode,
                            fullLabel: parsed.fullLabel || a.slotCode,
                            quantity: a.quantity,
                          })
                        })
                      } else if (lineReceived > 0) {
                        const locStr = stockLoc || (receiveRack ? `Rack ${receiveRack}` : 'Belarus DC Staging Floor')
                        const parsed = parseSlotCoord(locStr)
                        resolvedShelvedLocations.push({
                          slotCode: locStr,
                          fullLabel: parsed.fullLabel || locStr,
                          quantity: lineReceived,
                        })
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px] align-middle">
                            {itemIdx + 1}
                          </td>
                          <td className="py-2 px-2 align-middle max-w-[200px]">
                            <div className="font-semibold text-slate-900 truncate" title={productName}>
                              {productName}
                            </div>
                            <div className="font-mono text-slate-400 text-[10px]">{productSku}</div>
                          </td>
                          <td className="py-2 px-1.5 text-right font-mono font-medium text-slate-700 align-middle whitespace-nowrap w-12">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-1.5 text-right font-mono text-slate-400 align-middle whitespace-nowrap w-12">
                            <div>{lineReceived}</div>
                            {lineDamagedPrev > 0 && (
                              <div className="text-[9px] text-rose-500 font-medium leading-none mt-0.5">+{lineDamagedPrev} dmg</div>
                            )}
                          </td>
                          <td className="py-2 px-1.5 text-right font-mono font-bold text-amber-600 align-middle whitespace-nowrap w-12">
                            <div>{remainingGood}</div>
                            {currentDamaged > 0 && (
                              <div className="text-[9px] text-rose-600 font-medium leading-none mt-0.5">({currentDamaged} dmg)</div>
                            )}
                          </td>

                          {/* ASSIGNED SHELVING SLOT & INTAKE */}
                          <td className="py-2.5 px-3 align-middle">
                            {isFullyResolved ? (
                              /* 1. RECONCILED & SHELVED SUMMARY CARD (No form buttons or inputs) */
                              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/90 p-3 space-y-2 text-xs">
                                {/* Status Header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>✓ Fully Unloaded &amp; Accounted For ({item.quantity} / {item.quantity} pcs)</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    Reconciled
                                  </span>
                                </div>

                                {/* Sound Stock Location: Where it was put */}
                                <div className="bg-white rounded-lg p-2.5 border border-emerald-200/80 shadow-2xs space-y-1">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span>Sound Sellable Stock ({lineReceived} pcs)</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                    <span className="text-slate-600 font-medium text-xs">📍 Stored in Shelf:</span>
                                    {resolvedShelvedLocations.length > 0 ? (
                                      resolvedShelvedLocations.map((loc, lIdx) => (
                                        <span
                                          key={lIdx}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-md font-mono text-xs font-bold shadow-2xs"
                                        >
                                          <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                          <span>{loc.fullLabel}</span>
                                          {loc.quantity !== undefined && (
                                            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-sans">
                                              {loc.quantity} pcs
                                            </span>
                                          )}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-600 font-mono">Belarus DC Main Stock</span>
                                    )}
                                  </div>
                                </div>

                                {/* Damaged Stock: Where it was put */}
                                {lineDamagedPrev > 0 && (
                                  <div className="bg-rose-50/80 rounded-lg p-2.5 border border-rose-200 shadow-2xs space-y-1">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                      <span>Damaged / Defective Goods ({lineDamagedPrev} pcs)</span>
                                    </div>
                                    <div className="text-xs text-rose-950 font-medium">
                                      <span className="font-bold">⚠️ Stored in:</span>{' '}
                                      <span className="font-semibold text-rose-900 bg-rose-100/90 border border-rose-300/80 px-2 py-0.5 rounded font-mono text-[11px]">
                                        QC Quarantine Zone
                                      </span>{' '}
                                      <span className="text-slate-600 text-[11px]">
                                        (Quarantine Staging — Non-sellable hold, deducted from inventory)
                                      </span>
                                    </div>
                                    {item.qualityNotes && (
                                      <div className="text-[11px] text-rose-800 bg-white/80 px-2.5 py-1 rounded border border-rose-200 italic mt-1">
                                        <span className="font-semibold not-italic">QC Defect Note:</span> {item.qualityNotes}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* 2. PENDING / PARTIAL INTAKE CONTROLS */
                              <div className="space-y-2">
                                {/* Historical note if partially processed previously */}
                                {(lineReceived > 0 || lineDamagedPrev > 0) && (
                                  <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 border border-slate-200 rounded-md text-[11px] flex-wrap">
                                    <span className="font-bold text-slate-700">Previously Handled:</span>
                                    {lineReceived > 0 && (
                                      <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                                        <span>🟢 {lineReceived} pcs shelved in</span>
                                        <span className="font-bold font-mono">
                                          {resolvedShelvedLocations[0]?.fullLabel || 'Warehouse Stock'}
                                        </span>
                                      </span>
                                    )}
                                    {lineDamagedPrev > 0 && (
                                      <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-medium">
                                        <span>⚠️ {lineDamagedPrev} pcs in QC Quarantine</span>
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Target Shelf or Active Allocations */}
                                <div className="flex flex-row items-center gap-2 flex-wrap min-w-0">
                                  {allocations.length > 0 ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-blue-900">Shelved to:</span>
                                      {groupAllocationsByBay(allocations).map((group) => {
                                        const sortedLevels = [...group.items].sort((a, b) => {
                                          const numA = parseInt(a.levelLabel.replace(/\D/g, ''), 10) || 0
                                          const numB = parseInt(b.levelLabel.replace(/\D/g, ''), 10) || 0
                                          return numB - numA
                                        })

                                        return (
                                          <div
                                            key={group.bayLabel}
                                            className="inline-flex flex-col bg-white border border-blue-200/90 rounded-md overflow-hidden shadow-2xs text-[10px] min-w-[80px]"
                                          >
                                            <div className="text-center font-extrabold text-blue-700 bg-blue-50 border-b border-blue-100 px-2 py-0.5 font-mono">
                                              {group.bayLabel}
                                            </div>
                                            <div className="flex flex-col p-1 gap-1">
                                              {sortedLevels.map((a: any) => (
                                                <div
                                                  key={a.slotCode}
                                                  className="inline-flex items-center justify-between gap-1.5 font-mono bg-slate-50 hover:bg-slate-100 px-1.5 py-0.5 rounded transition"
                                                  title={`Full Slot Code: ${a.slotCode} (Bay ${group.bayLabel}, Level ${a.levelLabel})`}
                                                >
                                                  <span className="font-bold text-slate-800">{a.levelLabel}:</span>
                                                  <span className="font-extrabold text-blue-700 bg-white px-1 py-0.2 rounded border border-blue-100">
                                                    {a.quantity} pcs
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleRemoveSlotAllocation(item.id, a.slotCode)}
                                                    className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer leading-none"
                                                    title={`Remove ${a.slotCode}`}
                                                  >
                                                    ✕
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : selectedSlotCodes.length > 0 ? (
                                    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-md px-2 py-1 text-xs">
                                      <span className="font-bold text-blue-700">🎯 Target Shelf:</span>
                                      {selectedSlotCodes.map((code) => {
                                        const parsed = parseSlotCoord(code)
                                        return (
                                          <span key={code} className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-800">
                                            {parsed.fullLabel}
                                          </span>
                                        )
                                      })}
                                      <span className="text-[11px] text-blue-600 font-medium ml-1">(Click ⚡ Assign to apply)</span>
                                    </div>
                                  ) : receiveRack || receiveLane ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-200">
                                      <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                      <span>{receiveRack ? `Rack ${receiveRack} (Default Floor)` : 'General Floor'}</span>
                                    </span>
                                  ) : (
                                    <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span>👉 Click a <strong>Bay × Level slot</strong> in the matrix above (or general floor)</span>
                                    </div>
                                  )}
                                </div>

                                {/* Form Stepper, Fractions, Assign & Damaged Button */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <div className="inline-flex items-center border border-slate-200 rounded bg-white shadow-2xs overflow-hidden h-6">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const activeVal =
                                          allocations.length > 0 && unassignedRemainder > 0 && (rowAssignQty[item.id] === undefined || rowAssignQty[item.id] === 0)
                                            ? unassignedRemainder
                                            : rowAssignQty[item.id] !== undefined
                                            ? rowAssignQty[item.id]
                                            : (unassignedRemainder > 0 ? unassignedRemainder : remainingGood)
                                        const next = Math.max(0, activeVal - 1)
                                        setRowAssignQty((prev) => ({ ...prev, [item.id]: next }))
                                        if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: next }))
                                      }}
                                      className="w-5 h-full bg-slate-50 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer border-r border-slate-200"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      max={remainingGood}
                                      value={
                                        allocations.length > 0 && unassignedRemainder > 0 && (rowAssignQty[item.id] === undefined || rowAssignQty[item.id] === 0)
                                          ? unassignedRemainder
                                          : rowAssignQty[item.id] !== undefined
                                          ? rowAssignQty[item.id]
                                          : (unassignedRemainder > 0 ? unassignedRemainder : remainingGood)
                                      }
                                      onChange={(e) => {
                                        const val = Math.min(remainingGood, Math.max(0, parseInt(e.target.value) || 0))
                                        setRowAssignQty((prev) => ({
                                          ...prev,
                                          [item.id]: val,
                                        }))
                                        if (allocations.length === 0) {
                                          setReceivingItemsMap((prev) => ({ ...prev, [item.id]: val }))
                                        }
                                      }}
                                      className="w-16 h-full px-1 text-center font-mono font-bold text-xs bg-white text-slate-900 focus:outline-none"
                                      placeholder="0"
                                      title="Sound quantity to assign"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const activeVal =
                                          allocations.length > 0 && unassignedRemainder > 0 && (rowAssignQty[item.id] === undefined || rowAssignQty[item.id] === 0)
                                            ? unassignedRemainder
                                            : rowAssignQty[item.id] !== undefined
                                            ? rowAssignQty[item.id]
                                            : (unassignedRemainder > 0 ? unassignedRemainder : remainingGood)
                                        const next = Math.min(remainingGood, activeVal + 1)
                                        setRowAssignQty((prev) => ({ ...prev, [item.id]: next }))
                                        if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: next }))
                                      }}
                                      className="w-5 h-full bg-slate-50 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer border-l border-slate-200"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* FRACTIONS: [¼] [⅓] [½] [Full] */}
                                  <div className="inline-flex items-center border border-slate-200 rounded bg-slate-50 overflow-hidden h-6 divide-x divide-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const base = unassignedRemainder > 0 ? unassignedRemainder : remainingGood
                                        const val = Math.max(1, Math.round(base * 0.25))
                                        setRowAssignQty((prev) => ({ ...prev, [item.id]: val }))
                                        if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: val }))
                                      }}
                                      disabled={remainingGood <= 0}
                                      className="px-1.5 h-full text-[10px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition cursor-pointer"
                                      title={`Set to 25% (¼) of remaining (${Math.max(1, Math.round((unassignedRemainder > 0 ? unassignedRemainder : remainingGood) * 0.25))} pcs)`}
                                    >
                                      ¼
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const base = unassignedRemainder > 0 ? unassignedRemainder : remainingGood
                                        const val = Math.max(1, Math.round(base / 3))
                                        setRowAssignQty((prev) => ({ ...prev, [item.id]: val }))
                                        if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: val }))
                                      }}
                                      disabled={remainingGood <= 0}
                                      className="px-1.5 h-full text-[10px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition cursor-pointer"
                                      title={`Set to 33% (⅓) of remaining (${Math.max(1, Math.round((unassignedRemainder > 0 ? unassignedRemainder : remainingGood) / 3))} pcs)`}
                                    >
                                      ⅓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const base = unassignedRemainder > 0 ? unassignedRemainder : remainingGood
                                        const val = Math.max(1, Math.round(base * 0.5))
                                        setRowAssignQty((prev) => ({ ...prev, [item.id]: val }))
                                        if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: val }))
                                      }}
                                      disabled={remainingGood <= 0}
                                      className="px-1.5 h-full text-[10px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition cursor-pointer"
                                      title={`Set to 50% (½) of remaining (${Math.max(1, Math.round((unassignedRemainder > 0 ? unassignedRemainder : remainingGood) * 0.5))} pcs)`}
                                    >
                                      ½
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const base = unassignedRemainder > 0 ? unassignedRemainder : remainingGood
                                        setRowAssignQty((prev) => ({ ...prev, [item.id]: base }))
                                        if (allocations.length === 0) setReceivingItemsMap((prev) => ({ ...prev, [item.id]: base }))
                                      }}
                                      disabled={remainingGood <= 0}
                                      className="px-2 h-full text-[10px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-700 transition cursor-pointer"
                                      title={`Set to 100% of remaining (${unassignedRemainder > 0 ? unassignedRemainder : remainingGood} pcs)`}
                                    >
                                      Full
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={remainingGood <= 0}
                                    onClick={() => {
                                      const currentAssignVal =
                                        allocations.length > 0 && unassignedRemainder > 0 && (rowAssignQty[item.id] === undefined || rowAssignQty[item.id] === 0)
                                          ? unassignedRemainder
                                          : (rowAssignQty[item.id] !== undefined ? rowAssignQty[item.id] : remainingGood)
                                      handleRegisterQtyToSlots(item.id, currentAssignVal)
                                    }}
                                    className="h-6 px-2.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded shadow-2xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                    title={
                                      selectedSlotCodes.length > 1
                                        ? `Divide quantity equally across ${selectedSlotCodes.length} selected slots (${selectedSlotCodes.join(', ')})`
                                        : selectedSlotCodes.length === 1
                                        ? `Assign quantity to slot ${selectedSlotCodes[0]}`
                                        : 'Select slot(s) above from the warehouse matrix to assign'
                                    }
                                  >
                                    <span>⚡ Assign{selectedSlotCodes.length > 1 ? ` (÷${selectedSlotCodes.length})` : ''}</span>
                                  </button>

                                  {/* TOGGLE DAMAGED QC INPUT */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowDamagedInput((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                                    }}
                                    className={`h-6 px-2 text-[10px] font-semibold rounded border transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                      currentDamaged > 0
                                        ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                                        : showDamagedInput[item.id]
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                    title="Report damaged cargo units (routed to QC Quarantine Zone)"
                                  >
                                    <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                    <span>{currentDamaged > 0 ? `${currentDamaged} Damaged` : '+ Damaged'}</span>
                                  </button>

                                  {/* STATUS DIRECTLY AFTER ASSIGN BUTTON */}
                                  {allocations.length > 0 && (
                                    unassignedRemainder > 0 ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        <span>{unassignedRemainder} unassigned</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                        <span>✓ Shelved ({totalAllocated} pcs)</span>
                                      </span>
                                    )
                                  )}

                                  {allocations.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleClearItemAllocations(item.id)}
                                      className="h-6 px-2 text-[10px] text-slate-400 hover:text-rose-600 rounded cursor-pointer ml-auto"
                                      title="Clear all assigned slots for this product"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>

                                {/* COLLAPSIBLE DAMAGED QC STRIP */}
                                {(showDamagedInput[item.id] || currentDamaged > 0) && (
                                  <div className="p-2.5 bg-rose-50/80 border border-rose-200 rounded-lg text-xs space-y-2">
                                    {/* Clear destination banner for damaged goods */}
                                    <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-rose-200/60">
                                      <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                        <span>QC Quarantine Intake — Non-Sellable Defective Goods</span>
                                      </div>
                                      <span className="text-[10px] font-medium text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                                        📍 Stored in: QC Quarantine Zone (Deducted from stock)
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="text-[11px] text-rose-800 font-medium">
                                        Designate Damaged Qty:
                                      </div>

                                      <div className="flex items-center gap-1">
                                        {/* Damaged Stepper */}
                                        <div className="inline-flex items-center border border-rose-300 rounded bg-white shadow-2xs overflow-hidden h-6">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const next = Math.max(0, currentDamaged - 1)
                                              setItemDamagedQty((prev) => ({ ...prev, [item.id]: next }))
                                              const newRemGood = Math.max(0, remainingRaw - next)
                                              if ((rowAssignQty[item.id] || 0) > newRemGood) {
                                                setRowAssignQty((p) => ({ ...p, [item.id]: newRemGood }))
                                                if (allocations.length === 0) setReceivingItemsMap((p) => ({ ...p, [item.id]: newRemGood }))
                                              }
                                            }}
                                            className="w-5 h-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center cursor-pointer border-r border-rose-200"
                                          >
                                            -
                                          </button>
                                          <input
                                            type="number"
                                            min="0"
                                            max={remainingRaw}
                                            value={currentDamaged || ''}
                                            onChange={(e) => {
                                              const val = Math.min(remainingRaw, Math.max(0, parseInt(e.target.value) || 0))
                                              setItemDamagedQty((prev) => ({ ...prev, [item.id]: val }))
                                              const newRemGood = Math.max(0, remainingRaw - val)
                                              if ((rowAssignQty[item.id] || 0) > newRemGood) {
                                                setRowAssignQty((p) => ({ ...p, [item.id]: newRemGood }))
                                                if (allocations.length === 0) setReceivingItemsMap((p) => ({ ...p, [item.id]: newRemGood }))
                                              }
                                            }}
                                            className="w-14 h-full px-1 text-center font-mono font-bold text-xs bg-white text-rose-900 focus:outline-none"
                                            placeholder="0"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const next = Math.min(remainingRaw, currentDamaged + 1)
                                              setItemDamagedQty((prev) => ({ ...prev, [item.id]: next }))
                                              const newRemGood = Math.max(0, remainingRaw - next)
                                              if ((rowAssignQty[item.id] || 0) > newRemGood) {
                                                setRowAssignQty((p) => ({ ...p, [item.id]: newRemGood }))
                                                if (allocations.length === 0) setReceivingItemsMap((p) => ({ ...p, [item.id]: newRemGood }))
                                              }
                                            }}
                                            className="w-5 h-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center cursor-pointer border-l border-rose-200"
                                          >
                                            +
                                          </button>
                                        </div>

                                        {/* Quick presets: [1 pc] [5%] [10%] [All Damaged] [Reset] */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const val = Math.min(remainingRaw, 1)
                                            setItemDamagedQty((prev) => ({ ...prev, [item.id]: val }))
                                            const newRemGood = Math.max(0, remainingRaw - val)
                                            if ((rowAssignQty[item.id] || 0) > newRemGood) {
                                              setRowAssignQty((p) => ({ ...p, [item.id]: newRemGood }))
                                              if (allocations.length === 0) setReceivingItemsMap((p) => ({ ...p, [item.id]: newRemGood }))
                                            }
                                          }}
                                          className="h-6 px-1.5 text-[10px] font-medium rounded bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                                        >
                                          1 pc
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const val = Math.min(remainingRaw, Math.max(1, Math.round(remainingRaw * 0.05)))
                                            setItemDamagedQty((prev) => ({ ...prev, [item.id]: val }))
                                            const newRemGood = Math.max(0, remainingRaw - val)
                                            if ((rowAssignQty[item.id] || 0) > newRemGood) {
                                              setRowAssignQty((p) => ({ ...p, [item.id]: newRemGood }))
                                              if (allocations.length === 0) setReceivingItemsMap((p) => ({ ...p, [item.id]: newRemGood }))
                                            }
                                          }}
                                          className="h-6 px-1.5 text-[10px] font-medium rounded bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                                        >
                                          5%
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const val = Math.min(remainingRaw, Math.max(1, Math.round(remainingRaw * 0.10)))
                                            setItemDamagedQty((prev) => ({ ...prev, [item.id]: val }))
                                            const newRemGood = Math.max(0, remainingRaw - val)
                                            if ((rowAssignQty[item.id] || 0) > newRemGood) {
                                              setRowAssignQty((p) => ({ ...p, [item.id]: newRemGood }))
                                              if (allocations.length === 0) setReceivingItemsMap((p) => ({ ...p, [item.id]: newRemGood }))
                                            }
                                          }}
                                          className="h-6 px-1.5 text-[10px] font-medium rounded bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                                        >
                                          10%
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setItemDamagedQty((prev) => ({ ...prev, [item.id]: remainingRaw }))
                                            setRowAssignQty((p) => ({ ...p, [item.id]: 0 }))
                                            if (allocations.length === 0) setReceivingItemsMap((p) => ({ ...p, [item.id]: 0 }))
                                          }}
                                          className="h-6 px-2 text-[10px] font-bold rounded bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition cursor-pointer"
                                        >
                                          All Damaged
                                        </button>
                                        {currentDamaged > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setItemDamagedQty((prev) => ({ ...prev, [item.id]: 0 }))
                                            }}
                                            className="h-6 px-1.5 text-[10px] text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                          >
                                            Reset
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* QC Note Input for Damaged Cargo */}
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={itemDamagedNotes[item.id] || ''}
                                        onChange={(e) => {
                                          const val = e.target.value
                                          setItemDamagedNotes((prev) => ({ ...prev, [item.id]: val }))
                                        }}
                                        placeholder="QC defect note (e.g. crushed carton, water leak, broken seal)..."
                                        className="w-full h-6 px-2 text-[11px] bg-white border border-rose-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400"
                                      />
                                      <div className="flex items-center gap-1 shrink-0">
                                        {['Crushed', 'Water Leak', 'Broken Seal'].map((tag) => (
                                          <button
                                            key={tag}
                                            type="button"
                                            onClick={() => {
                                              setItemDamagedNotes((prev) => {
                                                const cur = prev[item.id] || ''
                                                return { ...prev, [item.id]: cur ? `${cur} • ${tag}` : tag }
                                              })
                                            }}
                                            className="text-[9px] px-1.5 py-0.5 bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 rounded transition cursor-pointer"
                                          >
                                            +{tag}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 4: Receipt Note & Inspection Check */}
            <div className="mb-6 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Receipt Note / Inspector Memo
              </label>
              <input
                type="text"
                value={receiveNotes}
                onChange={(e) => setReceiveNotes(e.target.value)}
                placeholder="e.g., Box verified undamaged, sealed by inspector..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex flex-wrap gap-1.5">
                {['Cartons Undamaged', 'Seals Verified', 'Barcode Scanned', 'Urgent Shelving'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setReceiveNotes((prev) => (prev ? `${prev} • ${tag}` : tag))
                    }}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedContainerToReceive(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              {(() => {
                const assignedProducts = selectedContainerToReceive.items.filter((item) => {
                  const itemCustom = itemCustomSlots[item.id]
                  const allocations = itemCustom?.allocations || []
                  const totalAllocated = allocations.reduce((sum: number, a: any) => sum + (a.quantity || 0), 0)
                  const soundQty = totalAllocated > 0 ? totalAllocated : (receivingItemsMap[item.id] || 0)
                  const damagedQty = itemDamagedQty[item.id] || 0
                  return soundQty > 0 || damagedQty > 0
                })
                const assignedProductsCount = assignedProducts.length
                const totalSoundUnits = assignedProducts.reduce((sum, item) => {
                  const itemCustom = itemCustomSlots[item.id]
                  const allocations = itemCustom?.allocations || []
                  const totalAllocated = allocations.reduce((s: number, a: any) => s + (a.quantity || 0), 0)
                  return sum + (totalAllocated > 0 ? totalAllocated : (receivingItemsMap[item.id] || 0))
                }, 0)
                const totalDamagedUnits = assignedProducts.reduce((sum, item) => sum + (itemDamagedQty[item.id] || 0), 0)

                return (
                  <button
                    type="button"
                    disabled={containerSubmitting || assignedProductsCount === 0}
                    onClick={() => handleReceiveContainerSubmit()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {containerSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Unloading &amp; Shelving into Hub...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {assignedProductsCount > 0
                            ? `Confirm Unload & Shelve (${totalSoundUnits.toLocaleString()} sound${totalDamagedUnits > 0 ? `, ${totalDamagedUnits.toLocaleString()} damaged` : ''})`
                            : 'Assign shelving slot or mark damaged'}
                        </span>
                      </>
                    )}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Slot Detail & Stored Products Viewer */}
      {selectedSlotDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                  {selectedSlotDetail.structureType === 'RACK' ? (
                    <Layers className="w-6 h-6" />
                  ) : selectedSlotDetail.structureType === 'FLOOR' ? (
                    <Grid className="w-6 h-6" />
                  ) : (
                    <Truck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-black text-slate-900">
                      {selectedSlotDetail.slot.code}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                      {selectedSlotDetail.structureType}
                    </span>
                    {selectedSlotDetail.products.length > 0 ? (
                      <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                        Occupied
                      </span>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
                        Empty Available
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentShelvesWarehouse?.name || 'Warehouse'}</span>
                    <span>•</span>
                    <span>{selectedSlotDetail.structureTitle}</span>
                    {selectedSlotDetail.slot.bayNum && (
                      <>
                        <span>•</span>
                        <span>Bay {String(selectedSlotDetail.slot.bayNum).padStart(2, '0')}</span>
                      </>
                    )}
                    {selectedSlotDetail.slot.level && (
                      <>
                        <span>•</span>
                        <span>Level {selectedSlotDetail.slot.level}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlotDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Products on this slot */}
            {selectedSlotDetail.products.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {selectedSlotDetail.products.length} distinct product line(s) stored in this position
                    </span>
                  </div>
                  <div className="font-mono font-bold text-emerald-800 text-sm">
                    {selectedSlotDetail.products.reduce((acc, p) => acc + p.quantity, 0).toLocaleString()} total pcs
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedSlotDetail.products.map((prod) => {
                    const matchingStock = filteredStocks.find(
                      (s) =>
                        s.product?.id === prod.id ||
                        s.product?.sku === prod.sku
                    )

                    return (
                      <div
                        key={`slot-detail-prod-${prod.id}`}
                        className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 transition shadow-2xs"
                      >
                        <div className="flex items-start gap-3.5">
                          {prod.thumbnail ? (
                            <img
                              src={prod.thumbnail}
                              alt={prod.name}
                              className="w-14 h-14 object-cover rounded-lg border border-slate-200 flex-shrink-0 bg-slate-50"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-200">
                              <Box className="w-6 h-6" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm truncate" title={prod.name}>
                                  {prod.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-xs text-slate-500 font-medium">
                                    SKU: {prod.sku}
                                  </span>
                                  {prod.costPrice && (
                                    <span className="text-xs text-slate-400">
                                      • Unit Cost: ${prod.costPrice.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-base font-black text-slate-900 font-mono">
                                  {prod.quantity.toLocaleString()} pcs
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Avail: {prod.availableQty ?? prod.quantity}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-xs text-slate-400 font-mono">
                                Slot: {selectedSlotDetail.slot.code}
                              </span>
                              {matchingStock && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sourceCode = selectedSlotDetail.slot.code
                                    const sourceId = selectedSlotDetail.slot.id
                                    const slotProdQty = prod.quantity || matchingStock.quantity
                                    setSelectedSlotDetail(null)
                                    openRelocateModal(matchingStock, undefined, {
                                      slotId: sourceId,
                                      locationCode: sourceCode,
                                      maxQty: slotProdQty,
                                    })
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition cursor-pointer border border-blue-200"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                  <span>Relocate Stock</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
                  <Box className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">This Slot is Empty &amp; Available</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    No inventory is currently placed at slot <span className="font-mono font-bold text-slate-700">{selectedSlotDetail.slot.code}</span>. You can relocate existing warehouse items here or perform direct intake.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {filteredStocks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetSlot = selectedSlotDetail.slot
                        setSelectedSlotDetail(null)
                        openRelocateModal(filteredStocks[0], {
                          slotId: targetSlot.id,
                          locationCode: targetSlot.code,
                          locationPath: `${selectedSlotDetail.structureTitle} > Slot ${targetSlot.code}`,
                        })
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      <span>Relocate Stock Into This Slot</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const targetSlot = selectedSlotDetail.slot
                      setSelectedSlotDetail(null)
                      setIntakeWarehouseId(shelvesWarehouseId || displayedWarehouses[0]?.id || '')
                      if (selectedSlotDetail.structureType === 'RACK') {
                        setIntakeRack(selectedSlotDetail.structureTitle.replace(/^Rack\s+/i, ''))
                      } else if (selectedSlotDetail.structureType === 'FLOOR') {
                        setIntakeFloor(targetSlot.bayCode || selectedSlotDetail.structureTitle)
                      } else if (selectedSlotDetail.structureType === 'LANE') {
                        setIntakeLane(targetSlot.bayCode || selectedSlotDetail.structureTitle)
                      }
                      setIsIntakeModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Direct Intake to This Slot</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSlotDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 p-6 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  )
}
