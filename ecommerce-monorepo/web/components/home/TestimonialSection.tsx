'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Testimonial {
  id: string
  name: string
  company: string
  role: string
  quote: string
  rating: number
  avatar?: string | null
  image?: string | null
  isFeatured: boolean
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Marcus Vance',
    role: 'CEO & Founder',
    company: 'Vance Goods Co.',
    quote: 'Yiwu Express transformed our supply chain. We used to struggle with sourcing quality control, but their local inspection team ensures every container meets our exact specifications.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&h=400&q=80',
    isFeatured: true
  },
  {
    id: 't2',
    name: 'Elena Rostova',
    role: 'Head of Purchasing',
    company: 'Nordic Retail Group',
    quote: 'Sourcing from Yiwu market has never been this seamless. They act as our local eyes and ears, matching us with verified suppliers and handling the entire logistics process to Europe.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&h=400&q=80',
    isFeatured: true
  },
  {
    id: 't3',
    name: 'David Kojo',
    role: 'E-commerce Brand Owner',
    company: 'Kojo Designs',
    quote: 'Their consolidation services saved us thousands. We source from 8 different suppliers in Yiwu, and Yiwu Express packs everything into one single container for us. Life saver!',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    image: 'https://images.unsplash.com/photo-1553413719-87587f29173f?auto=format&fit=crop&w=600&h=400&q=80',
    isFeatured: true
  },
  {
    id: 't4',
    name: 'Amina Al-Mansoor',
    role: 'Supply Chain Manager',
    company: 'Gulf General Trade',
    quote: 'From contract negotiation to final delivery in Dubai, their agents are professional and responsive. 15 years of market experience really shows in how they handle custom issues.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
    image: null,
    isFeatured: false
  },
  {
    id: 't5',
    name: 'Pierre Dubois',
    role: 'Operations Director',
    company: 'Maison Chic Paris',
    quote: 'Outstanding translation, guiding, and shipment consolidation. Sourcing at Yiwu Futian market was productive because of their highly skilled local agents.',
    rating: 4,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    image: null,
    isFeatured: false
  }
]

export function TestimonialSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState(0) // -1 for left, 1 for right
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const res = await fetch('/api/testimonials')
        const data = await res.json()
        if (data.success && data.data.length > 0) {
          setTestimonials(data.data)
        } else {
          setTestimonials(DEFAULT_TESTIMONIALS)
        }
      } catch (err) {
        console.error('Error loading testimonials:', err)
        setTestimonials(DEFAULT_TESTIMONIALS)
      }
    }
    loadTestimonials()
  }, [])

  const featured = testimonials.filter(t => t.isFeatured)
  const standard = testimonials.filter(t => !t.isFeatured)

  useEffect(() => {
    if (featured.length <= 1 || isPaused) return

    timerRef.current = setInterval(() => {
      handleNext()
    }, 5000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex, featured.length, isPaused])

  const handleNext = () => {
    setDirection(1)
    setCurrentIndex(prev => (prev + 1) % featured.length)
  }

  const handlePrev = () => {
    setDirection(-1)
    setCurrentIndex(prev => (prev - 1 + featured.length) % featured.length)
  }

  if (testimonials.length === 0) return null

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0
    })
  }

  const currentTestimonial = featured[currentIndex] || testimonials[0]

  return (
    <section className="bg-gradient-to-b from-gray-900 to-[#0e2136] text-white py-20 px-4 md:px-8 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            What Our Import Clients Say
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-base md:text-lg">
            Empowering businesses globally with streamlined sourcing and secure shipping from Yiwu Market.
          </p>
        </div>

        {/* Carousel Area */}
        {featured.length > 0 && (
          <div 
            className="relative mb-20 min-h-[400px] flex items-center justify-center"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentTestimonial.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-10 shadow-2xl"
              >
                {/* Image Section */}
                <div className="lg:col-span-5 relative h-64 lg:h-80 w-full rounded-xl overflow-hidden shadow-lg border border-white/5 bg-gray-800">
                  {currentTestimonial.image ? (
                    <img 
                      src={currentTestimonial.image} 
                      alt={currentTestimonial.name} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1a3a5c] to-black flex items-center justify-center">
                      <Quote className="w-20 h-20 text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#c9a84c] shadow bg-gray-700 flex-shrink-0">
                        {currentTestimonial.avatar ? (
                          <img src={currentTestimonial.avatar} alt={currentTestimonial.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-white/50 m-2" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{currentTestimonial.name}</h4>
                        <p className="text-[#c9a84c] text-xs font-semibold">{currentTestimonial.role}, {currentTestimonial.company}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                  <div className="flex items-center gap-0.5 text-[#c9a84c]">
                    {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-[#c9a84c] text-[#c9a84c]" />
                    ))}
                  </div>

                  <div className="relative">
                    <Quote className="w-12 h-12 text-[#c9a84c]/20 absolute -top-6 -left-6 transform rotate-180" />
                    <p className="text-xl md:text-2xl leading-relaxed text-gray-200 font-medium italic relative z-10">
                      "{currentTestimonial.quote}"
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            {featured.length > 1 && (
              <>
                <Button
                  onClick={handlePrev}
                  variant="outline"
                  size="icon"
                  className="absolute left-2 md:-left-6 top-1/2 -translate-y-1/2 bg-gray-800/80 border-white/10 hover:bg-gray-700 text-white rounded-full h-11 w-11 shadow-lg backdrop-blur"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  onClick={handleNext}
                  variant="outline"
                  size="icon"
                  className="absolute right-2 md:-right-6 top-1/2 -translate-y-1/2 bg-gray-800/80 border-white/10 hover:bg-gray-700 text-white rounded-full h-11 w-11 shadow-lg backdrop-blur"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Dots */}
            {featured.length > 1 && (
              <div className="absolute -bottom-10 flex gap-2">
                {featured.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-[#c9a84c]' : 'w-2.5 bg-white/30'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Secondary Static Grid */}
        {standard.length > 0 && (
          <div className="mt-20">
            <h3 className="text-xl font-bold text-gray-300 mb-8 border-b border-white/10 pb-4">
              More success stories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {standard.map(testimonial => (
                <Card key={testimonial.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-0.5 text-[#c9a84c]">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#c9a84c] text-[#c9a84c]" />
                      ))}
                    </div>
                    <p className="text-gray-300 text-sm italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-gray-700 flex-shrink-0">
                        {testimonial.avatar ? (
                          <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-white/50 m-2.5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{testimonial.name}</h4>
                        <p className="text-gray-400 text-[10px]">{testimonial.role}, {testimonial.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
