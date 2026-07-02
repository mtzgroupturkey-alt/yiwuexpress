'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container } from '@/components/ui/Container'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AttributeForm } from '@/components/admin/AttributeForm'

export default function AttributeManager() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<any>(null)
  const queryClient = useQueryClient()

  // Fetch all categories with their attributes count
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', 'with-attributes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/categories?includeAttributes=true')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    },
  })

  // Fetch attributes for a specific category
  const { data: categoryAttributes } = useQuery({
    queryKey: ['category-attributes', selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return { data: [] }
      const res = await fetch(`/api/admin/categories/${selectedCategoryId}/attributes`)
      if (!res.ok) throw new Error('Failed to fetch attributes')
      return res.json()
    },
    enabled: !!selectedCategoryId,
  })

  // Delete attribute mutation
  const deleteAttribute = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/attributes/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete attribute')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-attributes'] })
      queryClient.invalidateQueries({ queryKey: ['categories', 'with-attributes'] })
      toast.success('Attribute deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete attribute')
    },
  })

  // Toggle attribute visibility
  const toggleVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const res = await fetch(`/api/admin/attributes/${id}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: visible }),
      })
      if (!res.ok) throw new Error('Failed to toggle visibility')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-attributes'] })
    },
  })

  const handleEdit = (attribute: any) => {
    setEditingAttribute(attribute)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this attribute?')) {
      deleteAttribute.mutate(id)
    }
  }

  const handleDialogClose = (success?: boolean) => {
    setIsDialogOpen(false)
    setEditingAttribute(null)
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['category-attributes'] })
      queryClient.invalidateQueries({ queryKey: ['categories', 'with-attributes'] })
    }
  }

  const getAttributeTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      TEXT: 'bg-blue-100 text-blue-800',
      TEXTAREA: 'bg-indigo-100 text-indigo-800',
      NUMBER: 'bg-green-100 text-green-800',
      SELECT: 'bg-yellow-100 text-yellow-800',
      MULTISELECT: 'bg-orange-100 text-orange-800',
      COLOR: 'bg-pink-100 text-pink-800',
      FILE: 'bg-purple-100 text-purple-800',
      URL: 'bg-cyan-100 text-cyan-800',
      CHECKBOX: 'bg-gray-100 text-gray-800',
      DATE: 'bg-red-100 text-red-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Container maxWidth="2xl" className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a3a5c]">Attribute Manager</h1>
          <p className="text-gray-500">
            Define custom product attributes for each category
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAttribute(null)
            setIsDialogOpen(true)
          }}
          className="bg-[#1a3a5c] hover:bg-[#2a5a8c]"
          disabled={!selectedCategoryId}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Select a category to manage its attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {isLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading...</div>
                ) : (
                  (() => {
                    // Build category hierarchy
                    const allCategories = categories?.data || []
                    const parentCategories = allCategories.filter((c: any) => !c.parentId)
                    const childCategories = allCategories.filter((c: any) => c.parentId)
                    
                    const categoryTree: any[] = []
                    
                    // Sort and build tree
                    parentCategories
                      .sort((a: any, b: any) => (a.menuOrder || 0) - (b.menuOrder || 0) || a.name.localeCompare(b.name))
                      .forEach((parent: any) => {
                        categoryTree.push({ ...parent, isParent: true, level: 0 })
                        
                        childCategories
                          .filter((child: any) => child.parentId === parent.id)
                          .sort((a: any, b: any) => (a.menuOrder || 0) - (b.menuOrder || 0) || a.name.localeCompare(b.name))
                          .forEach((child: any) => {
                            categoryTree.push({ ...child, isChild: true, level: 1, parentName: parent.name })
                          })
                      })
                    
                    return categoryTree.map((category: any) => (
                      <button
                        key={category.id}
                        className={`w-full text-left p-3 rounded-lg border transition ${
                          selectedCategoryId === category.id
                            ? 'border-[#1a3a5c] bg-[#1a3a5c]/5'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${category.isParent ? 'font-semibold' : ''}`}
                        onClick={() => setSelectedCategoryId(category.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {category.isChild && (
                              <span className="text-gray-400 flex-shrink-0">└─</span>
                            )}
                            <span className={`truncate ${category.isParent ? 'text-gray-900' : 'text-gray-700'}`}>
                              {category.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="secondary" className="text-xs">
                              {category._count?.attributes || 0}
                            </Badge>
                            {category.isParent && (
                              <span className="text-xs text-gray-400">
                                {childCategories.filter((c: any) => c.parentId === category.id).length} sub
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  })()
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attribute List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCategoryId
                  ? categories?.data?.find((c: any) => c.id === selectedCategoryId)?.name || 'Attributes'
                  : 'Select a category'}
              </CardTitle>
              <CardDescription>
                {selectedCategoryId
                  ? 'Manage product attributes for this category'
                  : 'Please select a category from the left panel'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCategoryId ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Select a category to manage its attributes</p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading attributes...</div>
              ) : (
                <>
                  {categoryAttributes?.category?.hasParent && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        ℹ️ This category inherits attributes from its parent category. Inherited attributes are shown with a light blue background and cannot be edited here.
                      </p>
                    </div>
                  )}
                  
                  {categoryAttributes?.data?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No attributes defined for this category</p>
                      <Button
                        onClick={() => {
                          setEditingAttribute(null)
                          setIsDialogOpen(true)
                        }}
                        variant="outline"
                        className="mt-4"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Attribute
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Attribute</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead>Filterable</TableHead>
                          <TableHead>Visible</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryAttributes?.data?.map((attr: any) => (
                          <TableRow 
                            key={attr.id} 
                            className={attr.isInherited ? 'bg-blue-50/50' : ''}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{attr.name}</span>
                                {attr.isInherited && (
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                    Inherited from {attr.inheritedFrom}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getAttributeTypeBadge(attr.type)}>
                                {attr.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {attr.isRequired ? '✅' : '❌'}
                            </TableCell>
                            <TableCell>
                              {attr.isFilterable ? '✅' : '❌'}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={attr.isVisible}
                                onCheckedChange={() =>
                                  toggleVisibility.mutate({
                                    id: attr.id,
                                    visible: !attr.isVisible,
                                  })
                                }
                                disabled={attr.isInherited}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {!attr.isInherited && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(attr)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(attr.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {attr.isInherited && (
                                <span className="text-xs text-gray-400">Read-only</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attribute Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={() => handleDialogClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingAttribute ? 'Edit Attribute' : 'Add Attribute'}</DialogTitle>
            <DialogDescription>
              Define a custom attribute for this category
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            <AttributeForm
              initialData={editingAttribute}
              categoryId={selectedCategoryId}
              onSuccess={() => handleDialogClose(true)}
              onCancel={() => handleDialogClose()}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  )
}
