'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerSchema, RegisterInput } from '@/lib/validation'
import Navbar from '@/components/navbar'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      // Save token to localStorage
      localStorage.setItem('token', result.token)
      
      // Redirect to home
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Register Business Account</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                }`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Business Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                }`}
                placeholder="you@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                {...register('phone')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                }`}
                placeholder="+1 555 123 4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                }`}
                placeholder="••••••••"
              />
              <p className="mt-1 text-sm text-gray-500">
                Must be at least 8 characters long
              </p>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                {...register('companyName')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.companyName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                }`}
                placeholder="Your Company Ltd."
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
                Business Type
              </label>
              <select
                id="businessType"
                {...register('businessType')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  errors.businessType ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                }`}
              >
                <option value="">Select a business type</option>
                <option value="IMPORTER">Importer</option>
                <option value="EXPORTER">Exporter</option>
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.businessType && (
                <p className="mt-1 text-sm text-red-600">{errors.businessType.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
                Tax ID / Business Registration Number (Optional)
              </label>
              <input
                id="taxId"
                type="text"
                {...register('taxId')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.taxId ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                }`}
                placeholder="Tax ID Number"
              />
              {errors.taxId && (
                <p className="mt-1 text-sm text-red-600">{errors.taxId.message}</p>
              )}
            </div>

            <div className="text-sm text-gray-600 pt-2">
              <p>By creating an account, you agree to our:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}