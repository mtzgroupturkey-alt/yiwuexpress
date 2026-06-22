'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Package, 
  FileText, 
  Ship, 
  Calculator,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface DashboardStats {
  totalQuotes: number
  activeShipments: number
  completedShipments: number
  pendingQuotes: number
}

interface RecentActivity {
  id: string
  type: 'quote' | 'shipment'
  title: string
  status: string
  date: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    // If user is admin, redirect to admin dashboard
    if (parsedUser.role === 'admin') {
      router.push('/admin')
      return
    }

    // Load dashboard data
    loadDashboardData(parsedUser.id)
  }, [router])

  const loadDashboardData = async (userId: string) => {
    try {
      // Load user stats
      const statsResponse = await fetch(`/api/dashboard/stats?userId=${userId}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load recent activity
      const activityResponse = await fetch(`/api/dashboard/activity?userId=${userId}`)
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Request Quote',
      description: 'Get shipping quotes for your packages',
      icon: FileText,
      href: '/quotes',
      color: 'bg-blue-500'
    },
    {
      title: 'Track Shipment',
      description: 'Track your existing shipments',
      icon: Ship,
      href: '/track',
      color: 'bg-green-500'
    },
    {
      title: 'Calculator',
      description: 'Calculate shipping costs',
      icon: Calculator,
      href: '/calculator',
      color: 'bg-purple-500'
    },
    {
      title: 'My Shipments',
      description: 'View all your shipments',
      icon: Package,
      href: '/shipments',
      color: 'bg-orange-500'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'in_transit':
        return <Ship className="w-4 h-4 text-blue-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/profile')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('user')
                  router.push('/login')
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalQuotes}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Shipments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeShipments}</p>
                </div>
                <Ship className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedShipments}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Quotes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingQuotes}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => router.push(action.href)}
                  className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`${action.color} p-3 rounded-lg`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white rounded-lg shadow-sm border">
              {recentActivity.length > 0 ? (
                <div className="divide-y">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(activity.status)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.type} · {activity.date}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : activity.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start by requesting a quote or creating a shipment
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}