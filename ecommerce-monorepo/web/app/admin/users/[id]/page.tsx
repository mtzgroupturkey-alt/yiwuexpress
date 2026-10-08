'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Users, UserCheck, Shield, ShieldCheck, ShieldAlert, Award, Search, RefreshCw,
  ChevronRight, ArrowLeft, Mail, Phone, MapPin, Building, Calendar,
  CreditCard, FileText, ShoppingBag, ExternalLink, CheckCircle2,
  XCircle, Clock, AlertTriangle, Edit3, Trash2, Key, Check,
  Download, Eye, Lock, Globe, Building2, Copy, FileCheck, Layers,
  ZoomIn, ZoomOut, RotateCw, Loader2, RefreshCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'
import ClientOnly from '@/components/ClientOnly'

interface UserDetail {
  id: string
  email: string
  name: string
  companyName: string | null
  businessType: string | null
  taxId: string | null
  country: string | null
  phone: string | null
  profilePhoto: string | null
  role: 'USER' | 'SUPPLIER' | 'ADMIN'
  roleId: string | null
  permissionRole: {
    id: string
    name: string
    description: string | null
  } | null
  isActive: boolean
  isVerified: boolean
  userType: 'RETAIL' | 'WHOLESALE' | 'BOTH'
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DOCUMENTS_REQUIRED'
  verificationNotes: string | null
  verifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  supplierProfile: {
    id: string
    companyName: string
    businessType: string | null
    taxId: string | null
  } | null
  verificationDocs: Array<{
    id: string
    type: string
    fileName: string
    fileSize: number
    fileUrl: string
    status: string
    notes: string | null
    uploadedAt: string
  }>
  addresses: Array<{
    id: string
    label: string | null
    fullName: string
    phone: string
    company: string | null
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string | null
    postalCode: string
    country: string
    isDefault: boolean
  }>
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    mode: string
    paymentStatus: string
    paymentMethod: string
    total: number
    currency: string
    createdAt: string
    _count: {
      items: number
    }
  }>
  productQuotes: Array<{
    id: string
    quoteNumber: string
    status: string
    currency: string
    subtotal: number | null
    shippingCost: number | null
    totalAmount: number | null
    createdAt: string
  }>
  _count: {
    orders: number
    quotes: number
    productQuotes: number
    addresses: number
    verificationDocs: number
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const { isAdmin, loading: authLoading } = useAdminAuth()
  const { dict, locale } = useAdminLocale()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserDetail | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'quotes' | 'verification' | 'security'>('overview')

  // Edit User State
  const [showEditModal, setShowEditModal] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    companyName: '',
    businessType: '',
    taxId: '',
    role: 'USER' as 'USER' | 'SUPPLIER' | 'ADMIN',
    userType: 'RETAIL' as 'RETAIL' | 'WHOLESALE' | 'BOTH',
    isActive: true,
  })

  // Verification State
  const [verificationModal, setVerificationModal] = useState(false)
  const [targetStatus, setTargetStatus] = useState<'APPROVED' | 'REJECTED' | 'DOCUMENTS_REQUIRED'>('APPROVED')
  const [verificationNotes, setVerificationNotes] = useState('')
  const [processingVerification, setProcessingVerification] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<UserDetail['verificationDocs'][0] | null>(null)
  const [docZoom, setDocZoom] = useState(1)
  const [docRotation, setDocRotation] = useState(0)
  const [docImgLoading, setDocImgLoading] = useState(true)

  const openDocPreview = (doc: UserDetail['verificationDocs'][0]) => {
    setDocZoom(1)
    setDocRotation(0)
    setDocImgLoading(true)
    setPreviewDoc(doc)
  }

  const getDocDisplayUrl = (doc?: { id?: string; fileName?: string; fileUrl?: string } | null) => {
    if (!doc) return '#'
    if (doc.fileUrl && (doc.fileUrl.startsWith('/uploads/') || doc.fileUrl.startsWith('/api/uploads/'))) {
      return doc.fileUrl
    }
    if (doc.fileName) {
      return `/uploads/licenses/${doc.fileName}`
    }
    if (doc.id) {
      return `/api/admin/licenses/${doc.id}`
    }
    return '#'
  }

  // Security State
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  const fetchUser = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.user) {
        setUser(data.user)
        setEditForm({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          country: data.user.country || '',
          companyName: data.user.companyName || '',
          businessType: data.user.businessType || '',
          taxId: data.user.taxId || '',
          role: data.user.role || 'USER',
          userType: data.user.userType || 'RETAIL',
          isActive: data.user.isActive ?? true,
        })
        setVerificationNotes(data.user.verificationNotes || '')
        setError('')
      } else {
        setError(data.error || 'Failed to load user profile')
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching user profile')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchUser()
    }
  }, [fetchUser, authLoading, isAdmin])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const formatCurrency = (val: number, cur = 'USD') => {
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: cur || 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculate Lifetime Value
  const totalLtv = user?.orders?.reduce((sum, o) => {
    return sum + (o.paymentStatus === 'PAID' ? o.total : 0)
  }, 0) || 0

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (res.ok) {
        setShowEditModal(false)
        fetchUser()
      } else {
        alert(data.error || 'Failed to update user profile')
      }
    } catch (err: any) {
      alert('Error updating user profile')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleUpdateVerification = async (status: 'APPROVED' | 'REJECTED' | 'DOCUMENTS_REQUIRED') => {
    setProcessingVerification(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          verificationStatus: status,
          verificationNotes: verificationNotes,
          // When approving, ensure user is set to WHOLESALE or BOTH
          ...(status === 'APPROVED' && user?.userType === 'RETAIL' ? { userType: 'WHOLESALE' } : {}),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setVerificationModal(false)
        fetchUser()
      } else {
        alert(data.error || 'Failed to update verification status')
      }
    } catch (err: any) {
      alert('Error updating verification status')
    } finally {
      setProcessingVerification(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('Password successfully reset')
        setNewPassword('')
      } else {
        alert(data.error || 'Failed to reset password')
      }
    } catch (err) {
      alert('Error resetting password')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleToggleActive = async () => {
    if (!user) return
    const nextState = !user.isActive
    if (!confirm(`Are you sure you want to ${nextState ? 'activate' : 'deactivate'} this user account?`)) return
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: nextState }),
      })
      const data = await res.json()
      if (res.ok) {
        fetchUser()
      } else {
        alert(data.error || 'Failed to toggle account status')
      }
    } catch (err) {
      alert('Error toggling account status')
    }
  }

  if (authLoading || (loading && !user)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin border-t-blue-600" />
          <p className="text-sm font-medium text-gray-500">Loading customer profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-xs">
          <ArrowLeft size={14} /> Back
        </Button>
        <Card className="rounded-2xl border-rose-200 bg-rose-50/50 p-8 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">User Not Found</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            {error || 'The requested customer profile could not be located in the database.'}
          </p>
          <div className="pt-2">
            <Link href="/admin/customers">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs">
                Return to Customer List
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 pb-20">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="rounded-xl gap-1.5 text-xs border-gray-200"
          >
            <ArrowLeft size={14} />
            Back
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/admin/customers" className="hover:text-gray-700 transition-colors">
              Customers
            </Link>
            <ChevronRight size={12} />
            <span className="font-semibold text-gray-800 truncate max-w-[200px]">{user.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUser}
            disabled={loading}
            className="rounded-xl gap-1.5 text-xs border-gray-200"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowEditModal(true)}
            className="rounded-xl gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <Edit3 size={14} />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Main Profile Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 shadow-xs"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center text-white text-2xl font-black shadow-xs">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{user.name}</h1>

                {/* Status Badges */}
                <Badge className={user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}>
                  {user.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                </Badge>

                <Badge className={
                  user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  user.role === 'SUPPLIER' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }>
                  {user.role}
                </Badge>

                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">
                  {user.userType}
                </Badge>

                {/* B2B Verification Badge */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  user.verificationStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  user.verificationStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  user.verificationStatus === 'DOCUMENTS_REQUIRED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  user.verificationStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  {user.verificationStatus === 'APPROVED' ? <CheckCircle2 size={12} /> :
                   user.verificationStatus === 'PENDING' ? <Clock size={12} /> :
                   <FileText size={12} />}
                  B2B {user.verificationStatus}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Mail size={13} className="text-gray-400" />
                  <a href={`mailto:${user.email}`} className="hover:text-blue-600 transition-colors">
                    {user.email}
                  </a>
                </span>

                {user.phone && (
                  <span className="flex items-center gap-1.5 font-medium text-gray-700">
                    <Phone size={13} className="text-gray-400" />
                    <a href={`tel:${user.phone}`} className="hover:text-blue-600 transition-colors">
                      {user.phone}
                    </a>
                  </span>
                )}

                {user.country && (
                  <span className="flex items-center gap-1.5">
                    <Globe size={13} className="text-gray-400" />
                    {user.country}
                  </span>
                )}

                <button
                  onClick={() => copyToClipboard(user.id)}
                  className="flex items-center gap-1 font-mono text-[11px] text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 px-2 py-0.5 rounded-md"
                  title="Click to copy ID"
                >
                  <Copy size={11} />
                  <span>ID: {user.id.slice(0, 12)}...</span>
                  {copiedId && <span className="text-emerald-600 font-sans font-bold text-[10px]">Copied!</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Quick B2B Action Button */}
          <div className="flex items-center gap-2">
            {user.verificationStatus !== 'APPROVED' ? (
              <Button
                onClick={() => {
                  setTargetStatus('APPROVED')
                  setVerificationModal(true)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5 shadow-xs font-bold"
              >
                <CheckCircle2 size={14} />
                Approve B2B Wholesale
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setTargetStatus('DOCUMENTS_REQUIRED')
                  setVerificationModal(true)
                }}
                className="text-amber-700 border-amber-300 hover:bg-amber-50 rounded-xl text-xs gap-1.5 font-semibold"
              >
                <FileText size={14} />
                Manage Verification
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleToggleActive}
              className={`rounded-xl text-xs font-semibold ${
                user.isActive
                  ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                  : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
              }`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-gray-200/80 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Lifetime Spend (LTV)</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(totalLtv)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Paid orders total</div>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Total Orders</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{user._count.orders || 0}</div>
          <div className="text-[11px] text-blue-600/70 mt-0.5">Direct retail/wholesale orders</div>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Wholesale Quotes (RFQ)</div>
          <div className="text-2xl font-black text-purple-700 mt-1">{user._count.productQuotes || user._count.quotes || 0}</div>
          <div className="text-[11px] text-purple-600/70 mt-0.5">Formal quote submissions</div>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Member Since</div>
          <div className="text-lg font-black text-gray-900 mt-1 truncate">
            {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Last Login: {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-semibold text-gray-500">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent hover:text-gray-800'
          }`}
        >
          <Building2 size={16} />
          Overview & Business
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent hover:text-gray-800'
          }`}
        >
          <ShoppingBag size={16} />
          Orders ({user.orders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'quotes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent hover:text-gray-800'
          }`}
        >
          <FileText size={16} />
          Wholesale Quotes ({user.productQuotes?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'verification'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent hover:text-gray-800'
          }`}
        >
          <FileCheck size={16} />
          B2B Verification ({user.verificationDocs?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent hover:text-gray-800'
          }`}
        >
          <Lock size={16} />
          Security & Access
        </button>
      </div>

      {/* TAB 1: OVERVIEW & BUSINESS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company & B2B Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border-gray-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Business & Enterprise Credentials
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowEditModal(true)} className="text-xs text-blue-600">
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Company Name</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{user.companyName || 'Not Provided'}</p>
                  </div>

                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Business Structure / Type</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5 capitalize">{user.businessType || 'Not Provided'}</p>
                  </div>

                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tax ID / VAT / UNP</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5 font-mono">{user.taxId || 'Not Provided'}</p>
                  </div>

                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Purchasing Channel Mode</span>
                    <p className="text-sm font-bold text-indigo-700 mt-0.5">{user.userType} Buyer</p>
                  </div>
                </div>

                {user.verificationNotes && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <span className="font-bold">Verification Note: </span>
                    {user.verificationNotes}
                  </div>
                )}

                {user.verificationDocs && user.verificationDocs.length > 0 && (
                  <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-blue-600" />
                        Uploaded Business License & Credentials ({user.verificationDocs.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('verification')}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 transition-colors"
                      >
                        Manage in Verification Tab &rarr;
                      </button>
                    </div>
                    <div className="space-y-2">
                      {user.verificationDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 shadow-2xs hover:border-blue-300 transition-colors">
                          <div className="flex items-center gap-3 truncate pr-2">
                            {/* Clickable Photo Thumbnail */}
                            <div
                              onClick={() => openDocPreview(doc)}
                              className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group/thumb hover:border-blue-500 transition-colors shadow-2xs"
                              title="Click to view photo in modal"
                            >
                              {!doc.fileName.toLowerCase().endsWith('.pdf') ? (
                                <img
                                  src={getDocDisplayUrl(doc)}
                                  alt={doc.fileName}
                                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `/api/admin/licenses/${doc.id}`
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-600">
                                  <FileText size={20} />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 flex items-center justify-center transition-colors">
                                <Eye size={16} className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow" />
                              </div>
                            </div>

                            <div className="truncate">
                              <p 
                                onClick={() => openDocPreview(doc)}
                                className="text-xs font-bold text-gray-900 truncate font-mono hover:text-blue-600 cursor-pointer transition-colors"
                                title="Click to view photo in modal"
                              >
                                {doc.fileName}
                              </p>
                              <p className="text-[10px] text-gray-400 capitalize">{doc.type.replace(/_/g, ' ')} • {(doc.fileSize / 1024).toFixed(0)} KB • {doc.status}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => openDocPreview(doc)}
                              className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 shadow-2xs font-bold"
                            >
                              <Eye size={13} />
                              View Document
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Delivery Addresses */}
            <Card className="rounded-2xl border-gray-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Saved Delivery Addresses ({user.addresses?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {(!user.addresses || user.addresses.length === 0) ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No delivery addresses on file.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.addresses.map((addr) => (
                      <div key={addr.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{addr.fullName}</span>
                          {addr.isDefault && (
                            <Badge className="bg-blue-100 text-blue-700 text-[10px]">DEFAULT</Badge>
                          )}
                        </div>
                        {addr.company && <p className="text-gray-500 font-medium">{addr.company}</p>}
                        <p className="text-gray-700">{addr.addressLine1} {addr.addressLine2 || ''}</p>
                        <p className="text-gray-700">{addr.city}, {addr.state || ''} {addr.postalCode}</p>
                        <p className="font-semibold text-gray-900">{addr.country}</p>
                        <p className="text-gray-500 pt-1">{addr.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account Metadata & Contact Info Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-gray-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-base font-bold text-gray-900">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-400">Account ID</span>
                  <span className="font-mono text-gray-800 truncate max-w-[150px]">{user.id}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-400">System Role</span>
                  <span className="font-bold text-gray-800">{user.role}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-400">Permission Role</span>
                  <span className="font-bold text-purple-700">{user.permissionRole?.name || 'Default'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-400">Email Verified</span>
                  <span className={user.isVerified ? 'text-emerald-600 font-bold' : 'text-gray-500'}>
                    {user.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-400">Registered</span>
                  <span className="text-gray-800">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-400">Last Active</span>
                  <span className="text-gray-800">{formatDate(user.lastLoginAt)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-400">Last Profile Update</span>
                  <span className="text-gray-800">{formatDate(user.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="rounded-2xl border-gray-200/80 p-5 space-y-3">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">Customer Support</span>
              <a
                href={`mailto:${user.email}?subject=Support regarding your account at Global Trade`}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors"
              >
                <Mail size={14} /> Send Email Notice
              </a>
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                >
                  <Phone size={14} /> Call Customer
                </a>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <Card className="rounded-2xl border-gray-200/80 overflow-hidden shadow-xs">
          <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Customer Order History</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">All direct retail and wholesale cart orders placed by this user.</p>
            </div>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
              {user.orders?.length || 0} Total Orders
            </Badge>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {(!user.orders || user.orders.length === 0) ? (
              <div className="py-12 text-center text-gray-400 text-xs">No orders have been placed by this customer yet.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Fulfillment</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {user.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={o.mode === 'WHOLESALE' ? 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]' : 'bg-gray-100 text-gray-700 text-[10px]'}>
                          {o.mode}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {o._count.items}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                          o.paymentStatus === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800">{o.status}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-900">
                        {formatCurrency(o.total, o.currency)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/orders/${o.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600 hover:text-blue-800 gap-1 text-[11px]">
                            View <ExternalLink size={12} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: QUOTES (RFQ) */}
      {activeTab === 'quotes' && (
        <Card className="rounded-2xl border-gray-200/80 overflow-hidden shadow-xs">
          <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Wholesale Quotations & RFQs</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">B2B product inquiries submitted by this user requiring custom quotations.</p>
            </div>
            <Badge className="bg-purple-50 text-purple-700 border-purple-200">
              {user.productQuotes?.length || 0} Submissions
            </Badge>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {(!user.productQuotes || user.productQuotes.length === 0) ? (
              <div className="py-12 text-center text-gray-400 text-xs">No wholesale quotations submitted by this customer.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Quote #</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Quoted Freight</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {user.productQuotes.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-purple-600">
                        {q.quoteNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                          {q.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-700">
                        {q.subtotal != null ? formatCurrency(q.subtotal, q.currency) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-700">
                        {q.shippingCost != null ? formatCurrency(q.shippingCost, q.currency) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-900">
                        {q.totalAmount != null ? formatCurrency(q.totalAmount, q.currency) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/quotes/${q.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-purple-600 hover:text-purple-800 gap-1 text-[11px]">
                            Review <ExternalLink size={12} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: B2B VERIFICATION DOCUMENTS */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-gray-200/80 shadow-xs">
            <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-600" />
                  B2B Wholesale Verification Documents
                </CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  Business license certificates, tax registration, and official company credentials.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setTargetStatus('APPROVED')
                    setVerificationModal(true)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5"
                >
                  <CheckCircle2 size={13} /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTargetStatus('REJECTED')
                    setVerificationModal(true)
                  }}
                  className="text-rose-600 hover:bg-rose-50 border-rose-200 rounded-xl text-xs gap-1.5"
                >
                  <XCircle size={13} /> Reject
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {(!user.verificationDocs || user.verificationDocs.length === 0) ? (
                <div className="py-10 text-center space-y-3">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400">No verification documents have been uploaded by this customer.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTargetStatus('DOCUMENTS_REQUIRED')
                      setVerificationModal(true)
                    }}
                    className="rounded-xl text-xs"
                  >
                    Request Documents from Customer
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.verificationDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl gap-3 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        {/* Clickable Photo Thumbnail */}
                        <div
                          onClick={() => openDocPreview(doc)}
                          className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group/thumb hover:ring-2 hover:ring-blue-500 transition-all shadow-2xs"
                          title="Click to view photo in modal"
                        >
                          {!doc.fileName.toLowerCase().endsWith('.pdf') ? (
                            <img
                              src={getDocDisplayUrl(doc)}
                              alt={doc.fileName}
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `/api/admin/licenses/${doc.id}`
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-600">
                              <FileText size={24} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 flex items-center justify-center transition-colors">
                            <Eye size={18} className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow" />
                          </div>
                        </div>

                        <div>
                          <h4 
                            onClick={() => openDocPreview(doc)}
                            className="text-xs font-bold text-gray-900 font-mono hover:text-blue-600 cursor-pointer transition-colors"
                            title="Click to view photo in modal"
                          >
                            {doc.fileName}
                          </h4>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                            <span className="capitalize">{doc.type.replace(/_/g, ' ')}</span>
                            <span>•</span>
                            <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                            <span>•</span>
                            <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={
                          doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          doc.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }>
                          {doc.status}
                        </Badge>

                        <Button
                          size="sm"
                          onClick={() => openDocPreview(doc)}
                          className="h-8 px-3 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs"
                        >
                          <Eye size={13} />
                          View Document
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: SECURITY & ACCESS */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Password Reset Card */}
          <Card className="rounded-2xl border-gray-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                Administrative Password Reset
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-gray-500">
                Directly update this user password. The user will be able to log in with this new password immediately.
              </p>
              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    New Password (Min 8 Characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Enter strong password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={savingPassword || !newPassword}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs gap-1.5 font-bold"
                >
                  <Lock size={13} />
                  {savingPassword ? 'Resetting Password...' : 'Save New Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Status Card */}
          <Card className="rounded-2xl border-gray-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-600" />
                Account Status & Access Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <div className="font-bold text-gray-900 text-xs">Login Access</div>
                  <div className="text-[11px] text-gray-500">Controls whether user can authenticate into the storefront.</div>
                </div>
                <Badge className={user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}>
                  {user.isActive ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <Button
                variant="outline"
                onClick={handleToggleActive}
                className={`w-full rounded-xl text-xs font-bold ${
                  user.isActive
                    ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                    : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                {user.isActive ? 'Deactivate Customer Account' : 'Activate Customer Account'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EDIT USER PROFILE MODAL */}
      <ClientOnly>
        {showEditModal && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs"
            onClick={() => setShowEditModal(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-black text-gray-900">Edit Customer Profile</h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={editForm.country}
                      onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* B2B Fields */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                  <span className="font-bold text-gray-900 text-[11px] block">Company Credentials</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={editForm.companyName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, companyName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                        Business Type
                      </label>
                      <select
                        value={editForm.businessType}
                        onChange={(e) => setEditForm(prev => ({ ...prev, businessType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                      >
                        <option value="">Select structure...</option>
                        <option value="retailer">Retailer</option>
                        <option value="wholesaler">Wholesaler</option>
                        <option value="distributor">Distributor</option>
                        <option value="manufacturer">Manufacturer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Tax ID / VAT Number
                    </label>
                    <input
                      type="text"
                      value={editForm.taxId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, taxId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Role & User Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      System Role
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                    >
                      <option value="USER">USER</option>
                      <option value="SUPPLIER">SUPPLIER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Customer Tier / Mode
                    </label>
                    <select
                      value={editForm.userType}
                      onChange={(e) => setEditForm(prev => ({ ...prev, userType: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold text-indigo-700"
                    >
                      <option value="RETAIL">RETAIL (B2C)</option>
                      <option value="WHOLESALE">WHOLESALE (B2B)</option>
                      <option value="BOTH">BOTH (Hybrid)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingEdit}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </ClientOnly>

      {/* B2B VERIFICATION ACTION MODAL */}
      <ClientOnly>
        {verificationModal && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs"
            onClick={() => setVerificationModal(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Update B2B Verification
                </h3>
                <button onClick={() => setVerificationModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Attached Document Summary in Decision Modal */}
                {user.verificationDocs && user.verificationDocs.length > 0 && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                    <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                      Attached B2B License Document
                    </span>
                    {user.verificationDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-blue-100 shadow-2xs">
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          {!doc.fileName.toLowerCase().endsWith('.pdf') ? (
                            <img
                              src={getDocDisplayUrl(doc)}
                              alt={doc.fileName}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setVerificationModal(false)
                                openDocPreview(doc)
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `/api/admin/licenses/${doc.id}`
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                              <FileText size={18} />
                            </div>
                          )}
                          <div className="truncate">
                            <p 
                              className="text-xs font-bold text-gray-900 truncate font-mono hover:text-blue-600 cursor-pointer"
                              onClick={() => {
                                setVerificationModal(false)
                                openDocPreview(doc)
                              }}
                            >
                              {doc.fileName}
                            </p>
                            <p className="text-[10px] text-gray-400 capitalize">{doc.type.replace(/_/g, ' ')} • {(doc.fileSize / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => {
                            setVerificationModal(false)
                            openDocPreview(doc)
                          }}
                          className="h-7 px-2.5 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-1"
                        >
                          <Eye size={12} />
                          View Photo
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    Select Verification Decision
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold"
                  >
                    <option value="APPROVED">APPROVED (Grants Full Wholesale Access)</option>
                    <option value="DOCUMENTS_REQUIRED">DOCUMENTS REQUIRED (Prompt User for Docs)</option>
                    <option value="REJECTED">REJECTED (Decline B2B Application)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    Admin Notes / Email Reason
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter message or justification sent to customer..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    This note is saved and included in the automated B2B status email notification.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setVerificationModal(false)}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleUpdateVerification(targetStatus)}
                    disabled={processingVerification}
                    className={`rounded-xl text-xs font-bold text-white ${
                      targetStatus === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      targetStatus === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700' :
                      'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {processingVerification ? 'Processing...' : `Confirm ${targetStatus}`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ClientOnly>

      {/* DOCUMENT PREVIEW MODAL / PHOTO LIGHTBOX */}
      <ClientOnly>
        {previewDoc && (
          <div
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 backdrop-blur-sm"
            onClick={() => setPreviewDoc(null)}
          >
            <div
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl max-h-[96vh] flex flex-col gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3 truncate pr-2">
                  <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20">
                    <FileCheck size={20} />
                  </div>
                  <div className="truncate">
                    <h3 className="text-sm sm:text-base font-black text-white font-mono truncate">{previewDoc.fileName}</h3>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {previewDoc.type.replace(/_/g, ' ')} • {(previewDoc.fileSize / 1024).toFixed(0)} KB • Uploaded {formatDate(previewDoc.uploadedAt)}
                    </p>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {!previewDoc.fileName.toLowerCase().endsWith('.pdf') && (
                    <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setDocZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut size={15} />
                      </button>
                      <span className="text-[11px] font-mono font-bold px-1.5 text-slate-300 min-w-[42px] text-center">
                        {Math.round(docZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setDocZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocRotation((r) => (r + 90) % 360)}
                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Rotate 90 degrees"
                      >
                        <RotateCw size={15} />
                      </button>
                      {(docZoom !== 1 || docRotation !== 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            setDocZoom(1)
                            setDocRotation(0)
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Reset Zoom & Rotation"
                        >
                          <RefreshCcw size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  <a
                    href={getDocDisplayUrl(previewDoc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors shadow-2xs"
                    title="Open in new window"
                  >
                    <ExternalLink size={13} />
                    <span className="hidden sm:inline">New Tab</span>
                  </a>

                  <a
                    href={getDocDisplayUrl(previewDoc)}
                    download={previewDoc.fileName}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors shadow-2xs"
                    title="Download document file"
                  >
                    <Download size={13} />
                    <span className="hidden sm:inline">Download</span>
                  </a>

                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Close"
                  >
                    <XCircle size={22} />
                  </button>
                </div>
              </div>

              {/* Photo Display Canvas */}
              <div className="relative flex-1 min-h-[360px] max-h-[66vh] flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden p-2 sm:p-4 border border-slate-800">
                {docImgLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 z-10">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                )}

                {previewDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={getDocDisplayUrl(previewDoc)}
                    className="w-full h-[62vh] rounded-xl border-0 bg-white"
                    title="License PDF"
                    onLoad={() => setDocImgLoading(false)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                    <img
                      src={getDocDisplayUrl(previewDoc)}
                      alt={previewDoc.fileName}
                      onLoad={() => setDocImgLoading(false)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (!target.dataset.triedUploads) {
                          target.dataset.triedUploads = '1'
                          target.src = `/api/uploads/licenses/${previewDoc.fileName}`
                        } else if (!target.dataset.triedAdmin) {
                          target.dataset.triedAdmin = '1'
                          target.src = `/api/admin/licenses/${previewDoc.id}`
                        }
                        setDocImgLoading(false)
                      }}
                      style={{
                        transform: `scale(${docZoom}) rotate(${docRotation}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease-out',
                      }}
                      className="max-h-[62vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800 bg-black/40 select-none"
                    />
                  </div>
                )}
              </div>

              {/* Footer Decision & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Verification Status:</span>
                  <Badge className={
                    previewDoc.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    previewDoc.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                    'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }>
                    {previewDoc.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setTargetStatus('APPROVED')
                      setVerificationModal(true)
                      setPreviewDoc(null)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5 font-bold shadow-xs"
                  >
                    <CheckCircle2 size={13} />
                    Approve Application
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTargetStatus('REJECTED')
                      setVerificationModal(true)
                      setPreviewDoc(null)
                    }}
                    className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 rounded-xl text-xs gap-1.5 font-semibold bg-transparent"
                  >
                    <XCircle size={13} />
                    Reject Application
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewDoc(null)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs bg-transparent"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ClientOnly>
    </div>
  )
}
