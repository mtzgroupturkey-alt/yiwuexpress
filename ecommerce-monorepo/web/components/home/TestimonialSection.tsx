'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote, User, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLocale } from 'next-intl'

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

export function TestimonialSection() {
  const locale = useLocale()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const copyMap: Record<string, {
    badge: string
    title: string
    subtitle: string
    moreStories: string
    defaultData: Testimonial[]
  }> = {
    en: {
      badge: 'Client Testimonials',
      title: 'What Our Import Clients Say',
      subtitle: 'Empowering businesses globally with streamlined machinery sourcing, CE/ISO inspection, and secure international shipping from China.',
      moreStories: 'More Client Success Stories',
      defaultData: [
        {
          id: 't1',
          name: 'Marcus Vance',
          role: 'Procurement Director',
          company: 'Vance Industrial Systems Ltd (USA)',
          quote: 'Global Trade transformed our equipment sourcing from China. The 3000W fiber laser cutter arrived in pristine condition, fully CE certified and ready for operation. Outstanding quality assurance and transparent pricing.',
          rating: 5,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
          image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&h=400&q=80',
          isFeatured: true
        },
        {
          id: 't2',
          name: 'Dmitry Sokolov',
          role: 'Chief Technical Officer',
          company: 'Sokolov Heavy Workshop (Russia)',
          quote: 'We regularly source 20V cordless power tool sets and magnetic drills in bulk. Delivery to Moscow took only 16 days with complete DDP customs clearance. Zero hassle with customs paperwork.',
          rating: 5,
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
          image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&h=400&q=80',
          isFeatured: true
        },
        {
          id: 't3',
          name: 'Ahmed Al-Farooq',
          role: 'Managing Partner',
          company: 'Al-Farooq General Trading (UAE)',
          quote: 'Their multi-supplier warehouse consolidation in Yiwu saved us over $12,000 on our last shipment. We collected generators, laser levels, and welding gear into a single 40ft container.',
          rating: 5,
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
          image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&h=400&q=80',
          isFeatured: true
        }
      ]
    },
    ru: {
      badge: 'Отзывы клиентов',
      title: 'Что говорят наши партнеры по импорту',
      subtitle: 'Прямые поставки станков, контроль качества на заводах в Китае и надежная доставка под ключ в РФ и страны СНГ.',
      moreStories: 'Другие отзывы заказчиков',
      defaultData: [
        {
          id: 't1',
          name: 'Маркус Вэнс',
          role: 'Директор по закупкам',
          company: 'Vance Industrial Systems (США)',
          quote: 'Global Trade полностью изменил наш подход к закупке станков из Китая. Лазерный резак мощностью 3000 Вт прибыл в идеальном состоянии со всеми сертификатами. Отличный контроль качества и честные цены.',
          rating: 5,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
          image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&h=400&q=80',
          isFeatured: true
        },
        {
          id: 't2',
          name: 'Дмитрий Соколов',
          role: 'Главный инженер',
          company: 'Соколов Хэви Воркшоп (Россия)',
          quote: 'Регулярно заказываем оптом аккумуляторный инструмент и магнитные станки. Доставка в Москву заняла всего 16 дней с полной таможенной очисткой DDP. Никаких хлопот с оформлением.',
          rating: 5,
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
          image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&h=400&q=80',
          isFeatured: true
        },
        {
          id: 't3',
          name: 'Ахмед Аль-Фарук',
          role: 'Управляющий партнер',
          company: 'Аль-Фарук Дженерал Трейдинг (ОАЭ)',
          quote: 'Складская консолидация в Иу сэкономила нам более 12 000 долларов на прошлой поставке. Мы собрали генераторы, уровни и сварочные аппараты в один 40-футовый контейнер.',
          rating: 5,
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
          image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&h=400&q=80',
          isFeatured: true
        }
      ]
    },
    zh: {
      badge: '全球客户真实评价',
      title: '全球工程采购商真实口碑与评价',
      subtitle: '为全球企业提供中国源头工厂工业机床直采、出厂全检及海运空运一站式双清门到门物流履约服务。',
      moreStories: '更多全球客户采购案例',
      defaultData: [
        {
          id: 't1',
          name: 'Marcus Vance',
          role: '采购总监',
          company: 'Vance工业系统有限公司 (美国)',
          quote: 'Global Trade彻底优化了我们从中国采购工业设备的流程。采购的3000W光纤激光切割机准时安全交付，CE证书齐全，现场安装即可运行。品控极为严谨，价格完全透明！',
          rating: 5,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
          image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&h=400&q=80',
          isFeatured: true
        },
        {
          id: 't2',
          name: 'Dmitry Sokolov',
          role: '首席技术官',
          company: 'Sokolov重型制造工厂 (俄罗斯)',
          quote: '我们定期批量采购20V无刷锂电工具和重型磁座钻。发往莫斯科仅耗时16天，双清包税门到门，完全不需要我们处理繁琐的清关报税手续，非常省心。',
          rating: 5,
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
          image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&h=400&q=80',
          isFeatured: true
        },
        {
          id: 't3',
          name: 'Ahmed Al-Farooq',
          role: '执行合伙人',
          company: 'Al-Farooq通用贸易公司 (阿联酋)',
          quote: '他们在义乌的自营集货仓为我们上一批货物节省了超过12,000美元运费。我们将发电机、激光水平仪和焊机集中拼装进同一个40尺高柜，验货专业，装箱非常紧凑安全！',
          rating: 5,
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
          image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&h=400&q=80',
          isFeatured: true
        }
      ]
    }
  }

  const copy = copyMap[locale] || copyMap.en

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const res = await fetch(`/api/testimonials?locale=${locale}`)
        const data = await res.json()
        if (data.success && data.data.length > 0) {
          setTestimonials(data.data)
        } else {
          setTestimonials(copy.defaultData)
        }
      } catch (err) {
        console.error('Error loading testimonials:', err)
        setTestimonials(copy.defaultData)
      }
    }
    loadTestimonials()
  }, [locale])

  const featured = testimonials.filter(t => t.isFeatured)
  const standard = testimonials.filter(t => !t.isFeatured)

  useEffect(() => {
    if (featured.length <= 1 || isPaused) return

    timerRef.current = setInterval(() => {
      handleNext()
    }, 6000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex, featured.length, isPaused])

  const handleNext = () => {
    setDirection(1)
    setCurrentIndex(prev => (prev + 1) % (featured.length || 1))
  }

  const handlePrev = () => {
    setDirection(-1)
    setCurrentIndex(prev => (prev - 1 + (featured.length || 1)) % (featured.length || 1))
  }

  if (testimonials.length === 0) return null

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
    <section className="bg-gradient-to-b from-gray-900 via-[#0a1628] to-[#070d16] text-white py-20 px-4 md:px-8 overflow-hidden relative border-t border-white/5">
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c9a84c]/15 border border-[#c9a84c]/30 rounded-full text-[#e5c158] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span>{copy.badge}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            {copy.title}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        {/* Carousel Area */}
        {featured.length > 0 && currentTestimonial && (
          <div 
            className="relative mb-16 min-h-[380px] flex items-center justify-center"
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
                className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 md:p-10 shadow-2xl"
              >
                {/* Image Section */}
                <div className="lg:col-span-5 relative h-64 lg:h-80 w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-gray-950">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#c9a84c] shadow bg-gray-700 flex-shrink-0">
                        {currentTestimonial.avatar ? (
                          <img src={currentTestimonial.avatar} alt={currentTestimonial.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-white m-3" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm">{currentTestimonial.name}</h4>
                        <p className="text-gray-300 text-xs">{currentTestimonial.role} - {currentTestimonial.company}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center gap-1 text-[#c9a84c]">
                    {Array.from({ length: currentTestimonial.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-[#c9a84c] text-[#c9a84c]" />
                    ))}
                  </div>

                  <div className="relative">
                    <Quote className="w-12 h-12 text-[#c9a84c]/20 absolute -top-6 -left-6 transform rotate-180" />
                    <p className="text-lg md:text-xl leading-relaxed text-gray-200 font-medium italic relative z-10">
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
              <div className="absolute -bottom-8 flex gap-2">
                {featured.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-[#c9a84c]' : 'w-2 bg-white/30'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Secondary Static Grid */}
        {standard.length > 0 && (
          <div className="mt-16">
            <h3 className="text-lg font-bold text-gray-300 mb-6 border-b border-white/10 pb-3">
              {copy.moreStories}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {standard.map(testimonial => (
                <Card key={testimonial.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-0.5 text-[#c9a84c]">
                      {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
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
