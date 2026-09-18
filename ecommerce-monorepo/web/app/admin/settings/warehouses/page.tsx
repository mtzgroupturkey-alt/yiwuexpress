'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Warehouse as WarehouseIcon,
  Layers,
  Box,
  Truck,
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
import { WarehouseItemLayoutModal, InspectorItem } from '@/components/admin/warehouse/WarehouseItemLayoutModal'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'

const WAREHOUSE_COUNTRIES = [
  { value: 'China', label: 'China' },
  { value: 'Belarus', label: 'Belarus' },
] as const

type TabType = 'register' | 'layout' | '3d-twin'

export default function AdminSettingsWarehousesPage() {
  const queryClient = useQueryClient()
  const { dict, locale } = useAdminLocale()
  // Lazy-initialize activeTab from URL search params or localStorage
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search)
        const urlTab = params.get('tab') as TabType | null
        if (urlTab === 'register' || urlTab === 'layout' || urlTab === '3d-twin') {
          return urlTab
        }
        const localTab = localStorage.getItem('admin_warehouse_active_tab') as TabType | null
        if (localTab === 'register' || localTab === 'layout' || localTab === '3d-twin') {
          return localTab
        }
      } catch (e) {
        // Fallback to register
      }
    }
    return 'register'
  })

  // Lazy-initialize selectedWarehouseId from URL search params or localStorage
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search)
        const urlWh = params.get('warehouse')
        if (urlWh) return urlWh
        const localWh = localStorage.getItem('admin_warehouse_selected_id')
        if (localWh) return localWh
      } catch (e) {
        // Fallback
      }
    }
    return null
  })

  // 1. Restore activeTab & selectedWarehouseId from URL search params or localStorage on mount/refresh
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const urlTab = params.get('tab') as TabType | null
    const localTab = localStorage.getItem('admin_warehouse_active_tab') as TabType | null
    const targetTab = urlTab || localTab
    if (targetTab && (targetTab === 'register' || targetTab === 'layout' || targetTab === '3d-twin')) {
      setActiveTab(targetTab)
    }

    const urlWh = params.get('warehouse')
    const localWh = localStorage.getItem('admin_warehouse_selected_id')
    const targetWh = urlWh || localWh
    if (targetWh) {
      setSelectedWarehouseId(targetWh)
    }
  }, [])

  // 2. Keep URL search params and localStorage in sync whenever activeTab or selectedWarehouseId changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('admin_warehouse_active_tab', activeTab)
    if (selectedWarehouseId) {
      localStorage.setItem('admin_warehouse_selected_id', selectedWarehouseId)
    }

    const params = new URLSearchParams(window.location.search)
    let urlChanged = false
    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab)
      urlChanged = true
    }
    if (selectedWarehouseId && params.get('warehouse') !== selectedWarehouseId) {
      params.set('warehouse', selectedWarehouseId)
      urlChanged = true
    }
    if (urlChanged) {
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState(null, '', newUrl)
    }
  }, [activeTab, selectedWarehouseId])

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null)
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
        toast.success(resizingPartId ? dict.warehouses.shapeResizedSaved : dict.warehouses.layoutPositionUpdated)
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
    toast.success(dict.warehouses.layoutResetSuccess)
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
  const [selectedInspectorItem, setSelectedInspectorItem] = useState<InspectorItem | null>(null)

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

  // Auto-select preferred (from URL / localStorage) or first warehouse if none selected
  React.useEffect(() => {
    if (warehouses.length === 0) return
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const urlWh = params?.get('warehouse')
    const localWh = typeof window !== 'undefined' ? localStorage.getItem('admin_warehouse_selected_id') : null
    const preferredId = urlWh || localWh

    if (preferredId && warehouses.some((w: any) => w.id === preferredId)) {
      if (selectedWarehouseId !== preferredId) {
        setSelectedWarehouseId(preferredId)
      }
    } else if (!selectedWarehouseId) {
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
      toast.success(editingWarehouse ? dict.warehouses.warehouseUpdated : dict.warehouses.warehouseCreated)
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
        toast.success(dict.warehouses.zoneRegistered)
      } else if (vars.action === 'ADD_BAY') {
        toast.success(dict.warehouses.bayConfigured)
        setAddBayModalOpen(false)
        setBayForm({ code: '', name: '', aisle: 'A1', rack: 'R1', tiers: 3, slotsPerTier: 2 })
      } else if (vars.action === 'BATCH_GENERATE_RACKS') {
        toast.success(res.message || dict.warehouses.batchRacks)
        setBatchRacksModalOpen(false)
        setQuickRackModalOpen(false)
      } else if (vars.action === 'ASSIGN_PRODUCT_SLOT') {
        toast.success(dict.warehouses.productMapped)
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
        toast.success(dict.warehouses.zoneDeleted)
      } else if (vars.action === 'DELETE_BAY') {
        toast.success(dict.warehouses.bayDeleted)
      } else if (vars.action === 'DELETE_RACK') {
        toast.success(dict.warehouses.rackDeleted)
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

  // Helpers to infer 2D matrix rows/cols for Floor bays and Lane tracks/stops
  function inferFloorDimensions(slots: any[]) {
    if (!slots || slots.length === 0) return { rows: 1, cols: 1 }
    const rowLetters = new Set<string>()
    const colNumbers = new Set<string>()
    let has2DFormat = false

    for (const s of slots) {
      const code = s.code || ''
      const m2D = code.match(/-([A-Z])(\d+)$/i)
      if (m2D) {
        has2DFormat = true
        rowLetters.add(m2D[1].toUpperCase())
        colNumbers.add(m2D[2])
        continue
      }
      const mLetter = code.match(/-([A-Z])$/i)
      if (mLetter) {
        rowLetters.add(mLetter[1].toUpperCase())
      }
    }

    if (has2DFormat && rowLetters.size > 0 && colNumbers.size > 0) {
      return { rows: rowLetters.size, cols: colNumbers.size }
    }
    if (rowLetters.size > 0) {
      return { rows: 1, cols: rowLetters.size }
    }
    const count = slots.length
    if (count === 1) return { rows: 1, cols: 1 }
    if (count === 2) return { rows: 1, cols: 2 }
    if (count === 4) return { rows: 2, cols: 2 }
    if (count === 6) return { rows: 2, cols: 3 }
    if (count === 8) return { rows: 4, cols: 2 }
    if (count === 9) return { rows: 3, cols: 3 }
    return { rows: 1, cols: count }
  }

  function inferLaneDimensions(slots: any[]) {
    if (!slots || slots.length === 0) return { laneRows: 1, laneCols: 1 }
    const tracks = new Set<string>()
    const stops = new Set<string>()
    let hasTrackFormat = false

    for (const s of slots) {
      const code = s.code || ''
      const mTrack = code.match(/-T(\d+)-(\d+)$/i)
      if (mTrack) {
        hasTrackFormat = true
        tracks.add(mTrack[1])
        stops.add(mTrack[2])
        continue
      }
      const mOnlyTrack = code.match(/-T(\d+)$/i)
      if (mOnlyTrack) {
        hasTrackFormat = true
        tracks.add(mOnlyTrack[1])
        continue
      }
      const mStop = code.match(/-S?(\d+)$/i)
      if (mStop) {
        stops.add(mStop[1])
      }
    }

    if (hasTrackFormat && tracks.size > 0 && stops.size > 0) {
      return { laneRows: stops.size, laneCols: tracks.size }
    }
    if (hasTrackFormat && tracks.size > 0) {
      return { laneRows: 1, laneCols: tracks.size }
    }
    if (stops.size > 0) {
      return { laneRows: stops.size, laneCols: 1 }
    }
    const count = slots.length
    if (count === 4) return { laneRows: 2, laneCols: 2 }
    if (count === 8) return { laneRows: 4, laneCols: 2 }
    if (count === 6) return { laneRows: 3, laneCols: 2 }
    return { laneRows: count || 1, laneCols: 1 }
  }

  function getOrganizedLaneGrid(slots: any[], laneRows: number, laneCols: number, baseCode: string) {
    if (!slots || slots.length === 0) return []

    const slotMap = new Map<string, any>()
    for (const s of slots) {
      if (s.code) slotMap.set(s.code, s)
    }

    const rows: { stopNum: number; stopLabel: string; trackSlots: (any | null)[] }[] = []

    for (let r = 1; r <= laneRows; r++) {
      const sPad = r < 10 ? `0${r}` : `${r}`
      const trackSlots: any[] = []

      for (let c = 1; c <= laneCols; c++) {
        let targetCode = ''
        if (laneCols === 1 && laneRows === 1) {
          targetCode = baseCode
        } else if (laneCols === 1 && laneRows > 1) {
          targetCode = `${baseCode}-${sPad}`
        } else if (laneCols > 1 && laneRows === 1) {
          targetCode = `${baseCode}-T${c}`
        } else {
          targetCode = `${baseCode}-T${c}-${sPad}`
        }

        const found =
          slotMap.get(targetCode) ||
          slots.find((sl: any) => sl.code?.endsWith(`T${c}-${sPad}`) || sl.code?.endsWith(`T${c}-${r}`)) ||
          slots[(c - 1) * laneRows + (r - 1)] ||
          null

        trackSlots.push(found)
      }

      rows.push({
        stopNum: r,
        stopLabel: `Stop ${sPad}`,
        trackSlots,
      })
    }

    return rows
  }

  function getOrganizedFloorGrid(slots: any[], rowsCount: number, colsCount: number, baseCode: string) {
    if (!slots || slots.length === 0) return []

    const slotMap = new Map<string, any>()
    for (const s of slots) {
      if (s.code) slotMap.set(s.code, s)
    }

    const rows: { rowNum: number; rowLetter: string; colSlots: (any | null)[] }[] = []

    for (let r = 1; r <= rowsCount; r++) {
      const rowLetter = String.fromCharCode(64 + r)
      const colSlots: any[] = []

      for (let c = 1; c <= colsCount; c++) {
        let targetCode = ''
        if (rowsCount === 1 && colsCount === 1) {
          targetCode = baseCode
        } else if (rowsCount === 1 && colsCount > 1) {
          targetCode = `${baseCode}-${String.fromCharCode(64 + c)}`
        } else if (rowsCount > 1 && colsCount === 1) {
          targetCode = `${baseCode}-${rowLetter}`
        } else {
          targetCode = `${baseCode}-${rowLetter}${c}`
        }

        const found =
          slotMap.get(targetCode) ||
          slots.find((sl: any) => sl.code?.endsWith(`${rowLetter}${c}`)) ||
          slots[(r - 1) * colsCount + (c - 1)] ||
          null

        colSlots.push(found)
      }

      rows.push({
        rowNum: r,
        rowLetter,
        colSlots,
      })
    }

    return rows
  }

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
    rows: number
    cols: number
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
    laneRows: number
    laneCols: number
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
            const { rows, cols } = inferFloorDimensions(b.slots || [])
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
              rows,
              cols,
              slotsCount: b.slots?.length || 1,
              allSlots: b.slots || [],
              aisle: b.aisle || '',
            })
          } else if (b.code?.startsWith('BL-') || (zone.type === 'SHIPPING' && !b.code?.startsWith('FL-'))) {
            const { laneRows, laneCols } = inferLaneDimensions(b.slots || [])
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
              laneRows,
              laneCols,
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

  // 1-Click item creation helpers for the 3 storage parts (RACK, FLOOR, LANE)
  const handleAddRack = () => {
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
  }

  const handleAddFloor = () => {
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
  }

  const handleAddLane = () => {
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
  }

  // ========================================================
  // VIEW 1: RENDER SHAPES AREA (FROM CANONICAL MODEL)
  // ========================================================
  const renderShapesArea = (model: WarehouseModel) => {
    if (!model.zones || model.zones.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
          <p className="text-xs">{dict.warehouses.noZonesYet}</p>
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
                  title={dict.warehouses.rotateDimensions}
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
                title={dict.warehouses.layoutDetails}
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

          <div
            className="flex-1 p-1 grid gap-1 overflow-y-auto"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, item.bays.length)}, minmax(0, 1fr))` }}
          >
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
            {dict.warehouses.legendRacks.toUpperCase()} {item.rackName}
            {isEdit2DMode && (
              <div
                onPointerDown={(e) => handleResizePointerDown(rackKey, w, h, e)}
                title={dict.warehouses.rotateDimensions}
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
    const floorWidth = Math.max(80, Math.min(120, Math.floor(360 / Math.max(1, floorCols))))
    const floorHeight = 180
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
          className={`absolute rounded-xl border-2 flex flex-col justify-between transition-all duration-150 ${
            isEdit2DMode
              ? 'cursor-grab active:cursor-grabbing hover:border-amber-400 ring-1 ring-amber-500/20'
              : 'cursor-pointer hover:border-sky-400'
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
          }}
        >
          <div className="bg-sky-900/90 text-sky-100 px-1 py-1 rounded-t-sm text-center border-b border-sky-700/80 flex items-center justify-between">
            <span className="font-mono font-black text-[11px] truncate">{fItem.bay.code}</span>
            <div className="flex items-center gap-1">
              {isEdit2DMode && isSelected && (
                <button
                  type="button"
                  title={dict.warehouses.rotateDimensions}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleShapeOrientation(bayKey, w, h)
                  }}
                  className="p-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all"
                >
                  <RotateCw size={10} />
                </button>
              )}
              <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-sky-800/80 text-sky-200">
                {fItem.rows}×{fItem.cols}
              </span>
              <button
                type="button"
                title={dict.warehouses.layoutDetails}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedInspectorItem({
                    itemType: 'FLOOR',
                    baseCode: fItem.bay.code,
                    title: `Floor Bay ${fItem.bay.code}`,
                    zoneId: fItem.zoneId,
                    layout: {
                      rows: fItem.rows,
                      cols: fItem.cols,
                      subParts: slotsCount,
                      bays: 1,
                      levels: 1,
                      sections: 1,
                    },
                  })
                }}
                className="p-0.5 rounded hover:bg-sky-800 text-sky-200 hover:text-white transition-colors"
              >
                <Settings2 size={11} />
              </button>
            </div>
          </div>

          {/* Inner Slots list / schematic */}
          <div className="flex-1 p-1 flex flex-col justify-start gap-1 overflow-y-auto">
            {fItem.allSlots.length === 0 ? (
              <div className="text-[8px] text-slate-400 text-center py-4">No Slots</div>
            ) : (
              <div className="space-y-1">
                {getOrganizedFloorGrid(fItem.allSlots, fItem.rows, fItem.cols, fItem.bay.code).map((row) => (
                  <div
                    key={row.rowNum}
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${fItem.cols}, minmax(0, 1fr))` }}
                  >
                    {row.colSlots.map((slot: any, colIdx: number) => {
                      if (!slot) return <div key={colIdx} className="h-5 rounded border border-dashed border-sky-900/40" />
                      const hasStock = slot.stocks && slot.stocks.length > 0
                      return (
                        <div
                          key={slot.id}
                          onClick={(e) => {
                            if (isEdit2DMode) return
                            e.stopPropagation()
                            setTargetSlotCode(slot.code)
                            toast.success(`Selected Slot ${slot.code}`)
                          }}
                          className={`border rounded px-1 py-0.5 text-center transition-colors ${
                            hasStock
                              ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900/60'
                              : 'border-sky-500/40 bg-slate-900/90 text-slate-200 hover:bg-sky-900/40'
                          }`}
                          title={`Slot: ${slot.code} (Row ${row.rowLetter} • Col ${colIdx + 1}) ${hasStock ? '(In Stock)' : '(Empty)'}`}
                        >
                          <div className="font-mono text-[9px] font-bold truncate flex items-center justify-center gap-1">
                            {hasStock && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>}
                            <span className="truncate">{slot.code}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative bg-slate-900/90 text-[8px] font-mono text-center py-0.5 text-slate-400 border-t border-slate-800 rounded-b-sm truncate">
            {dict.warehouses.inboundPad.toUpperCase()} {fItem.bay.code}
            {isEdit2DMode && (
              <div
                onPointerDown={(e) => handleResizePointerDown(bayKey, w, h, e)}
                title={dict.warehouses.rotateDimensions}
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
    const laneWidth = Math.max(90, Math.min(130, Math.floor(360 / Math.max(1, laneCols))))
    const laneHeight = 180
    const laneGapX = 8
    const laneGapY = 8

    model.lanes.forEach((lItem, idx) => {
      const isZoneFiltered = activeZoneFilter === lItem.zoneId
      const bayKey = lItem.id
      const col = idx % Math.max(1, laneCols)
      const row = Math.floor(idx / Math.max(1, laneCols))
      const defaultX = 20 + col * (laneWidth + laneGapX)
      const defaultY = (totalFloors > 0 ? 480 : 280) + row * (laneHeight + laneGapY)
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
          className={`absolute rounded-xl border-2 flex flex-col justify-between transition-all duration-150 ${
            isEdit2DMode
              ? 'cursor-grab active:cursor-grabbing hover:border-amber-400 ring-1 ring-amber-500/20'
              : 'cursor-pointer hover:border-amber-400'
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
          }}
        >
          <div className="bg-amber-900/90 text-amber-100 px-1 py-1 rounded-t-sm text-center border-b border-amber-700/80 flex items-center justify-between">
            <span className="font-mono font-black text-[11px] truncate">{lItem.bay.code}</span>
            <div className="flex items-center gap-1">
              {isEdit2DMode && isSelected && (
                <button
                  type="button"
                  title={dict.warehouses.rotateDimensions}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleShapeOrientation(bayKey, w, h)
                  }}
                  className="p-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all"
                >
                  <RotateCw size={10} />
                </button>
              )}
              <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-800/80 text-amber-200" title={`${lItem.laneCols} Tracks × ${lItem.laneRows} Stops (${lItem.laneRows} Rows × ${lItem.laneCols} Cols)`}>
                {lItem.laneCols}T×{lItem.laneRows}S
              </span>
              <button
                type="button"
                title={dict.warehouses.layoutDetails}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedInspectorItem({
                    itemType: 'LANE',
                    baseCode: lItem.bay.code,
                    title: `Bulk Lane ${lItem.bay.code}`,
                    zoneId: lItem.zoneId,
                    layout: {
                      rows: lItem.laneRows,
                      cols: lItem.laneCols,
                      laneRows: lItem.laneRows,
                      laneCols: lItem.laneCols,
                      sections: sectionsCount,
                      bays: 1,
                      levels: 1,
                      subParts: 1,
                    },
                  })
                }}
                className="p-0.5 rounded hover:bg-amber-800 text-amber-200 hover:text-white transition-colors"
              >
                <Settings2 size={11} />
              </button>
            </div>
          </div>

          {/* Inner Slots list / schematic */}
          <div className="flex-1 p-1 flex flex-col justify-start gap-1 overflow-y-auto">
            {lItem.allSlots.length === 0 ? (
              <div className="text-[8px] text-slate-400 text-center py-4">No Slots</div>
            ) : (
              <div className="space-y-1">
                {getOrganizedLaneGrid(lItem.allSlots, lItem.laneRows, lItem.laneCols, lItem.bay.code).map((row) => (
                  <div
                    key={row.stopNum}
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${lItem.laneCols}, minmax(0, 1fr))` }}
                  >
                    {row.trackSlots.map((slot: any, colIdx: number) => {
                      if (!slot) {
                        return <div key={colIdx} className="h-5 rounded border border-dashed border-amber-900/40" />
                      }
                      const hasStock = slot.stocks && slot.stocks.length > 0
                      return (
                        <div
                          key={slot.id}
                          onClick={(e) => {
                            if (isEdit2DMode) return
                            e.stopPropagation()
                            setTargetSlotCode(slot.code)
                            toast.success(`Selected Lane Slot ${slot.code}`)
                          }}
                          className={`border rounded px-1 py-0.5 text-center transition-colors ${
                            hasStock
                              ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900/60'
                              : 'border-amber-500/40 bg-slate-900/90 text-slate-200 hover:bg-amber-900/40'
                          }`}
                          title={`Slot: ${slot.code} (Track ${colIdx + 1} • Stop ${row.stopNum}) ${hasStock ? '(In Stock)' : '(Empty)'}`}
                        >
                          <div className="font-mono text-[9px] font-bold truncate flex items-center justify-center gap-1">
                            {hasStock && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>}
                            <span className="truncate">{slot.code}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative bg-slate-900/90 text-[8px] font-mono text-center py-0.5 text-slate-400 border-t border-slate-800 rounded-b-sm truncate">
            {dict.warehouses.outboundStaging.toUpperCase()} {lItem.bay.code}
            {isEdit2DMode && (
              <div
                onPointerDown={(e) => handleResizePointerDown(bayKey, w, h, e)}
                title={dict.warehouses.rotateDimensions}
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
                    title={dict.warehouses.rotateDimensions}
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
              {zone.tempControlled ? dict.warehouses.climateControlledZone : dict.warehouses.activeOperationArea}
            </p>
          </div>

          <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-400 font-semibold">{dict.warehouses.configuredBaysStations}</span>
              <span className="font-mono font-bold text-slate-200">
                {zone.bays?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-400 font-semibold">{dict.warehouses.addressableSlots}:</span>
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
              {isZoneFiltered ? 'Filtered ✓' : `${dict.common.filter} →`}
            </span>

            {isEdit2DMode && (
              <div
                onPointerDown={(e) => handleResizePointerDown(zoneKey, w, h, e)}
                title={dict.warehouses.rotateDimensions}
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
    const totalRacksCount = model.racks.length
    const totalFloorsCount = model.floors.length
    const totalLanesCount = model.lanes.length
    const totalRackBays = model.racks.reduce((acc, r) => acc + r.bays.length, 0)
    const totalRackSlots = model.racks.reduce((acc, r) => acc + r.totalSlots, 0)
    const totalFloorSlots = model.floors.reduce((acc, f) => acc + f.slotsCount, 0)
    const totalLaneSlots = model.lanes.reduce((acc, l) => acc + l.sectionsCount, 0)

    const otherBaysCount = model.otherZones.reduce((acc, oz) => acc + (oz.remainingBays?.length || 0), 0)

    if (totalRacksCount === 0 && totalFloorsCount === 0 && totalLanesCount === 0 && otherBaysCount === 0) {
      return (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Layers size={28} />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm mb-1">{dict.warehouses.noLayoutDefined}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            {dict.warehouses.noLayoutDefinedDesc}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              size="sm"
              onClick={handleAddRack}
              disabled={layoutMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 shadow-sm h-8.5 rounded-xl"
            >
              <Plus size={14} />
              {dict.warehouses.addRack}
            </Button>
            <Button
              size="sm"
              onClick={handleAddFloor}
              disabled={layoutMutation.isPending}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold gap-1.5 shadow-sm h-8.5 rounded-xl"
            >
              <Plus size={14} />
              {dict.warehouses.addFloorBay}
            </Button>
            <Button
              size="sm"
              onClick={handleAddLane}
              disabled={layoutMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 shadow-sm h-8.5 rounded-xl"
            >
              <Plus size={14} />
              {dict.warehouses.addLane}
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div
        className="space-y-6"
        data-testid="details-panel"
        data-racks-count={totalRacksCount}
        data-floors-count={totalFloorsCount}
        data-lanes-count={totalLanesCount}
        data-racks-ids={model.racks.map((r) => r.code).join(',')}
      >
        {/* ======================================================== */}
        {/* PART 1: PALLET RACKS & SHELVING (RACK)                   */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 transition-all shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-blue-50/60 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="font-mono font-black text-xs bg-blue-600 text-white">
                RACK
              </Badge>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Grid3X3 size={16} className="text-blue-600" />
                {dict.warehouses.legendRacks}
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                • {totalRacksCount} {totalRacksCount === 1 ? 'Rack' : 'Racks'} ({totalRackBays} {dict.warehouses.baysCount} • {totalRackSlots} {dict.warehouses.addressableSlots})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleAddRack}
                disabled={layoutMutation.isPending}
                className="h-7.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1 rounded-lg shadow-2xs"
              >
                <Plus size={13} />
                {dict.warehouses.addRack}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const storageZone = currentWarehouse?.zones?.find((z: any) => z.type === 'STORAGE')
                  setSelectedZoneForBay(storageZone?.id || currentWarehouse?.zones?.[0]?.id || null)
                  setBatchRacksModalOpen(true)
                }}
                className="h-7.5 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100 gap-1 rounded-lg"
              >
                <Sparkles size={13} className="text-amber-500" />
                {dict.warehouses.batchRacks}
              </Button>
            </div>
          </div>

          <div className="p-5">
            {totalRacksCount === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No pallet racks configured yet. Click &ldquo;+ {dict.warehouses.addRack}&rdquo; to add R1.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {model.racks.map((rack) => (
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
                          {dict.warehouses.baysCount}: <strong className="text-slate-700">{rack.bays.length}</strong> • {dict.warehouses.levelsTiers}: <strong className="text-slate-700">{rack.levels}</strong>
                        </span>
                        <span>
                          {dict.warehouses.addressableSlots}: <strong className="text-slate-700">{rack.totalSlots}</strong>
                        </span>
                      </div>

                      {/* Shelves & Slots Addressing — Bay (horizontal columns) × Level (vertical rows) grid */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          <span>{dict.warehouses.shelvesAndSlots}</span>
                          <span className="font-mono text-[9px] text-blue-600 font-semibold lowercase">
                            {rack.bays.length} {rack.bays.length === 1 ? 'bay' : 'bays'} × {rack.levels} {rack.levels === 1 ? 'level' : 'levels'}
                          </span>
                        </div>
                        {(() => {
                          // Build bay→level map from slot codes (e.g. R1-01-01 → bay=1, level=1)
                          const bayMap = new Map<number, Map<number, any>>()
                          rack.allSlots.forEach((slot: any) => {
                            const parts = slot.code.split('-')
                            const bay = parseInt(parts[parts.length - 2], 10) || 0
                            const level = parseInt(parts[parts.length - 1], 10) || 0
                            if (!bayMap.has(bay)) bayMap.set(bay, new Map())
                            bayMap.get(bay)!.set(level, slot)
                          })
                          const bayNumbers = Array.from(bayMap.keys()).sort((a, b) => a - b)
                          const levelNumbers = Array.from(
                            new Set(rack.allSlots.map((s: any) => {
                              const p = s.code.split('-')
                              return parseInt(p[p.length - 1], 10) || 0
                            }))
                          ).sort((a: number, b: number) => b - a) as number[]

                          if (bayNumbers.length === 0) return null

                          return (
                            <div className="p-2 rounded-xl bg-slate-900/5 border border-slate-200/80 overflow-x-auto no-scrollbar">
                              <div className="min-w-fit space-y-1.5">
                                {/* Level rows going down (Levels vertical: L3, L2, L1 from top to bottom, so from bottom up it starts L1, L2, L3 like real racks) */}
                                <div className="space-y-1">
                                  {levelNumbers.map((lv) => (
                                    <div
                                      key={lv}
                                      className="grid items-center gap-1.5"
                                      style={{ gridTemplateColumns: `36px repeat(${bayNumbers.length}, minmax(84px, 1fr))` }}
                                    >
                                      {/* Level vertical label */}
                                      <div className="text-[10px] font-mono font-bold text-slate-500 text-center py-1 bg-slate-100 rounded border border-slate-200">
                                        L{lv}
                                      </div>
                                      {/* Bay cells side-by-side */}
                                      {bayNumbers.map((bay) => {
                                        const slot = bayMap.get(bay)?.get(lv)
                                        if (!slot) {
                                          return (
                                            <div
                                              key={bay}
                                              className="h-8 rounded border border-dashed border-slate-200 bg-slate-50/50"
                                            />
                                          )
                                        }
                                        const hasStock = slot.stocks && slot.stocks.length > 0
                                        return (
                                          <div
                                            key={bay}
                                            onClick={() => {
                                              setSelectedSlotForAssign(slot)
                                              setAssignProductModalOpen(true)
                                            }}
                                            className={`px-1.5 py-1 rounded text-[9px] font-mono border cursor-pointer transition-all flex items-center justify-between gap-1 min-h-[30px] shadow-2xs ${
                                              hasStock
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                            }`}
                                            title={`Click to map product: ${slot.code} (Bay ${bay} • Level ${lv})`}
                                          >
                                            <div className="flex items-center gap-1 truncate">
                                              <Tag size={9} className={hasStock ? 'text-emerald-500' : 'text-slate-400'} />
                                              <span className="truncate font-semibold">{slot.code}</span>
                                            </div>
                                            {hasStock && (
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ))}
                                </div>

                                {/* Bay header row across columns shown at the bottom of the shelf */}
                                <div
                                  className="grid text-[9px] font-bold uppercase tracking-wider gap-1.5 pt-1 border-t border-slate-200/80"
                                  style={{ gridTemplateColumns: `36px repeat(${bayNumbers.length}, minmax(84px, 1fr))` }}
                                >
                                  <div className="text-center font-mono text-[9px] text-slate-400 py-0.5 flex items-center justify-center">Tier</div>
                                  {bayNumbers.map((bay) => (
                                    <div
                                      key={bay}
                                      className="text-center bg-blue-100/80 text-blue-800 border border-blue-200 py-0.5 rounded font-mono font-bold shadow-2xs"
                                    >
                                      B{bay}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })()}
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
                          {dict.warehouses.locateIn3D}
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
                          {dict.warehouses.layoutDetails}
                        </button>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {rack.aisle ? `${dict.warehouses.aisle} ${rack.aisle}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* PART 2: FLOOR BAYS & GROUND STAGING (FLOOR)             */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 transition-all shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-sky-50/60 border-b border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="font-mono font-black text-xs bg-sky-600 text-white">
                FLOOR
              </Badge>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Box size={16} className="text-sky-600" />
                {dict.warehouses.floorBayType}
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                • {totalFloorsCount} {totalFloorsCount === 1 ? 'Floor Bay' : 'Floor Bays'} ({totalFloorSlots} {dict.warehouses.addressableSlots})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleAddFloor}
                disabled={layoutMutation.isPending}
                className="h-7.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white gap-1 rounded-lg shadow-2xs"
              >
                <Plus size={13} />
                {dict.warehouses.addFloorBay}
              </Button>
            </div>
          </div>

          <div className="p-5">
            {totalFloorsCount === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No floor bays configured yet. Click &ldquo;+ {dict.warehouses.addFloorBay}&rdquo; to add FL-01.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {model.floors.map((floor) => (
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
                          <Badge variant="outline" className="text-[10px] font-semibold text-sky-700 bg-sky-50">
                            {floor.rows} Rows × {floor.cols} Cols
                          </Badge>
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
                          Rows (Depth): <strong className="text-slate-700">{floor.rows}</strong> • Columns (Width): <strong className="text-slate-700">{floor.cols}</strong>
                        </span>
                        <span>
                          {dict.warehouses.addressableSlots}: <strong className="text-slate-700">{floor.slotsCount}</strong>
                        </span>
                      </div>

                      {/* Shelves & Slots Addressing */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          <span>{dict.warehouses.shelvesAndSlots}</span>
                          <span className="font-mono text-[9px] text-sky-600 font-semibold lowercase">
                            {floor.rows} {floor.rows === 1 ? 'row' : 'rows'} × {floor.cols} {floor.cols === 1 ? 'col' : 'cols'}
                          </span>
                        </div>

                        {/* Staging Matrix Grid Layout (mirrors 2D Layout Details) */}
                        <div className="p-2 rounded-xl bg-slate-900/5 border border-slate-200/80 space-y-1 max-h-48 overflow-y-auto pr-0.5">
                          {getOrganizedFloorGrid(floor.allSlots, floor.rows, floor.cols, floor.code).map((row) => (
                            <div
                              key={row.rowNum}
                              className="grid gap-1.5"
                              style={{ gridTemplateColumns: `repeat(${floor.cols}, minmax(0, 1fr))` }}
                            >
                              {row.colSlots.map((slot: any, colIdx: number) => {
                                if (!slot) {
                                  return (
                                    <div
                                      key={colIdx}
                                      className="h-7 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[9px] font-mono text-slate-300"
                                    >
                                      Empty
                                    </div>
                                  )
                                }
                                const hasStock = slot.stocks && slot.stocks.length > 0
                                return (
                                  <div
                                    key={slot.id}
                                    onClick={() => {
                                      setSelectedSlotForAssign(slot)
                                      setAssignProductModalOpen(true)
                                    }}
                                    className={`px-2 py-1 rounded text-[10px] font-mono border cursor-pointer transition-all flex items-center justify-between gap-1 shadow-2xs ${
                                      hasStock
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400 hover:bg-sky-50/50'
                                    }`}
                                    title={`Click to map product: ${slot.code} (Row ${row.rowLetter} • Col ${colIdx + 1})`}
                                  >
                                    <div className="flex items-center gap-1 truncate">
                                      <Tag size={10} className={hasStock ? 'text-emerald-600' : 'text-slate-400'} />
                                      <span className="truncate font-semibold">{slot.code}</span>
                                    </div>
                                    {hasStock && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ))}
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
                          {dict.warehouses.locateIn3D}
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
                                rows: floor.rows,
                                cols: floor.cols,
                                subParts: floor.slotsCount,
                                bays: 1,
                                levels: 1,
                                sections: 1,
                              },
                            })
                          }}
                          className="font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                        >
                          <Settings2 size={12} />
                          {dict.warehouses.layoutDetails}
                        </button>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {floor.aisle ? `${dict.warehouses.aisle} ${floor.aisle}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* PART 3: BULK SHIPPING LANES (LANE)                       */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 transition-all shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-amber-50/60 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="font-mono font-black text-xs bg-amber-600 text-white">
                LANE
              </Badge>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Truck size={16} className="text-amber-600" />
                {dict.warehouses.bulkLaneType}
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                • {totalLanesCount} {totalLanesCount === 1 ? 'Bulk Lane' : 'Bulk Lanes'} ({totalLaneSlots} Lane Sections (1 - 20))
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleAddLane}
                disabled={layoutMutation.isPending}
                className="h-7.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1 rounded-lg shadow-2xs"
              >
                <Plus size={13} />
                {dict.warehouses.addLane}
              </Button>
            </div>
          </div>

          <div className="p-5">
            {totalLanesCount === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No bulk shipping lanes configured yet. Click &ldquo;+ {dict.warehouses.addLane}&rdquo; to add BL-01.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {model.lanes.map((lane) => (
                  <div
                    key={lane.id}
                    data-testid={`detail-lane-${lane.code}`}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              {lane.code}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {lane.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px] font-semibold text-amber-700 bg-amber-50">
                              {lane.laneCols} Tracks × {lane.laneRows} Stops
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] font-mono text-amber-800 bg-amber-100/70 border border-amber-200">
                              {lane.laneRows} Rows × {lane.laneCols} Cols
                            </Badge>
                          </div>
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
                          Parallel Tracks: <strong className="text-slate-700">{lane.laneCols}</strong> • Depth Stops: <strong className="text-slate-700">{lane.laneRows}</strong>
                        </span>
                        <span>
                          {dict.warehouses.addressableSlots}: <strong className="text-slate-700">{lane.sectionsCount}</strong>
                        </span>
                      </div>

                      {/* Shelves & Slots Addressing */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          <span>{dict.warehouses.shelvesAndSlots}</span>
                          <span className="font-mono text-[9px] text-amber-600 font-semibold lowercase">
                            {lane.laneCols} {lane.laneCols === 1 ? 'track' : 'tracks'} × {lane.laneRows} {lane.laneRows === 1 ? 'stop' : 'stops'}
                          </span>
                        </div>

                        {/* Staging Matrix Flow Layout (mirrors 2D Layout Details) */}
                        <div className="p-2 rounded-xl bg-slate-900/5 border border-slate-200/80 space-y-1.5">
                          {/* Track Column Header Labels */}
                          {lane.laneCols > 1 && (
                            <div
                              className="grid gap-1.5"
                              style={{ gridTemplateColumns: `repeat(${lane.laneCols}, minmax(0, 1fr))` }}
                            >
                              {Array.from({ length: lane.laneCols }).map((_, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="text-center font-mono text-[9px] font-bold text-amber-900 bg-amber-100/70 border border-amber-200 py-0.5 rounded flex items-center justify-center gap-1"
                                >
                                  <Truck size={10} className="text-amber-600" />
                                  <span>Track {cIdx + 1}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Rows of Depth Stops */}
                          <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                            {getOrganizedLaneGrid(lane.allSlots, lane.laneRows, lane.laneCols, lane.code).map((row) => (
                              <div
                                key={row.stopNum}
                                className="grid gap-1.5"
                                style={{ gridTemplateColumns: `repeat(${lane.laneCols}, minmax(0, 1fr))` }}
                              >
                                {row.trackSlots.map((slot: any, colIdx: number) => {
                                  if (!slot) {
                                    return (
                                      <div
                                        key={colIdx}
                                        className="h-7 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[9px] font-mono text-slate-300"
                                      >
                                        Empty
                                      </div>
                                    )
                                  }
                                  const hasStock = slot.stocks && slot.stocks.length > 0
                                  return (
                                    <div
                                      key={slot.id}
                                      onClick={() => {
                                        setSelectedSlotForAssign(slot)
                                        setAssignProductModalOpen(true)
                                      }}
                                      className={`px-2 py-1 rounded text-[10px] font-mono border cursor-pointer transition-all flex items-center justify-between gap-1 shadow-2xs ${
                                        hasStock
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                          : 'bg-white border-slate-200 text-slate-700 hover:border-amber-400 hover:bg-amber-50/50'
                                      }`}
                                      title={`Click to map product: ${slot.code} (Track ${colIdx + 1} • Stop ${row.stopNum})`}
                                    >
                                      <div className="flex items-center gap-1 truncate">
                                        <Tag size={10} className={hasStock ? 'text-emerald-600' : 'text-slate-400'} />
                                        <span className="truncate font-semibold">{slot.code}</span>
                                      </div>
                                      {hasStock && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            ))}
                          </div>
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
                          {dict.warehouses.locateIn3D}
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
                                rows: lane.laneRows,
                                cols: lane.laneCols,
                                laneRows: lane.laneRows,
                                laneCols: lane.laneCols,
                                sections: lane.sectionsCount,
                                bays: 1,
                                levels: 1,
                                subParts: 1,
                              },
                            })
                          }}
                          className="font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1"
                        >
                          <Settings2 size={12} />
                          {dict.warehouses.layoutDetails}
                        </button>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {lane.aisle ? `${dict.warehouses.aisle} ${lane.aisle}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Auxiliary Section: Legacy / Other Custom Stations (if any) */}
        {model.otherZones.some((oz) => oz.remainingBays.length > 0) && (
          <div className="bg-white rounded-2xl border border-slate-200 transition-all shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-700 text-sm">
                Other Storage & Custom Stations
              </h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {model.otherZones.flatMap((oz) => oz.remainingBays).map((bay: any) => (
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
                      <span>{dict.warehouses.tiersPerBay}: <strong className="text-slate-700">{bay.level || 1}</strong></span>
                      <span>{dict.warehouses.addressableSlots}: <strong className="text-slate-700">{bay.slots?.length || 0}</strong></span>
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
          </div>
        )}
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
                {dict.warehouses.settingsHub}
              </Link>
              <ChevronRight size={13} />
              <span className="text-foreground font-bold">{dict.warehouses.pageBreadcrumb}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Building2 size={20} />
              </div>
              {dict.warehouses.pageTitle}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {dict.warehouses.pageSubtitle}
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
              {dict.warehouses.registerWarehouse}
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
              {dict.warehouses.refresh}
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
              {dict.warehouses.tabWarehouses} ({warehouses.length})
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
              {dict.warehouses.tabLayout}
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
              {dict.warehouses.tab3d}
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                3D
              </span>
            </button>
          </div>

          {/* Active Warehouse Dropdown Filter */}
          {warehouses.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-500">{dict.warehouses.activeHub}</span>
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
                  <div className="text-xs text-slate-500 font-semibold">{dict.warehouses.registeredHubs}</div>
                  <div className="text-2xl font-black text-slate-900">{warehouses.length}</div>
                  <div className="text-[11px] text-slate-400">{dict.warehouses.globalFreightNodes}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Layers size={24} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">{dict.warehouses.currentHubZones}</div>
                  <div className="text-2xl font-black text-slate-900">{totalZones}</div>
                  <div className="text-[11px] text-slate-400">{dict.warehouses.sectionsAndWorkAreas}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Grid3X3 size={24} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">{dict.warehouses.racksAndBays}</div>
                  <div className="text-2xl font-black text-slate-900">{totalBays}</div>
                  <div className="text-[11px] text-slate-400">{dict.warehouses.inActiveHub}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Box size={24} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">{dict.warehouses.addressableSlots}</div>
                  <div className="text-2xl font-black text-slate-900">{totalSlots}</div>
                  <div className="text-[11px] text-emerald-600 font-semibold">{dict.warehouses.pinpointReady}</div>
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
                                {dict.warehouses.defaultProcurement}
                              </Badge>
                            )}
                            {wh.isDefaultSales && (
                              <Badge className="bg-blue-600 text-white text-[10px] font-bold">
                                {dict.warehouses.defaultSales}
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
                            {dict.warehouses.contact} <span className="text-slate-800 font-semibold">{wh.contactPerson}</span>
                            {wh.contactPhone && ` • ${wh.contactPhone}`}
                          </p>
                        )}
                      </div>

                      {/* Internal stats bar */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-bold">{dict.warehouses.zonesCount}</div>
                          <div className="font-bold text-slate-800 text-sm">
                            {wh.zones?.length || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-bold">{dict.warehouses.stockUnits}</div>
                          <div className="font-bold text-slate-800 text-sm">
                            {wh.totalStockUnits || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-bold">{dict.warehouses.activeOrders}</div>
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
                        {dict.warehouses.configure2DLayout}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedWarehouseId(wh.id)
                          setActiveTab('3d-twin')
                        }}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <Compass size={13} />
                        {dict.warehouses.open3dSpatialTwin}
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
                  {dict.warehouses.addressingTopology} {currentWarehouse?.name} ({currentWarehouse?.code})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dict.warehouses.addressingTopologyDesc}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1-Click Storage Item Buttons: RACK, FLOOR BAY, BULK LANE */}
                <Button
                  size="sm"
                  onClick={handleAddRack}
                  disabled={layoutMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8.5 rounded-xl gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  {dict.warehouses.addRack}
                </Button>

                <Button
                  size="sm"
                  onClick={handleAddFloor}
                  disabled={layoutMutation.isPending}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold h-8.5 rounded-xl gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  {dict.warehouses.addFloorBay}
                </Button>

                <Button
                  size="sm"
                  onClick={handleAddLane}
                  disabled={layoutMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8.5 rounded-xl gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  {dict.warehouses.addLane}
                </Button>

                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const storageZone = currentWarehouse?.zones?.find((z: any) => z.type === 'STORAGE')
                    setSelectedZoneForBay(storageZone?.id || currentWarehouse?.zones?.[0]?.id || null)
                    setBatchRacksModalOpen(true)
                  }}
                  className="border-slate-300 text-slate-700 text-xs font-bold h-8.5 rounded-xl gap-1.5 hover:bg-slate-100"
                >
                  <Sparkles size={14} className="text-amber-500" />
                  {dict.warehouses.batchRacks}
                </Button>
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
                        {dict.warehouses.blueprintTitle} {currentWarehouse.name}
                      </h3>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] font-mono">
                        {currentWarehouse.code}
                      </Badge>
                      {isEdit2DMode && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] animate-pulse">
                          {dict.warehouses.dragPositionEnabled}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {dict.warehouses.blueprintDesc}
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
                        {dict.warehouses.architectView}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEdit2DMode(true)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                          isEdit2DMode ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Move size={12} />
                        {dict.warehouses.dragPosition}
                      </button>
                    </div>

                    {isEdit2DMode && (
                      <button
                        type="button"
                        onClick={reset2DLayout}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700"
                      >
                        {dict.warehouses.resetLayout}
                      </button>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 border border-blue-400"></span>
                      <span>{dict.warehouses.legendRacks}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 border border-sky-400"></span>
                      <span>{dict.warehouses.floorBayType}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 border border-amber-400"></span>
                      <span>{dict.warehouses.bulkLaneType}</span>
                    </div>

                    {activeZoneFilter && (
                      <button
                        onClick={() => setActiveZoneFilter(null)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 ml-1"
                      >
                        {dict.warehouses.clearFilter}
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
                        {dict.warehouses.selectedShape} <strong className="font-mono text-amber-300">{selectedShapeId}</strong>
                      </span>
                      {(() => {
                        const cur = layoutPositions[selectedShapeId]
                        const isH = cur?.orientation === 'horizontal'
                        return (
                          <Badge className="bg-slate-800 text-amber-200 border-slate-700 text-[10px] uppercase font-bold">
                            {isH ? dict.warehouses.rotateSetHorizontal : dict.warehouses.rotateSetVertical} ({cur?.w || 80}×{cur?.h || 120}px)
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
                            title={dict.warehouses.rotateDimensions}
                          >
                            <RotateCw size={12} />
                            <span>{isH ? dict.warehouses.rotateSetVertical : dict.warehouses.rotateSetHorizontal}</span>
                          </button>
                        )
                      })()}

                      {/* Directional Arrow Buttons for fine-tuning */}
                      <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveSelectedShape(-5, 0)}
                          title={dict.warehouses.nudgeLeft}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        >
                          <ArrowLeft size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSelectedShape(0, -5)}
                          title={dict.warehouses.nudgeUp}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSelectedShape(0, 5)}
                          title={dict.warehouses.nudgeDown}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSelectedShape(5, 0)}
                          title={dict.warehouses.nudgeRight}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        >
                          <ArrowRight size={13} />
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        {dict.warehouses.arrowKeysHint}
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
                    {dict.warehouses.northWall}
                  </div>
                  <div className="absolute bottom-2 left-4 text-[10px] font-mono font-bold text-slate-500 tracking-wider">
                    {dict.warehouses.southWall}
                  </div>
                  <div className="absolute top-2 right-4 text-[10px] font-mono font-bold text-slate-500 tracking-wider">
                    {dict.warehouses.eastGate}
                  </div>

                  {/* Center forklift runway indicator */}
                  <div className="absolute left-[45%] top-0 bottom-0 w-[2px] border-r border-dashed border-slate-700/60 pointer-events-none flex flex-col justify-center items-center">
                    <span className="bg-[#070a13] px-1 py-3 text-[9px] text-slate-500 font-mono tracking-widest rotate-90 whitespace-nowrap">
                      {dict.warehouses.mainAisle}
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
                      ? dict.warehouses.dragTipEdit
                      : dict.warehouses.dragTipView}
                  </div>
                </div>
              </div>
            )}

            {/* ITEM DETAILS & INNER LAYOUT CONFIGURATION MODAL */}
            <WarehouseItemLayoutModal
              item={selectedInspectorItem}
              onClose={() => setSelectedInspectorItem(null)}
              onSave={(payload) => {
                layoutMutation.mutate({
                  action: 'UPDATE_ITEM_LAYOUT',
                  payload,
                })
              }}
              isSaving={layoutMutation.isPending}
              dict={dict}
            />

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
                    {dict.warehouses.digitalTwinViewport} {currentWarehouse?.name} ({currentWarehouse?.code})
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {dict.warehouses.digitalTwinDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-slate-900 text-white font-mono text-xs">
                  {twin3DItems.length} {dict.warehouses.productsPlotted}
                </Badge>
                <Badge variant="outline" className="font-bold text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
                  {dict.warehouses.laserWayfindingActive}
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
              {editingWarehouse ? dict.warehouses.modalEditWarehouseTitle : dict.warehouses.modalRegisterWarehouseTitle}
            </DialogTitle>
            <DialogDescription>
              {dict.warehouses.modalWarehouseDesc}
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
                <Label className="text-xs">{dict.warehouses.warehouseCode}</Label>
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
                <Label className="text-xs">{dict.warehouses.hubType}</Label>
                <select
                  value={whForm.type}
                  onChange={(e) => setWhForm({ ...whForm, type: e.target.value })}
                  className="w-full h-8 px-2 rounded-md border border-input text-xs bg-background"
                >
                  <option value="PROCUREMENT">{dict.warehouses.typeProcurement}</option>
                  <option value="DISTRIBUTION">{dict.warehouses.typeDistribution}</option>
                  <option value="TRANSIT">{dict.warehouses.typeTransit}</option>
                  <option value="RETURN">{dict.warehouses.typeReturn}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">{dict.warehouses.warehouseName}</Label>
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
                <Label className="text-xs">{dict.warehouses.country}</Label>
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
                <Label className="text-xs">{dict.warehouses.city}</Label>
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
              <Label className="text-xs">{dict.warehouses.physicalAddress}</Label>
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
                <Label className="text-xs">{dict.warehouses.contactManager}</Label>
                <Input
                  placeholder="Manager Name"
                  value={whForm.contactPerson}
                  onChange={(e) => setWhForm({ ...whForm, contactPerson: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dict.warehouses.contactPhone}</Label>
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
                  {dict.warehouses.defaultProcurementCheckbox}
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
                  {dict.warehouses.defaultSalesCheckbox}
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
                {dict.common.cancel}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createOrUpdateWhMutation.isPending}
                className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                {createOrUpdateWhMutation.isPending ? dict.common.saving : dict.warehouses.saveWarehouse}
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
              {dict.warehouses.modalQuickRackTitle} ({quickRackForm.rackPrefix}{quickRackForm.rackNumber})
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
                <Label className="text-xs">{dict.warehouses.destinationZone}</Label>
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
                <Label className="text-xs">{dict.warehouses.rackPrefix}</Label>
                <Input
                  value={quickRackForm.rackPrefix}
                  onChange={(e) => setQuickRackForm({ ...quickRackForm, rackPrefix: e.target.value.toUpperCase() })}
                  className="h-8 text-xs font-mono font-bold uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dict.warehouses.rackNumber}</Label>
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
                <Label className="text-[11px] font-semibold text-emerald-900">{dict.warehouses.baysCount}</Label>
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
                <Label className="text-[11px] font-semibold text-emerald-900">{dict.warehouses.levelsTiers}</Label>
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
                <Label className="text-[11px] font-semibold text-emerald-900">{dict.warehouses.slotsPerTier}</Label>
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
                {dict.common.cancel}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={layoutMutation.isPending}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {layoutMutation.isPending ? dict.common.saving : `Create Rack ${quickRackForm.rackPrefix}${quickRackForm.rackNumber}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Add Bay / Rack Modal */}
      <Dialog open={addBayModalOpen} onOpenChange={setAddBayModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{dict.warehouses.modalAddBayTitle}</DialogTitle>
            <DialogDescription>{dict.warehouses.modalAddBayDesc}</DialogDescription>
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
                <Label className="text-xs">{dict.warehouses.bayCode}</Label>
                <Input
                  required
                  placeholder="e.g. R2-B01"
                  value={bayForm.code}
                  onChange={(e) => setBayForm({ ...bayForm, code: e.target.value.toUpperCase() })}
                  className="h-8 text-xs font-mono uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dict.warehouses.bayLabel}</Label>
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
                <Label className="text-xs">{dict.warehouses.aisleIdentifier}</Label>
                <Input
                  placeholder="e.g. A1, A2"
                  value={bayForm.aisle}
                  onChange={(e) => setBayForm({ ...bayForm, aisle: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dict.warehouses.rackRow}</Label>
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
                <Label className="text-xs">{dict.warehouses.levelsTiers} *</Label>
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
                <Label className="text-xs">{dict.warehouses.slotsPerTier} *</Label>
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
                {dict.common.cancel}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={layoutMutation.isPending}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {layoutMutation.isPending ? dict.common.saving : dict.warehouses.generateBaySlots}
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
              {dict.warehouses.modalBatchRacksTitle} ({batchForm.rackPrefix}{batchForm.startRack} - {batchForm.rackPrefix}{batchForm.endRack})
            </DialogTitle>
            <DialogDescription>
              {dict.warehouses.modalBatchRacksDesc} {currentWarehouse?.name}.
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
              <Label className="text-xs">{dict.warehouses.destinationZone} *</Label>
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
                <Label className="text-xs">{dict.warehouses.rackPrefix}</Label>
                <Input
                  value={batchForm.rackPrefix}
                  onChange={(e) => setBatchForm({ ...batchForm, rackPrefix: e.target.value })}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dict.warehouses.startRackNum}</Label>
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
                <Label className="text-xs">{dict.warehouses.endRackNum}</Label>
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
                <Label className="text-xs">{dict.warehouses.baysPerRack}</Label>
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
                <Label className="text-xs">{dict.warehouses.tiersPerBay}</Label>
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
                <Label className="text-xs">{dict.warehouses.slotsPerTier}</Label>
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
                {dict.common.cancel}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={layoutMutation.isPending}
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {layoutMutation.isPending ? dict.common.saving : dict.warehouses.executeBatchGenerator}
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
              {dict.warehouses.modalAssignProductTitle}
            </DialogTitle>
            <DialogDescription>
              {dict.warehouses.modalAssignProductDesc}{' '}
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
              <Label className="text-xs">{dict.warehouses.selectProductCatalog}</Label>
              <select
                value={assignProductId}
                onChange={(e) => setAssignProductId(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-input text-xs bg-background font-bold"
              >
                <option value="">{dict.warehouses.chooseProduct}</option>
                {availableProducts.map((prod: any) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.sku} • {prod.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 border text-[11px] text-slate-600">
              <div>
                {dict.warehouses.targetSlotCode} <span className="font-mono font-bold text-slate-900">{selectedSlotForAssign?.code}</span>
              </div>
              <div>
                {dict.warehouses.shelfLevel} <span className="font-bold text-slate-900">{selectedSlotForAssign?.name}</span>
              </div>
              <div>
                {dict.warehouses.barcode} <span className="font-mono text-slate-600">{selectedSlotForAssign?.barcode || 'N/A'}</span>
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
                {dict.common.cancel}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!assignProductId || layoutMutation.isPending}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {layoutMutation.isPending ? dict.common.saving : dict.warehouses.confirmSlotAssignment}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}