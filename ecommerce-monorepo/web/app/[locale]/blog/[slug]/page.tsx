import { SharedLayout } from '@/components/layout/SharedLayout'
import { LocaleLink } from '@/components/LocaleLink'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export const metadata = {
  title: 'Blog Post',
  description: 'Trade insights, sourcing guides, and logistics tips.',
}

const posts: Record<string, { title: string; excerpt: string; category: string; date: string; readTime: string; body: string[] }> = {
  'complete-guide-restaurant-cookware': {
    title: 'The Complete Guide to Choosing Restaurant Cookware',
    excerpt:
      'Learn how to select the perfect cookware for your commercial kitchen. From materials to durability, we cover everything you need to know.',
    category: 'Kitchen Tips',
    date: '2024-01-15',
    readTime: '5 min read',
    body: [
      'Choosing the right cookware is one of the most important decisions for any commercial kitchen. The materials, weight, and construction directly affect cooking performance, food safety, and long-term cost.',
      'Stainless steel remains the workhorse of professional kitchens thanks to its durability and corrosion resistance. Non-stick options reduce oil usage but require careful handling to preserve their coating.',
      'When sourcing cookware at scale, work with verified suppliers who provide material certifications. Our inspection teams verify gauge, finish, and heat distribution before shipment.',
    ],
  },
  'importing-from-china-guide': {
    title: "Importing from China: A Beginner's Guide",
    excerpt:
      'Navigate the complexities of international trade with our comprehensive guide to importing from China market.',
    category: 'Trade Insights',
    date: '2024-01-10',
    readTime: '8 min read',
    body: [
      'Importing from China can unlock significant cost savings, but it comes with logistics, customs, and quality considerations that every buyer should understand before placing an order.',
      'Start by identifying verified suppliers and requesting samples. A local inspection team can confirm specifications and catch defects before goods leave the factory.',
      'Consolidation across multiple suppliers reduces shipping cost and transit time. Our express logistics network delivers approximately 40% faster than industry average.',
    ],
  },
  'top-10-kitchen-tools-2024': {
    title: 'Top 10 Must-Have Kitchen Tools for 2024',
    excerpt:
      'Discover the essential kitchen tools that every professional chef and home cook needs in their arsenal this year.',
    category: 'Product Reviews',
    date: '2024-01-05',
    readTime: '6 min read',
    body: [
      'Every efficient kitchen relies on a core set of tools. In 2024, durability and ergonomics top the list for both professional chefs and home cooks.',
      'From chef knives to digital thermometers, the right tools reduce prep time and improve consistency. Sourcing them through a trusted partner ensures quality and competitive pricing.',
      'We help businesses equip their kitchens with verified, food-safe tools sourced directly from manufacturers.',
    ],
  },
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const t = useTranslations('Blog')
  const post = posts[params.slug]
  const title = post?.title ?? 'Article'
  const category = post?.category ?? 'Insights'
  const date = post?.date ?? '2024-01-01'
  const readTime = post?.readTime ?? '5 min read'
  const body = post?.body ?? [
    'This article is coming soon. In the meantime, explore our other insights or reach out to our team for sourcing guidance.',
  ]

  return (
    <SharedLayout
      pageTitle={title}
      pageDescription={post?.excerpt ?? 'Trade insights, sourcing guides, and logistics tips.'}
      breadcrumbs={[
        { name: t('title'), href: '/blog' },
        { name: title, href: `/blog/${params.slug}` },
      ]}
    >
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <LocaleLink
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-semibold text-secondary-500 hover:text-secondary-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToBlog')}
          </LocaleLink>

          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">
            <span className="inline-block bg-secondary-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h1>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-8">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {readTime}
              </span>
            </div>

            <div className="space-y-5 text-gray-600 leading-relaxed">
              {body.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
