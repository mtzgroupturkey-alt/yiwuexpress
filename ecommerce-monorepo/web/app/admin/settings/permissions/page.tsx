'use client'

import { useState, useEffect } from 'react'
import { Shield, Plus, Edit, Trash2, Users, Save, X, Check } from 'lucide-react'

interface Permission {
  id?: string
  resource: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: Permission[]
  _count?: { users: number }
}

interface User {
  id: string
  email: string
  name: string
  companyName: string | null
  roleId: string | null
  permissionRole: Role | null
  customPermissions: Permission[]
}

// Available resources in the admin panel with hierarchy
const RESOURCES = [
  { key: 'dashboard', label: 'Dashboard', level: 0 },
  { key: 'users', label: 'Users Management', level: 0 },
  { key: 'services', label: 'Services', level: 0 },
  { key: 'quotes', label: 'Quotes Management', level: 0 },
  { key: 'quotes_view', label: 'View Quotes', level: 1, parent: 'quotes' },
  { key: 'quotes_approve', label: 'Approve/Reject Quotes', level: 1, parent: 'quotes' },
  { key: 'shipments', label: 'Shipments', level: 0 },
  { key: 'shipments_tracking', label: 'Tracking Management', level: 1, parent: 'shipments' },
  { key: 'settings', label: 'System Settings', level: 0 },
  { key: 'settings_company', label: 'Company Info', level: 1, parent: 'settings' },
  { key: 'settings_general', label: 'General Settings', level: 1, parent: 'settings' },
  { key: 'settings_email', label: 'Email Configuration', level: 1, parent: 'settings' },
  { key: 'permissions', label: 'Permissions', level: 0 },
  { key: 'backup', label: 'Backup & Export', level: 0 },
]

