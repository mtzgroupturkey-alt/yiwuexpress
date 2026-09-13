'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Warehouse as WarehouseIcon,
  Layers,
  Box,
  MapPin,
  Plus,
  ArrowRight,
  Package,
  Loader2,
  RefreshCw,
  Search,
  Sliders,
  Eye,
  CheckCircle2,
  Sparkles,
  Building2,
  ExternalLink,
  ChevronRight,
  FolderTree,
  Compass,
  Maximize2,
  AlertCircle,
  Tag,
  Grid3X3,
  X,
  Edit2,
  Trash2,
  Navigation,
  RotateCw,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Move,
  LayoutTemplate,
  Settings2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { Warehouse3DViewer, Warehouse3DItem } from '@/components/admin/warehouse/Warehouse3DViewer'

const WAREHOUSE_COUNTRIES = [
  { value: 'China', label: 'China' },
  { value: 'Belarus', label: 'Belarus' },
] as const

type TabType = 'register' | 'layout' | '3d-twin'

export default function AdminSettingsWarehousesPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('register')

  // Selected warehouse for 2D Layout & 3D Twin
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null)

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null)
  const [addZoneModalOpen, setAddZoneModalOpen] = useState(false)
  const [addBayModalOpen, setAddBayModalOpen] = useState(false)
  const [selectedZoneForBay, setSelectedZoneForBay] = useState<string | null>(null)
  const [batchRacksModalOpen, setBatchRacksModalOpen] = useState(false)
  const [assignProductModalOpen, setAssignProductModalOpen] = useState(false)
  const [selectedSlotForAssign, setSelectedSlotForAssign] = useState<any | null>(null)

  // 3D Visualizer targeting
  const [targetSlotCode, setTargetSlotCode] = useState<string | undefined>(undefined)
  const [activeZoneFilter, setActiveZoneFilter] = useState<string | null>(null)

  // 2D Interactive Blueprint Drag-and-Drop & Resizing State
  const [isEdit2DMode, setIsEdit2DMode] = useState(false)
  const [layoutPositions, setLayoutPositions] = useState<
    Record<string, { x: number; y: number; w?: number; h?: number; orientation?: 'vertical' | 'horizontal' }>
  >({})
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [draggingPartId, setDraggingPartId] = useState<string | null>(null)
  const [resizingPartId, setResizingPartId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState<{ startX: number; startY: number; initialW: number; initialH: number }>({
    startX: 0,
    startY: 0,
    initialW: 100,
    initialH: 100,
  })
  const blueprintBoardRef = React.useRef<HTMLDivElement>(null)

  // Load custom 2D blueprint layout coordinates from storage
  React.useEffect(() => {
    if (!selectedWarehouseId) return
    const saved = localStorage.getItem(`warehouse_2d_layout_${selectedWarehouseId}`)
    if (saved) {
      try {
        setLayoutPositions(JSON.parse(saved))
      } catch (e) {
        setLayoutPositions({})
      }
    } else {
      setLayoutPositions({})
    }
    setSelectedShapeId(null)
  }, [selectedWarehouseId])

  const saveLayoutPositions = (
    nextPos: Record<string, { x: number; y: number; w?: number; h?: number; orientation?: 'vertical' | 'horizontal' }>
  ) => {
    setLayoutPositions(nextPos)
    if (selectedWarehouseId) {
      localStorage.setItem(`warehouse_2d_layout_${selectedWarehouseId}`, JSON.stringify(nextPos))
    }
  }

  // Handle Keyboard Arrow Keys for Selected Shape Positioning
  React.useEffect(() => {
    if (!isEdit2DMode || !selectedShapeId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing inside an input or textarea
      const activeTag = (document.activeElement?.tagName || '').toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return

      const step = e.shiftKey ? 20 : 5 // Shift + arrow moves faster (20px)
      let dx = 0
      let dy = 0

      if (e.key === 'ArrowUp' || e.key === 'Up') {
        dy = -step
      } else if (e.key === 'ArrowDown' || e.key === 'Down') {
        dy = step
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        dx = -step
      } else if (e.key === 'ArrowRight' || e.key === 'Right') {
        dx = step
      } else if (e.key === 'Escape') {
        setSelectedShapeId(null)
        return
      } else {
        return
      }

      e.preventDefault()

      const board = blueprintBoardRef.current
      const boardWidth = board?.clientWidth || 1000
      const boardHeight = board?.clientHeight || 550

      setLayoutPositions((prev) => {
        const cur = prev[selectedShapeId] || { x: 50, y: 50 }
        const curW = cur.w || 80
        const curH = cur.h || 120
        const nextX = Math.max(5, Math.min(boardWidth - curW - 5, (cur.x ?? 0) + dx))
        const nextY = Math.max(5, Math.min(boardHeight - curH - 5, (cur.y ?? 0) + dy))

        const updated = {
          ...prev,
          [selectedShapeId]: {
            ...cur,
            x: nextX,
            y: nextY,
          },
        }

        if (selectedWarehouseId) {
          localStorage.setItem(`warehouse_2d_layout_${selectedWarehouseId}`, JSON.stringify(updated))
        }
        return updated
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEdit2DMode, selectedShapeId, selectedWarehouseId])

  // Toggle Orientation between vertical and horizontal (swaps width & height)
  const toggleShapeOrientation = (id: string, currentW: number, currentH: number) => {
    setLayoutPositions((prev) => {
      const cur = prev[id] || { x: 50, y: 50 }
      const newOrientation: 'vertical' | 'horizontal' = cur.orientation === 'horizontal' ? 'vertical' : 'horizontal'
      // Swap width and height when toggling orientation
      const updated = {
        ...prev,
        [id]: {
          ...cur,
          w: currentH,
          h: currentW,
          orientation: newOrientation,
        },
      }
      if (selectedWarehouseId) {
        localStorage.setItem(`warehouse_2d_layout_${selectedWarehouseId}`, JSON.stringify(updated))
      }
      toast.success(`Orientation toggled to ${newOrientation.toUpperCase()}`)
      return updated
    })
  }

  // Move selected shape by delta offset programmatically
  const moveSelectedShape = (dx: number, dy: number) => {
    if (!selectedShapeId) return
    const board = blueprintBoardRef.current
    const boardWidth = board?.clientWidth || 1000
    const boardHeight = board?.clientHeight || 550

    setLayoutPositions((prev) => {
      const cur = prev[selectedShapeId] || { x: 50, y: 50 }
      const curW = cur.w || 80
      const curH = cur.h || 120
      const nextX = Math.max(5, Math.min(boardWidth - curW - 5, (cur.x ?? 0) + dx))
      const nextY = Math.max(5, Math.min(boardHeight - curH - 5, (cur.y ?? 0) + dy))

      const updated = {
        ...prev,
        [selectedShapeId]: {
          ...cur,
          x: nextX,
          y: nextY,
        },
      }

      if (selectedWarehouseId) {
        localStorage.setItem(`warehouse_2d_layout_${selectedWarehouseId}`, JSON.stringify(updated))
      }
      return updated
    })
  }

  const handlePointerDown = (id: string, defaultW: number, defaultH: number, e: React.PointerEvent) => {
    if (!isEdit2DMode) return
    e.preventDefault()
    e.stopPropagation()
    setSelectedShapeId(id)
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    const board = blueprintBoardRef.current
    if (!board) return
    const boardRect = board.getBoundingClientRect()
    const curItem = layoutPositions[id] || { x: 0, y: 0 }
    setDraggingPartId(id)
    setDragOffset({
      x: e.clientX - boardRect.left - (curItem.x ?? 0),
      y: e.clientY - boardRect.top - (curItem.y ?? 0),
    })
  }

  const handleResizePointerDown = (
    id: string,
    currentW: number,
    currentH: number,
    e: React.PointerEvent
  ) => {
    if (!isEdit2DMode) return
    e.preventDefault()
    e.stopPropagation()
    setSelectedShapeId(id)
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    setResizingPartId(id)
    setResizeStart({
      startX: e.clientX,
      startY: e.clientY,
      initialW: currentW,
      initialH: currentH,
    })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isEdit2DMode) return
    const board = blueprintBoardRef.current
    if (!board) return
    const boardRect = board.getBoundingClientRect()

    // 1. Resizing in progress
    if (resizingPartId) {
      const deltaX = e.clientX - resizeStart.startX
      const deltaY = e.clientY - resizeStart.startY
      const currentPos = layoutPositions[resizingPartId] || { x: 0, y: 0 }
      const newW = Math.max(50, Math.min(boardRect.width - (currentPos.x || 0) - 10, Math.round((resizeStart.initialW + deltaX) / 5) * 5))
      const newH = Math.max(40, Math.min(boardRect.height - (currentPos.y || 0) - 10, Math.round((resizeStart.initialH + deltaY) / 5) * 5))

      setLayoutPositions((prev) => ({
        ...prev,
        [resizingPartId]: {
          ...(prev[resizingPartId] || { x: 0, y: 0 }),
          w: newW,
          h: newH,
        },
      }))
      return
    }

    // 2. Dragging in progress
    if (draggingPartId) {
      const curItem = layoutPositions[draggingPartId]
      const curW = curItem?.w || 74
      const curH = curItem?.h || 200
      let newX = Math.round((e.clientX - boardRect.left - dragOffset.x) / 5) * 5
      let newY = Math.round((e.clientY - boardRect.top - dragOffset.y) / 5) * 5

      // Boundaries clamping
      newX = Math.max(5, Math.min(boardRect.width - curW - 5, newX))
      newY = Math.max(5, Math.min(boardRect.height - curH - 5, newY))

      setLayoutPositions((prev) => ({
        ...prev,
        [draggingPartId]: {
          ...(prev[draggingPartId] || {}),
          x: newX,
          y: newY,
        },
      }))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingPartId || resizingPartId) {
      if (selectedWarehouseId) {
        localStorage.setItem(`warehouse_2d_layout_${selectedWarehouseId}`, JSON.stringify(layoutPositions))
        toast.success(resizingPartId ? 'Shape resized & saved' : '2D Layout position updated')
      }
      setDraggingPartId(null)
      setResizingPartId(null)
    }
  }

  const reset2DLayout = () => {
    if (!selectedWarehouseId) return
    localStorage.removeItem(`warehouse_2d_layout_${selectedWarehouseId}`)
    setLayoutPositions({})
    setSelectedShapeId(null)
    toast.success('2D Layout reset to default schematic')
  }

  // Warehouse Form State
  const [whForm, setWhForm] = useState({
    name: '',
    code: '',
    type: 'DISTRIBUTION',
    country: 'China',
    city: 'Yiwu',
    address: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    isDefaultProcurement: false,
    isDefaultSales: false,
    notes: '',
  })

  // Zone Form State (Supports both simple zone and Shelving/Rack with bays & slots)
  const [zoneForm, setZoneForm] = useState({
    code: '',
    name: '',
    type: 'STORAGE',
    tempControlled: false,
    hasShelving: true,
    rackPrefix: 'R',
    rackNumber: 1,
    baysCount: 2,
    tiersCount: 3,
    slotsPerTier: 2,
  })

  // Quick 1-Click Add Rack Modal State
  const [quickRackModalOpen, setQuickRackModalOpen] = useState(false)
  const [quickRackForm, setQuickRackForm] = useState({
    zoneId: '',
    rackPrefix: 'R',
    rackNumber: 1,
    baysCount: 2,
    tiersCount: 3,
    slotsPerTier: 2,
  })

  // Bay / Rack Form State
  const [bayForm, setBayForm] = useState({
    code: '',
    name: '',
    aisle: 'A1',
    rack: 'R1',
    tiers: 3,
    slotsPerTier: 2,
  })

  // Batch Racks Form State
  const [batchForm, setBatchForm] = useState({
    rackPrefix: 'R',
    startRack: 1,
    endRack: 6,
    baysPerRack: 4,
    tiersPerBay: 3,
    slotsPerTier: 2,
  })

  // Product Slot Assign Form State
  const [assignProductId, setAssignProductId] = useState('')

  // Storage Items (Rack, Floor Bay, Bulk Lane) Inspector & Configuration State
  const [selectedInspectorItem, setSelectedInspectorItem] = useState<{
    itemType: 'RACK' | 'FLOOR' | 'LANE'
    baseCode: string
    title: string
    zoneId?: string
    layout: {
      bays: number
      levels: number
      subParts: number
      sections: number
    }
  } | null>(null)

  // 1. Fetch all warehouses list
  const { data: whData, isLoading: isLoadingList, refetch: refetchList } = useQuery<{
    success: boolean
    data: any[]
  }>({
    queryKey: ['admin-warehouses-list'],
    queryFn: async () => {
      const res = await fetch('/api/admin/warehouses')
      if (!res.ok) throw new Error('Failed to fetch warehouses')
      return res.json()
    },
  })

  const warehouses = whData?.data || []

  // Auto-select first warehouse if none selected
  React.useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id)
    }
  }, [warehouses, selectedWarehouseId])

  // 2. Fetch detailed warehouse info with zones, bays, slots, stocks
  const {
    data: detailData,
    isLoading: isLoadingDetail,
    refetch: refetchDetail,
  } = useQuery<{
    success: boolean
    data: any
  }>({
    queryKey: ['admin-warehouse-detail', selectedWarehouseId],
    queryFn: async () => {
      if (!selectedWarehouseId) return null
      const res = await fetch(`/api/admin/warehouses/${selectedWarehouseId}`)
      if (!res.ok) throw new Error('Failed to fetch warehouse layout details')
      return res.json()
    },
    enabled: Boolean(selectedWarehouseId),
  })

  const currentWarehouse = detailData?.data || warehouses.find((w) => w.id === selectedWarehouseId)

  // 3. Fetch products list for slot assignment
  const { data: productsData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['admin-products-compact'],
    queryFn: async () => {
      const res = await fetch('/api/admin/products?limit=100')
      if (!res.ok) return { success: false, data: [] }
      return res.json()
    },
  })
  const availableProducts = productsData?.data || []

  // Mutations
  const createOrUpdateWhMutation = useMutation({
    mutationFn: async (payload: any) => {
      const isEdit = Boolean(editingWarehouse)
      const url = isEdit
        ? `/api/admin/warehouses/${editingWarehouse.id}`
        : '/api/admin/warehouses'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save warehouse')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-warehouses-list'] })
      queryClient.invalidateQueries({ queryKey: ['admin-warehouse-detail'] })
      toast.success(editingWarehouse ? 'Warehouse updated' : 'Warehouse registered successfully')
      setCreateModalOpen(false)
      setEditingWarehouse(null)
    },
    onError: (err: any) => toast.error(err.message),
  })

  const layoutMutation = useMutation({
    mutationFn: async ({ action, payload }: { action: string; payload: any }) => {
      if (!selectedWarehouseId) throw new Error('No warehouse selected')
      const res = await fetch(`/api/admin/warehouses/${selectedWarehouseId}/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Layout action failed')
      return json
    },
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-warehouse-detail', selectedWarehouseId] })
      queryClient.invalidateQueries({ queryKey: ['admin-warehouses-list'] })
      if (vars.action === 'ADD_ZONE') {
        toast.success('Zone registered with layout addresses')
        setAddZoneModalOpen(false)
        setZoneForm({
          code: '',
          name: '',
          type: 'STORAGE',
          tempControlled: false,
          hasShelving: true,
          rackPrefix: 'R',
          rackNumber: (currentWarehouse?.zones?.filter((z: any) => z.type === 'STORAGE').length || 0) + 1,
          baysCount: 2,
          tiersCount: 3,
          slotsPerTier: 2,
        })
      } else if (vars.action === 'ADD_BAY') {
        toast.success('Bay with Tiers & Slots configured')
        setAddBayModalOpen(false)
        setBayForm({ code: '', name: '', aisle: 'A1', rack: 'R1', tiers: 3, slotsPerTier: 2 })
      } else if (vars.action === 'BATCH_GENERATE_RACKS') {
        toast.success(res.message || 'Racks generated')
        setBatchRacksModalOpen(false)
        setQuickRackModalOpen(false)
      } else if (vars.action === 'ASSIGN_PRODUCT_SLOT') {
        toast.success('Product address code mapped')
        setAssignProductModalOpen(false)
        setSelectedSlotForAssign(null)
        setAssignProductId('')
      } else if (vars.action === 'ADD_ITEM') {
        const itemType = vars.payload?.itemType
        const code = res.data?.code || ''
        if (itemType === 'RACK') {
          toast.success(`Rack ${code} added — click item to customize bays and levels`, { icon: '📦' })
        } else if (itemType === 'FLOOR') {
          toast.success(`Floor Bay ${code} added — click item to configure sub-parts`, { icon: '📥' })
        } else if (itemType === 'LANE') {
          toast.success(`Bulk Lane ${code} added — click item to configure sections`, { icon: '🚛' })
        } else {
          toast.success('Storage item added')
        }
      } else if (vars.action === 'UPDATE_ITEM_LAYOUT') {
        const baseCode = vars.payload?.baseCode || ''
        toast.success(`Layout for ${baseCode} regenerated successfully!`, { icon: '✅' })
        setSelectedInspectorItem(null)
      } else if (vars.action === 'DELETE_ZONE') {
        toast.success('Zone deleted')
      } else if (vars.action === 'DELETE_BAY') {
        toast.success('Bay deleted')
      } else if (vars.action === 'DELETE_RACK') {
        toast.success(`Rack ${vars.payload?.rackName || ''} deleted`)
      }
    },
    onError: (err: any) => toast.error(err.message),
  })

  // Prepare items for 3D digital twin
  const twin3DItems: Warehouse3DItem[] = useMemo(() => {
    if (!currentWarehouse?.zones) return []
    const list: Warehouse3DItem[] = []

    currentWarehouse.zones.forEach((zone: any) => {
      (zone.bays || []).forEach((bay: any) => {
        (bay.slots || []).forEach((slot: any) => {
          if (slot.stocks && slot.stocks.length > 0) {
            slot.stocks.forEach((stk: any) => {
              list.push({
                sku: stk.product?.sku || 'SKU-UNKNOWN',
                name: stk.product?.name || 'Assigned Cargo Unit',
                category: zone.name || 'Warehouse Storage',
                location: slot.code,
                stock: `${stk.quantity || 0} Units`,
                occupancy: stk.quantity > 50 ? 'Full (100%)' : 'Partial (45%)',
                route: {
                  zone: `${zone.code} (${zone.name})`,
                  bay: bay.code,
                  level: slot.name,
                },
              })
            })
          }
        })
      })
    })

    return list
  }, [currentWarehouse])

  // ========================================================
  // CANONICAL WAREHOUSE 2D/3D ITEM MODEL (SINGLE SOURCE OF TRUTH)
  // ========================================================
  interface RackModelItem {
    id: string // `rack_${zoneId}_${rackName}`
    itemType: 'RACK'
    rackName: string
    code: string // e.g. 'R1', 'R2', 'R3', 'R4'
    title: string // e.g. 'Rack R1'
    zoneId: string
    zoneCode: string
    zoneName: string
    zoneType: string
    bays: any[]
    levels: number
    totalSlots: number
    allSlots: any[]
    aisle: string
  }

  interface FloorModelItem {
    id: string // `bay_${bay.id}`
    itemType: 'FLOOR'
    code: string // e.g. 'FL-01'
    title: string
    zoneId: string
    zoneCode: string
    zoneName: string
    zoneType: string
    bay: any
    slotsCount: number
    allSlots: any[]
    aisle: string
  }

  interface LaneModelItem {
    id: string // `bay_${bay.id}`
    itemType: 'LANE'
    code: string // e.g. 'BL-01'
    title: string
    zoneId: string
    zoneCode: string
    zoneName: string
    zoneType: string
    bay: any
    sectionsCount: number
    allSlots: any[]
    aisle: string
  }

  interface OtherZoneModelItem {
    id: string // `zone_${zone.id}`
    zoneId: string
    zone: any
    remainingBays: any[]
  }

  interface WarehouseModel {
    racks: RackModelItem[]
    floors: FloorModelItem[]
    lanes: LaneModelItem[]
    otherZones: OtherZoneModelItem[]
    zones: any[]
  }

  const warehouseModel: WarehouseModel = useMemo(() => {
    if (!currentWarehouse?.zones || currentWarehouse.zones.length === 0) {
      return { racks: [], floors: [], lanes: [], otherZones: [], zones: [] }
    }

    const racks: RackModelItem[] = []
    const floors: FloorModelItem[] = []
    const lanes: LaneModelItem[] = []
    const otherZones: OtherZoneModelItem[] = []

    currentWarehouse.zones.forEach((zone: any) => {
      if (zone.type === 'STORAGE') {
        const rackGroups: Record<string, any[]> = {}
        ;(zone.bays || []).forEach((b: any) => {
          const rName =
            b.rack ||
            (b.code.match(/^R\d+/)?.[0]) ||
            (b.code.match(/-R\d+/)?.[0]?.replace('-', '')) ||
            b.aisle ||
            b.code.split('-')[1] ||
            'R1'
          if (!rackGroups[rName]) rackGroups[rName] = []
          rackGroups[rName].push(b)
        })

        const rackKeys = Object.keys(rackGroups)
        const extractNum = (s: string) => {
          const m = s.match(/\d+/)
          return m ? parseInt(m[0], 10) : 999
        }
        rackKeys.sort((a, b) => extractNum(a) - extractNum(b) || a.localeCompare(b))

        if (rackKeys.length === 0) {
          racks.push({
            id: `rack_${zone.id}_${zone.code}`,
            itemType: 'RACK',
            rackName: zone.code,
            code: zone.code,
            title: `Rack ${zone.code}`,
            zoneId: zone.id,
            zoneCode: zone.code,
            zoneName: zone.name,
            zoneType: zone.type,
            bays: [],
            levels: 1,
            totalSlots: 0,
            allSlots: [],
            aisle: '',
          })
        } else {
          rackKeys.forEach((rName) => {
            const bays = rackGroups[rName]
            const allSlots: any[] = []
            bays.forEach((b: any) => {
              if (b.slots && b.slots.length > 0) {
                allSlots.push(...b.slots)
              }
            })
            racks.push({
              id: `rack_${zone.id}_${rName}`,
              itemType: 'RACK',
              rackName: rName,
              code: rName,
              title: `Rack ${rName}`,
              zoneId: zone.id,
              zoneCode: zone.code,
              zoneName: zone.name,
              zoneType: zone.type,
              bays,
              levels: bays[0]?.level || 1,
              totalSlots: allSlots.length,
              allSlots,
              aisle: bays[0]?.aisle || '',
            })
          })
        }
      } else {
        const remainingBays: any[] = []
        ;(zone.bays || []).forEach((b: any) => {
          if (b.code?.startsWith('FL-') || (zone.type === 'RECEIVING' && !b.code?.startsWith('BL-'))) {
            floors.push({
              id: `bay_${b.id}`,
              itemType: 'FLOOR',
              code: b.code,
              title: b.name || `Floor Bay ${b.code}`,
              zoneId: zone.id,
              zoneCode: zone.code,
              zoneName: zone.name,
              zoneType: zone.type,
              bay: b,
              slotsCount: b.slots?.length || 1,
              allSlots: b.slots || [],
              aisle: b.aisle || '',
            })
          } else if (b.code?.startsWith('BL-') || (zone.type === 'SHIPPING' && !b.code?.startsWith('FL-'))) {
            lanes.push({
              id: `bay_${b.id}`,
              itemType: 'LANE',
              code: b.code,
              title: b.name || `Bulk Lane ${b.code}`,
              zoneId: zone.id,
              zoneCode: zone.code,
              zoneName: zone.name,
              zoneType: zone.type,
              bay: b,
              sectionsCount: b.slots?.length || 1,
              allSlots: b.slots || [],
              aisle: b.aisle || '',
            })
          } else {
            remainingBays.push(b)
          }
        })

        if (zone.type !== 'RECEIVING' && zone.type !== 'SHIPPING') {
          otherZones.push({ id: `zone_${zone.id}`, zoneId: zone.id, zone, remainingBays })
        } else if (remainingBays.length > 0) {
          otherZones.push({ id: `zone_${zone.id}`, zoneId: zone.id, zone, remainingBays })
        }
      }
    })

    // Sort floors by code natural ordering (FL-01, FL-02...)
    floors.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    // Sort lanes by code natural ordering (BL-01, BL-02...)
    lanes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))

    return {
      racks,
      floors,
      lanes,
      otherZones,
      zones: currentWarehouse.zones || [],
    }
  }, [currentWarehouse])

  // Count statistics
  const totalZones = currentWarehouse?.zones?.length || 0
  const totalBays =
    currentWarehouse?.zones?.reduce((acc: number, z: any) => acc + (z.bays?.length || 0), 0) || 0
  const totalSlots =
    currentWarehouse?.zones?.reduce(
      (acc: number, z: any) =>
        acc +
        (z.bays || []).reduce((bAcc: number, b: any) => bAcc + (b.slots?.length || 0), 0),
      0
    ) || 0


  // ========================================================
  // VIEW 1: RENDER SHAPES AREA (FROM CANONICAL MODEL)
  // ========================================================
  const renderShapesArea = (model: WarehouseModel) => {
    if (!model.zones || model.zones.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
          <p className="text-xs">No zones registered yet. Click &quot;Add Zone&quot; or &quot;Add Rack&quot; above.</p>
        </div>
      )
    }

    const elementsToRender: React.ReactNode[] = []

    const totalRacks = model.racks.length
    const totalFloors = model.floors.length
    const totalLanes = model.lanes.length

    // Dynamic Rack dimensions:
    const rackWidth = Math.max(52, Math.min(76, Math.floor(360 / Math.max(1, totalRacks))))
    const rackGap = Math.max(6, Math.min(12, Math.floor(60 / Math.max(1, totalRacks))))

    // 1. Render RACKS
    model.racks.forEach((item, idx) => {
      const isZoneFiltered = activeZoneFilter === item.zoneId
      const rackKey = item.id
      const defaultX = 20 + idx * (rackWidth + rackGap)
      const defaultY = 26
      const customPos = layoutPositions[rackKey]
      const x = customPos ? customPos.x : defaultX
      const y = customPos ? customPos.y : defaultY
      const w = customPos?.w || rackWidth
      const h = customPos?.h || 240
      const isDragging = draggingPartId === rackKey
      const isResizing = resizingPartId === rackKey
      const isSelected = selectedShapeId === rackKey

      elementsToRender.push(
        <div
          key={rackKey}
          data-testid={`shape-rack-${item.code}`}
          onPointerDown={(e) => handlePointerDown(rackKey, w, h, e)}
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${w}px`,
            height: `${h}px`,
          }}
          className={`absolute rounded-lg border-2 flex flex-col justify-between transition-all duration-150 ${
            isEdit2DMode
              ? 'cursor-grab active:cursor-grabbing hover:border-amber-400 ring-1 ring-amber-500/20'
              : 'cursor-pointer hover:border-blue-400'
          } ${
            isSelected
              ? 'z-50 border-amber-300 ring-4 ring-amber-400/60 shadow-2xl bg-amber-950/40'
              : isDragging || isResizing
              ? 'z-40 border-amber-400 bg-amber-950/50 shadow-xl ring-2 ring-amber-400'
              : 'border-blue-600/80 bg-blue-950/40 shadow-md backdrop-blur-xs'
          } ${isZoneFiltered ? 'ring-2 ring-blue-400' : ''}`}
          onClick={(e) => {
            if (isEdit2DMode) {
              e.stopPropagation()
              setSelectedShapeId(rackKey)
              return
            }
            setActiveZoneFilter(isZoneFiltered ? null : item.zoneId)
          }}
        >
          <div className="bg-blue-900/90 text-blue-100 px-1 py-1 rounded-t-sm text-center border-b border-blue-700/80 flex items-center justify-between">
            <span className="font-mono font-black text-[11px] truncate">{item.rackName}</span>
            <div className="flex items-center gap-1">
              {isEdit2DMode && isSelected && (
                <button
                  type="button"
                  title="Rotate / Swap Dimensions"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleShapeOrientation(rackKey, w, h)
                  }}
                  className="p-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all"
                >
                  <RotateCw size={10} />
                </button>
              )}
              <span className="text-[9px] text-blue-300 font-bold">{item.bays.length}B</span>
              <button
                type="button"
                title="Configure Rack Details"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedInspectorItem({
                    itemType: 'RACK',
                    baseCode: item.rackName,
                    title: `Rack ${item.rackName}`,
                    zoneId: item.zoneId,
                    layout: {
                      bays: item.bays.length || 1,
                      levels: item.levels,
                      subParts: 1,
                      sections: 1,
                    },
                  })
                }}
                className="p-0.5 rounded hover:bg-blue-800 text-blue-200 hover:text-white transition-colors"
              >
                <Settings2 size={11} />
              </button>
            </div>
          </div>

          <div className="flex-1 p-1 flex flex-col justify-start gap-1 overflow-y-auto">
            {item.bays.length === 0 ? (
              <div className="text-[8px] text-slate-400 text-center py-4">No Bays</div>
            ) : (
              item.bays.map((bay: any) => (
                <div
                  key={bay.id}
                  onClick={(e) => {
                    if (isEdit2DMode) return
                    e.stopPropagation()
                    if (bay.slots && bay.slots.length > 0) {
                      setTargetSlotCode(bay.slots[0].code)
                      toast.success(`Selected Bay ${bay.code} (${bay.slots[0].code})`)
                    }
                  }}
                  className="border border-blue-500/40 bg-slate-900/90 rounded px-1 py-0.5 text-center hover:bg-blue-900/40 transition-colors"
                  title={`Bay: ${bay.code}`}
                >
                  <div className="font-mono text-[9px] font-bold text-slate-200 truncate">
                    {bay.code}
                  </div>
                  <div className="text-[8px] text-blue-400 truncate">
                    {bay.level || 1}T • {bay.slots?.length || 1}S
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="relative bg-slate-900/90 text-[8px] font-mono text-center py-0.5 text-slate-400 border-t border-slate-800 rounded-b-sm truncate">
            RACK {item.rackName}
            {isEdit2DMode && (
              <div
                onPointerDown={(e) => handleResizePointerDown(rackKey, w, h, e)}
                title="Drag to Resize Rack"
                className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 border border-slate-900 cursor-se-resize flex items-center justify-center rounded-tl-sm rounded-br-sm shadow-xs z-50 transition-transform hover:scale-110"
              >
                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor" className="text-slate-950">
                  <circle cx="1" cy="5" r="0.75" />
                  <circle cx="5" cy="1" r="0.75" />
                  <circle cx="5" cy="5" r="0.75" />
                </svg>
              </div>
            )}
          </div>
        </div>
      )
    })

    // 2. Render FLOOR BAYS
    const floorCols = Math.min(3, Math.max(1, Math.ceil(totalFloors / 2)))
    const floorWidth = totalFloors > 6 ? 90 : 105
    const floorHeight = totalFloors > 6 ? 62 : 70
    const floorGapX = 8
    const floorGapY = 8

    model.floors.forEach((fItem, idx) => {
      const isZoneFiltered = activeZoneFilter === fItem.zoneId
      const bayKey = fItem.id
      const col = idx % Math.max(1, floorCols)
      const row = Math.floor(idx / Math.max(1, floorCols))
      const defaultX = 20 + col * (floorWidth + floorGapX)
      const defaultY = 280 + row * (floorHeight + floorGapY)
      const customPos = layoutPositions[bayKey]
      const x = customPos ? customPos.x : defaultX
      const y = customPos ? customPos.y : defaultY
      const w = customPos?.w || floorWidth
      const h = customPos?.h || floorHeight
      const isDragging = draggingPartId === bayKey
      const isResizing = resizingPartId === bayKey
      const isSelected = selectedShapeId === bayKey
      const slotsCount = fItem.slotsCount

      elementsToRender.push(
        <div
          key={bayKey}
          data-testid={`shape-floor-${fItem.code}`}
          onPointerDown={(e) => handlePointerDown(bayKey, w, h, e)}
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${w}px`,
            height: `${h}px`,
          }}
          className={`absolute rounded-xl border-2 flex flex-col justify-between p-1.5 transition-all duration-150 ${
            isEdit2DMode
              ? 'cursor-grab active:cursor-grabbing hover:border-amber-400 ring-1 ring-amber-500/20'
              : 'cursor-pointer hover:border-sky-400 hover:scale-[1.02]'
          } ${
            isSelected
              ? 'z-50 border-amber-300 ring-4 ring-amber-400/60 shadow-2xl bg-amber-950/40'
              : isDragging || isResizing
              ? 'z-40 border-amber-400 bg-amber-950/50 shadow-xl ring-2 ring-amber-400'
              : 'border-sky-500/80 bg-sky-950/40 shadow-md backdrop-blur-xs'
          } ${isZoneFiltered ? 'ring-2 ring-sky-400' : ''}`}
          onClick={(e) => {
            if (isEdit2DMode) {
              e.stopPropagation()
              setSelectedShapeId(bayKey)
              return
            }
            setActiveZoneFilter(isZoneFiltered ? null : fItem.zoneId)
            if (fItem.bay.slots && fItem.bay.slots.length > 0) {
              setTargetSlotCode(fItem.bay.slots[0].code)
              toast.success(`Selected Floor Bay ${fItem.bay.code}`)
            }
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="font-mono font-black text-[11px] text-sky-200 bg-sky-900/80 px-1.5 py-0.5 rounded border border-sky-700/60 truncate">
              {fItem.bay.code}
            </span>
            <div className="flex items-center gap-1">
              {isEdit2DMode && isSelected && (
                <button
                  type="button"
                  title="Rotate / Swap Dimensions"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleShapeOrientation(bayKey, w, h)
                  }}
                  className="p-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all"
                >
                  <RotateCw size={10} />
                </button>
              )}
              <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-sky-800/60 text-sky-300">
                {slotsCount > 1 ? `${slotsCount}P` : 'FLOOR'}
              </span>
              <button
                type="button"
                title="Configure Floor Bay Details"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedInspectorItem({
                    itemType: 'FLOOR',
                    baseCode: fItem.bay.code,
                    title: `Floor Bay ${fItem.bay.code}`,
                    zoneId: fItem.zoneId,
                    layout: {
                      bays: 1,
                      levels: 1,
                      subParts: slotsCount,
                      sections: 1,
                    },
                  })
                }}
                className="p-0.5 rounded hover:bg-sky-800 text-sky-300 hover:text-white transition-colors"
              >
                <Settings2 size={11} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[8px] text-slate-300 px-0.5">
            <span className="truncate max-w-[55px]">{fItem.bay.name || 'Floor Bay'}</span>
            <span className="font-mono text-sky-400 font-bold">
              {slotsCount === 1 ? 'Single' : `${slotsCount} Sub-parts`}
            </span>
          </div>

          <div className="relative bg-slate-900/90 text-[8px] font-mono text-center py-0.5 text-slate-400 border-t border-slate-800 rounded-b-sm truncate">
            INBOUND PAD
            {isEdit2DMode && (
              <div
                onPointerDown={(e) => handleResizePointerDown(bayKey, w, h, e)}
                title="Drag to Resize Floor Bay"
                className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 border border-slate-900 cursor-se-resize flex items-center justify-center rounded-tl-sm rounded-br-sm shadow-xs z-50 transition-transform hover:scale-110"
              >
                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor" className="text-slate-950">
                  <circle cx="1" cy="5" r="0.75" />
                  <circle cx="5" cy="1" r="0.75" />
                  <circle cx="5" cy="5" r="0.75" />
                </svg>
              </div>
            )}
          </div>
        </div>
      )
    })

    // 3. Render BULK LANES
    const laneCols = Math.min(3, Math.max(1, Math.ceil(totalLanes / 2)))
    const laneWidth = totalLanes > 6 ? 105 : 120
    const laneHeight = totalLanes > 6 ? 48 : 54
    const laneGapX = 8
    const laneGapY = 8

    model.lanes.forEach((lItem, idx) => {
      const isZoneFiltered = activeZoneFilter === lItem.zoneId
      const bayKey = lItem.id
      const col = idx % Math.max(1, laneCols)
      const row = Math.floor(idx / Math.max(1, laneCols))
      const defaultX = 20 + col * (laneWidth + laneGapX)
      const defaultY = (totalFloors > 0 ? 365 : 280) + row * (laneHeight + laneGapY)
      const customPos = layoutPositions[bayKey]
      const x = customPos ? customPos.x : defaultX
      const y = customPos ? customPos.y : defaultY
      const w = customPos?.w || laneWidth
      const h = customPos?.h || laneHeight
      const isDragging = draggingPartId === bayKey
      const isResizing = resizingPartId === bayKey
      const isSelected = selectedShapeId === bayKey
      const sectionsCount = lItem.sectionsCount

      elementsToRender.push(
        <div
          key={bayKey}
          data-testid={`shape-lane-${lItem.code}`}
          onPointerDown={(e) => handlePointerDown(bayKey, w, h, e)}
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${w}px`,
            height: `${h}px`,
          }}
          className={`absolute rounded-xl border-2 flex flex-col justify-between p-1.5 transition-all duration-150 ${
            isEdit2DMode
              ? 'cursor-grab active:cursor-grabbing hover:border-amber-400 ring-1 ring-amber-500/20'
              : 'cursor-pointer hover:border-amber-400 hover:scale-[1.02]'
          } ${
            isSelected
              ? 'z-50 border-amber-300 ring-4 ring-amber-400/60 shadow-2xl bg-amber-950/40'
              : isDragging || isResizing
              ? 'z-40 border-amber-400 bg-amber-950/50 shadow-xl ring-2 ring-amber-400'
              : 'border-amber-500/80 bg-amber-950/40 shadow-md backdrop-blur-xs'
          } ${isZoneFiltered ? 'ring-2 ring-amber-400' : ''}`}
          onClick={(e) => {
            if (isEdit2DMode) {
              e.stopPropagation()
              setSelectedShapeId(bayKey)
              return
            }
            setActiveZoneFilter(isZoneFiltered ? null : lItem.zoneId)
            if (lItem.bay.slots && lItem.bay.slots.length > 0) {
              setTargetSlotCode(lItem.bay.slots[0].code)
              toast.success(`Selected Bulk Lane ${lItem.bay.code}`)
            }
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="font-mono font-black text-[11px] text-amber-200 bg-amber-900/80 px-1.5 py-0.5 rounded border border-amber-700/60 truncate">
              {lItem.bay.code}
            </span>
            <div className="flex items-center gap-1">
              {isEdit2DMode && isSelected && (
                <button
                  type="button"
                  title="Rotate / Swap Dimensions"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleShapeOrientation(bayKey, w, h)
                  }}
                  className="p-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all"
                >
                  <RotateCw size={10} />
                </button>
              )}
              <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-800/60 text-amber-300">
                {sectionsCount > 1 ? `${sectionsCount} SEC` : 'LANE'}
              </span>
              <button
                type="button"
                title="Configure Bulk Lane Details"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedInspectorItem({
                    itemType: 'LANE',
                    baseCode: lItem.bay.code,
                    title: `Bulk Lane ${lItem.bay.code}`,
                    zoneId: lItem.zoneId,
                    layout: {
                      bays: 1,
                      levels: 1,
                      subParts: 1,
                      sections: sectionsCount,
                    },
                  })
                }}
                className="p-0.5 rounded hover:bg-amber-800 text-amber-300 hover:text-white transition-colors"
              >
                <Settings2 size={11} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[8px] text-slate-300 px-0.5">
            <span className="truncate max-w-[65px]">{lItem.bay.name || 'Bulk Lane'}</span>
            <span className="font-mono text-amber-400 font-bold">
              {sectionsCount === 1 ? 'Single' : `${sectionsCount} Secs`}
            </span>
          </div>

          <div className="relative bg-slate-900/90 text-[8px] font-mono text-center py-0.5 text-slate-400 border-t border-slate-800 rounded-b-sm truncate">
            OUTBOUND STAGING
            {isEdit2DMode && (
              <div
                onPointerDown={(e) => handleResizePointerDown(bayKey, w, h, e)}
                title="Drag to Resize Bulk Lane"
                className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 border border-slate-900 cursor-se-resize flex items-center justify-center rounded-tl-sm rounded-br-sm shadow-xs z-50 transition-transform hover:scale-110"
              >
                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor" className="text-slate-950">
                  <circle cx="1" cy="5" r="0.75" />
                  <circle cx="5" cy="1" r="0.75" />
                  <circle cx="5" cy="5" r="0.75" />
                </svg>
              </div>
            )}
          </div>
        </div>
      )
    })

    // 4. Render OTHER FUNCTIONAL ZONES (PACKING, DAMAGED, etc.)
    model.otherZones.forEach((oz, oIdx) => {
      const zone = oz.zone
      const isZoneFiltered = activeZoneFilter === zone.id
      const zoneKey = oz.id
      const col = oIdx % 2
      const row = Math.floor(oIdx / 2)
      const defaultX = 520 + col * 230
      const defaultY = 26 + row * 210
      const customPos = layoutPositions[zoneKey]
      const x = customPos ? customPos.x : defaultX
      const y = customPos ? customPos.y : defaultY
      const w = customPos?.w || 215
      const h = customPos?.h || 190
      const isDragging = draggingPartId === zoneKey
      const isResizing = resizingPartId === zoneKey
      const isSelected = selectedShapeId === zoneKey

      let colorBorder = 'border-slate-500/80'
      let colorBg = 'bg-slate-950/35'
      let badgeColor = 'bg-slate-600/30 text-slate-300'

      if (zone.type === 'RECEIVING') {
        colorBorder = 'border-emerald-500/80'
        colorBg = 'bg-emerald-950/35'
        badgeColor = 'bg-emerald-600/30 text-emerald-300'
      } else if (zone.type === 'PACKING' || zone.type === 'SHIPPING') {
        colorBorder = 'border-amber-500/80'
        colorBg = 'bg-amber-950/35'
        badgeColor = 'bg-amber-600/30 text-amber-300'
      } else if (zone.type === 'DAMAGED' || zone.type === 'RETURNS') {
        colorBorder = 'border-rose-500/80'
        colorBg = 'bg-rose-950/35'
        badgeColor = 'bg-rose-600/30 text-rose-300'
      } else if (zone.type === 'PICKING') {
        colorBorder = 'border-indigo-500/80'
        colorBg = 'bg-indigo-950/35'
        badgeColor = 'bg-indigo-600/30 text-indigo-300'
      }

      elementsToRender.push(
        <div
          key={zoneKey}
          onPointerDown={(e) => handlePointerDown(zoneKey, w, h, e)}
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${w}px`,
            height: `${h}px`,
          }}
          className={`absolute rounded-xl border-2 transition-all p-3 flex flex-col justify-between ${
            isEdit2DMode
              ? 'cursor-grab active:cursor-grabbing hover:border-amber-400 ring-1 ring-amber-500/20'
              : 'cursor-pointer hover:scale-[1.01]'
          } ${
            isSelected
              ? 'z-50 border-amber-300 ring-4 ring-amber-400/60 shadow-2xl bg-amber-950/50'
              : isDragging || isResizing
              ? 'z-40 border-amber-400 bg-amber-950/40 shadow-2xl ring-2 ring-amber-400'
              : `${colorBorder} ${colorBg} shadow-lg backdrop-blur-xs`
          } ${isZoneFiltered ? 'ring-2 ring-blue-400' : ''}`}
          onClick={(e) => {
            if (isEdit2DMode) {
              e.stopPropagation()
              setSelectedShapeId(zoneKey)
              return
            }
            setActiveZoneFilter(isZoneFiltered ? null : zone.id)
          }}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-white">
                {zone.code}
              </span>
              <div className="flex items-center gap-1">
                {isEdit2DMode && isSelected && (
                  <button
                    type="button"
                    title="Rotate / Swap Dimensions"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleShapeOrientation(zoneKey, w, h)
                    }}
                    className="p-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all"
                  >
                    <RotateCw size={10} />
                  </button>
                )}
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${badgeColor}`}>
                  {zone.type}
                </span>
              </div>
            </div>

            <h4 className="font-extrabold text-xs text-white mt-1.5 leading-snug">
              {zone.name}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              {zone.tempControlled ? '❄️ Climate-controlled zone' : 'Active functional operation area'}
            </p>
          </div>

          <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-400 font-semibold">Configured Bays / Stations:</span>
              <span className="font-mono font-bold text-slate-200">
                {zone.bays?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-400 font-semibold">Addressable Slots:</span>
              <span className="text-emerald-400 font-mono font-bold">
                {zone.bays?.reduce((acc: number, b: any) => acc + (b.slots?.length || 0), 0) || 0}
              </span>
            </div>
          </div>

          <div className="relative flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
            <span className="text-slate-400 font-mono text-[9px] truncate max-w-[100px]">
              {zone.bays?.length ? `${zone.bays[0].code}` : 'Ready'}
            </span>
            <span className="text-blue-400 font-bold hover:underline cursor-pointer">
              {isZoneFiltered ? 'Filtered ✓' : 'Filter →'}
            </span>

            {isEdit2DMode && (
              <div
                onPointerDown={(e) => handleResizePointerDown(zoneKey, w, h, e)}
                title="Drag to Resize Zone"
                className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 border border-slate-900 cursor-se-resize flex items-center justify-center rounded-tl-sm rounded-br-sm shadow-xs z-50 transition-transform hover:scale-110"
              >
                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor" className="text-slate-950">
                  <circle cx="1" cy="5" r="0.75" />
                  <circle cx="5" cy="1" r="0.75" />
                  <circle cx="5" cy="5" r="0.75" />
                </svg>
              </div>
            )}
          </div>
        </div>
      )
    })

    return elementsToRender
  }

  // ========================================================
  // VIEW 2: RENDER DETAILS PANEL (FROM SAME CANONICAL MODEL)
  // ========================================================
  const renderDetailsPanel = (model: WarehouseModel) => {
    if (!model.zones || model.zones.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Layers size={28} />
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">No warehouse layout defined yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Start by adding functional zones (e.g. Storage, Receiving, Picking, Shipping), then add racks with vertical tiers and slots.
          </p>
          <Button
            size="sm"
            onClick={() => setAddZoneModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
          >
            <Plus size={14} className="mr-1" /> Add First Zone
          </Button>
        </div>
      )
    }

    return (
      <div
        className="space-y-6"
        data-testid="details-panel"
        data-racks-count={model.racks.length}
        data-floors-count={model.floors.length}
        data-lanes-count={model.lanes.length}
        data-racks-ids={model.racks.map((r) => r.code).join(',')}
      >
        {model.zones.map((zone: any) => {
          const isZoneFiltered = activeZoneFilter === zone.id
          // Get items belonging to this zone from the canonical model
          const zoneRacks = model.racks.filter((r) => r.zoneId === zone.id)
          const zoneFloors = model.floors.filter((f) => f.zoneId === zone.id)
          const zoneLanes = model.lanes.filter((l) => l.zoneId === zone.id)
          const zoneOther = model.otherZones.find((oz) => oz.zoneId === zone.id)

          const hasItems = zoneRacks.length > 0 || zoneFloors.length > 0 || zoneLanes.length > 0 || (zoneOther && zoneOther.remainingBays.length > 0)

          // Accurate item count computed directly from the exact items drawn in the SHAPES area
          let countLabel = '• 0 Items'
          if (zoneRacks.length > 0) {
            countLabel = `• ${zoneRacks.length} ${zoneRacks.length === 1 ? 'Rack' : 'Racks'}`
          } else if (zoneFloors.length > 0) {
            countLabel = `• ${zoneFloors.length} ${zoneFloors.length === 1 ? 'Floor Bay' : 'Floor Bays'}`
          } else if (zoneLanes.length > 0) {
            countLabel = `• ${zoneLanes.length} ${zoneLanes.length === 1 ? 'Bulk Lane' : 'Bulk Lanes'}`
          } else if (zoneOther && zoneOther.remainingBays.length > 0) {
            countLabel = `• ${zoneOther.remainingBays.length} Bays`
          }

          return (
            <div
              key={zone.id}
              className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${
                isZoneFiltered ? 'border-blue-500 ring-2 ring-blue-400/30' : 'border-slate-200'
              }`}
            >
              {/* Zone Header */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge className="font-mono font-black text-xs bg-slate-900 text-white">
                    {zone.code}
                  </Badge>
                  <h3 className="font-extrabold text-slate-900 text-sm">{zone.name}</h3>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-600">
                    {zone.type}
                  </Badge>
                  {zone.tempControlled && (
                    <Badge className="bg-sky-500 text-white text-[10px]">Temp Controlled</Badge>
                  )}
                  <span className="text-xs font-semibold text-slate-500">
                    {countLabel}
                  </span>
                  {isZoneFiltered && (
                    <Badge className="bg-blue-600 text-white text-[10px] font-bold cursor-pointer" onClick={() => setActiveZoneFilter(null)}>
                      Filtered Selection (Click to clear)
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedZoneForBay(zone.id)
                      setBayForm({
                        code: `${zone.code}-B0${(zone.bays?.length || 0) + 1}`,
                        name: `Bay ${(zone.bays?.length || 0) + 1}`,
                        aisle: 'A1',
                        rack: 'R1',
                        tiers: 3,
                        slotsPerTier: 2,
                      })
                      setAddBayModalOpen(true)
                    }}
                    className="h-7 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <Plus size={13} className="mr-1" /> Add Bay/Rack
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete zone ${zone.name}? All contained bays and slots will be removed.`)) {
                        layoutMutation.mutate({ action: 'DELETE_ZONE', payload: { zoneId: zone.id } })
                      }
                    }}
                    className="h-7 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5"
                    title="Delete Zone"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>

              {/* Items Grid */}
              <div className="p-5">
                {!hasItems ? (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No bays or racks in this zone. Click &ldquo;Add Bay/Rack&rdquo; above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. RACKS (One card per Rack, exactly matching SHAPES area racks) */}
                    {zoneRacks.map((rack) => (
                      <div
                        key={rack.id}
                        data-testid={`detail-rack-${rack.code}`}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                {rack.code}
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {rack.title}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                {rack.bays.length} {rack.bays.length === 1 ? 'Bay' : 'Bays'}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm(`Delete rack ${rack.code} and all its bays/slots?`)) {
                                  layoutMutation.mutate({
                                    action: 'DELETE_RACK',
                                    payload: { rackName: rack.code, zoneId: rack.zoneId },
                                  })
                                }
                              }}
                              className="text-slate-300 hover:text-rose-500 p-1"
                              title="Delete Rack"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-2">
                            <span>
                              Bays: <strong className="text-slate-700">{rack.bays.length}</strong> • Tiers (Levels): <strong className="text-slate-700">{rack.levels}</strong>
                            </span>
                            <span>
                              Slots: <strong className="text-slate-700">{rack.totalSlots}</strong>
                            </span>
                          </div>

                          {/* Shelves & Slots Addressing */}
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                              Shelves & Slots Addressing:
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                              {rack.allSlots.map((slot: any) => {
                                const hasStock = slot.stocks && slot.stocks.length > 0
                                return (
                                  <div
                                    key={slot.id}
                                    onClick={() => {
                                      setSelectedSlotForAssign(slot)
                                      setAssignProductModalOpen(true)
                                    }}
                                    className={`px-2 py-1 rounded text-[10px] font-mono border cursor-pointer transition-all flex items-center gap-1 ${
                                      hasStock
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-xs'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                    }`}
                                    title={`Click to map product: ${slot.code}`}
                                  >
                                    <Tag size={10} className={hasStock ? 'text-emerald-600' : 'text-slate-400'} />
                                    <span>{slot.code}</span>
                                    {hasStock && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (rack.allSlots.length > 0) {
                                  setTargetSlotCode(rack.allSlots[0].code)
                                } else {
                                  setTargetSlotCode(rack.code)
                                }
                                setActiveTab('3d-twin')
                              }}
                              className="font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                            >
                              <Compass size={12} />
                              Locate in 3D
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInspectorItem({
                                  itemType: 'RACK',
                                  baseCode: rack.code,
                                  title: rack.title,
                                  zoneId: rack.zoneId,
                                  layout: {
                                    bays: rack.bays.length || 1,
                                    levels: rack.levels,
                                    subParts: 1,
                                    sections: 1,
                                  },
                                })
                              }}
                              className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Settings2 size={12} />
                              Layout Details
                            </button>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {rack.aisle ? `Aisle ${rack.aisle}` : ''}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* 2. FLOOR BAYS (One card per Floor Bay, exactly matching SHAPES area) */}
                    {zoneFloors.map((floor) => (
                      <div
                        key={floor.id}
                        data-testid={`detail-floor-${floor.code}`}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                                {floor.code}
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {floor.title}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm(`Delete floor bay ${floor.code} and its slots?`)) {
                                  layoutMutation.mutate({ action: 'DELETE_BAY', payload: { bayId: floor.bay.id } })
                                }
                              }}
                              className="text-slate-300 hover:text-rose-500 p-1"
                              title="Delete Floor Bay"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-2">
                            <span>
                              Sub-Parts / Divs: <strong className="text-slate-700">{floor.slotsCount}</strong>
                            </span>
                            <span>
                              Slots: <strong className="text-slate-700">{floor.slotsCount}</strong>
                            </span>
                          </div>

                          {/* Shelves & Slots Addressing */}
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                              Shelves & Slots Addressing:
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                              {floor.allSlots.map((slot: any) => {
                                const hasStock = slot.stocks && slot.stocks.length > 0
                                return (
                                  <div
                                    key={slot.id}
                                    onClick={() => {
                                      setSelectedSlotForAssign(slot)
                                      setAssignProductModalOpen(true)
                                    }}
                                    className={`px-2 py-1 rounded text-[10px] font-mono border cursor-pointer transition-all flex items-center gap-1 ${
                                      hasStock
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-xs'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                    }`}
                                    title={`Click to map product: ${slot.code}`}
                                  >
                                    <Tag size={10} className={hasStock ? 'text-emerald-600' : 'text-slate-400'} />
                                    <span>{slot.code}</span>
                                    {hasStock && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (floor.allSlots.length > 0) {
                                  setTargetSlotCode(floor.allSlots[0].code)
                                } else {
                                  setTargetSlotCode(floor.code)
                                }
                                setActiveTab('3d-twin')
                              }}
                              className="font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                            >
                              <Compass size={12} />
                              Locate in 3D
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInspectorItem({
                                  itemType: 'FLOOR',
                                  baseCode: floor.code,
                                  title: floor.title,
                                  zoneId: floor.zoneId,
                                  layout: {
                                    bays: 1,
                                    levels: 1,
                                    subParts: floor.slotsCount,
                                    sections: 1,
                                  },
                                })
                              }}
                              className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Settings2 size={12} />
                              Layout Details
                            </button>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {floor.aisle ? `Aisle ${floor.aisle}` : ''}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* 3. BULK LANES (One card per Bulk Lane, exactly matching SHAPES area) */}
                    {zoneLanes.map((lane) => (
                      <div
                        key={lane.id}
                        data-testid={`detail-lane-${lane.code}`}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                {lane.code}
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {lane.title}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm(`Delete bulk lane ${lane.code} and its slots?`)) {
                                  layoutMutation.mutate({ action: 'DELETE_BAY', payload: { bayId: lane.bay.id } })
                                }
                              }}
                              className="text-slate-300 hover:text-rose-500 p-1"
                              title="Delete Bulk Lane"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-2">
                            <span>
                              Sections: <strong className="text-slate-700">{lane.sectionsCount}</strong>
                            </span>
                            <span>
                              Slots: <strong className="text-slate-700">{lane.sectionsCount}</strong>
                            </span>
                          </div>

                          {/* Shelves & Slots Addressing */}
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                              Shelves & Slots Addressing:
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                              {lane.allSlots.map((slot: any) => {
                                const hasStock = slot.stocks && slot.stocks.length > 0
                                return (
                                  <div
                                    key={slot.id}
                                    onClick={() => {
                                      setSelectedSlotForAssign(slot)
                                      setAssignProductModalOpen(true)
                                    }}
                                    className={`px-2 py-1 rounded text-[10px] font-mono border cursor-pointer transition-all flex items-center gap-1 ${
                                      hasStock
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-xs'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                    }`}
                                    title={`Click to map product: ${slot.code}`}
                                  >
                                    <Tag size={10} className={hasStock ? 'text-emerald-600' : 'text-slate-400'} />
                                    <span>{slot.code}</span>
                                    {hasStock && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (lane.allSlots.length > 0) {
                                  setTargetSlotCode(lane.allSlots[0].code)
                                } else {
                                  setTargetSlotCode(lane.code)
                                }
                                setActiveTab('3d-twin')
                              }}
                              className="font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                            >
                              <Compass size={12} />
                              Locate in 3D
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInspectorItem({
                                  itemType: 'LANE',
                                  baseCode: lane.code,
                                  title: lane.title,
                                  zoneId: lane.zoneId,
                                  layout: {
                                    bays: 1,
                                    levels: 1,
                                    subParts: 1,
                                    sections: lane.sectionsCount,
                                  },
                                })
                              }}
                              className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Settings2 size={12} />
                              Layout Details
                            </button>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {lane.aisle ? `Aisle ${lane.aisle}` : ''}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* 4. OTHER FUNCTIONAL STATIONS / BAYS (if any) */}
                    {zoneOther && zoneOther.remainingBays.map((bay: any) => (
                      <div
                        key={bay.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                            <div>
                              <span className="font-mono font-black text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                {bay.code}
                              </span>
                              <span className="text-xs font-bold text-slate-800 ml-2">
                                {bay.name}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm(`Delete bay ${bay.code} and its slots?`)) {
                                  layoutMutation.mutate({ action: 'DELETE_BAY', payload: { bayId: bay.id } })
                                }
                              }}
                              className="text-slate-300 hover:text-rose-500 p-1"
                              title="Delete Bay"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-2">
                            <span>Tiers: <strong className="text-slate-700">{bay.level || 1}</strong></span>
                            <span>Slots: <strong className="text-slate-700">{bay.slots?.length || 0}</strong></span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {(bay.slots || []).map((slot: any) => (
                              <div
                                key={slot.id}
                                onClick={() => {
                                  setSelectedSlotForAssign(slot)
                                  setAssignProductModalOpen(true)
                                }}
                                className="px-2 py-1 rounded text-[10px] font-mono border border-slate-200 bg-white cursor-pointer hover:bg-blue-50"
                              >
                                {slot.code}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Bar */}
      <div className="border-b bg-white px-6 py-5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              <Link href="/admin/settings" className="hover:text-blue-600 transition-colors">
                Settings Hub
              </Link>
              <ChevronRight size={13} />
              <span className="text-foreground font-bold">Warehouse Logistics & 3D Twin</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Building2 size={20} />
              </div>
              Warehouse Management & 3D Spatial Twin
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Register international fulfillment hubs, define 2D layout hierarchies (Sections → Racks → Tiers → Slots), and pinpoint products in 3D.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => {
                setEditingWarehouse(null)
                setWhForm({
                  name: '',
                  code: '',
                  type: 'DISTRIBUTION',
                  country: 'China',
                  city: 'Yiwu',
                  address: '',
                  contactPerson: '',
                  contactPhone: '',
                  contactEmail: '',
                  isDefaultProcurement: false,
                  isDefaultSales: false,
                  notes: '',
                })
                setCreateModalOpen(true)
              }}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold h-9 px-4 rounded-xl shadow-sm gap-1.5"
            >
              <Plus size={15} />
              Register Warehouse
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchList()
                if (selectedWarehouseId) refetchDetail()
              }}
              className="h-9 text-xs gap-1.5 border-slate-200 hover:bg-slate-100"
            >
              <RefreshCw size={13} className={isLoadingList || isLoadingDetail ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Selector & Warehouse Switcher */}
        <div className="max-w-7xl mx-auto mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 size={14} className={activeTab === 'register' ? 'text-orange-600' : ''} />
              Warehouses ({warehouses.length})
            </button>
            <button
              onClick={() => setActiveTab('layout')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'layout'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 size={14} className={activeTab === 'layout' ? 'text-blue-600' : ''} />
              2D Layout Architecture
            </button>
            <button
              onClick={() => setActiveTab('3d-twin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === '3d-twin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass size={14} className={activeTab === '3d-twin' ? 'text-emerald-600' : ''} />
              3D View
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                3D
              </span>
            </button>
          </div>

          {/* Active Warehouse Dropdown Filter */}
          {warehouses.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-500">Active Hub:</span>
              <select
                value={selectedWarehouseId || ''}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name} ({w.city}, {w.country})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* ======================================================== */}
        {/* TAB 1: REGISTER & OVERVIEW                               */}
        {/* ======================================================== */}
        {activeTab === 'register' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <Building2 size={24} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Registered Hubs</div>
                  <div className="text-2xl font-black text-slate-900">{warehouses.length}</div>
                  <div className="text-[11px] text-slate-400">Global freight nodes</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Layers size={24} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Current Hub Zones</div>
                  <div className="text-2xl font-black text-slate-900">{totalZones}</div>
                  <div className="text-[11px] text-slate-400">Sections & work areas</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Grid3X3 size={24} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Racks & Bays</div>
                  <div className="text-2xl font-black text-slate-900">{totalBays}</div>
                  <div className="text-[11px] text-slate-400">In active hub</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Box size={24} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Addressable Slots</div>
                  <div className="text-2xl font-black text-slate-900">{totalSlots}</div>
                  <div className="text-[11px] text-emerald-600 font-semibold">3D Pinpoint ready</div>
                </div>
              </div>
            </div>

            {/* Warehouse Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {warehouses.map((wh) => {
                const isSelected = wh.id === selectedWarehouseId
                return (
                  <div
                    key={wh.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/10 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">
                              {wh.code}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-bold tracking-wider"
                            >
                              {wh.type}
                            </Badge>
                            {wh.isDefaultProcurement && (
                              <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                                Default Procurement
                              </Badge>
                            )}
                            {wh.isDefaultSales && (
                              <Badge className="bg-blue-600 text-white text-[10px] font-bold">
                                Default Sales DC
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-extrabold text-lg text-slate-900">{wh.name}</h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingWarehouse(wh)
                              setWhForm({
                                name: wh.name,
                                code: wh.code,
                                type: wh.type,
                                country: wh.country,
                                city: wh.city,
                                address: wh.address,
                                contactPerson: wh.contactPerson || '',
                                contactPhone: wh.contactPhone || '',
                                contactEmail: wh.contactEmail || '',
                                isDefaultProcurement: Boolean(wh.isDefaultProcurement),
                                isDefaultSales: Boolean(wh.isDefaultSales),
                                notes: wh.notes || '',
                              })
                              setCreateModalOpen(true)
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Edit warehouse"
                          >
                            <Edit2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1.5 mb-4">
                        <p className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                          <span>
                            {wh.address}, {wh.city}, <strong className="text-slate-800">{wh.country}</strong>
                          </span>
                        </p>
                        {wh.contactPerson && (
                          <p className="text-slate-500 pl-5">
                            Contact: <span className="text-slate-800 font-semibold">{wh.contactPerson}</span>
                            {wh.contactPhone && ` • ${wh.contactPhone}`}
                          </p>
                        )}
                      </div>

                      {/* Internal stats bar */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Zones</div>
                          <div className="font-bold text-slate-800 text-sm">
                            {wh.zones?.length || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Stock Units</div>
                          <div className="font-bold text-slate-800 text-sm">
                            {wh.totalStockUnits || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Active Orders</div>
                          <div className="font-bold text-slate-800 text-sm">
                            {wh._count?.orders || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedWarehouseId(wh.id)
                          setActiveTab('layout')
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Grid3X3 size={13} />
                        Configure 2D Layout
                      </button>

                      <button
                        onClick={() => {
                          setSelectedWarehouseId(wh.id)
                          setActiveTab('3d-twin')
                        }}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <Compass size={13} />
                        Open 3D Spatial Twin →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: 2D LAYOUT ARCHITECT (ZONES -> BAYS -> TIERS)      */}
        {/* ======================================================== */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            {/* Top Toolbar for Layout */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Grid3X3 size={18} className="text-blue-600" />
                  2D Warehouse Addressing Topology: {currentWarehouse?.name} ({currentWarehouse?.code})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Structure Sections (Zones) → Racks/Bays → Tiers (Levels) → Slots with barcode codes.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1-Click Storage Item Buttons: RACK, FLOOR BAY, BULK LANE */}
                <Button
                  size="sm"
                  onClick={() => {
                    // Auto-increment Rack counter: R{N}
                    let highestRack = 0
                    currentWarehouse?.zones?.forEach((z: any) => {
                      (z.bays || []).forEach((b: any) => {
                        const m = (b.rack || b.code || '').match(/R(\d+)/i)
                        if (m && Number(m[1]) > highestRack) highestRack = Number(m[1])
                      })
                    })
                    const nextRack = highestRack + 1
                    layoutMutation.mutate({
                      action: 'ADD_ITEM',
                      payload: { itemType: 'RACK', counter: nextRack },
                    })
                  }}
                  disabled={layoutMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8.5 rounded-xl gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  Add Rack (R1, R2...)
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    // Auto-increment Floor Bay counter: FL-{NN}
                    let highestFloor = 0
                    currentWarehouse?.zones?.forEach((z: any) => {
                      (z.bays || []).forEach((b: any) => {
                        const m = (b.code || '').match(/FL-(\d+)/i)
                        if (m && Number(m[1]) > highestFloor) highestFloor = Number(m[1])
                      })
                    })
                    const nextFloor = highestFloor + 1
                    layoutMutation.mutate({
                      action: 'ADD_ITEM',
                      payload: { itemType: 'FLOOR', counter: nextFloor },
                    })
                  }}
                  disabled={layoutMutation.isPending}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold h-8.5 rounded-xl gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  Add Floor Bay (FL-01...)
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    // Auto-increment Bulk Lane counter: BL-{NN}
                    let highestLane = 0
                    currentWarehouse?.zones?.forEach((z: any) => {
                      (z.bays || []).forEach((b: any) => {
                        const m = (b.code || '').match(/BL-(\d+)/i)
                        if (m && Number(m[1]) > highestLane) highestLane = Number(m[1])
                      })
                    })
                    const nextLane = highestLane + 1
                    layoutMutation.mutate({
                      action: 'ADD_ITEM',
                      payload: { itemType: 'LANE', counter: nextLane },
                    })
                  }}
                  disabled={layoutMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8.5 rounded-xl gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  Add Lane (BL-01...)
                </Button>

                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setZoneForm({
                      code: `${currentWarehouse?.code || 'WH'}-Z0${(currentWarehouse?.zones?.length || 0) + 1}`,
                      name: `Zone ${(currentWarehouse?.zones?.length || 0) + 1}`,
                      type: 'STORAGE',
                      tempControlled: false,
                      hasShelving: true,
                      rackPrefix: 'R',
                      rackNumber: (currentWarehouse?.zones?.filter((z: any) => z.type === 'STORAGE').length || 0) + 1,
                      baysCount: 2,
                      tiersCount: 3,
                      slotsPerTier: 2,
                    })
                    setAddZoneModalOpen(true)
                  }}
                  className="border-slate-300 text-slate-700 text-xs font-bold h-8.5 rounded-xl gap-1.5 hover:bg-slate-100"
                >
                  <Plus size={14} />
                  Add Custom Zone
                </Button>

                {currentWarehouse?.zones?.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedZoneForBay(currentWarehouse.zones[0]?.id || null)
                      setBatchRacksModalOpen(true)
                    }}
                    className="border-slate-300 text-slate-700 text-xs font-bold h-8.5 rounded-xl gap-1.5 hover:bg-slate-100"
                  >
                    <Sparkles size={14} className="text-amber-500" />
                    Batch Racks
                  </Button>
                )}
              </div>
            </div>

            {/* 2D VISUAL WAREHOUSE SCHEMATIC BLUEPRINT (MATCHING REAL TOPOLOGY) */}
            {currentWarehouse?.zones && currentWarehouse.zones.length > 0 && (
              <div className="bg-[#0b0f19] rounded-2xl border border-slate-800 p-5 shadow-2xl text-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📐</span>
                      <h3 className="font-extrabold text-sm text-slate-100 tracking-tight">
                        2D Floor Plan Schematic Blueprint: {currentWarehouse.name}
                      </h3>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] font-mono">
                        {currentWarehouse.code}
                      </Badge>
                      {isEdit2DMode && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] animate-pulse">
                          Drag & Position Enabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Top-down architectural blueprint. Parallel vertical racks on left, staging bays below, and functional staging & processing blocks on right.
                    </p>
                  </div>

                  {/* Controls & Mode Toggles */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                    <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 mr-1">
                      <button
                        type="button"
                        onClick={() => setIsEdit2DMode(false)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                          !isEdit2DMode ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <LayoutTemplate size={12} />
                        Architect View
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEdit2DMode(true)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                          isEdit2DMode ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Move size={12} />
                        Drag & Position
                      </button>
                    </div>

                    {isEdit2DMode && (
                      <button
                        type="button"
                        onClick={reset2DLayout}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700"
                      >
                        Reset Layout
                      </button>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 border border-blue-400"></span>
                      <span>Racks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-400"></span>
                      <span>Receiving</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 border border-amber-400"></span>
                      <span>Packing/Shipping</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 border border-rose-400"></span>
                      <span>Damaged/Returns</span>
                    </div>

                    {activeZoneFilter && (
                      <button
                        onClick={() => setActiveZoneFilter(null)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 ml-1"
                      >
                        Clear Filter ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Item Floating Position & Orientation Toolpad (Visible when shape is selected in Drag mode) */}
                {isEdit2DMode && selectedShapeId && (
                  <div className="bg-slate-900/95 border-2 border-amber-500/70 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                      <span className="text-slate-300 font-bold">
                        Selected: <strong className="font-mono text-amber-300">{selectedShapeId}</strong>
                      </span>
                      {(() => {
                        const cur = layoutPositions[selectedShapeId]
                        const isH = cur?.orientation === 'horizontal'
                        return (
                          <Badge className="bg-slate-800 text-amber-200 border-slate-700 text-[10px] uppercase font-bold">
                            {isH ? 'Horizontal' : 'Vertical'} ({cur?.w || 80}×{cur?.h || 120}px)
                          </Badge>
                        )
                      })()}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Orientation Toggle Button */}
                      {(() => {
                        const cur = layoutPositions[selectedShapeId]
                        const curW = cur?.w || 80
                        const curH = cur?.h || 120
                        const isH = cur?.orientation === 'horizontal'

                        return (
                          <button
                            type="button"
                            onClick={() => toggleShapeOrientation(selectedShapeId, curW, curH)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold text-[11px] transition-all"
                            title="Rotate shape 90° (Swaps width & height)"
                          >
                            <RotateCw size={12} />
                            <span>Rotate: {isH ? 'Set Vertical' : 'Set Horizontal'}</span>
                          </button>
                        )
                      })()}

                      {/* Directional Arrow Buttons for fine-tuning */}
                      <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveSelectedShape(-5, 0)}
                          title="Nudge Left (Left Arrow)"
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        >
                          <ArrowLeft size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSelectedShape(0, -5)}
                          title="Nudge Up (Up Arrow)"
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSelectedShape(0, 5)}
                          title="Nudge Down (Down Arrow)"
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSelectedShape(5, 0)}
                          title="Nudge Right (Right Arrow)"
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        >
                          <ArrowRight size={13} />
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        ⌨ Arrow keys / Shift+Arrow
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedShapeId(null)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 ml-1"
                        title="Deselect"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2D INTERACTIVE ARCHITECTURAL CANVAS (SVG / CSS GRID) */}
                <div
                  ref={blueprintBoardRef}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="relative w-full min-h-[520px] h-[550px] bg-[#070a13] rounded-xl border-2 border-slate-600 p-3 overflow-hidden select-none shadow-inner"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, #1e293b 1px, transparent 1px), linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)',
                    backgroundSize: '20px 20px, 40px 40px, 40px 40px',
                  }}
                >
                  {/* Warehouse Wall Labels */}
                  <div className="absolute top-2 left-4 text-[10px] font-mono font-bold text-slate-500 tracking-wider">
                    ◄ NORTH WALL / INBOUND DOCKS
                  </div>
                  <div className="absolute bottom-2 left-4 text-[10px] font-mono font-bold text-slate-500 tracking-wider">
                    ◄ SOUTH WALL / OUTBOUND LOGISTICS
                  </div>
                  <div className="absolute top-2 right-4 text-[10px] font-mono font-bold text-slate-500 tracking-wider">
                    EAST PERIMETER GATE ►
                  </div>

                  {/* Center forklift runway indicator */}
                  <div className="absolute left-[45%] top-0 bottom-0 w-[2px] border-r border-dashed border-slate-700/60 pointer-events-none flex flex-col justify-center items-center">
                    <span className="bg-[#070a13] px-1 py-3 text-[9px] text-slate-500 font-mono tracking-widest rotate-90 whitespace-nowrap">
                      MAIN TRANSIT AISLE
                    </span>
                  </div>

                  {/* DYNAMIC RENDERING: RENDER SHAPES AREA (FROM CANONICAL MODEL) */}
                  <div data-testid="shapes-area" data-racks-count={warehouseModel.racks.length} data-floors-count={warehouseModel.floors.length} data-lanes-count={warehouseModel.lanes.length} data-racks-ids={warehouseModel.racks.map(r => r.code).join(',')}>
                    {renderShapesArea(warehouseModel)}
                  </div>
                </div>

                {/* Blueprint Footer Guidelines */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-[11px] text-slate-400 px-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-emerald-400 font-bold">● North Inbound</span>
                    <span className="w-10 h-0 border-t border-dashed border-slate-600"></span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-400 font-bold">
                      2D TOPOLOGY TO 3D DIGITAL TWIN MAPPING
                    </span>
                    <span className="w-10 h-0 border-t border-dashed border-slate-600"></span>
                    <span className="text-amber-400 font-bold">● South Outbound</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {isEdit2DMode
                      ? '💡 Drag or click to select • ⌨ Arrow keys (Shift+Arrow = 20px) • Rotate button for Horizontal/Vertical • Drag corner to resize'
                      : '💡 Click any block or bay to filter and highlight • Switch to Drag & Position to customize'}
                  </div>
                </div>
              </div>
            )}

            {/* ITEM DETAILS & INNER LAYOUT INSPECTOR PANEL */}
            {selectedInspectorItem && (
              <div className="bg-white rounded-2xl border-2 border-blue-500/80 shadow-lg p-5 transition-all">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Settings2 size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">
                          {selectedInspectorItem.baseCode}
                        </span>
                        <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border-blue-200">
                          {selectedInspectorItem.itemType === 'RACK'
                            ? 'Pallet Rack (Vertical Multi-Bay)'
                            : selectedInspectorItem.itemType === 'FLOOR'
                            ? 'Floor Bay (Ground Staging)'
                            : 'Bulk Shipping Lane'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure inner layout parameters below. Clicking <strong>Apply Changes</strong> will instantly regenerate only this item&apos;s addressing sub-codes.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedInspectorItem(null)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Numeric Configuration Inputs */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Layout Dimension Parameters
                      </div>

                      {selectedInspectorItem.itemType === 'RACK' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Number of Bays (1 - 20)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={selectedInspectorItem.layout.bays}
                              onChange={(e) =>
                                setSelectedInspectorItem({
                                  ...selectedInspectorItem,
                                  layout: {
                                    ...selectedInspectorItem.layout,
                                    bays: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                                  },
                                })
                              }
                              className="h-9 text-xs font-semibold bg-white"
                            />
                            <span className="text-[10px] text-slate-400">Horizontal rack segments</span>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Levels / Tiers (1 - 10)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={selectedInspectorItem.layout.levels}
                              onChange={(e) =>
                                setSelectedInspectorItem({
                                  ...selectedInspectorItem,
                                  layout: {
                                    ...selectedInspectorItem.layout,
                                    levels: Math.max(1, Math.min(10, Number(e.target.value) || 1)),
                                  },
                                })
                              }
                              className="h-9 text-xs font-semibold bg-white"
                            />
                            <span className="text-[10px] text-slate-400">Vertical shelf height tiers</span>
                          </div>
                        </div>
                      )}

                      {selectedInspectorItem.itemType === 'FLOOR' && (
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-700">Floor Sub-Parts / Sub-Divisions (1 - 26)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={26}
                            value={selectedInspectorItem.layout.subParts}
                            onChange={(e) =>
                              setSelectedInspectorItem({
                                ...selectedInspectorItem,
                                layout: {
                                  ...selectedInspectorItem.layout,
                                  subParts: Math.max(1, Math.min(26, Number(e.target.value) || 1)),
                                },
                              })
                            }
                            className="h-9 text-xs font-semibold bg-white"
                          />
                          <span className="text-[10px] text-slate-400">
                            1 gives base code ({selectedInspectorItem.baseCode}). Greater than 1 generates lettered divisions ({selectedInspectorItem.baseCode}-A, {selectedInspectorItem.baseCode}-B, ...).
                          </span>
                        </div>
                      )}

                      {selectedInspectorItem.itemType === 'LANE' && (
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-700">Lane Sections (1 - 20)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={selectedInspectorItem.layout.sections}
                            onChange={(e) =>
                              setSelectedInspectorItem({
                                ...selectedInspectorItem,
                                layout: {
                                  ...selectedInspectorItem.layout,
                                  sections: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                                },
                              })
                            }
                            className="h-9 text-xs font-semibold bg-white"
                          />
                          <span className="text-[10px] text-slate-400">
                            1 gives base code ({selectedInspectorItem.baseCode}). Greater than 1 generates numbered sections ({selectedInspectorItem.baseCode}-01, {selectedInspectorItem.baseCode}-02, ...).
                          </span>
                        </div>
                      )}

                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          onClick={() => {
                            layoutMutation.mutate({
                              action: 'UPDATE_ITEM_LAYOUT',
                              payload: {
                                itemType: selectedInspectorItem.itemType,
                                baseCode: selectedInspectorItem.baseCode,
                                layout: selectedInspectorItem.layout,
                              },
                            })
                          }}
                          disabled={layoutMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9 rounded-xl px-4 gap-1.5 shadow-sm"
                        >
                          {layoutMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          Apply Changes & Regenerate
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setSelectedInspectorItem(null)}
                          className="h-9 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Sub-Codes Preview */}
                  <div className="lg:col-span-6 bg-slate-900 rounded-xl p-4 text-slate-100 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <div className="text-xs font-bold text-slate-300">Live Sub-Codes Addressing Preview</div>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] font-mono">
                          {(() => {
                            if (selectedInspectorItem.itemType === 'RACK') {
                              return `${selectedInspectorItem.layout.bays * selectedInspectorItem.layout.levels} Slots`
                            } else if (selectedInspectorItem.itemType === 'FLOOR') {
                              return `${selectedInspectorItem.layout.subParts} Addresses`
                            } else {
                              return `${selectedInspectorItem.layout.sections} Sections`
                            }
                          })()}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-slate-400 mb-3">
                        These unique identifiers will be generated in the database and addressable in both 2D blueprint and 3D digital twin:
                      </p>

                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {(() => {
                          const previewCodes: string[] = []
                          if (selectedInspectorItem.itemType === 'RACK') {
                            const { bays, levels } = selectedInspectorItem.layout
                            for (let b = 1; b <= bays; b++) {
                              const bPad = b < 10 ? `0${b}` : `${b}`
                              for (let l = 1; l <= levels; l++) {
                                const lPad = l < 10 ? `0${l}` : `${l}`
                                previewCodes.push(`${selectedInspectorItem.baseCode}-${bPad}-${lPad}`)
                              }
                            }
                          } else if (selectedInspectorItem.itemType === 'FLOOR') {
                            const { subParts } = selectedInspectorItem.layout
                            if (subParts === 1) {
                              previewCodes.push(selectedInspectorItem.baseCode)
                            } else {
                              for (let i = 0; i < subParts; i++) {
                                const letter = String.fromCharCode(65 + i)
                                previewCodes.push(`${selectedInspectorItem.baseCode}-${letter}`)
                              }
                            }
                          } else if (selectedInspectorItem.itemType === 'LANE') {
                            const { sections } = selectedInspectorItem.layout
                            if (sections === 1) {
                              previewCodes.push(selectedInspectorItem.baseCode)
                            } else {
                              for (let s = 1; s <= sections; s++) {
                                const sPad = s < 10 ? `0${s}` : `${s}`
                                previewCodes.push(`${selectedInspectorItem.baseCode}-${sPad}`)
                              }
                            }
                          }

                          return previewCodes.map((code) => (
                            <span
                              key={code}
                              className="font-mono text-[11px] px-2.5 py-1 rounded bg-slate-800 text-sky-300 border border-slate-700 font-bold"
                            >
                              {code}
                            </span>
                          ))
                        })()}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Instant localized database update</span>
                      <span className="text-emerald-400 font-bold">● Zero disturbance to other racks</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DETAILS PANEL: FAITHFUL REAL-TIME MIRROR OF SHAPES AREA */}
            {renderDetailsPanel(warehouseModel)}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: 3D DIGITAL TWIN & SPATIAL PATHFINDING             */}
        {/* ======================================================== */}
        {activeTab === '3d-twin' && (
          <div className="space-y-4">
            {/* Header info strip */}
            <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Compass size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Digital Twin Viewport: {currentWarehouse?.name} ({currentWarehouse?.code})
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Interactive Three.js environment. Search product address code, toggle Heatmap, and visualize laser aisle routes.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-slate-900 text-white font-mono text-xs">
                  {twin3DItems.length} Products Plotted
                </Badge>
                <Badge variant="outline" className="font-bold text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
                  Laser Wayfinding Active
                </Badge>
              </div>
            </div>

            {/* 3D Canvas Visualizer Component */}
            <Warehouse3DViewer
              warehouse={currentWarehouse}
              items={twin3DItems}
              layoutPositions={layoutPositions}
              selectedLocation={targetSlotCode}
              onSelectLocation={(loc) => setTargetSlotCode(loc)}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}

      {/* 1. Register / Edit Warehouse Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? 'Edit Warehouse Hub' : 'Register New Warehouse Hub'}
            </DialogTitle>
            <DialogDescription>
              Provide warehouse code, location details, and fulfillment assignments.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createOrUpdateWhMutation.mutate(whForm)
            }}
            className="space-y-3 pt-2 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Warehouse Code *</Label>
                <Input
                  required
                  disabled={Boolean(editingWarehouse)}
                  placeholder="e.g. CN-YW, BY-MS"
                  value={whForm.code}
                  onChange={(e) => setWhForm({ ...whForm, code: e.target.value.toUpperCase() })}
                  className="h-8 text-xs font-mono font-bold uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hub Type *</Label>
                <select
                  value={whForm.type}
                  onChange={(e) => setWhForm({ ...whForm, type: e.target.value })}
                  className="w-full h-8 px-2 rounded-md border border-input text-xs bg-background"
                >
                  <option value="PROCUREMENT">PROCUREMENT (Source DC)</option>
                  <option value="DISTRIBUTION">DISTRIBUTION (Fulfillment Hub)</option>
                  <option value="TRANSIT">TRANSIT (Cross-docking)</option>
                  <option value="RETURN">RETURN (Inspection / Warranty)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Warehouse Name *</Label>
              <Input
                required
                placeholder="e.g. China Yiwu International Procurement DC"
                value={whForm.name}
                onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
                className="h-8 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Country *</Label>
                <select
                  required
                  value={whForm.country}
                  onChange={(e) => {
                    const nextCountry = e.target.value
                    setWhForm((prev) => ({
                      ...prev,
                      country: nextCountry,
                      city:
                        nextCountry === 'Belarus' && (!prev.city || prev.city === 'Yiwu')
                          ? 'Minsk'
                          : nextCountry === 'China' && (!prev.city || prev.city === 'Minsk')
                          ? 'Yiwu'
                          : prev.city,
                    }))
                  }}
                  className="w-full h-8 px-2 rounded-md border border-input text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                >
                  {WAREHOUSE_COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City *</Label>
                <Input
                  required
                  placeholder="Yiwu, Minsk, Moscow..."
                  value={whForm.city}
                  onChange={(e) => setWhForm({ ...whForm, city: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Physical Address *</Label>
              <Input
                required
                placeholder="Building number, industrial zone, street address"
                value={whForm.address}
                onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Contact Manager</Label>
                <Input
                  placeholder="Manager Name"
                  value={whForm.contactPerson}
                  onChange={(e) => setWhForm({ ...whForm, contactPerson: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contact Phone</Label>
                <Input
                  placeholder="+86 ..."
                  value={whForm.contactPhone}
                  onChange={(e) => setWhForm({ ...whForm, contactPhone: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultProcurement"
                  checked={whForm.isDefaultProcurement}
                  onChange={(e) =>
                    setWhForm({ ...whForm, isDefaultProcurement: e.target.checked })
                  }
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="isDefaultProcurement" className="text-xs font-semibold text-slate-700">
                  Default China Hub for Supplier POs
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultSales"
                  checked={whForm.isDefaultSales}
                  onChange={(e) =>
                    setWhForm({ ...whForm, isDefaultSales: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isDefaultSales" className="text-xs font-semibold text-slate-700">
                  Default Overseas Destination Hub for Customer Orders
                </label>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createOrUpdateWhMutation.isPending}
                className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                {createOrUpdateWhMutation.isPending ? 'Saving...' : 'Save Warehouse'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Add Zone Modal */}
      <Dialog open={addZoneModalOpen} onOpenChange={setAddZoneModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Warehouse Zone</DialogTitle>
            <DialogDescription>Define functional area in {currentWarehouse?.name}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              layoutMutation.mutate({ action: 'ADD_ZONE', payload: zoneForm })
            }}
            className="space-y-3 pt-2 text-xs"
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Zone Code *</Label>
                <Input
                  required
                  placeholder="e.g. CN-STOR-02, Z-PICK"
                  value={zoneForm.code}
                  onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value.toUpperCase() })}
                  className="h-8 text-xs font-mono uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Zone Name *</Label>
                <Input
                  required
                  placeholder="e.g. Bulk Pallet Storage"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Function Type *</Label>
              <select
                value={zoneForm.type}
                onChange={(e) => {
                  const newType = e.target.value
                  setZoneForm({
                    ...zoneForm,
                    type: newType,
                    hasShelving: newType === 'STORAGE',
                  })
                }}
                className="w-full h-8 px-2 rounded-md border border-input text-xs bg-background font-medium"
              >
                <option value="STORAGE">STORAGE (Shelving & Pallet Racks)</option>
                <option value="RECEIVING">RECEIVING (Staging & Inbound QA - Auto Stations)</option>
                <option value="PICKING">PICKING (Fast-moving Bins)</option>
                <option value="PACKING">PACKING (Consolidation - Auto Stations)</option>
                <option value="SHIPPING">SHIPPING (Container Staging - Auto Stations)</option>
                <option value="DAMAGED">DAMAGED (Quarantine & Return - Auto Stations)</option>
              </select>
            </div>

            {/* If Shelving / Storage is selected: Allow user to configure bays, tiers, and slots */}
            {zoneForm.type === 'STORAGE' ? (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2.5">
                <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                  <Grid3X3 size={13} className="text-blue-600" />
                  Shelving Rack Specification (Customizable)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Rack Identifier</Label>
                    <Input
                      value={`${zoneForm.rackPrefix}${zoneForm.rackNumber}`}
                      onChange={(e) => {
                        const val = e.target.value
                        const match = val.match(/^([a-zA-Z]+)(\d+)$/)
                        if (match) {
                          setZoneForm({ ...zoneForm, rackPrefix: match[1], rackNumber: parseInt(match[2]) || 1 })
                        }
                      }}
                      placeholder="e.g. R1"
                      className="h-7 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Bays Count</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={zoneForm.baysCount}
                      onChange={(e) => setZoneForm({ ...zoneForm, baysCount: parseInt(e.target.value) || 1 })}
                      className="h-7 text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Tiers (Levels) / Bay</Label>
                    <Input
                      type="number"
                      min={1}
                      max={8}
                      value={zoneForm.tiersCount}
                      onChange={(e) => setZoneForm({ ...zoneForm, tiersCount: parseInt(e.target.value) || 1 })}
                      className="h-7 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Slots / Tier</Label>
                    <Input
                      type="number"
                      min={1}
                      max={6}
                      value={zoneForm.slotsPerTier}
                      onChange={(e) => setZoneForm({ ...zoneForm, slotsPerTier: parseInt(e.target.value) || 1 })}
                      className="h-7 text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-blue-700 italic">
                  Will generate {zoneForm.baysCount} bays × {zoneForm.tiersCount} levels × {zoneForm.slotsPerTier} slots ={' '}
                  {zoneForm.baysCount * zoneForm.tiersCount * zoneForm.slotsPerTier} addressable 3D locations.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">Automated Station Addressing:</span> System will automatically generate staging pads and tracking address codes for this zone without manual bay/slot setup.
                </div>
              </div>
            )}

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddZoneModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={layoutMutation.isPending}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {layoutMutation.isPending ? 'Adding...' : 'Add Zone'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2.5 Quick 1-Click Add Rack Modal */}
      <Dialog open={quickRackModalOpen} onOpenChange={setQuickRackModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              1-Click Add Rack ({quickRackForm.rackPrefix}{quickRackForm.rackNumber})
            </DialogTitle>
            <DialogDescription>
              Quickly add an addressable pallet rack to {currentWarehouse?.name}.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              // Find or select target storage zone
              let targetZoneId = quickRackForm.zoneId
              if (!targetZoneId) {
                const storageZone = currentWarehouse?.zones?.find((z: any) => z.type === 'STORAGE')
                targetZoneId = storageZone?.id || currentWarehouse?.zones?.[0]?.id
              }

              if (!targetZoneId) {
                // If no zone exists yet, create one directly with ADD_ZONE
                layoutMutation.mutate({
                  action: 'ADD_ZONE',
                  payload: {
                    code: `${currentWarehouse?.code || 'WH'}-STOR-01`,
                    name: 'Storage Area',
                    type: 'STORAGE',
                    hasShelving: true,
                    rackPrefix: quickRackForm.rackPrefix,
                    rackNumber: quickRackForm.rackNumber,
                    baysCount: quickRackForm.baysCount,
                    tiersCount: quickRackForm.tiersCount,
                    slotsPerTier: quickRackForm.slotsPerTier,
                  },
                })
              } else {
                // Dispatch batch generate for single rack
                layoutMutation.mutate({
                  action: 'BATCH_GENERATE_RACKS',
                  payload: {
                    zoneId: targetZoneId,
                    rackPrefix: quickRackForm.rackPrefix,
                    startRack: quickRackForm.rackNumber,
                    endRack: quickRackForm.rackNumber,
                    baysPerRack: quickRackForm.baysCount,
                    tiersPerBay: quickRackForm.tiersCount,
                    slotsPerTier: quickRackForm.slotsPerTier,
                  },
                })
              }
            }}
            className="space-y-3 pt-2 text-xs"
          >
            {currentWarehouse?.zones?.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Destination Zone</Label>
                <select
                  value={quickRackForm.zoneId || currentWarehouse?.zones?.[0]?.id || ''}
                  onChange={(e) => setQuickRackForm({ ...quickRackForm, zoneId: e.target.value })}
                  className="w-full h-8 px-2 rounded-md border border-input text-xs bg-background font-medium"
                >
                  {currentWarehouse?.zones?.map((z: any) => (
                    <option key={z.id} value={z.id}>
                      {z.code} - {z.name} ({z.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Rack Prefix</Label>
                <Input
                  value={quickRackForm.rackPrefix}
                  onChange={(e) => setQuickRackForm({ ...quickRackForm, rackPrefix: e.target.value.toUpperCase() })}
                  className="h-8 text-xs font-mono font-bold uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rack Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={quickRackForm.rackNumber}
                  onChange={(e) => setQuickRackForm({ ...quickRackForm, rackNumber: parseInt(e.target.value) || 1 })}
                  className="h-8 text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-emerald-900">Bays</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={quickRackForm.baysCount}
                  onChange={(e) => setQuickRackForm({ ...quickRackForm, baysCount: parseInt(e.target.value) || 1 })}
                  className="h-7 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-emerald-900">Tiers (Levels)</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={quickRackForm.tiersCount}
                  onChange={(e) => setQuickRackForm({ ...quickRackForm, tiersCount: parseInt(e.target.value) || 1 })}
                  className="h-7 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-emerald-900">Slots / Tier</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={quickRackForm.slotsPerTier}
                  onChange={(e) => setQuickRackForm({ ...quickRackForm, slotsPerTier: parseInt(e.target.value) || 1 })}
                  className="h-7 text-xs font-bold"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              Generates rack <strong className="font-mono text-slate-800">{quickRackForm.rackPrefix}{quickRackForm.rackNumber}</strong> with{' '}
              {quickRackForm.baysCount} bays and {quickRackForm.baysCount * quickRackForm.tiersCount * quickRackForm.slotsPerTier} addressable 3D slots.
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickRackModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={layoutMutation.isPending}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {layoutMutation.isPending ? 'Generating...' : `Create Rack ${quickRackForm.rackPrefix}${quickRackForm.rackNumber}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Add Bay / Rack Modal */}
      <Dialog open={addBayModalOpen} onOpenChange={setAddBayModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Rack / Bay with Shelves</DialogTitle>
            <DialogDescription>Define vertical tiers and slots per tier</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              layoutMutation.mutate({
                action: 'ADD_BAY',
                payload: { ...bayForm, zoneId: selectedZoneForBay },
              })
            }}
            className="space-y-3 pt-2 text-xs"
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Bay Code *</Label>
                <Input
                  required
                  placeholder="e.g. R2-B01"
                  value={bayForm.code}
                  onChange={(e) => setBayForm({ ...bayForm, code: e.target.value.toUpperCase() })}
                  className="h-8 text-xs font-mono uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bay Label</Label>
                <Input
                  placeholder="e.g. Rack 2 Bay 1"
                  value={bayForm.name}
                  onChange={(e) => setBayForm({ ...bayForm, name: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Aisle Identifier</Label>
                <Input
                  placeholder="e.g. A1, A2"
                  value={bayForm.aisle}
                  onChange={(e) => setBayForm({ ...bayForm, aisle: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rack Row</Label>
                <Input
                  placeholder="e.g. R1, R2"
                  value={bayForm.rack}
                  onChange={(e) => setBayForm({ ...bayForm, rack: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg border">
              <div className="space-y-1">
                <Label className="text-xs">Tiers (Levels) *</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={bayForm.tiers}
                  onChange={(e) => setBayForm({ ...bayForm, tiers: parseInt(e.target.value) || 1 })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slots / Tier *</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={bayForm.slotsPerTier}
                  onChange={(e) =>
                    setBayForm({ ...bayForm, slotsPerTier: parseInt(e.target.value) || 1 })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddBayModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={layoutMutation.isPending}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {layoutMutation.isPending ? 'Configuring...' : 'Generate Bay & Slots'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Batch Generate Custom Racks Modal */}
      <Dialog open={batchRacksModalOpen} onOpenChange={setBatchRacksModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Batch Generate Warehouse Racks ({batchForm.rackPrefix}{batchForm.startRack} - {batchForm.rackPrefix}{batchForm.endRack})
            </DialogTitle>
            <DialogDescription>
              Scaffold any custom range of racks, bays, vertical tiers, and slots for {currentWarehouse?.name}.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              layoutMutation.mutate({
                action: 'BATCH_GENERATE_RACKS',
                payload: { ...batchForm, zoneId: selectedZoneForBay },
              })
            }}
            className="space-y-3 pt-2 text-xs"
          >
            <div className="space-y-1">
              <Label className="text-xs">Target Zone *</Label>
              <select
                value={selectedZoneForBay || ''}
                onChange={(e) => setSelectedZoneForBay(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-input text-xs bg-background font-bold"
              >
                {currentWarehouse?.zones?.map((z: any) => (
                  <option key={z.id} value={z.id}>
                    {z.code} - {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Prefix</Label>
                <Input
                  value={batchForm.rackPrefix}
                  onChange={(e) => setBatchForm({ ...batchForm, rackPrefix: e.target.value })}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Rack #</Label>
                <Input
                  type="number"
                  value={batchForm.startRack}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, startRack: parseInt(e.target.value) || 1 })
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Rack #</Label>
                <Input
                  type="number"
                  value={batchForm.endRack}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, endRack: parseInt(e.target.value) || 6 })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-amber-50/50 rounded-xl border border-amber-200">
              <div className="space-y-1">
                <Label className="text-xs">Bays / Rack</Label>
                <Input
                  type="number"
                  value={batchForm.baysPerRack}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, baysPerRack: parseInt(e.target.value) || 4 })
                  }
                  className="h-8 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tiers / Bay</Label>
                <Input
                  type="number"
                  value={batchForm.tiersPerBay}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, tiersPerBay: parseInt(e.target.value) || 3 })
                  }
                  className="h-8 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slots / Tier</Label>
                <Input
                  type="number"
                  value={batchForm.slotsPerTier}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, slotsPerTier: parseInt(e.target.value) || 2 })
                  }
                  className="h-8 text-xs font-bold"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              Formula: {(batchForm.endRack - batchForm.startRack + 1) * batchForm.baysPerRack} bays,{' '}
              {(batchForm.endRack - batchForm.startRack + 1) *
                batchForm.baysPerRack *
                batchForm.tiersPerBay *
                batchForm.slotsPerTier}{' '}
              individual addressable slots with 3D path coordinates will be generated.
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBatchRacksModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={layoutMutation.isPending}
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {layoutMutation.isPending ? 'Generating...' : 'Execute Batch Generator'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Assign Product to Slot Modal */}
      <Dialog open={assignProductModalOpen} onOpenChange={setAssignProductModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              Map Product to Warehouse Address Slot
            </DialogTitle>
            <DialogDescription>
              Assign catalog item to slot{' '}
              <strong className="font-mono text-slate-900">{selectedSlotForAssign?.code}</strong>
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!assignProductId || !selectedSlotForAssign) return
              layoutMutation.mutate({
                action: 'ASSIGN_PRODUCT_SLOT',
                payload: {
                  productId: assignProductId,
                  slotId: selectedSlotForAssign.id,
                },
              })
            }}
            className="space-y-3 pt-2 text-xs"
          >
            <div className="space-y-1">
              <Label className="text-xs">Select Product from Catalog *</Label>
              <select
                value={assignProductId}
                onChange={(e) => setAssignProductId(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-input text-xs bg-background font-bold"
              >
                <option value="">-- Choose Product --</option>
                {availableProducts.map((prod: any) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.sku} • {prod.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 border text-[11px] text-slate-600">
              <div>
                Target Slot Code: <span className="font-mono font-bold text-slate-900">{selectedSlotForAssign?.code}</span>
              </div>
              <div>
                Shelf Level: <span className="font-bold text-slate-900">{selectedSlotForAssign?.name}</span>
              </div>
              <div>
                Barcode: <span className="font-mono text-slate-600">{selectedSlotForAssign?.barcode || 'N/A'}</span>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAssignProductModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!assignProductId || layoutMutation.isPending}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {layoutMutation.isPending ? 'Mapping...' : 'Confirm Slot Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}