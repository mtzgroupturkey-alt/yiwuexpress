'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Plus, Edit, Trash2, Globe } from 'lucide-react'

interface Country {
  id: string
  code: string
  name: string
  currency: string
  currencySymbol: string
  flag?: string
  deliverySLA?: string
  isActive: boolean
  shippingRates?: Array<{
    id: string
    carrier: string
    serviceType: string
    baseRate: number
    ratePerKg: number
  }>
}

export default function AdminCountriesPage() {
  const router = useRouter()
  const [countries, setCountries] = useState<Country[]>([])
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchCountries()
  }, [])

  useEffect(() => {
    filterCountries()
  }, [countries, search])

  const fetchCountries = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/countries')
      const data = await response.json()

      if (data.success) {
        setCountries(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCountries = () => {
    let filtered = [...countries]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(country =>
        country.name.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase().includes(searchLower) ||
        country.currency.toLowerCase().includes(searchLower)
      )
    }

    setFilteredCountries(filtered)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/countries/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        alert('Country deleted successfully!')
        fetchCountries()
      } else {
        alert(result.error || 'Failed to delete country')
      }
    } catch (error) {
      console.error('Error deleting country:', error)
      alert('Failed to delete country')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Countries</h1>
          <p className="text-gray-600">Manage shipping destinations and configurations</p>
        </div>
        <Button onClick={() => router.push('/admin/countries/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Country
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {countries.length}
            </div>
            <p className="text-sm text-gray-600">Total Countries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {countries.filter(c => c.isActive).length}
            </div>
            <p className="text-sm text-gray-600">Active Countries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {countries.reduce((sum, c) => sum + (c.shippingRates?.length || 0), 0)}
            </div>
            <p className="text-sm text-gray-600">Total Shipping Rates</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, code, or currency..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {search && (
              <Button variant="outline" onClick={() => setSearch('')}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Countries List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredCountries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No countries found</h3>
            <p className="text-gray-600 mb-4">
              {countries.length === 0 
                ? "Get started by adding your first country configuration"
                : "No countries match your search"}
            </p>
            {countries.length === 0 && (
              <Button onClick={() => router.push('/admin/countries/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Country
              </Button>
            )}
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
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Delivery SLA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Shipping Rates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCountries.map((country) => (
                  <tr key={country.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {country.flag && <span className="text-xl">{country.flag}</span>}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {country.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {country.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {country.currencySymbol} {country.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {country.deliverySLA || 'Not set'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">
                        {country.shippingRates?.length || 0} rates
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={country.isActive ? 'success' : 'secondary'}>
                        {country.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/countries/${country.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(country.id, country.name)}
                        disabled={deleting === country.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredCountries.map((country) => (
              <Card key={country.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {country.flag && <span className="text-2xl">{country.flag}</span>}
                      <div>
                        <h3 className="font-semibold text-gray-900">{country.name}</h3>
                        <p className="text-sm text-gray-500">{country.code}</p>
                      </div>
                    </div>
                    <Badge variant={country.isActive ? 'success' : 'secondary'}>
                      {country.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Currency:</span>{' '}
                      <span className="font-medium">{country.currencySymbol} {country.currency}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Rates:</span>{' '}
                      <Badge variant="secondary" className="text-xs">
                        {country.shippingRates?.length || 0}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Delivery SLA:</span>{' '}
                      <span className="font-medium text-xs">{country.deliverySLA || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/admin/countries/${country.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(country.id, country.name)}
                      disabled={deleting === country.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