// Get all parent menu keys
const PARENT_MENUS = RESOURCES.filter(r => r.level === 0 && RESOURCES.some(child => child.parent === r.key))
  .map(r => r.key)

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles')
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    fetchRoles()
    fetchUsers()
  }, [])

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/permissions/roles', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRoles(data.roles)
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/permissions/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/permissions/roles/${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        fetchRoles()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete role')
      }
    } catch (error) {
      alert('Failed to delete role')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Permissions Management</h2>
            <p className="text-sm text-gray-500">Manage roles and user access controls</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 inline-flex">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'roles'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Permission Roles
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          User Permissions
        </button>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Create permission roles with default access levels for different user types
            </p>
            <button
              onClick={() => {
                setEditingRole(null)
                setShowRoleModal(true)
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg flex items-center gap-2"
            >
              <Plus size={18} />
              New Role
            </button>
          </div>

          {/* Roles List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{role.name}</h3>
                    {role.description && (
                      <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                    )}
                  </div>
                  {role.isSystem && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      System
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Users size={16} />
                  <span>{role._count?.users || 0} users</span>
                </div>

                <div className="text-xs text-gray-600 mb-4">
                  <p className="font-semibold mb-1">Permissions:</p>
                  <div className="space-y-1">
                    {role.permissions.slice(0, 3).map((perm) => (
                      <div key={perm.resource} className="flex items-center gap-1">
                        <Check size={12} className="text-green-600" />
                        <span>{RESOURCES.find(r => r.key === perm.resource)?.label || perm.resource}</span>
                      </div>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="text-gray-400">+{role.permissions.length - 3} more...</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingRole(role)
                      setShowRoleModal(true)
                    }}
                    className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg flex items-center justify-center gap-2"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  {!role.isSystem && (
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Assign permission roles to users or set custom permissions
          </p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Custom</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{user.companyName || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {user.permissionRole ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                          {user.permissionRole.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No role</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.customPermissions.length > 0 ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                          {user.customPermissions.length} custom
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditingUser(user)
                          setShowUserModal(true)
                        }}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded text-sm"
                      >
                        Edit Permissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <RoleModal
          role={editingRole}
          onClose={() => {
            setShowRoleModal(false)
            setEditingRole(null)
          }}
          onSuccess={() => {
            setShowRoleModal(false)
            setEditingRole(null)
            fetchRoles()
          }}
        />
      )}

      {/* User Modal */}
      {showUserModal && editingUser && (
        <UserPermissionModal
          user={editingUser}
          roles={roles}
          onClose={() => {
            setShowUserModal(false)
            setEditingUser(null)
          }}
          onSuccess={() => {
            setShowUserModal(false)
            setEditingUser(null)
            fetchUsers()
          }}
        />
      )}
    </div>
  )
}

// Role Modal Component
function RoleModal({ 
  role, 
  onClose, 
  onSuccess 
}: { 
  role: Role | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')
  
  // Initialize permissions - merge existing with all resources to ensure all are present
  const [permissions, setPermissions] = useState<Permission[]>(() => {
    if (role?.permissions) {
      // Merge existing permissions with all resources
      return RESOURCES.map(r => {
        const existing = role.permissions.find(p => p.resource === r.key)
        return existing || {
          resource: r.key,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false
        }
      })
    }
    // New role - all unchecked
    return RESOURCES.map(r => ({
      resource: r.key,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }))
  })
  
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Role name is required')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const url = role 
        ? `/api/admin/permissions/roles/${role.id}`
        : '/api/admin/permissions/roles'
      
      const res = await fetch(url, {
        method: role ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description, permissions })
      })

      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save role')
      }
    } catch (error) {
      alert('Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  const togglePermission = (resource: string, type: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    console.log('Toggle permission:', resource, type)
    setPermissions(prev => {
      const updated = prev.map(p => 
        p.resource === resource ? { ...p, [type]: !p[type] } : p
      )
      console.log('Updated permissions:', updated.find(p => p.resource === resource))
      return updated
    })
  }

  const toggleAllPermissions = (type: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    const allChecked = permissions.every(p => p[type])
    setPermissions(prev => 
      prev.map(p => ({ ...p, [type]: !allChecked }))
    )
  }

  const toggleParentPermissions = (parentKey: string, type: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    const childResources = RESOURCES.filter(r => r.parent === parentKey).map(r => r.key)
    const allChildren = [parentKey, ...childResources]
    const allChecked = permissions.filter(p => allChildren.includes(p.resource)).every(p => p[type])
    
    setPermissions(prev => 
      prev.map(p => 
        allChildren.includes(p.resource) ? { ...p, [type]: !allChecked } : p
      )
    )
  }

  const isParentChecked = (parentKey: string, type: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    const childResources = RESOURCES.filter(r => r.parent === parentKey).map(r => r.key)
    const allChildren = [parentKey, ...childResources]
    return permissions.filter(p => allChildren.includes(p.resource)).every(p => p[type])
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {role ? 'Edit Role' : 'Create New Role'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g. Manager, Staff, Viewer"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              placeholder="Brief description of this role"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Default Permissions
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Resource</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      <div className="flex flex-col items-center gap-1">
                        <span>View</span>
                        <input
                          type="checkbox"
                          checked={permissions.every(p => p.canView)}
                          onChange={() => toggleAllPermissions('canView')}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                          title="Toggle all View permissions"
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      <div className="flex flex-col items-center gap-1">
                        <span>Create</span>
                        <input
                          type="checkbox"
                          checked={permissions.every(p => p.canCreate)}
                          onChange={() => toggleAllPermissions('canCreate')}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                          title="Toggle all Create permissions"
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      <div className="flex flex-col items-center gap-1">
                        <span>Edit</span>
                        <input
                          type="checkbox"
                          checked={permissions.every(p => p.canEdit)}
                          onChange={() => toggleAllPermissions('canEdit')}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                          title="Toggle all Edit permissions"
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      <div className="flex flex-col items-center gap-1">
                        <span>Delete</span>
                        <input
                          type="checkbox"
                          checked={permissions.every(p => p.canDelete)}
                          onChange={() => toggleAllPermissions('canDelete')}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                          title="Toggle all Delete permissions"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {RESOURCES.map((resource) => {
                    const perm = permissions.find(p => p.resource === resource.key)
                    // Only parent rows (level 0) with children get special treatment
                    const isParentRow = resource.level === 0 && RESOURCES.some(r => r.parent === resource.key)
                    // Submenu rows are level 1 - they should be individually clickable
                    const isSubmenu = resource.level === 1
                    
                    return (
                      <tr key={resource.key} className={`hover:bg-gray-50 ${isParentRow ? 'bg-purple-50 font-semibold' : ''}`}>
                        <td className={`px-4 py-3 text-sm ${isParentRow ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                          <div className={isSubmenu ? 'pl-6' : ''}>
                            {isSubmenu && <span className="text-gray-400 mr-2">└─</span>}
                            {resource.label}
                          </div>
                        </td>
                        {(['canView', 'canCreate', 'canEdit', 'canDelete'] as const).map((type) => (
                          <td key={type} className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isParentRow ? isParentChecked(resource.key, type) : (perm?.[type] || false)}
                              onChange={() => isParentRow ? toggleParentPermissions(resource.key, type) : togglePermission(resource.key, type)}
                              className={`w-4 h-4 rounded focus:ring-purple-500 cursor-pointer ${isParentRow ? 'text-purple-700' : 'text-purple-600'}`}
                            />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center gap-2"
          >
            {saving ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Role
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// User Permission Modal Component
function UserPermissionModal({ 
  user, 
  roles,
  onClose, 
  onSuccess 
}: { 
  user: User
  roles: Role[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedRoleId, setSelectedRoleId] = useState(user.roleId || '')
  const [useCustom, setUseCustom] = useState(user.customPermissions.length > 0)
  
  // Initialize custom permissions - merge existing with all resources
  const [customPermissions, setCustomPermissions] = useState<Permission[]>(() => {
    if (user.customPermissions.length > 0) {
      // Merge existing permissions with all resources
      return RESOURCES.map(r => {
        const existing = user.customPermissions.find(p => p.resource === r.key)
        return existing || {
          resource: r.key,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false
        }
      })
    }
    // No custom permissions - all unchecked
    return RESOURCES.map(r => ({
      resource: r.key,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }))
  })
  
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/permissions/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roleId: useCustom ? null : (selectedRoleId || null),
          customPermissions: useCustom ? customPermissions : []
        })
      })

      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update permissions')
      }
    } catch (error) {
      alert('Failed to update permissions')
    } finally {
      setSaving(false)
    }
  }

  const togglePermission = (resource: string, type: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    setCustomPermissions(prev => 
      prev.map(p => 
        p.resource === resource ? { ...p, [type]: !p[type] } : p
      )
    )
  }

  const toggleAllPermissions = (type: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    const allChecked = customPermissions.every(p => p[type])
    setCustomPermissions(prev => 
      prev.map(p => ({ ...p, [type]: !allChecked }))
    )
  }

  const toggleParentPermissions = (parentKey: string, type: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    const childResources = RESOURCES.filter(r => r.parent === parentKey).map(r => r.key)
    const allChildren = [parentKey, ...childResources]
    const allChecked = customPermissions.filter(p => allChildren.includes(p.resource)).every(p => p[type])
    
    setCustomPermissions(prev => 
      prev.map(p => 
        allChildren.includes(p.resource) ? { ...p, [type]: !allChecked } : p
      )
    )
  }

  const isParentChecked = (parentKey: string, type: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    const childResources = RESOURCES.filter(r => r.parent === parentKey).map(r => r.key)
    const allChildren = [parentKey, ...childResources]
    return customPermissions.filter(p => allChildren.includes(p.resource)).every(p => p[type])
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Edit User Permissions</h3>
            <p className="text-sm text-gray-500 mt-1">{user.name} ({user.email})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!useCustom}
                onChange={() => setUseCustom(false)}
                className="w-4 h-4 text-purple-600"
              />
              <span className="font-semibold text-gray-900">Assign Permission Role</span>
            </label>

            {!useCustom && (
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">No Role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} {role.description && `- ${role.description}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={useCustom}
                onChange={() => setUseCustom(true)}
                className="w-4 h-4 text-purple-600"
              />
              <span className="font-semibold text-gray-900">Set Custom Permissions</span>
            </label>

            {useCustom && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Resource</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                        <div className="flex flex-col items-center gap-1">
                          <span>View</span>
                          <input
                            type="checkbox"
                            checked={customPermissions.every(p => p.canView)}
                            onChange={() => toggleAllPermissions('canView')}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                            title="Toggle all View permissions"
                          />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                        <div className="flex flex-col items-center gap-1">
                          <span>Create</span>
                          <input
                            type="checkbox"
                            checked={customPermissions.every(p => p.canCreate)}
                            onChange={() => toggleAllPermissions('canCreate')}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                            title="Toggle all Create permissions"
                          />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                        <div className="flex flex-col items-center gap-1">
                          <span>Edit</span>
                          <input
                            type="checkbox"
                            checked={customPermissions.every(p => p.canEdit)}
                            onChange={() => toggleAllPermissions('canEdit')}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                            title="Toggle all Edit permissions"
                          />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                        <div className="flex flex-col items-center gap-1">
                          <span>Delete</span>
                          <input
                            type="checkbox"
                            checked={customPermissions.every(p => p.canDelete)}
                            onChange={() => toggleAllPermissions('canDelete')}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                            title="Toggle all Delete permissions"
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {RESOURCES.map((resource) => {
                      const perm = customPermissions.find(p => p.resource === resource.key)
                      // Only parent rows (level 0) with children get special treatment
                      const isParentRow = resource.level === 0 && RESOURCES.some(r => r.parent === resource.key)
                      // Submenu rows are level 1 - they should be individually clickable
                      const isSubmenu = resource.level === 1
                      
                      return (
                        <tr key={resource.key} className={`hover:bg-gray-50 ${isParentRow ? 'bg-purple-50 font-semibold' : ''}`}>
                          <td className={`px-4 py-3 text-sm ${isParentRow ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                            <div className={isSubmenu ? 'pl-6' : ''}>
                              {isSubmenu && <span className="text-gray-400 mr-2">└─</span>}
                              {resource.label}
                            </div>
                          </td>
                          {(['canView', 'canCreate', 'canEdit', 'canDelete'] as const).map((type) => (
                            <td key={type} className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isParentRow ? isParentChecked(resource.key, type) : (perm?.[type] || false)}
                                onChange={() => isParentRow ? toggleParentPermissions(resource.key, type) : togglePermission(resource.key, type)}
                                className={`w-4 h-4 rounded focus:ring-purple-500 cursor-pointer ${isParentRow ? 'text-purple-700' : 'text-purple-600'}`}
                              />
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center gap-2"
          >
            {saving ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Permissions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
