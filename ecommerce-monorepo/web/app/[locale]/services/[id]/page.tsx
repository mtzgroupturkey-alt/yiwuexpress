'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { LocaleLink } from '@/components/LocaleLink'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Truck, 
  Shield, 
  Package, 
  Users, 
  Globe, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  ArrowLeft, 
  Calculator, 
  HelpCircle,
  FileText,
  PhoneCall,
  ChevronRight,
  ChevronDown,
  Building2,
  Anchor,
  Plane,
  Warehouse,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Mail,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface ServiceDetail {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  duration?: string
  coverage?: string
  type: string
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ServiceListResponse {
  services: ServiceDetail[]
}

export default function ServiceDetailPage() {
  const t = useTranslations('Services')
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const serviceId = params?.id as string

  const [activeTab, setActiveTab] = useState('overview')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [isRequestingQuote, setIsRequestingQuote] = useState(false)

  // Fetch current service details
  const { data, isLoading, error } = useQuery<{ service: ServiceDetail }>({
    queryKey: ['service', serviceId, locale],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}?locale=${locale}`)
      if (!res.ok) {
        throw new Error('Service not found')
      }
      return res.json()
    },
    enabled: Boolean(serviceId),
  })

  // Fetch complementary services
  const { data: allServicesData } = useQuery<ServiceListResponse>({
    queryKey: ['services-related', locale],
    queryFn: async () => {
      const res = await fetch(`/api/services?limit=4&locale=${locale}`)
      if (!res.ok) return { services: [] }
      return res.json()
    },
  })

  const service = data?.service
  const relatedServices = (allServicesData?.services || []).filter(s => s.id !== serviceId).slice(0, 3)

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'shipping':
        return Truck
      case 'customs':
        return Shield
      case 'warehousing':
        return Package
      case 'sourcing':
        return Users
      default:
        return Globe
    }
  }

  const getServiceColor = (type: string) => {
    switch (type) {
      case 'shipping':
        return {
          badge: 'text-accent-600 bg-accent-50 border-accent-200',
          gradient: 'from-accent-500 to-accent-600',
          accentText: 'text-accent-600'
        }
      case 'customs':
        return {
          badge: 'text-primary-600 bg-primary-50 border-primary-200',
          gradient: 'from-primary-600 to-primary-700',
          accentText: 'text-primary-600'
        }
      case 'warehousing':
        return {
          badge: 'text-secondary-600 bg-secondary-50 border-secondary-200',
          gradient: 'from-secondary-500 to-secondary-600',
          accentText: 'text-secondary-600'
        }
      case 'sourcing':
        return {
          badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          gradient: 'from-emerald-600 to-emerald-700',
          accentText: 'text-emerald-600'
        }
      default:
        return {
          badge: 'text-gray-700 bg-gray-50 border-gray-200',
          gradient: 'from-gray-700 to-gray-800',
          accentText: 'text-gray-700'
        }
    }
  }

  const getServiceLabel = (type: string) => {
    switch (type) {
      case 'shipping':
        return t('card.type.shipping')
      case 'customs':
        return t('card.type.customs')
      case 'warehousing':
        return t('card.type.warehousing')
      case 'sourcing':
        return t('card.type.sourcing')
      default:
        return t('card.type.default')
    }
  }

  const handleRequestQuote = () => {
    setIsRequestingQuote(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push(`/login?redirect=/quotes/new?service=${serviceId}`)
    } else {
      router.push(`/quotes/new?service=${serviceId}`)
    }
  }

  if (isLoading) {
    return (
      <SharedLayout
        pageTitle="Loading Logistics Service..."
        breadcrumbs={[
          { name: t('breadcrumb'), href: '/services' },
          { name: 'Loading...', href: '#' }
        ]}
      >
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-12 w-3/4 rounded-xl" />
              <Skeleton className="h-6 w-1/3 rounded-lg" />
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-80 w-full rounded-2xl" />
              <Skeleton className="h-56 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </SharedLayout>
    )
  }

  if (error || !service) {
    return (
      <SharedLayout
        pageTitle="Service Not Found"
        breadcrumbs={[
          { name: t('breadcrumb'), href: '/services' },
          { name: 'Not Found', href: '#' }
        ]}
      >
        <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
          <div className="bg-white rounded-3xl shadow-brand-lg p-10 border border-gray-100">
            <div className="w-16 h-16 bg-accent-50 text-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent-100">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
            <p className="text-gray-600 mb-8">
              The logistics service you requested does not exist or may have been relocated.
            </p>
            <LocaleLink
              href="/services"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Explore All Services
            </LocaleLink>
          </div>
        </div>
      </SharedLayout>
    )
  }

  const Icon = getServiceIcon(service.type)
  const colors = getServiceColor(service.type)
  const serviceLabel = getServiceLabel(service.type)

  const featureInclusions = [
    {
      title: 'Dedicated Logistics Specialist',
      desc: '1-on-1 freight coordinator managing your cargo from booking to final destination.'
    },
    {
      title: 'Complete Customs Documentation',
      desc: 'Expert preparation of Bill of Lading, Packing List, Commercial Invoice & HS-Code verification.'
    },
    {
      title: 'Milestone & GPS Container Tracking',
      desc: 'Real-time telemetry tracking with proactive notifications at every transit checkpoint.'
    },
    {
      title: 'Port-to-Port & Door-to-Door (DDP/DDU)',
      desc: 'Flexible Incoterms execution matching your supply chain and tax requirements.'
    },
    {
      title: 'Verified China Warehouse Consolidation',
      desc: 'Free 15-day storage and packaging inspection at our Yiwu, Ningbo, and Shenzhen hubs.'
    },
    {
      title: 'Cargo Insurance & Dispute Protection',
      desc: 'Underwritten cargo insurance protecting goods against damage, loss, or inspection delays.'
    }
  ]

  const workflowSteps = [
    {
      num: '01',
      title: 'Request & Instant Quote Formulation',
      desc: 'Submit cargo volume (CBM/Weight), pickup city in China, and destination port. Our team returns a guaranteed rate within 24 hours.',
      icon: FileText
    },
    {
      num: '02',
      title: 'Cargo Pickup & Warehouse Inspection',
      desc: 'Goods are collected directly from your supplier/factory and consolidated at our automated China logistics facility for dimensional audit.',
      icon: Warehouse
    },
    {
      num: '03',
      title: 'Customs Clearance & Vessel Lading',
      desc: 'Our licensed customs brokers clear Chinese export protocols, issue the Ocean/Air Bill of Lading, and secure vessel allocation.',
      icon: Anchor
    },
    {
      num: '04',
      title: 'International Freight & Final Delivery',
      desc: 'Cargo is transported via direct maritime or air routes, cleared through destination customs, and delivered directly to your door.',
      icon: Truck
    }
  ]

  const faqs = [
    {
      q: 'How are the rates and total freight charges calculated?',
      a: 'Freight charges depend on total volumetric weight (CBM vs gross weight), shipping mode (FCL container vs LCL consolidation vs Air Cargo), destination port tariffs, and selected Incoterms (FOB, CIF, or DDP).'
    },
    {
      q: 'Can you consolidate shipments from multiple Chinese factories into one container?',
      a: 'Yes! We specialize in Multi-Supplier Consolidation. We collect goods from different suppliers across Yiwu, Guangzhou, Ningbo, and Shenzhen, consolidate them into a single container in our warehouse, and issue unified customs documentation.'
    },
    {
      q: 'What customs documentation is provided for import clearance?',
      a: 'We provide an authenticated Master & House Bill of Lading (B/L), Certificate of Origin (Form A/Form E/CO), Commercial Invoice, Packing List, and custom inspection certificates as required by destination country customs authorities.'
    },
    {
      q: 'What happens if my shipment experiences weather or customs inspection delays?',
      a: 'Our operations desk operates 24/7. In the event of secondary customs checks or vessel rescheduling, we immediately reroute cargo and provide daily status updates with full insurance coverage.'
    }
  ]

  return (
    <SharedLayout
      pageTitle={service.name}
      pageDescription={service.description || t('card.defaultDescription')}
      breadcrumbs={[
        { name: t('breadcrumb'), href: '/services' },
        { name: service.name, href: `/services/${service.id}` }
      ]}
      backgroundImage="/images/services-bg.jpg"
    >
      <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 py-10">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Top Breadcrumb / Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <LocaleLink
              href="/services"
              className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              {t('breadcrumb')}
            </LocaleLink>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                Live Freight Service Available
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Licensed NVOCC & Customs Broker
              </span>
            </div>
          </div>

          {/* Main Grid: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Main Section (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Header Hero Banner Card */}
              <div className="relative rounded-3xl bg-gradient-primary text-white p-6 sm:p-10 shadow-brand-lg overflow-hidden border border-primary-700">
                {/* Background decorative patterns */}
                <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3.5 py-1 rounded-lg text-xs font-bold bg-white/10 text-white backdrop-blur-md border border-white/20 uppercase tracking-wider">
                      {serviceLabel}
                    </span>
                    <span className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-secondary-500 text-white shadow-sm flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      Premium Enterprise Tier
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    {service.name}
                  </h1>

                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed max-w-2xl">
                    {service.description || t('card.defaultDescription')}
                  </p>

                  {/* Quick Specs Highlight Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 mt-6">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div className="text-[11px] text-gray-300 uppercase tracking-wider font-medium">Transit Speed</div>
                      <div className="text-sm sm:text-base font-bold text-white mt-0.5">{service.duration || 'Fast Track'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div className="text-[11px] text-gray-300 uppercase tracking-wider font-medium">Coverage Area</div>
                      <div className="text-sm sm:text-base font-bold text-white mt-0.5">{service.coverage || 'Global Ports'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div className="text-[11px] text-gray-300 uppercase tracking-wider font-medium">Clearance</div>
                      <div className="text-sm sm:text-base font-bold text-white mt-0.5">24-48h Expedited</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div className="text-[11px] text-gray-300 uppercase tracking-wider font-medium">Starting Rate</div>
                      <div className="text-sm sm:text-base font-bold text-secondary-300 mt-0.5">
                        ${(typeof service.price === 'number' ? service.price : (Number(service.price) || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-gray-100 p-1.5 rounded-2xl w-full grid grid-cols-3 sm:grid-cols-4 h-auto gap-1 border border-gray-200/80">
                  <TabsTrigger value="overview" className="rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="workflow" className="rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all">
                    4-Step Process
                  </TabsTrigger>
                  <TabsTrigger value="routes" className="rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all">
                    Port Network
                  </TabsTrigger>
                  <TabsTrigger value="faqs" className="rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all col-span-3 sm:col-span-1">
                    FAQs
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: Overview */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                  {/* Inclusions Card */}
                  <Card className="border-gray-200/80 shadow-brand rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 pb-4">
                      <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary-500" />
                        Comprehensive Standard Deliverables
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {featureInclusions.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary-200 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Value Proposition Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-brand text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">Direct Carrier Booking</h4>
                      <p className="text-xs text-gray-500">Tier-1 container allocations with zero intermediate brokers.</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-brand text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-secondary-50 text-secondary-600 flex items-center justify-center mx-auto">
                        <Shield className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">Escrow Protection</h4>
                      <p className="text-xs text-gray-500">Secure settlements with full milestone release gates.</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-brand text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <Globe className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">Multi-Lingual Support</h4>
                      <p className="text-xs text-gray-500">Direct coordination in English, Chinese, and Arabic.</p>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: Process Workflow */}
                <TabsContent value="workflow" className="mt-6">
                  <Card className="border-gray-200/80 shadow-brand rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 pb-4">
                      <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-600" />
                        End-to-End Logistics Execution Lifecycle
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8">
                      <div className="relative border-l-2 border-primary-200 ml-4 sm:ml-6 space-y-8 py-2">
                        {workflowSteps.map((step, idx) => {
                          const StepIcon = step.icon
                          return (
                            <div key={idx} className="relative pl-6 sm:pl-8 group">
                              {/* Step circle marker */}
                              <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center ring-4 ring-white shadow-md group-hover:bg-secondary-500 transition-colors">
                                {step.num}
                              </div>
                              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 group-hover:border-primary-200 group-hover:bg-white transition-all duration-200 space-y-2 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <StepIcon className="w-4 h-4 text-primary-600" />
                                  <h3 className="font-bold text-gray-900 text-base">{step.title}</h3>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB 3: China Port Network */}
                <TabsContent value="routes" className="mt-6">
                  <Card className="border-gray-200/80 shadow-brand rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 pb-4">
                      <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Anchor className="w-5 h-5 text-primary-600" />
                        Primary China Logistics Hubs & Seaports
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 space-y-6">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Our integrated logistics network operates dedicated container freight stations (CFS) and customs clearance teams across China's highest-volume trade gateways:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-sm">Yiwu Inland Freight Port</span>
                            <Badge variant="outline" className="text-xs bg-white text-secondary-600 border-secondary-300">Central Hub</Badge>
                          </div>
                          <p className="text-xs text-gray-500">Daily container feeder connections to Ningbo & Shanghai ports.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-sm">Ningbo-Zhoushan Port</span>
                            <Badge variant="outline" className="text-xs bg-white text-primary-600 border-primary-300">Deepwater</Badge>
                          </div>
                          <p className="text-xs text-gray-500">Fast ocean freight to Europe, Mediterranean & Middle East.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-sm">Shanghai Port (Yangshan)</span>
                            <Badge variant="outline" className="text-xs bg-white text-primary-600 border-primary-300">Global</Badge>
                          </div>
                          <p className="text-xs text-gray-500">World's #1 container port with direct transpacific schedules.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-sm">Shenzhen & Guangzhou Hub</span>
                            <Badge variant="outline" className="text-xs bg-white text-primary-600 border-primary-300">South China</Badge>
                          </div>
                          <p className="text-xs text-gray-500">High-speed air express and electronics freight consolidation.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB 4: FAQs */}
                <TabsContent value="faqs" className="mt-6">
                  <Card className="border-gray-200/80 shadow-brand rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 pb-4">
                      <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-primary-600" />
                        Frequently Asked Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 space-y-4">
                      {faqs.map((faq, idx) => {
                        const isExpanded = expandedFaq === idx
                        return (
                          <div 
                            key={idx}
                            className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200"
                          >
                            <button
                              onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                              className="w-full text-left p-4 sm:p-5 bg-gray-50 hover:bg-gray-100 flex items-center justify-between gap-4 font-semibold text-gray-900 text-sm sm:text-base transition-colors"
                            >
                              <span>{faq.q}</span>
                              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180 text-primary-600' : ''}`} />
                            </button>
                            {isExpanded && (
                              <div className="p-4 sm:p-5 bg-white border-t border-gray-100 text-sm text-gray-600 leading-relaxed">
                                {faq.a}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Related Complementary Services */}
              {relatedServices.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Complementary Trade Services</h3>
                    <LocaleLink href="/services" className="text-xs font-semibold text-primary-600 hover:underline">
                      View All Services →
                    </LocaleLink>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {relatedServices.map((rel) => (
                      <LocaleLink
                        key={rel.id}
                        href={`/services/${rel.id}`}
                        className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:shadow-brand-lg hover:border-primary-300 transition-all duration-200 flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                            {getServiceLabel(rel.type)}
                          </span>
                          <h4 className="font-bold text-gray-900 text-sm group-hover:text-primary-600 transition-colors line-clamp-1">
                            {rel.name}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {rel.description || 'Professional global logistics service'}
                          </p>
                        </div>
                        <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between text-xs font-bold text-primary-600">
                          <span>${(typeof rel.price === 'number' ? rel.price : 0).toFixed(2)}</span>
                          <span className="flex items-center">Details <ChevronRight className="w-3 h-3 ml-0.5" /></span>
                        </div>
                      </LocaleLink>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sticky Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Primary Rate & Booking Card */}
              <Card className="border-gray-200 shadow-brand-lg rounded-3xl overflow-hidden bg-white">
                <div className="bg-gradient-primary p-6 text-white text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-500/10 rounded-full blur-2xl" />
                  <p className="text-xs uppercase tracking-widest text-secondary-300 font-bold mb-1">
                    {t('card.startingPrice')}
                  </p>
                  <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    ${(typeof service.price === 'number' ? service.price : (Number(service.price) || 0)).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-300 mt-1.5 font-medium">
                    Guaranteed Rate Lock Available
                  </p>
                </div>

                <CardContent className="p-6 sm:p-7 space-y-4">
                  <Button
                    onClick={handleRequestQuote}
                    disabled={isRequestingQuote}
                    className="w-full bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-6 text-base rounded-xl shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.99]"
                  >
                    {isRequestingQuote ? t('card.requesting') : 'Request Official Quote'}
                  </Button>

                  <LocaleLink
                    href="/calculator"
                    className="w-full inline-flex items-center justify-center px-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm shadow-sm"
                  >
                    <Calculator className="w-4 h-4 mr-2 text-primary-600" />
                    Calculate Estimated Rate
                  </LocaleLink>

                  {/* Trust Badges */}
                  <div className="pt-4 border-t border-gray-100 space-y-2.5">
                    <div className="flex items-center text-xs text-gray-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mr-2.5 flex-shrink-0" />
                      Guaranteed response within 24 hours
                    </div>
                    <div className="flex items-center text-xs text-gray-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mr-2.5 flex-shrink-0" />
                      Zero hidden port or customs fees
                    </div>
                    <div className="flex items-center text-xs text-gray-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mr-2.5 flex-shrink-0" />
                      Official China export tax invoices (FaPiao)
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Specialist Contact Card */}
              <Card className="border-gray-200 shadow-brand rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto border border-primary-100">
                    <PhoneCall className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Speak with a Logistics Specialist</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Need custom container routing, hazardous cargo permits, or warehousing in Yiwu?
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <LocaleLink
                      href="/contact"
                      className="inline-flex items-center justify-center w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                      Contact Trade Desk
                    </LocaleLink>
                  </div>

                  <div className="pt-2 text-[11px] text-gray-400 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Average specialist response time: &lt; 15 mins
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
