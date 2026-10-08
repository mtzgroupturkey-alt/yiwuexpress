'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import {
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Eye,
  SlidersHorizontal,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react'
import { IkeaProduct, IkeaMapResult, MappedAttributeValue, UnmappedSpec } from '@/lib/ikea/types'

interface FetchResultItem {
  itemNumber: string
  cleanItemNumber: string
  status: 'READY' | 'NOT_FOUND' | 'FETCH_FAILED' | 'PARSE_FAILED'
  product?: IkeaProduct
  mappedResult?: IkeaMapResult
  error?: string
  retryable?: boolean
}

export default function IkeaImportPage() {
  const [rawInput, setRawInput] = useState('304.432.55\n503.275.80\ns792.284.12')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [fetchResults, setFetchResults] = useState<FetchResultItem[]>([])
  const [selectedItemForModal, setSelectedItemForModal] = useState<FetchResultItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'ready' | 'issues'>('all')
  const [modalTab, setModalTab] = useState<'overview' | 'details' | 'measurements'>('overview')

  const queryClient = useQueryClient()

  // Load categories for override dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories-simple'],
    queryFn: async () => {
      const res = await fetch('/api/admin/categories')
      if (!res.ok) throw new Error('Failed to load categories')
      const json = await res.json()
      return json.data || json.categories || json || []
    }
  })

  // Load existing attributes for manual assignment in modal
  const { data: mappingsData } = useQuery({
    queryKey: ['admin-ikea-mappings-list'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ikea/mappings')
      if (!res.ok) throw new Error('Failed to load mappings')
      return res.json()
    }
  })

  const availableAttributes = mappingsData?.attributes || []

  // Fetch & Parse Mutation
  const fetchMutation = useMutation({
    mutationFn: async () => {
      const lines = rawInput
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)

      if (lines.length === 0) {
        throw new Error('Please enter at least one IKEA item number')
      }

      const res = await fetch('/api/admin/ikea/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemNumbers: lines,
          targetCategoryId: selectedCategoryId || undefined
        })
      })

      if (!res.ok) {
        const errorJson = await res.json()
        throw new Error(errorJson.error || 'Failed to fetch IKEA products')
      }

      return res.json()
    },
    onSuccess: (data) => {
      setFetchResults(data.results || [])
      const successCount = (data.results || []).filter((r: any) => r.status === 'READY').length
      toast.success(`Fetched & parsed ${successCount} of ${data.results?.length} products!`)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Fetch error')
    }
  })

  // Import Mutation
  const importMutation = useMutation({
    mutationFn: async (itemsToImport: FetchResultItem[]) => {
      const payloadItems = itemsToImport
        .filter((r) => r.status === 'READY' && r.product && r.mappedResult)
        .map((r) => {
          const m = r.mappedResult!
          const p = r.product!
          return {
            itemNumber: p.cleanItemNumber,
            categoryId: m.targetCategoryId,
            name: m.productDefaults.name,
            description: m.productDefaults.description,
            price: m.productDefaults.price,
            wholesalePrice: m.productDefaults.wholesalePrice,
            images: m.productDefaults.images,
            mappedAttributes: m.mapped.map((attr) => ({
              attributeId: attr.attributeId,
              value: attr.value
            })),
            rawIkeaPayload: p,
            overwriteExisting
          }
        })

      if (payloadItems.length === 0) {
        throw new Error('No valid ready items selected for import')
      }

      const res = await fetch('/api/admin/ikea/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payloadItems,
          overwriteExisting
        })
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to import products')
      }

      return res.json()
    },
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.importedCount} products into database!`)
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Import error')
    }
  })

  // Filtered table items
  const filteredResults = fetchResults.filter((item) => {
    if (activeTab === 'ready') return item.status === 'READY'
    if (activeTab === 'issues') return item.status !== 'READY'
    return true
  })

  const readyCount = fetchResults.filter((r) => r.status === 'READY').length
  const issueCount = fetchResults.filter((r) => r.status !== 'READY').length

  const handleOpenModal = (item: FetchResultItem) => {
    setSelectedItemForModal(JSON.parse(JSON.stringify(item))) // clone
    setIsModalOpen(true)
  }

  const handleSaveModalChanges = () => {
    if (!selectedItemForModal) return

    setFetchResults((prev) =>
      prev.map((item) =>
        item.cleanItemNumber === selectedItemForModal.cleanItemNumber ? selectedItemForModal : item
      )
    )
    setIsModalOpen(false)
    toast.success('Updated product preview mapping')
  }

  const handleUpdateAttributeValue = (index: number, val: string) => {
    if (!selectedItemForModal?.mappedResult) return
    const updated = { ...selectedItemForModal }
    updated.mappedResult!.mapped[index].value = val
    setSelectedItemForModal(updated)
  }

  const handleAssignUnmappedSpec = (unmappedIndex: number, attributeId: string) => {
    if (!selectedItemForModal?.mappedResult) return
    const attr = availableAttributes.find((a: any) => a.id === attributeId)
    if (!attr) return

    const updated = { ...selectedItemForModal }
    const unmappedItem = updated.mappedResult!.unmapped[unmappedIndex]

    // Add to mapped
    updated.mappedResult!.mapped.push({
      attributeId: attr.id,
      attributeName: attr.name,
      attributeSlug: attr.slug,
      attributeType: attr.type,
      value: unmappedItem.value,
      rawIkeaKey: unmappedItem.key,
      rawIkeaValue: unmappedItem.value,
      matchedVia: 'manual'
    })

    // Remove from unmapped
    updated.mappedResult!.unmapped.splice(unmappedIndex, 1)
    setSelectedItemForModal(updated)
    toast.success(`Mapped "${unmappedItem.key}" to ${attr.name}`)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-600" />
            IKEA Bulk Spec Importer & Attribute Mapper
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fetch official IKEA specs, automatically map to your category attributes schema, and persist products idempotently.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/attributes/ikea-mapping">
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Manage IKEA Mappings
            </Button>
          </Link>
        </div>
      </div>

      {/* Input Section Card */}
      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            1. IKEA Item Numbers Input
          </CardTitle>
          <CardDescription>
            Enter one or more IKEA 8-digit item numbers (e.g. <code>304.432.55</code>, <code>503.275.80</code>, <code>s792.284.12</code>), separated by newlines or commas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="304.432.55&#10;503.275.80&#10;s792.284.12"
            rows={4}
            className="font-mono text-sm"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Target Category Override (Optional)
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Auto-resolve from IKEA Category Breadcrumbs</option>
                {categoriesData?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <Switch
                id="overwrite-switch"
                checked={overwriteExisting}
                onCheckedChange={setOverwriteExisting}
              />
              <label htmlFor="overwrite-switch" className="text-sm font-medium cursor-pointer">
                Overwrite existing products and values if already in database
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-500" />
              Cached for 24h in PostgreSQL. Respects rate limits with exponential backoff.
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => fetchMutation.mutate()}
                disabled={fetchMutation.isPending || !rawInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                {fetchMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Fetch & Preview Specs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview & Results Section */}
      {fetchResults.length > 0 && (
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                2. Extracted Specs & Mapping Preview ({fetchResults.length} items)
              </CardTitle>
              <CardDescription>
                Review matched attributes and inspect unmapped specs before persisting to the database.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => importMutation.mutate(fetchResults)}
                disabled={importMutation.isPending || readyCount === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              >
                {importMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                Import All Ready ({readyCount})
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('all')}
              >
                All ({fetchResults.length})
              </Button>
              <Button
                variant={activeTab === 'ready' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('ready')}
                className="text-emerald-700"
              >
                Ready ({readyCount})
              </Button>
              <Button
                variant={activeTab === 'issues' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('issues')}
                className="text-rose-700"
              >
                Issues ({issueCount})
              </Button>
            </div>

            {/* Preview Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Item #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Matched Category</TableHead>
                    <TableHead className="text-center">Mapped Attrs</TableHead>
                    <TableHead className="text-center">Unmapped Specs</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((item, idx) => {
                    const isReady = item.status === 'READY'
                    const mappedCount = item.mappedResult?.mapped.length || 0
                    const unmappedCount = item.mappedResult?.unmapped.length || 0

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-mono font-medium text-xs">
                          {item.itemNumber}
                        </TableCell>
                        <TableCell>
                          {isReady && item.product ? (
                            <div className="flex items-center gap-3">
                              {item.product.mainImage && (
                                <img
                                  src={item.product.mainImage}
                                  alt={item.product.name}
                                  className="w-10 h-10 object-cover rounded border"
                                />
                              )}
                              <div>
                                <div className="font-semibold text-sm line-clamp-1">
                                  {item.product.name}
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {item.product.typeName || item.product.categoryName} • ${item.product.price}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-rose-600">
                              {item.error || 'Failed to fetch product'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isReady ? (
                            <Badge variant="outline" className="text-xs bg-slate-50">
                              {item.mappedResult?.targetCategoryName || 'Unassigned'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isReady ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                              {mappedCount} mapped
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isReady ? (
                            unmappedCount > 0 ? (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                {unmappedCount} unmapped
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-50 text-emerald-700">All mapped</Badge>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isReady ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" /> Ready
                            </span>
                          ) : item.status === 'NOT_FOUND' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                              <XCircle className="w-4 h-4" /> Not Found
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                              <AlertTriangle className="w-4 h-4" /> Error
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isReady && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenModal(item)}
                                  className="h-8 px-2 text-xs"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  Inspect & Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => importMutation.mutate([item])}
                                  disabled={importMutation.isPending}
                                  className="h-8 px-2 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                                >
                                  Import
                                </Button>
                              </>
                            )}
                            {item.product?.url && (
                              <a
                                href={item.product.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-muted-foreground hover:text-blue-600 p-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Item Preview & Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Preview & Edit IKEA Specs: {selectedItemForModal?.product?.name} (
              {selectedItemForModal?.itemNumber})
            </DialogTitle>
            <DialogDescription>
              Side-by-side inspection of raw IKEA specs and mapped category attributes.
            </DialogDescription>
          </DialogHeader>

          {selectedItemForModal?.mappedResult && selectedItemForModal.product && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
              {/* Left Column: Official IKEA 3 Tabs */}
              <div className="border rounded-lg p-4 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-sm text-slate-900">Official IKEA Specs</h3>
                  <Badge variant="outline" className="text-xs">
                    {selectedItemForModal.product.categoryName}
                  </Badge>
                </div>

                {/* Tab Switcher Buttons */}
                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-md text-xs">
                  <button
                    type="button"
                    onClick={() => setModalTab('overview')}
                    className={`flex-1 py-1 px-2 rounded font-medium transition-colors ${
                      modalTab === 'overview'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('details')}
                    className={`flex-1 py-1 px-2 rounded font-medium transition-colors ${
                      modalTab === 'details'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Product details
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('measurements')}
                    className={`flex-1 py-1 px-2 rounded font-medium transition-colors ${
                      modalTab === 'measurements'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Measurements
                  </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {modalTab === 'overview' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1">Overview Summary:</span>
                      <p className="bg-white p-2.5 rounded border text-slate-800 leading-relaxed">
                        {selectedItemForModal.product.overview?.summary ||
                          selectedItemForModal.product.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded border">
                        <span className="text-slate-500 block text-[10px]">Official Price</span>
                        <span className="font-bold text-slate-900">
                          ${selectedItemForModal.product.price} {selectedItemForModal.product.currency}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <span className="text-slate-500 block text-[10px]">Availability</span>
                        <span className="font-semibold text-emerald-600">
                          {selectedItemForModal.product.availability?.statusText || 'In stock'}
                        </span>
                      </div>
                    </div>

                    {selectedItemForModal.product.images?.length > 0 && (
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1.5">Gallery:</span>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {selectedItemForModal.product.images.slice(0, 6).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Gallery"
                              className="w-14 h-14 object-cover rounded border bg-white flex-shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: PRODUCT DETAILS */}
                {modalTab === 'details' && (
                  <div className="space-y-3 text-xs max-h-[380px] overflow-y-auto pr-1">
                    {/* Key features bullets */}
                    {selectedItemForModal.product.productDetails?.keyFeatures?.length > 0 && (
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">Key Features:</span>
                        <ul className="list-disc pl-4 space-y-1 bg-white p-2.5 rounded border text-slate-800">
                          {selectedItemForModal.product.productDetails.keyFeatures.map((kf, i) => (
                            <li key={i}>{kf}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Good to know */}
                    {selectedItemForModal.product.productDetails?.goodToKnow && (
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">Good to know / Set includes:</span>
                        <p className="bg-white p-2.5 rounded border text-slate-800 leading-relaxed">
                          {selectedItemForModal.product.productDetails.goodToKnow}
                        </p>
                      </div>
                    )}

                    {/* Materials */}
                    {selectedItemForModal.product.productDetails?.materials && (
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">Materials:</span>
                        <p className="bg-white p-2.5 rounded border text-slate-800 leading-relaxed">
                          {selectedItemForModal.product.productDetails.materials}
                        </p>
                      </div>
                    )}

                    {/* Care instructions */}
                    {selectedItemForModal.product.productDetails?.careInstructions && (
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">Care Instructions:</span>
                        <p className="bg-white p-2.5 rounded border text-slate-800 leading-relaxed">
                          {selectedItemForModal.product.productDetails.careInstructions}
                        </p>
                      </div>
                    )}

                    {/* Designer */}
                    {selectedItemForModal.product.designer && (
                      <div className="bg-white p-2 rounded border">
                        <span className="text-slate-500 block text-[10px]">Designer</span>
                        <span className="font-semibold text-slate-900">
                          {selectedItemForModal.product.designer}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: MEASUREMENTS */}
                {modalTab === 'measurements' && (
                  <div className="space-y-3 text-xs max-h-[380px] overflow-y-auto pr-1">
                    {/* Product Dimensions */}
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1">Product Dimensions:</span>
                      <div className="space-y-1.5">
                        {Object.entries(selectedItemForModal.product.measurements || {}).map(([k, v], i) => (
                          <div
                            key={i}
                            className="bg-white p-2 rounded border text-xs flex justify-between gap-2"
                          >
                            <span className="font-medium text-slate-600">{k}:</span>
                            <span className="text-slate-900 font-semibold">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Packaging Details */}
                    {selectedItemForModal.product.measurementsTab?.packaging?.length > 0 && (
                      <div className="border-t pt-2">
                        <span className="font-semibold text-slate-700 block mb-1.5">
                          Packaging Measurements:
                        </span>
                        <div className="space-y-2">
                          {selectedItemForModal.product.measurementsTab.packaging.map((pkg, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded border space-y-1 text-xs">
                              <div className="font-semibold text-slate-800">
                                Package {idx + 1}
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
                                {pkg.width && <div>Width: <span className="font-medium">{pkg.width}</span></div>}
                                {pkg.height && <div>Height: <span className="font-medium">{pkg.height}</span></div>}
                                {pkg.length && <div>Length: <span className="font-medium">{pkg.length}</span></div>}
                                {pkg.weight && <div>Weight: <span className="font-medium">{pkg.weight}</span></div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Mapped Internal Attributes */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-sm text-slate-900">Mapped Attributes</h3>
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                    Category: {selectedItemForModal.mappedResult.targetCategoryName}
                  </Badge>
                </div>

                {/* Mapped Fields */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {selectedItemForModal.mappedResult.mapped.map((attr, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                          {attr.attributeName}
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({attr.attributeType})
                          </span>
                        </label>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          via {attr.matchedVia}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={attr.value}
                          onChange={(e) => handleUpdateAttributeValue(idx, e.target.value)}
                          className="h-8 text-xs"
                        />
                        {attr.unit && (
                          <span className="px-2 py-1 text-xs font-mono bg-slate-100 rounded border flex items-center">
                            {attr.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Unmapped Specs Section */}
                {selectedItemForModal.mappedResult.unmapped.length > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <h4 className="font-semibold text-xs text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Unmapped IKEA Specs ({selectedItemForModal.mappedResult.unmapped.length})
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Assign an unmapped spec to an existing attribute:
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedItemForModal.mappedResult.unmapped.map((unm, uIdx) => (
                        <div
                          key={uIdx}
                          className="p-2 bg-amber-50/60 border border-amber-200 rounded text-xs space-y-1.5"
                        >
                          <div className="flex justify-between font-medium text-amber-900">
                            <span>{unm.key}</span>
                            <span className="text-slate-600 truncate max-w-[140px]">
                              {unm.value}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <select
                              onChange={(e) => {
                                if (e.target.value) handleAssignUnmappedSpec(uIdx, e.target.value)
                              }}
                              className="w-full text-xs h-7 px-2 bg-white border border-slate-300 rounded"
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Select attribute to map...
                              </option>
                              {availableAttributes.map((a: any) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({a.type})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-3 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleSaveModalChanges} className="bg-blue-600 hover:bg-blue-700 text-white">
                Save & Apply Mapping
              </Button>
              <Button
                onClick={() => {
                  handleSaveModalChanges()
                  if (selectedItemForModal) {
                    importMutation.mutate([selectedItemForModal])
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirm & Import Now
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
