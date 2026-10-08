'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  MessageSquare,
  Star,
  Check,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  EyeOff,
  Reply,
  ShieldCheck,
  AlertCircle,
  Download,
  CheckSquare,
  Square,
  X,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Send,
  MessageCircle,
  ThumbsUp,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useAdminLocale } from '../contexts/AdminLocaleContext'

interface ReviewReplyUser {
  id?: string
  name: string
  email: string
  role?: string
}

interface ReviewReply {
  id: string
  reviewId: string
  userId: string
  comment: string
  isAdminReply: boolean
  createdAt: string
  user?: ReviewReplyUser
}

interface ReviewUser {
  id?: string
  name: string
  email: string
  profilePhoto?: string | null
  userType?: string
  role?: string
}

interface ReviewProduct {
  id?: string
  name: string
  slug: string
  thumbnail?: string | null
  images?: string[]
}

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  images?: string[]
  isApproved: boolean
  isVerifiedPurchase: boolean
  helpfulCount?: number
  createdAt: string
  user: ReviewUser
  product: ReviewProduct
  replies?: ReviewReply[]
}

export default function AdminReviewsPage() {
  const { dict, locale } = useAdminLocale()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'WITH_IMAGES'>('ALL')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'RATING_HIGH' | 'RATING_LOW'>('NEWEST')

  // Bulk selections
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  // Reply state: reviewId -> string
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  // Lightbox modal for customer review image
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Expanded comment IDs (for long reviews)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  // Fetch reviews from API
  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/reviews')
      if (!res.ok) throw new Error('Failed to fetch reviews')
      const data = await res.json()
      if (data.success) {
        setReviews(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching admin reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Single review approval toggle
  const handleToggleApproval = async (id: string, currentApproved: boolean) => {
    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentApproved }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved: !currentApproved } : r)))
        } else {
          setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved: !currentApproved } : r)))
        }
      }
    } catch (error) {
      console.error('Error toggling approval:', error)
    } finally {
      setActioningId(null)
    }
  }

  // Single review delete
  const handleDelete = async (id: string) => {
    const confirmText = dict.reviews?.deleteConfirm || 'Are you sure you want to delete this review?'
    if (!window.confirm(confirmText)) return
    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id))
        setSelectedIds((prev) => prev.filter((item) => item !== id))
      }
    } catch (error) {
      console.error('Error deleting review:', error)
    } finally {
      setActioningId(null)
    }
  }

  // Submit official reply
  const handleSubmitReply = async (reviewId: string) => {
    if (!replyText.trim()) return
    setSubmittingReply(true)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: replyText.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          setReviews((prev) =>
            prev.map((r) => {
              if (r.id === reviewId) {
                return {
                  ...r,
                  replies: [...(r.replies || []), data.data],
                }
              }
              return r
            })
          )
          setReplyText('')
          setReplyOpenId(null)
        }
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setSubmittingReply(false)
    }
  }

  // Delete official reply
  const handleDeleteReply = async (reviewId: string, replyId: string) => {
    if (!window.confirm('Delete this reply?')) return
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/reply?replyId=${replyId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => {
            if (r.id === reviewId) {
              return {
                ...r,
                replies: (r.replies || []).filter((rep) => rep.id !== replyId),
              }
            }
            return r
          })
        )
      }
    } catch (error) {
      console.error('Error deleting reply:', error)
    }
  }

  // Bulk actions
  const handleBulkAction = async (action: 'APPROVE' | 'UNAPPROVE' | 'DELETE') => {
    if (selectedIds.length === 0) return
    if (action === 'DELETE') {
      const confirmMsg = `Are you sure you want to permanently delete ${selectedIds.length} review(s)?`
      if (!window.confirm(confirmMsg)) return
    }

    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/reviews/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action }),
      })
      if (res.ok) {
        if (action === 'APPROVE') {
          setReviews((prev) => prev.map((r) => (selectedIds.includes(r.id) ? { ...r, isApproved: true } : r)))
        } else if (action === 'UNAPPROVE') {
          setReviews((prev) => prev.map((r) => (selectedIds.includes(r.id) ? { ...r, isApproved: false } : r)))
        } else if (action === 'DELETE') {
          setReviews((prev) => prev.filter((r) => !selectedIds.includes(r.id)))
        }
        setSelectedIds([])
      }
    } catch (error) {
      console.error('Error executing bulk action:', error)
    } finally {
      setBulkLoading(false)
    }
  }

  // KPI calculations
  const totalReviews = reviews.length
  const pendingCount = useMemo(() => reviews.filter((r) => !r.isApproved).length, [reviews])
  const approvedCount = useMemo(() => reviews.filter((r) => r.isApproved).length, [reviews])
  const verifiedCount = useMemo(() => reviews.filter((r) => r.isVerifiedPurchase).length, [reviews])
  const verifiedPercent = totalReviews > 0 ? Math.round((verifiedCount / totalReviews) * 100) : 0

  const averageRating = useMemo(() => {
    if (totalReviews === 0) return 0
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return Number((sum / totalReviews).toFixed(1))
  }, [reviews, totalReviews])

  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating as keyof typeof counts]++
      }
    })
    return counts
  }, [reviews])

  const withPhotosCount = useMemo(() => {
    return reviews.filter((r) => Array.isArray(r.images) && r.images.length > 0).length
  }, [reviews])

  // Filtering and Sorting
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((review) => {
        // Status filter
        if (statusFilter === 'PENDING' && review.isApproved) return false
        if (statusFilter === 'APPROVED' && !review.isApproved) return false
        if (statusFilter === 'WITH_IMAGES' && (!review.images || review.images.length === 0)) return false

        // Rating filter
        if (ratingFilter !== null && review.rating !== ratingFilter) return false

        // Search text
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase().trim()
          const matchUser = review.user?.name?.toLowerCase().includes(q) || review.user?.email?.toLowerCase().includes(q)
          const matchProduct = review.product?.name?.toLowerCase().includes(q) || review.product?.slug?.toLowerCase().includes(q)
          const matchContent = review.title?.toLowerCase().includes(q) || review.comment?.toLowerCase().includes(q)
          if (!matchUser && !matchProduct && !matchContent) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        if (sortBy === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        if (sortBy === 'RATING_HIGH') return b.rating - a.rating
        if (sortBy === 'RATING_LOW') return a.rating - b.rating
        return 0
      })
  }, [reviews, statusFilter, ratingFilter, debouncedSearch, sortBy])

  // Multi-select helpers
  const toggleSelectAll = () => {
    const currentFilteredIds = filteredReviews.map((r) => r.id)
    const allSelected = currentFilteredIds.length > 0 && currentFilteredIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentFilteredIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentFilteredIds])))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  // Export filtered reviews to CSV
  const exportCSV = () => {
    if (filteredReviews.length === 0) return
    const headers = ['ID', 'Date', 'Product', 'Customer Name', 'Customer Email', 'Rating', 'Title', 'Comment', 'Status', 'Verified']
    const rows = filteredReviews.map((r) => [
      r.id,
      new Date(r.createdAt).toISOString(),
      `"${(r.product?.name || '').replace(/"/g, '""')}"`,
      `"${(r.user?.name || '').replace(/"/g, '""')}"`,
      r.user?.email || '',
      r.rating,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.comment || '').replace(/"/g, '""')}"`,
      r.isApproved ? 'APPROVED' : 'PENDING',
      r.isVerifiedPurchase ? 'YES' : 'NO',
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `customer-reviews-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1a3a5c]/10 text-[#1a3a5c] flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6 text-[#1a3a5c]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {dict.reviews?.title || 'Customer Reviews'}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-[#1a3a5c]/10 text-[#1a3a5c] rounded-full">
                  {totalReviews} {dict.reviews?.allReviews || 'Reviews'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {dict.reviews?.subtitle || 'Moderate product ratings and customer feedback'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={fetchReviews}
            className="rounded-xl text-xs font-semibold h-10 px-3.5 border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1.5"
            title={dict.common?.refresh || 'Refresh'}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{dict.common?.refresh || 'Refresh'}</span>
          </Button>

          <Button
            onClick={exportCSV}
            disabled={filteredReviews.length === 0}
            className="bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] hover:from-[#152e4a] hover:to-[#1d4ed8] text-white shadow-md shadow-blue-900/10 rounded-xl px-4 py-2.5 font-bold text-xs inline-flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download size={15} />
            <span>{dict.common?.exportCsv || 'Export CSV'}</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Reviews */}
        <div
          onClick={() => {
            setStatusFilter('ALL')
            setRatingFilter(null)
          }}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            statusFilter === 'ALL' && ratingFilter === null ? 'border-[#1a3a5c] ring-2 ring-[#1a3a5c]/10' : 'border-gray-100'
          } shadow-xs hover:border-gray-300 flex items-center gap-3`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <MessageSquare size={19} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{dict.reviews?.totalReviews || 'Total Reviews'}</p>
            <p className="text-lg font-black text-gray-900">{totalReviews}</p>
          </div>
        </div>

        {/* Pending Moderation */}
        <div
          onClick={() => {
            setStatusFilter('PENDING')
            setRatingFilter(null)
          }}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            statusFilter === 'PENDING' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-gray-100'
          } shadow-xs hover:border-amber-300 flex items-center gap-3`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock size={19} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-gray-500 font-medium">{dict.reviews?.pendingApproval || 'Pending'}</p>
              {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
            </div>
            <p className="text-lg font-black text-amber-600">{pendingCount}</p>
          </div>
        </div>

        {/* Approved */}
        <div
          onClick={() => {
            setStatusFilter('APPROVED')
            setRatingFilter(null)
          }}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            statusFilter === 'APPROVED' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-gray-100'
          } shadow-xs hover:border-emerald-300 flex items-center gap-3`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 size={19} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{dict.reviews?.approvedBadge || 'Approved'}</p>
            <p className="text-lg font-black text-emerald-600">{approvedCount}</p>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold shrink-0">
            <Star size={19} className="fill-yellow-400 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{dict.reviews?.averageRating || 'Average Rating'}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-gray-900">{averageRating}</span>
              <span className="text-xs text-gray-400 font-semibold">/ 5.0</span>
            </div>
          </div>
        </div>

        {/* Verified Buyers */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck size={19} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{dict.reviews?.verifiedBuyers || 'Verified Buyers'}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-purple-700">{verifiedCount}</span>
              <span className="text-xs text-gray-400 font-semibold">({verifiedPercent}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Star Distribution Visual Strip */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            Rating Breakdown & Distribution
          </span>
          {ratingFilter !== null && (
            <button
              onClick={() => setRatingFilter(null)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              Clear rating filter <X size={12} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = starCounts[stars as keyof typeof starCounts]
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
            const isSelected = ratingFilter === stars

            return (
              <button
                key={stars}
                onClick={() => setRatingFilter(isSelected ? null : stars)}
                className={`p-2.5 rounded-xl border transition-all text-left group ${
                  isSelected
                    ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-gray-800 mb-1">
                  <span className="flex items-center gap-1">
                    {stars} <Star size={11} className="fill-amber-400 text-amber-400" />
                  </span>
                  <span className="text-gray-500 text-[11px] font-semibold">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-medium block mt-1">{percentage}%</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filter and Search Station */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {dict.reviews?.allReviews || 'All'} ({totalReviews})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100/70'
              }`}
            >
              {dict.reviews?.pendingApproval || 'Pending'} ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
              }`}
            >
              {dict.reviews?.approvedBadge || 'Approved'} ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('WITH_IMAGES')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'WITH_IMAGES'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100/70'
              }`}
            >
              <ImageIcon size={13} />
              {dict.reviews?.withImages || 'With Photos'} ({withPhotosCount})
            </button>
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20"
            >
              <option value="NEWEST">{dict.reviews?.newest || 'Newest First'}</option>
              <option value="OLDEST">{dict.reviews?.oldest || 'Oldest First'}</option>
              <option value="RATING_HIGH">{dict.reviews?.highestRating || 'Highest Rating'}</option>
              <option value="RATING_LOW">{dict.reviews?.lowestRating || 'Lowest Rating'}</option>
            </select>
          </div>
        </div>

        {/* Search Bar & Multi-Select Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="relative flex-1 max-w-lg">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dict.reviews?.searchPlaceholder || 'Search reviewer, email, product, or keyword...'}
              className="pl-9 pr-8 text-xs rounded-xl h-9 bg-gray-50 border-gray-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="rounded-xl text-xs font-semibold h-9 px-3 border-gray-200 hover:bg-gray-50"
            >
              {filteredReviews.length > 0 && filteredReviews.every((r) => selectedIds.includes(r.id)) ? (
                <>
                  <CheckSquare size={14} className="mr-1.5 text-blue-600" />
                  Deselect All
                </>
              ) : (
                <>
                  <Square size={14} className="mr-1.5 text-gray-400" />
                  Select All
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Bulk Action Sticky Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/80 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full">
                {selectedIds.length} Selected
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-blue-700 hover:underline font-semibold"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleBulkAction('APPROVE')}
                disabled={bulkLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-lg gap-1"
              >
                <Check size={13} />
                {dict.reviews?.bulkApprove || 'Bulk Approve'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('UNAPPROVE')}
                disabled={bulkLoading}
                className="border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold text-xs h-8 rounded-lg gap-1"
              >
                <EyeOff size={13} />
                {dict.reviews?.bulkUnapprove || 'Bulk Unapprove'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('DELETE')}
                disabled={bulkLoading}
                className="border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold text-xs h-8 rounded-lg gap-1"
              >
                <Trash2 size={13} />
                {dict.reviews?.bulkDelete || 'Bulk Delete'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Review List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-xs">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a3a5c] mx-auto" />
          <p className="text-gray-500 font-semibold text-xs mt-4">{dict.common?.loading || 'Loading customer reviews...'}</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <Card className="text-center py-16 border border-dashed border-gray-200 rounded-3xl shadow-none">
          <CardContent className="space-y-3">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">{dict.common?.noData || 'No reviews found'}</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {debouncedSearch || statusFilter !== 'ALL' || ratingFilter !== null
                ? 'No reviews match your current filters. Try resetting search or status filters.'
                : 'Customer ratings and written reviews will appear here once submitted.'}
            </p>
            {(debouncedSearch || statusFilter !== 'ALL' || ratingFilter !== null) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('ALL')
                  setRatingFilter(null)
                }}
                className="rounded-xl text-xs font-semibold mt-2"
              >
                Reset All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const isSelected = selectedIds.includes(review.id)
            const isReplying = replyOpenId === review.id
            const isExpanded = !!expandedIds[review.id]
            const isLongComment = review.comment && review.comment.length > 280
            const displayComment = isLongComment && !isExpanded ? review.comment.slice(0, 280) + '...' : review.comment
            const userInitial = (review.user?.name || review.user?.email || 'U').charAt(0).toUpperCase()
            const repliesList = review.replies || []

            return (
              <Card
                key={review.id}
                className={`overflow-hidden transition-all duration-200 border rounded-2xl shadow-xs ${
                  isSelected
                    ? 'border-blue-400 ring-2 ring-blue-100 bg-blue-50/10'
                    : review.isApproved
                    ? 'border-gray-200 bg-white hover:border-gray-300'
                    : 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
                }`}
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Top Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelectOne(review.id)}
                        className="mt-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                        title="Select review"
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-blue-600" />
                        ) : (
                          <Square size={18} className="text-gray-300 hover:text-gray-400" />
                        )}
                      </button>

                      {/* Customer Avatar & Meta */}
                      <div className="flex items-center gap-3">
                        {review.user?.profilePhoto ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden relative border border-gray-100 shrink-0">
                            <Image
                              src={review.user.profilePhoto}
                              alt={review.user.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                            {userInitial}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">{review.user?.name || 'Anonymous Customer'}</span>
                            <span className="text-xs text-gray-400">({review.user?.email || 'No email'})</span>
                            {review.isVerifiedPurchase && (
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 font-bold text-[10px] px-2 py-0">
                                <ShieldCheck size={11} className="mr-0.5 inline" />
                                {dict.reviews?.verifiedPurchase || 'Verified Purchase'}
                              </Badge>
                            )}
                            {review.isApproved ? (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-0">
                                {dict.reviews?.approvedBadge || 'Approved'}
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-2 py-0">
                                {dict.reviews?.pendingApproval || 'Pending Approval'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock size={11} />
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            <span className="text-gray-300">•</span>
                            <span>{format(new Date(review.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Product Micro-card Pill */}
                    <div className="sm:self-start bg-gray-50/80 border border-gray-200/80 rounded-xl p-2 px-3 flex items-center gap-2.5 max-w-sm">
                      {review.product?.thumbnail || review.product?.images?.[0] ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden relative bg-white border border-gray-200 shrink-0">
                          <Image
                            src={review.product.thumbnail || review.product.images?.[0] || ''}
                            alt={review.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-400 flex items-center justify-center shrink-0">
                          <ImageIcon size={14} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{dict.reviews?.product || 'Product'}</p>
                        <p className="text-xs font-bold text-gray-800 truncate" title={review.product?.name}>
                          {review.product?.name}
                        </p>
                      </div>
                      <Link
                        href={`/products/${review.product?.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 p-1 rounded-md hover:bg-white shrink-0 transition-colors"
                        title="View product storefront page"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>

                  {/* Rating Stars & Title */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-black text-gray-700">{review.rating}.0</span>
                      {review.helpfulCount !== undefined && review.helpfulCount > 0 && (
                        <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 ml-2">
                          <ThumbsUp size={11} className="text-gray-400" />
                          {review.helpfulCount} helpful votes
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-gray-900 text-sm sm:text-base mt-1">{review.title}</h4>
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {displayComment}
                    </p>
                    {isLongComment && (
                      <button
                        onClick={() => toggleExpanded(review.id)}
                        className="text-xs font-bold text-blue-600 hover:underline self-start flex items-center gap-0.5"
                      >
                        {isExpanded ? (
                          <>
                            Read Less <ChevronUp size={12} />
                          </>
                        ) : (
                          <>
                            Read More <ChevronDown size={12} />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Customer Uploaded Photo Gallery */}
                  {Array.isArray(review.images) && review.images.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <ImageIcon size={12} /> Customer Photos ({review.images.length})
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {review.images.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            onClick={() => setLightboxImage(imgUrl)}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden relative border border-gray-200 bg-gray-50 cursor-zoom-in hover:opacity-90 transition-opacity shrink-0 shadow-2xs"
                          >
                            <Image src={imgUrl} alt={`Review photo ${idx + 1}`} fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Existing Replies List */}
                  {repliesList.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <MessageCircle size={12} /> {dict.reviews?.replies || 'Replies'} ({repliesList.length})
                      </span>
                      <div className="space-y-2 pl-3 border-l-2 border-blue-400">
                        {repliesList.map((reply) => (
                          <div key={reply.id} className="bg-gray-50/80 rounded-xl p-3 space-y-1 border border-gray-100">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {reply.isAdminReply && (
                                  <Badge className="bg-blue-600 text-white font-bold text-[9px] px-1.5 py-0">
                                    {dict.reviews?.adminReply || 'Official Reply'}
                                  </Badge>
                                )}
                                <span className="text-xs font-bold text-gray-800">{reply.user?.name || 'Administrator'}</span>
                                <span className="text-[10px] text-gray-400">
                                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteReply(review.id, reply.id)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors"
                                title={dict.reviews?.deleteReply || 'Delete Reply'}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed">{reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline Reply Editor Drawer */}
                  {isReplying && (
                    <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                          <Reply size={13} className="text-blue-600" />
                          {dict.reviews?.adminReply || 'Official Store Reply'}
                        </span>
                        <button
                          onClick={() => {
                            setReplyOpenId(null)
                            setReplyText('')
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={dict.reviews?.replyPlaceholder || 'Write an official store response to this review...'}
                        className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyOpenId(null)
                            setReplyText('')
                          }}
                          className="text-xs h-7 rounded-lg"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitReply(review.id)}
                          disabled={submittingReply || !replyText.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-7 rounded-lg gap-1"
                        >
                          <Send size={11} className={submittingReply ? 'animate-spin' : ''} />
                          {dict.reviews?.sendReply || 'Send Reply'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {/* Approve / Unapprove Toggle */}
                      {review.isApproved ? (
                        <Button
                          onClick={() => handleToggleApproval(review.id, true)}
                          disabled={actioningId === review.id}
                          variant="outline"
                          size="sm"
                          className="border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100 font-bold gap-1 text-xs h-8 rounded-xl"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          {dict.reviews?.unapproveReview || 'Unapprove'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleToggleApproval(review.id, false)}
                          disabled={actioningId === review.id}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 text-xs h-8 rounded-xl shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {dict.reviews?.approveReview || 'Approve Review'}
                        </Button>
                      )}

                      {/* Reply Button */}
                      <Button
                        onClick={() => {
                          if (isReplying) {
                            setReplyOpenId(null)
                          } else {
                            setReplyOpenId(review.id)
                            setReplyText('')
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold gap-1 text-xs h-8 rounded-xl"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        {dict.reviews?.reply || 'Reply'}
                      </Button>
                    </div>

                    {/* Delete Review */}
                    <Button
                      onClick={() => handleDelete(review.id)}
                      disabled={actioningId === review.id}
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold gap-1 text-xs h-8 rounded-xl ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {dict.reviews?.deleteReview || 'Delete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Lightbox Modal for Customer Uploaded Images */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full h-[80vh] flex items-center justify-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1"
            >
              <X size={24} />
            </button>
            <div className="relative w-full h-full">
              <Image
                src={lightboxImage}
                alt="Enlarged review photo"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
