'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Trash2, Star, MessageSquareQuote, ShieldAlert } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

interface Testimonial {
  id: string
  name: string
  company: string
  role: string
  quote: string
  rating: number
  avatar?: string
  image?: string
  isFeatured: boolean
  createdAt: string
}

export default function AdminTestimonialsPage() {
  const router = useRouter()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/testimonials')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (data.success) {
        setTestimonials(data.data)
      } else {
        setTestimonials(data) // depending on API response format
      }
    } catch (err) {
      setError('Failed to load testimonials')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const handleToggleFeatured = async (id: string) => {
    setActioningId(id)
    const testimonial = testimonials.find(t => t.id === id)
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !testimonial?.isFeatured })
      })
      if (res.ok) {
        setTestimonials(prev => prev.map(t => t.id === id ? { ...t, isFeatured: !t.isFeatured } : t))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActioningId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return
    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setTestimonials(prev => prev.filter(t => t.id !== id))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquareQuote className="w-8 h-8 text-primary-600" />
            Testimonials Moderation
          </h1>
          <p className="text-gray-500 mt-1">Manage and feature customer testimonials</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="text-gray-500 mt-4">Loading testimonials...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : testimonials.length === 0 ? (
        <Card className="text-center py-12 border border-dashed border-gray-300">
          <CardContent>
            <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Testimonials Found</h3>
            <p className="text-gray-500">There are no testimonials available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className={`overflow-hidden border transition-shadow hover:shadow-md ${testimonial.isFeatured ? 'border-primary-300 bg-primary-50/10' : 'border-gray-200'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {testimonial.avatar ? (
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                          {testimonial.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-base">{testimonial.name}</span>
                        {testimonial.isFeatured && (
                          <Badge className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 md:text-right">
                    {testimonial.createdAt && formatDistanceToNow(new Date(testimonial.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>

                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{testimonial.quote}"</p>

                {testimonial.image && (
                  <div className="mb-4">
                    <Image 
                      src={testimonial.image} 
                      alt="Testimonial attachment" 
                      width={200} 
                      height={150} 
                      className="rounded-md object-cover border border-gray-200"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <Button
                    onClick={() => handleToggleFeatured(testimonial.id)}
                    disabled={actioningId === testimonial.id}
                    variant={testimonial.isFeatured ? "outline" : "default"}
                    className={`gap-1 text-xs font-bold ${!testimonial.isFeatured ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'text-primary-700 border-primary-200 hover:bg-primary-50'}`}
                  >
                    <Check className="w-4 h-4" />
                    {testimonial.isFeatured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button
                    onClick={() => handleDelete(testimonial.id)}
                    disabled={actioningId === testimonial.id}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 font-bold gap-1 text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
