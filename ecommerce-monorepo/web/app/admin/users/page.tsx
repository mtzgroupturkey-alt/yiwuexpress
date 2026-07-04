'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { 
  Users, Plus, Search, Edit, Trash2, Eye,
  Building, Mail, Phone, MapPin, Calendar, AlertTriangle,
  Camera, Loader2
} from 'lucide-react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import ClientOnly from '@/components/ClientOnly'

interface User {
  id: string
  email: string
  name: string
  companyName: string | null
  businessType: string | null
  profilePhoto: string | null
  taxId: string | null
  country: string | null
  phone: string | null
  role: string
  roleId: string | null
  permissionRole: {
    id: string
    name: string
    description: string | null
  } | null
  createdAt: string
  updatedAt: string
  _count: {
    quotes: number
    shipments: number
  }
}

interface PermissionRole {
  id: string
  name: string
  description: string | null
  isSystem: boolean
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  SUPPLIER: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  USER: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
}

export default function AdminUsersPage() {
  const { isAdmin, loading: authLoading, token } = useAdminAuth()
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [addPhotoPreview, setAddPhotoPreview] = useState<string | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const addFileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [permissionRoles, setPermissionRoles] = useState<PermissionRole[]>([])
  const [editFormData, setEditFormData] = useState({
    email: '',
    name: '',
    companyName: '',
    businessType: '',
    profilePhoto: '',
    taxId: '',
    country: '',
    phone: '',
    role: 'USER',
    password: '',
    permissionRoleId: '',
  })

  const [addFormData, setAddFormData] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
    businessType: '',
    profilePhoto: '',
    taxId: '',
    country: '',
    phone: '',
    role: 'USER',
    permissionRoleId: '',
  })

  useEffect(() => {
    if (!authLoading && isAdmin && token) {
      fetchUsers()
      fetchPermissionRoles()
    }
  }, [pagination.page, searchTerm, roleFilter, authLoading, isAdmin, token])

  // Cleanup effect to prevent DOM errors
  useEffect(() => {
    setMounted(true)
    return () => {
      // Clean up any pending state updates
      setShowAddModal(false)
      setShowEditModal(false)
      setSelectedUser(null)
      setLoading(false)
      setError('')
      setMounted(false)
    }
  }, [])

  // Close modals on route change
  const pathname = usePathname()
  useEffect(() => {
    setShowAddModal(false)
    setShowEditModal(false)
    setSelectedUser(null)
  }, [pathname])

  // Add keyboard event listener for ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showEditModal) {
          closeEditModal()
        } else if (showAddModal) {
          resetAddForm()
        }
      }
    }

    if (showEditModal || showAddModal) {
      document.addEventListener('keydown', handleEsc)
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [showEditModal, showAddModal])

  const fetchUsers = async () => {
    if (!token) return
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (roleFilter) params.append('role', roleFilter)

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users)
        setPagination(data.pagination)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissionRoles = async () => {
    if (!token) return
    try {
      const response = await fetch('/api/admin/permissions/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPermissionRoles(data.roles || [])
      }
    } catch (err) {
      console.error('Failed to fetch permission roles:', err)
    }
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      email: user.email,
      name: user.name,
      companyName: user.companyName || '',
      businessType: user.businessType || '',
      profilePhoto: user.profilePhoto || '',
      taxId: user.taxId || '',
      country: user.country || '',
      phone: user.phone || '',
      role: user.role,
      password: '', // Don't populate password
      permissionRoleId: user.roleId || '',
    })
    setEditPhotoPreview(user.profilePhoto || null)
    setShowEditModal(true)
  }

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!token) return null
    const formData = new FormData()
    formData.append('file', file)
    try {
      setPhotoUploading(true)
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      const data = await response.json()
      if (response.ok) return data.url
      alert(data.error || 'Upload failed')
      return null
    } catch {
      alert('Network error during upload')
      return null
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleAddPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be less than 5MB'); return }
    const previewUrl = URL.createObjectURL(file)
    setAddPhotoPreview(previewUrl)
    const url = await uploadPhoto(file)
    if (url) {
      setAddFormData(prev => ({ ...prev, profilePhoto: url }))
    }
  }

  const handleEditPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be less than 5MB'); return }
    const previewUrl = URL.createObjectURL(file)
    setEditPhotoPreview(previewUrl)
    const url = await uploadPhoto(file)
    if (url) {
      setEditFormData(prev => ({ ...prev, profilePhoto: url }))
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !token) return

    try {
      // Remove empty password from data
      const updateData: any = { ...editFormData }
      if (!updateData.password) {
        delete updateData.password
      }

      // Update permission role via permissions API if it changed
      if (updateData.permissionRoleId !== selectedUser.roleId) {
        const permResponse = await fetch(`/api/admin/permissions/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            roleId: updateData.permissionRoleId || null,
            customPermissions: []
          }),
        })

        if (!permResponse.ok) {
          const permError = await permResponse.json()
          alert(permError.error || 'Failed to update permission role')
          return
        }
      }

      // Remove permissionRoleId before updating basic user info
      delete updateData.permissionRoleId
      if (!updateData.profilePhoto) delete updateData.profilePhoto

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (response.ok) {
        fetchUsers()
        closeEditModal()
      } else {
        alert(data.error || 'Update failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      const createData: any = { ...addFormData }
      const permissionRoleId = createData.permissionRoleId
      delete createData.permissionRoleId
      if (!createData.profilePhoto) delete createData.profilePhoto

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(createData),
      })

      const data = await response.json()

      if (response.ok) {
        // Assign permission role if selected
        if (permissionRoleId) {
          await fetch(`/api/admin/permissions/users/${data.user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              roleId: permissionRoleId,
              customPermissions: []
            }),
          })
        }

        fetchUsers()
        setShowAddModal(false)
        setAddPhotoPreview(null)
        setAddFormData({
          email: '',
          password: '',
          name: '',
          companyName: '',
          businessType: '',
          profilePhoto: '',
          taxId: '',
          country: '',
          phone: '',
          role: 'USER',
          permissionRoleId: '',
        })
      } else {
        alert(data.error || 'Creation failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`) || !token) return

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        fetchUsers()
      } else {
        alert(data.error || 'Delete failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const resetAddForm = () => {
    setAddPhotoPreview(null)
    setAddFormData({
      email: '',
      password: '',
      name: '',
      companyName: '',
      businessType: '',
      profilePhoto: '',
      taxId: '',
      country: '',
      phone: '',
      role: 'USER',
      permissionRoleId: '',
    })
    setShowAddModal(false)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedUser(null)
    setEditPhotoPreview(null)
    setEditFormData({
      email: '',
      name: '',
      companyName: '',
      businessType: '',
      profilePhoto: '',
      taxId: '',
      country: '',
      phone: '',
      role: 'USER',
      password: '',
      permissionRoleId: '',
    })
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">Authenticating...</p>
        </div>
      </div>
    )
  }

  // Redirect handled by AdminAuthContext
  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage customer accounts and admin users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            <Users size={16} />
            <span>{pagination.total} Total Users</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #1a3a5c, #2563eb)' }}
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or company..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="USER">Users</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
              <p className="text-sm text-gray-500">Loading users...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle size={40} />
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">User</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Company</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Contact</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Permissions</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Activity</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Joined</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {user.profilePhoto ? (
                            <img
                              src={user.profilePhoto}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a3a5c] to-[#2a5a8c] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {getInitials(user.name)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{user.name}</h4>
                            <p className="text-xs text-gray-400">{user.email}</p>
                            {user.taxId && (
                              <p className="text-xs text-blue-600">Tax ID: {user.taxId}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          {user.companyName ? (
                            <>
                              <p className="font-medium text-gray-900">{user.companyName}</p>
                              {user.businessType && (
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                                  {user.businessType}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">No company</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm space-y-1">
                          {user.phone && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Phone size={12} />
                              <span>{user.phone}</span>
                            </div>
                          )}
                          {user.country && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <MapPin size={12} />
                              <span>{user.country}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleColors[user.role as keyof typeof roleColors]?.bg || 'bg-gray-50'} ${roleColors[user.role as keyof typeof roleColors]?.text || 'text-gray-600'} ${roleColors[user.role as keyof typeof roleColors]?.border || 'border-gray-200'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {user.permissionRole ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                            {user.permissionRole.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No permissions</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <p className="text-gray-900">{user._count.quotes} quotes</p>
                          <p className="text-gray-500">{user._count.shipments} shipments</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                            disabled={user.role === 'ADMIN'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Add User Modal */}
      <ClientOnly>
        {mounted && showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => {
            if (e.target === e.currentTarget) resetAddForm()
          }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Add New User</h2>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={addFormData.name}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={addFormData.email}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={addFormData.password}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                {/* Profile Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {addPhotoPreview ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                        <img src={addPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <Camera className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        disabled={photoUploading}
                        className="px-4 py-2 text-sm font-medium text-[#1a3a5c] bg-[#1a3a5c]/10 hover:bg-[#1a3a5c]/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {photoUploading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </span>
                        ) : 'Upload Photo'}
                      </button>
                      {addPhotoPreview && (
                        <button
                          type="button"
                          onClick={() => { setAddPhotoPreview(null); setAddFormData(prev => ({ ...prev, profilePhoto: '' })) }}
                          className="px-4 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      )}
                      <input
                        ref={addFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAddPhotoChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={addFormData.companyName}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={addFormData.businessType}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, businessType: e.target.value }))}
                    >
                      <option value="">Select type</option>
                      <option value="retailer">Retailer</option>
                      <option value="wholesaler">Wholesaler</option>
                      <option value="distributor">Distributor</option>
                      <option value="manufacturer">Manufacturer</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={addFormData.taxId}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={addFormData.country}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={addFormData.role}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="USER">User</option>
                    <option value="SUPPLIER">Supplier</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permission Role
                    <span className="text-xs text-gray-500 ml-2">(Optional - Controls access to admin panel features)</span>
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={addFormData.permissionRoleId}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, permissionRoleId: e.target.value }))}
                  >
                    <option value="">No Permission Role</option>
                    {permissionRoles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.description && `- ${role.description}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetAddForm}
                    className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #1a3a5c, #2563eb)' }}
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </ClientOnly>

      {/* Edit User Modal */}
      <ClientOnly>
        {mounted && showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => {
            if (e.target === e.currentTarget) closeEditModal()
          }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Edit User</h2>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                <div className="flex items-center gap-4">
                  {editPhotoPreview ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                      <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={photoUploading}
                      className="px-4 py-2 text-sm font-medium text-[#1a3a5c] bg-[#1a3a5c]/10 hover:bg-[#1a3a5c]/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {photoUploading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </span>
                      ) : 'Upload Photo'}
                    </button>
                    {editPhotoPreview && (
                      <button
                        type="button"
                        onClick={() => { setEditPhotoPreview(null); setEditFormData(prev => ({ ...prev, profilePhoto: '' })) }}
                        className="px-4 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditPhotoChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.companyName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.businessType}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, businessType: e.target.value }))}
                  >
                    <option value="">Select type</option>
                    <option value="retailer">Retailer</option>
                    <option value="wholesaler">Wholesaler</option>
                    <option value="distributor">Distributor</option>
                    <option value="manufacturer">Manufacturer</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.taxId}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, taxId: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editFormData.country}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="USER">User</option>
                  <option value="SUPPLIER">Supplier</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permission Role
                  <span className="text-xs text-gray-500 ml-2">(Controls access to admin panel features)</span>
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={editFormData.permissionRoleId}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, permissionRoleId: e.target.value }))}
                >
                  <option value="">No Permission Role</option>
                  {permissionRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} {role.description && `- ${role.description}`}
                    </option>
                  ))}
                </select>
                {selectedUser?.permissionRole && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {selectedUser.permissionRole.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
        )}
      </ClientOnly>
    </div>
  )
}