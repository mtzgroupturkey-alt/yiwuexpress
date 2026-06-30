'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbForm } from '@/components/admin/BreadcrumbForm'
import { toast } from 'react-hot-toast'
import { Pencil, Trash2, Plus } from 'lucide-react'

interface BreadcrumbSetting {
  id: string
  pageType: 'static' | 'shop_default' | 'category'
  pageSlug?: string
  categoryId?: string
  imageUrl: string
  mobileImageUrl?: string
  overlayColor?: string
  title?: string
  subtitle?: string
  isActive: boolean
  category?: {
    id: string
    name: string
    slug: string
  }
}

export default function BreadcrumbSettingsPage() {
  const [editingItem, setEditingItem] = useState<BreadcrumbSetting | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('static')
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Load tab from URL param or localStorage on component mount
  useEffect(() => {
    const urlTab = searchParams.get('tab')
    
    if (urlTab && ['static', 'shop', 'categories'].includes(urlTab)) {
      // URL parameter takes priority
      setActiveTab(urlTab)
    } else {
      // Fallback to localStorage
      try {
        const savedTab = localStorage.getItem('breadcrumb-settings-active-tab')
        if (savedTab && ['static', 'shop', 'categories'].includes(savedTab)) {
          setActiveTab(savedTab)
        }
      } catch (error) {
        console.error('Error loading saved tab from localStorage:', error)
        setActiveTab('static')
      }
    }
  }, [searchParams])

  // Save tab to localStorage and URL when it changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    
    // Save to localStorage
    try {
      localStorage.setItem('breadcrumb-settings-active-tab', tab)
    } catch (error) {
      console.error('Error saving tab to localStorage:', error)
    }
    
    // Update URL without causing a navigation
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('tab', tab)
    router.replace(currentUrl.pathname + '?' + currentUrl.searchParams.toString(), { scroll: false })
  }

  // Fetch all breadcrumb settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['breadcrumb-settings'],
    queryFn: async () => {
      const response = await api.get('/api/admin/settings/breadcrumb')
      console.log('Breadcrumb settings fetched:', response)
      return response
    },
  })

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('Fetching categories...')
      const response = await api.get('/api/categories?includeChildren=true')
      console.log('Categories API response:', response)
      console.log('Response data:', response.data)
      console.log('Response data.data:', response.data.data)
      // Return the actual categories array
      return response.data.data || response.data || []
    },
  })

  // Mutation for creating/updating
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Saving breadcrumb setting:', data)
      if (data.id) {
        const response = await api.put(`/api/admin/settings/breadcrumb/${data.id}`, data)
        console.log('Update response:', response)
        return response.data
      }
      const response = await api.post('/api/admin/settings/breadcrumb', data)
      console.log('Create response:', response)
      return response.data
    },
    onSuccess: (data) => {
      console.log('Save successful:', data)
      queryClient.invalidateQueries({ queryKey: ['breadcrumb-settings'] })
      toast.success('Breadcrumb setting saved successfully')
      setIsDialogOpen(false)
      setEditingItem(null)
    },
    onError: (error: any) => {
      console.error('Save error:', error)
      toast.error(error.response?.data?.error || error.message || 'Failed to save breadcrumb setting')
    },
  })

  // Mutation for deleting
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/admin/settings/breadcrumb/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breadcrumb-settings'] })
      toast.success('Breadcrumb setting deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete breadcrumb setting')
    },
  })

  const handleSave = (data: any) => {
    mutation.mutate(data)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this setting?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (item: BreadcrumbSetting) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingItem(null)
    setIsDialogOpen(true)
  }

  // Filter settings by type
  const staticPages = settings?.data?.filter((s: BreadcrumbSetting) => s.pageType === 'static') || []
  const shopDefault = settings?.data?.filter((s: BreadcrumbSetting) => s.pageType === 'shop_default') || []
  const categorySettings = settings?.data?.filter((s: BreadcrumbSetting) => s.pageType === 'category') || []

  if (isLoading) {
    return (
      <Container maxWidth="2xl" className="py-8">
        <div className="flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container maxWidth="2xl" className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a3a5c]">Breadcrumb Settings</h1>
          <p className="text-gray-500">Manage background images for breadcrumbs across your store</p>
        </div>
        <Button onClick={handleNew} className="bg-[#1a3a5c] hover:bg-[#2a5a8c]">
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="static">
            Static Pages {staticPages.length > 0 && (
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {staticPages.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="shop">
            Shop Default {shopDefault.length > 0 && (
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {shopDefault.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="categories">
            Categories {categorySettings.length > 0 && (
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {categorySettings.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* STATIC PAGES TAB */}
        <TabsContent value="static">
          <Card>
            <CardHeader>
              <CardTitle>Static Page Backgrounds</CardTitle>
              <CardDescription>
                Set background images for static pages like About, Contact, Blog, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staticPages.map((item: BreadcrumbSetting) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium capitalize">{item.pageSlug}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-10 rounded overflow-hidden bg-gray-100 border border-gray-200">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.pageSlug || 'Background'} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  if (target.nextElementSibling) {
                                    (target.nextElementSibling as HTMLElement).style.display = 'flex'
                                  }
                                }}
                              />
                            ) : null}
                            <div className="hidden w-full h-full items-center justify-center text-xs text-gray-400">
                              No image
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 truncate max-w-[150px]" title={item.imageUrl}>
                              {item.imageUrl.split('/').pop()}
                            </span>
                            <span className="text-xs text-gray-400">
                              {item.imageUrl.startsWith('/uploads/') ? 'Uploaded' : 'URL'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.title || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {staticPages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No static page settings found. Add one now.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHOP DEFAULT TAB */}
        <TabsContent value="shop">
          <Card>
            <CardHeader>
              <CardTitle>Shop Default Background</CardTitle>
              <CardDescription>
                This background will be used as a fallback for all product pages when no category-specific background is set.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shopDefault.length > 0 ? (
                <div className="space-y-4">
                  {shopDefault.map((item: BreadcrumbSetting) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-20 rounded overflow-hidden bg-gray-100 border-2 border-gray-200">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt="Shop default" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-gray-400">Image not found</div>'
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.title || 'Shop Default'}</p>
                          <p className="text-sm text-gray-500">{item.subtitle || 'Fallback background'}</p>
                          <p className="text-xs text-gray-400 mt-1 truncate max-w-xs" title={item.imageUrl}>
                            {item.imageUrl}
                          </p>
                          <Badge variant={item.isActive ? 'default' : 'secondary'} className="mt-1">
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No shop default background set.</p>
                  <Button onClick={handleNew} variant="outline" className="mt-4">
                    Add Shop Default
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Category Backgrounds</CardTitle>
              <CardDescription>
                Set custom background images for specific product categories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorySettings.map((item: BreadcrumbSetting) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.category?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-10 rounded overflow-hidden bg-gray-100 border border-gray-200">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.category?.name || 'Category'} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  if (target.nextElementSibling) {
                                    (target.nextElementSibling as HTMLElement).style.display = 'flex'
                                  }
                                }}
                              />
                            ) : null}
                            <div className="hidden w-full h-full items-center justify-center text-xs text-gray-400">
                              No image
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 truncate max-w-[150px]" title={item.imageUrl}>
                              {item.imageUrl.split('/').pop()}
                            </span>
                            <span className="text-xs text-gray-400">
                              {item.imageUrl.startsWith('/uploads/') ? 'Uploaded' : 'URL'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.title || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categorySettings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No category settings found. Add one now.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EDIT/CREATE DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Add'} Breadcrumb Setting</DialogTitle>
            <DialogDescription>
              Configure the breadcrumb background image and content.
            </DialogDescription>
          </DialogHeader>

          <BreadcrumbForm
            initialData={editingItem}
            categories={categories || []}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Container>
  )
}
