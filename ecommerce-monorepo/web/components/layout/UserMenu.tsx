'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useWishlist } from '@/hooks/useWishlist'
import { useCart } from '@/components/CartContext'
import { User, Heart, Package, Settings, LogOut, ChevronDown, LayoutDashboard, MapPin, Shield, Store, Loader2 } from 'lucide-react'

export function UserMenu() {
  const router = useRouter()
  const { user, logout, isAuthenticated, isLoading, checkAuth } = useAuth()
  const { wishlistCount } = useWishlist()
  const { clearCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  // Check authentication on mount (ONLY ONCE)
  useEffect(() => {
    let mounted = true
    
    const verifyAuth = async () => {
      // Only check if we haven't authenticated yet
      if (!isAuthenticated) {
        await checkAuth()
      }
      if (mounted) {
        setIsHydrated(true)
        setIsChecking(false)
      }
    }
    
    verifyAuth()
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once on mount

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false)
  }, [router])

  const handleLogout = async () => {
    setIsOpen(false)
    clearCart() // Clear cart count immediately
    await logout()
    router.push('/')
    router.refresh()
  }

  // Show loading spinner while checking auth or during hydration
  if (!isHydrated || isChecking || isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  // Show login/register buttons if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-50 rounded-lg transition-colors"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="px-3 py-1.5 text-sm font-medium bg-[#1a3a5c] text-white hover:bg-[#2a5a8c] rounded-lg transition-colors"
        >
          Register
        </Link>
      </div>
    )
  }

  const getRoleIcon = () => {
    if (user.role === 'ADMIN') return <Shield className="w-4 h-4 text-red-500" />
    if (user.role === 'SUPPLIER') return <Store className="w-4 h-4 text-blue-500" />
    return <User className="w-4 h-4 text-gray-500" />
  }

  const getDashboardLink = () => {
    if (user.role === 'ADMIN') return '/admin'
    if (user.role === 'SUPPLIER') return '/dashboard/supplier'
    return '/dashboard'
  }

  const getRoleBadgeColor = () => {
    if (user.role === 'ADMIN') return 'bg-red-100 text-red-600'
    if (user.role === 'SUPPLIER') return 'bg-blue-100 text-blue-600'
    return 'bg-green-100 text-green-600'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const menuItems = [
    {
      href: getDashboardLink(),
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      href: '/dashboard/orders',
      icon: Package,
      label: 'My Orders',
    },
    {
      href: '/dashboard/wishlist',
      icon: Heart,
      label: 'My Wishlist',
      count: wishlistCount || 0,
    },
    {
      href: '/dashboard/profile',
      icon: User,
      label: 'My Profile',
    },
    {
      href: '/dashboard/addresses',
      icon: MapPin,
      label: 'My Addresses',
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      label: 'Settings',
    },
  ]

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20 focus:ring-offset-2"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {/* Avatar with gradient border */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a5c] via-[#2a5a8c] to-[#c9a84c] rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {(user as any).profilePhoto ? (
            <img 
              src={(user as any).profilePhoto}
              alt={user.name}
              className="relative w-9 h-9 rounded-full object-cover shadow-md group-hover:shadow-lg transition-shadow duration-300 border-2 border-white"
            />
          ) : (
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3a5c] to-[#2a5a8c] flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow duration-300">
              <span className="text-sm font-semibold tracking-tight">
                {getInitials(user.name || 'User')}
              </span>
            </div>
          )}
        </div>
        
        {/* User name with animation */}
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-800 max-w-[120px] truncate group-hover:text-[#1a3a5c] transition-colors">
            {user.name}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            {user.role === 'USER' ? 'Customer' : user.role}
          </span>
        </div>
        
        {/* Chevron with animation */}
        <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-[#1a3a5c] transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-72 bg-white shadow-2xl rounded-2xl border border-gray-100/50 py-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          {/* User Info Card */}
          <div className="px-4 py-4 border-b border-gray-100/80 bg-gradient-to-br from-gray-50/50 to-transparent">
            <div className="flex items-start gap-3.5">
              {/* Avatar with glow effect */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a5c] to-[#c9a84c] rounded-full blur-md opacity-30"></div>
                {(user as any).profilePhoto ? (
                  <img 
                    src={(user as any).profilePhoto}
                    alt={user.name}
                    className="relative w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white"
                  />
                ) : (
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#1a3a5c] via-[#2a5a8c] to-[#c9a84c] flex items-center justify-center text-white shadow-lg">
                    <span className="text-base font-bold">
                      {getInitials(user.name || 'User')}
                    </span>
                  </div>
                )}
              </div>
              
              {/* User details */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 truncate mb-0.5">{user.name}</p>
                <p className="text-xs text-gray-500 truncate mb-2">{user.email}</p>
                
                {/* Role badge with icon */}
                <div className="flex items-center gap-1.5">
                  {getRoleIcon()}
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${getRoleBadgeColor()} shadow-sm`}>
                    {user.role === 'USER' ? 'Customer' : user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items with hover effects */}
          <div className="py-2 px-2">
            {menuItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3.5 px-3.5 py-2.5 text-sm text-gray-700 hover:text-[#1a3a5c] hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent rounded-xl transition-all duration-200 relative overflow-hidden"
                onClick={() => setIsOpen(false)}
              >
                {/* Hover background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a5c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                
                {/* Icon with background */}
                <div className="relative z-10 w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#1a3a5c]/10 flex items-center justify-center transition-colors duration-200">
                  <item.icon className="w-4 h-4 text-gray-500 group-hover:text-[#1a3a5c] transition-colors duration-200" />
                </div>
                
                {/* Label */}
                <span className="relative z-10 flex-1 font-medium">{item.label}</span>
                
                {/* Count badge */}
                {'count' in item && item.count > 0 && (
                  <span className="relative z-10 flex items-center justify-center min-w-[22px] h-[22px] bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full px-1.5 text-[10px] font-bold shadow-md">
                    {item.count}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Logout button */}
          <div className="border-t border-gray-100/80 pt-2 px-2 mt-1">
            <button
              onClick={handleLogout}
              className="group flex items-center gap-3.5 w-full px-3.5 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50/80 rounded-xl transition-all duration-200 font-medium"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors duration-200">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left">Logout</span>
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
