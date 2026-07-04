'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Eye, MessageSquare, Download } from 'lucide-react'

interface WholesaleInquiry {
  id: string
  companyName: string
  contactName: string
  email: string
  phone?: string
  status: string
  quantity: number
  targetPrice?: number
  message: string
  createdAt: string
  user?: {
    name?: string
    email: string
    phone?: string
  }
  quotedPrice?: number
  quotedAt?: string
}

export default function AdminWholesalePage() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<WholesaleInquiry[]>([])
  const [filteredInquiries, setFilteredInquiries] = useState<WholesaleInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  useEffect(() => {
    fetchInquiries()
  }, [])

  useEffect(() => {
    filterInquiries()
  }, [inquiries, search, statusFilter])

  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/wholesale')
      const data = await response.json()

      if (data.success) {
        setInquiries(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching wholesale inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterInquiries = () => {
    let filtered = [...inquiries]

    if (statusFilter) {
      filtered = filtered.filter(inquiry => inquiry.status === statusFilter)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(inquiry =>
        inquiry.companyName.toLowerCase().includes(searchLower) ||
        inquiry.contactName.toLowerCase().includes(searchLower) ||
        inquiry.email.toLowerCase().includes(searchLower)
      )
    }

    setFilteredInquiries(filtered)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      reviewing: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-purple-100 text-purple-800',
      negotiating: 'bg-orange-100 text-orange-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      converted: 'bg-teal-100 text-teal-800',
      expired: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const displayInquiries = filteredInquiries.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(filteredInquiries.length / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wholesale Inquiries</h1>
          <p className="text-gray-600">Manage and process wholesale requests</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Inquiries
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {inquiries.filter(i => i.status === 'new').length}
            </div>
            <p className="text-sm text-gray-600">New Inquiries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {inquiries.filter(i => i.status === 'quoted').length}
            </div>
            <p className="text-sm text-gray-600">Quoted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {inquiries.filter(i => i.status === 'negotiating').length}
            </div>
            <p className="text-sm text-gray-600">Negotiating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {inquiries.filter(i => i.status === 'converted').length}
            </div>
            <p className="text-sm text-gray-600">Converted</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by company, contact name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : displayInquiries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No inquiries found</h3>
            <p className="text-gray-600">
              {inquiries.length === 0 
                ? "No wholesale inquiries have been submitted yet"
                : "No inquiries match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Target Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {inquiry.companyName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {inquiry.contactName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {inquiry.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {inquiry.quantity.toLocaleString()} units
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {inquiry.targetPrice ? `$${inquiry.targetPrice.toFixed(2)}` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(inquiry.status)}>
                        {inquiry.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/wholesale/${inquiry.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {displayInquiries.map((inquiry) => (
              <Card key={inquiry.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{inquiry.companyName}</h3>
                      <p className="text-sm text-gray-500">{inquiry.contactName}</p>
                      <p className="text-sm text-gray-500">{inquiry.email}</p>
                    </div>
                    <Badge className={getStatusColor(inquiry.status)}>
                      {inquiry.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Quantity:</span>{' '}
                      {inquiry.quantity.toLocaleString()} units
                    </div>
                    <div>
                      <span className="text-gray-500">Target:</span>{' '}
                      {inquiry.targetPrice ? `$${inquiry.targetPrice.toFixed(2)}` : 'N/A'}
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Date:</span>{' '}
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/admin/wholesale/${inquiry.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
