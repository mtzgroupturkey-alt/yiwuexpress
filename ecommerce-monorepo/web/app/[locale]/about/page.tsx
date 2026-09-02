import { getTranslations } from 'next-intl/server'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { LocaleLink } from '@/components/LocaleLink'
import { Globe, Award, Users, Target, ShieldCheck, CheckCircle, ArrowRight, MapPin, Clock, TrendingUp, Package } from 'lucide-react'
import { StorySection } from '@/components/home/StorySection'
import { CompanyTimeline } from '@/components/about/CompanyTimeline'
import { ProcessFlow } from '@/components/about/ProcessFlow'
import { ClientLogos } from '@/components/about/ClientLogos'
import { AboutContactCTA } from '@/components/about/AboutContactCTA'
import { getCompanyName } from '@/lib/company'

export default async function AboutPage({
  params,
}: {
  params: { locale: string }
}) {
  const locale = params?.locale || 'en'
  const companyName = await getCompanyName(locale)
  const t = await getTranslations({ locale, namespace: 'About' })

  const achievements = [
    { label: t('achievements.verifiedSuppliers'), value: '2,500+', icon: Users, growth: '+15% YoY' },
    { label: t('achievements.globalDestinations'), value: '180+', icon: Globe, growth: 'New: 12 countries' },
    { label: t('achievements.ordersFulfilled'), value: '1.2M+', icon: Package, growth: '+28% this year' },
    { label: t('achievements.clientRetention'), value: '94%', icon: TrendingUp, growth: 'Industry leading' },
  ]

  const differentiators = [
    {
      title: t('differentiators.marketInsidersTitle'),
      description: t('differentiators.marketInsidersDesc'),
      icon: MapPin,
      metrics: '15+ years local presence'
    },
    {
      title: t('differentiators.qualityAssuranceTitle'),
      description: t('differentiators.qualityAssuranceDesc'),
      icon: ShieldCheck,
      metrics: '99.7% quality approval rate'
    },
    {
      title: t('differentiators.logisticsNetworkTitle'),
      description: t('differentiators.logisticsNetworkDesc'),
      icon: Clock,
      metrics: '12-18 days average delivery'
    },
    {
      title: t('differentiators.transparentPricingTitle'),
      description: t('differentiators.transparentPricingDesc'),
      icon: Target,
      metrics: '100% price transparency'
    },
  ]

  const testimonials = [
    {
      quote: t('testimonials.quote1', { name: companyName }),
      author: "Sarah Chen",
      title: t('testimonials.author1Title'),
      company: "TechStart Solutions"
    },
    {
      quote: t('testimonials.quote2'),
      author: "Michael Rodriguez",
      title: t('testimonials.author2Title'),
      company: "Global Retail Corp"
    }
  ]

  return (
    <SharedLayout 
      pageTitle={t('pageTitle', { name: companyName })}
      pageDescription={t('pageDescription')}
      breadcrumbs={[
        { name: t('breadcrumb'), href: '/about' }
      ]}
    >
      <div className="bg-gray-50">
        {/* Story Section */}
        <StorySection />

        {/* Enhanced Stats Section */}
        <section className="bg-white border-y border-gray-200 py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('stats.title')}</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {t('stats.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {achievements.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <div key={idx} className="text-center group hover:bg-gray-50 rounded-xl p-6 transition-all duration-300">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary-50 text-secondary-500 rounded-lg mb-4 group-hover:bg-secondary-500 group-hover:text-white transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-extrabold text-secondary-500 mb-2">{stat.value}</div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{stat.label}</div>
                    <div className="text-xs text-success font-medium">{stat.growth}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Company Timeline */}
        <CompanyTimeline />

        {/* Mission Section - Enhanced */}
        <section className="container mx-auto px-4 py-20 max-w-4xl">
            <div className="text-center mb-16">
              <span className="text-secondary-500 font-bold tracking-widest text-xs uppercase">{t('mission.badge')}</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-3 mb-6">
                {t('mission.title')}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
                {t('mission.description')}
              </p>
            </div>
          
          {/* Process Flow */}
          <div className="max-w-7xl mx-auto px-4">
            <ProcessFlow />
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="bg-white border-t border-gray-200 py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('differentiators.title')}</h2>
              <p className="text-gray-600 text-lg">
                {t('differentiators.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {differentiators.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} className="group">
                    <div className="flex items-start gap-5">
                      <div className="shrink-0 p-3 rounded-xl bg-secondary-50 text-secondary-500 group-hover:bg-secondary-500 group-hover:text-white transition-all duration-300">
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600 leading-relaxed mb-3">{item.description}</p>
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-500">
                          <CheckCircle className="w-4 h-4" />
                          {item.metrics}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Client Success Stories */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('testimonials.heading')}</h2>
              <p className="text-gray-600">
                {t('testimonials.subheading', { name: companyName })}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {testimonials.map((testimonial, idx) => (
                <div key={idx} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                  <div className="mb-6">
                    <svg className="w-8 h-8 text-primary-300 mb-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                    </svg>
                    <p className="text-gray-700 leading-relaxed italic">"{testimonial.quote}"</p>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.title}</p>
                    <p className="text-sm font-medium text-secondary-500">{testimonial.company}</p>
                  </div>
                </div>
              ))}
            </div>

            <ClientLogos />
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="bg-gradient-primary text-white py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-4xl font-bold mb-6">{t('cta.title')}</h2>
            <p className="text-white/80 mb-10 text-lg max-w-2xl mx-auto">
              {t('cta.subtitle', { name: companyName })}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <LocaleLink href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-secondary-500 px-8 py-4 text-sm font-semibold text-primary-800 transition-all hover:bg-secondary-400 hover:scale-105 shadow-gold"
              >
                {t('cta.getQuote')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </LocaleLink>
              <LocaleLink href="/services"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                {t('cta.exploreServices')}
              </LocaleLink>
            </div>

            <AboutContactCTA />
          </div>
        </section>
      </div>
    </SharedLayout>
  )
}
