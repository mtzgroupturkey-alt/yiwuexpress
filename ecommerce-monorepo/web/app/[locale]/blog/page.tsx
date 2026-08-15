import { SharedLayout } from '@/components/layout/SharedLayout'
import { LocaleLink } from '@/components/LocaleLink'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export const metadata = {
  title: 'Blog',
  description: 'Trade insights, sourcing guides, and logistics tips from our team.',
}

const posts = [
  {
    title: 'The Complete Guide to Choosing Restaurant Cookware',
    excerpt:
      'Learn how to select the perfect cookware for your commercial kitchen. From materials to durability, we cover everything you need to know.',
    image: '/uploads/blog-cookware.jpg',
    category: 'Kitchen Tips',
    date: '2024-01-15',
    readTime: '5 min read',
    href: '/blog/complete-guide-restaurant-cookware',
  },
  {
    title: "Importing from China: A Beginner's Guide",
    excerpt:
      'Navigate the complexities of international trade with our comprehensive guide to importing from China market.',
    image: '/uploads/blog-importing.jpg',
    category: 'Trade Insights',
    date: '2024-01-10',
    readTime: '8 min read',
    href: '/blog/importing-from-china-guide',
  },
  {
    title: 'Top 10 Must-Have Kitchen Tools for 2024',
    excerpt:
      'Discover the essential kitchen tools that every professional chef and home cook needs in their arsenal this year.',
    image: '/uploads/blog-tools.jpg',
    category: 'Product Reviews',
    date: '2024-01-05',
    readTime: '6 min read',
    href: '/blog/top-10-kitchen-tools-2024',
  },
]

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BlogPage() {
  const t = useTranslations('Blog')
  return (
    <SharedLayout
      pageTitle={t('title')}
      pageDescription={t('description')}
      breadcrumbs={[{ name: t('title'), href: '/blog' }]}
    >
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('heading')}</h1>
            <p className="text-gray-600 mt-3">{t('subheading')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <LocaleLink
                key={post.href}
                href={post.href}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 group"
              >
                <div className="aspect-video bg-gradient-to-br from-primary-500 to-primary-800 relative">
                  {post.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                  <span className="absolute top-3 left-3 bg-secondary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(post.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-secondary-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-secondary-500 mt-4">
                    {t('readMore')}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </LocaleLink>
            ))}
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
