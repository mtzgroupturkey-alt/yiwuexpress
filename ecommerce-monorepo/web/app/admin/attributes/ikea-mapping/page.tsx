'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import {
  SlidersHorizontal,
  FolderTree,
  Plus,
  Trash2,
  RefreshCw,
  ArrowRight,
  Layers,
  Sparkles,
  Download,
  CheckCircle2,
  Tag
} from 'lucide-react'

export default function IkeaMappingManagementPage() {
  const [activeTab, setActiveTab] = useState<'specs' | 'categories'>('specs')

  // Spec Mapping Dialog State
  const [isSpecDialogOpen, setIsSpecDialogOpen] = useState(false)
  const [specForm, setSpecForm] = useState({
    id: '',
    ikeaKey: '',
    attributeId: '',
    unit: '',
    aliases: ''
  })

  // Category Mapping Dialog State
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false)
  const [catForm, setCatForm] = useState({
    id: '',
    ikeaCategoryName: '',
    categoryId: ''
  })

  const queryClient = useQueryClient()

  // Load all mappings, categories, and attributes
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-ikea-all-mappings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ikea/mappings')
      if (!res.ok) throw new Error('Failed to load mappings')
      return res.json()
    }
  })

  const specMappings = data?.specMappings || []
  const categoryMappings = data?.categoryMappings || []
  const categories = data?.categories || []
  const attributes = data?.attributes || []

  // Mutation for Spec Mappings
  const specMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/ikea/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'spec', ...payload })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save spec mapping')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Spec mapping saved successfully')
      setIsSpecDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-ikea-all-mappings'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error saving mapping')
    }
  })

  // Mutation for Category Mappings
  const catMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/ikea/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'category', ...payload })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save category mapping')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Category mapping saved successfully')
      setIsCatDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-ikea-all-mappings'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error saving mapping')
    }
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'spec' | 'category'; id: string }) => {
      const res = await fetch('/api/admin/ikea/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action: 'delete', id })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete mapping')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Mapping deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-ikea-all-mappings'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error deleting mapping')
    }
  })

  // Seed default suggested mappings
  const handleSeedDefaults = async () => {
    try {
      const defaultCats = [
        { ikeaCategoryName: 'Bed frames', targetCategoryMatch: 'bed' },
        { ikeaCategoryName: 'Mattresses', targetCategoryMatch: 'bed' },
        { ikeaCategoryName: 'Cookware', targetCategoryMatch: 'kitchen' },
        { ikeaCategoryName: 'Office chairs', targetCategoryMatch: 'office' },
        { ikeaCategoryName: 'Tables & desks', targetCategoryMatch: 'table' }
      ]

      for (const dc of defaultCats) {
        const matched = categories.find((c: any) =>
          c.name.toLowerCase().includes(dc.targetCategoryMatch)
        )
        if (matched) {
          await catMutation.mutateAsync({
            ikeaCategoryName: dc.ikeaCategoryName,
            categoryId: matched.id
          })
        }
      }

      toast.success('Suggested default category mappings added!')
    } catch (err: any) {
      toast.error('Could not apply all defaults')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-7 h-7 text-indigo-600" />
            IKEA Spec & Category Mapping Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how external IKEA product specs and category breadcrumbs automatically translate to your internal catalog schema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products/import-ikea">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Download className="w-4 h-4" />
              Go to IKEA Bulk Importer
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          variant={activeTab === 'specs' ? 'default' : 'outline'}
          onClick={() => setActiveTab('specs')}
          className="flex items-center gap-2 text-sm"
        >
          <Tag className="w-4 h-4" />
          Spec Attribute Mappings ({specMappings.length})
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'outline'}
          onClick={() => setActiveTab('categories')}
          className="flex items-center gap-2 text-sm"
        >
          <FolderTree className="w-4 h-4" />
          Category Breadcrumb Mappings ({categoryMappings.length})
        </Button>
      </div>

      {/* Spec Mappings Tab */}
      {activeTab === 'specs' && (
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Spec Key to Attribute Mappings</CardTitle>
              <CardDescription>
                When an IKEA spec key matches these rules, it will be automatically formatted and assigned to your internal attribute.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setSpecForm({ id: '', ikeaKey: '', attributeId: '', unit: '', aliases: '' })
                setIsSpecDialogOpen(true)
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Spec Mapping
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IKEA Spec Key</TableHead>
                    <TableHead>Target Internal Attribute</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Aliases</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specMappings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">
                        No custom spec mappings configured yet. The built-in alias dictionary is currently handling standard dimensions and materials.
                      </TableCell>
                    </TableRow>
                  ) : (
                    specMappings.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs font-semibold text-slate-800">
                          {m.ikeaKey}
                        </TableCell>
                        <TableCell>
                          {m.attribute ? (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                {m.attribute.name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">({m.attribute.type})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {m.unit ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {m.unit}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {Array.isArray(m.aliases) &&
                              m.aliases.map((al: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[11px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 border"
                                >
                                  {al}
                                </span>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate({ type: 'spec', id: m.id })}
                            className="text-rose-600 hover:text-rose-700 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Mappings Tab */}
      {activeTab === 'categories' && (
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">IKEA Category to Catalog Category</CardTitle>
              <CardDescription>
                Map official IKEA breadcrumb names (e.g. &ldquo;Bed frames&rdquo;, &ldquo;Mattresses&rdquo;, &ldquo;Cookware&rdquo;) to your catalog categories.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDefaults}
                className="flex items-center gap-1.5 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Seed Common Defaults
              </Button>
              <Button
                onClick={() => {
                  setCatForm({ id: '', ikeaCategoryName: '', categoryId: '' })
                  setIsCatDialogOpen(true)
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Category Mapping
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IKEA Breadcrumb / Category Name</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Internal Catalog Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryMappings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                        No custom category mappings yet. Products will be matched by exact category name or default to the first active category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categoryMappings.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium text-sm text-slate-800">
                          {m.ikeaCategoryName}
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-sm">
                            {m.category?.name || 'Unknown category'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate({ type: 'category', id: m.id })}
                            className="text-rose-600 hover:text-rose-700 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Spec Mapping Dialog */}
      <Dialog open={isSpecDialogOpen} onOpenChange={setIsSpecDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Spec Attribute Mapping</DialogTitle>
            <DialogDescription>
              Map an IKEA spec key to an internal product attribute.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                IKEA Spec Key (e.g. &ldquo;Width&rdquo;, &ldquo;Materials&rdquo;, &ldquo;Footboard height&rdquo;)
              </label>
              <Input
                value={specForm.ikeaKey}
                onChange={(e) => setSpecForm({ ...specForm, ikeaKey: e.target.value })}
                placeholder="Width"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Target Internal Attribute
              </label>
              <select
                value={specForm.attributeId}
                onChange={(e) => setSpecForm({ ...specForm, attributeId: e.target.value })}
                className="w-full h-10 px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select attribute...</option>
                {attributes.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Expected Unit (Optional, e.g. cm, kg, mm)
              </label>
              <Input
                value={specForm.unit}
                onChange={(e) => setSpecForm({ ...specForm, unit: e.target.value })}
                placeholder="cm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Aliases (Comma-separated)
              </label>
              <Input
                value={specForm.aliases}
                onChange={(e) => setSpecForm({ ...specForm, aliases: e.target.value })}
                placeholder="Total width, Frame width, Breite"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSpecDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => specMutation.mutate(specForm)}
              disabled={!specForm.ikeaKey.trim() || specMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Mapping Dialog */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Category Mapping</DialogTitle>
            <DialogDescription>
              Map an IKEA category breadcrumb name to your catalog category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                IKEA Category Name (e.g. &ldquo;Bed frames&rdquo;, &ldquo;Mattresses&rdquo;)
              </label>
              <Input
                value={catForm.ikeaCategoryName}
                onChange={(e) => setCatForm({ ...catForm, ikeaCategoryName: e.target.value })}
                placeholder="Bed frames"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Internal Catalog Category
              </label>
              <select
                value={catForm.categoryId}
                onChange={(e) => setCatForm({ ...catForm, categoryId: e.target.value })}
                className="w-full h-10 px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select category...</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCatDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => catMutation.mutate(catForm)}
              disabled={
                !catForm.ikeaCategoryName.trim() ||
                !catForm.categoryId ||
                catMutation.isPending
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
