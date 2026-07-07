import { SharedLayout } from '@/components/layout/SharedLayout'
import { Globe, Award, Users, Target, ShieldCheck, TrendingUp } from 'lucide-react'
import { StorySection } from '@/components/home/StorySection'

export default function AboutPage() {
  const stats = [
    { label: 'Years of Experience', value: '15+' },
    { label: 'Countries Covered', value: '180+' },
    { label: 'Annual Shipments', value: '1.2M+' },
    { label: 'Active Corporate Clients', value: '15,000+' },
  ]

  const values = [
    {
      title: 'Global Connectivity',
      description: 'Bridging markets globally from the heart of Yiwu, China, through reliable supply chain networks.',
      icon: Globe,
    },
    {
      title: 'Uncompromised Integrity',
      description: 'Earning trust through transparent operations, clear pricing agreements, and secure logistics pathways.',
      icon: ShieldCheck,
    },
    {
      title: 'Operational Excellence',
      description: 'Leveraging cutting-edge tracking technology and experienced logistics teams to deliver on time, every time.',
      icon: Award,
    },
    {
      title: 'Customer-Centric Innovation',
      description: 'Continuous refinement of our booking, tracking, and warehousing solutions to match client demands.',
      icon: Target,
    },
  ]

  return (
    <SharedLayout 
      pageTitle="About YIWU EXPRESS"
      pageDescription="Connecting China's primary manufacturing hub with businesses around the globe through reliable, modern logistics"
      breadcrumbs={[
        { name: 'About', href: '/about' }
      ]}
      backgroundImage="/images/about-bg.jpg"
    >
      <div className="bg-gray-50">
        {/* Story Section */}
        <StorySection />

        {/* Stats Section */}
        <section className="bg-white border-y border-gray-200 py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-4xl font-extrabold text-primary-600 mb-2">{stat.value}</div>
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-600">
              The fundamental principles that guide our customer partnerships, operations, and service quality day after day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((val, idx) => {
              const Icon = val.icon
              return (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{val.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{val.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </SharedLayout>
  )
}
