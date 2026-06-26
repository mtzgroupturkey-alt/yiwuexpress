'use client'

import Link from 'next/link'
import { Calendar, ArrowRight, Clock } from 'lucide-react'
import { Container } from '@/components/ui/Container'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  image?: string
  category: string
  date: string
  readTime: string
  href: string
}

export default function BlogSection() {
  const posts: BlogPost[] = [
    {
      id: '1',
      title: 'The Complete Guide to Choosing Restaurant Cookware',
      excerpt: 'Learn how to select the perfect cookware for your commercial kitchen. From materials to durability, we cover everything you need to know.',
      image: '/uploads/blog-cookware.jpg',
      category: 'Kitchen Tips',
      date: '2024-01-15',
      readTime: '5 min read',
      href: '/blog/complete-guide-restaurant-cookware'
    },
    {
      id: '2',
      title: 'Importing from China: A Beginner\'s Guide',
      excerpt: 'Navigate the complexities of international trade with our comprehensive guide to importing kitchenware from Yiwu Market.',
      image: '/uploads/blog-importing.jpg',
      category: 'Trade Insights',
      date: '2024-01-10',
      readTime: '8 min read',
      href: '/blog/importing-from-china-guide'
    },
    {
      id: '3',
      title: 'Top 10 Must-Have Kitchen Tools for 2024',
      excerpt: 'Discover the essential kitchen tools that every professional chef and home cook needs in their arsenal this year.',
      image: '/uploads/blog-tools.jpg',
      category: 'Product Reviews',
      date: '2024-01-05',
      readTime: '6 min read',
      href: '/blog/top-10-kitchen-tools-2024'
    }
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <section className="py-16 bg-white">
      <Container>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Kitchen Tips & Trade Insights
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Expert advice, industry insights, and helpful guides to help you succeed in your business.
            </p>
          </div>
          
          <Link
            href="/blog"
            className="hidden md:inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
          >
            View All Articles
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={post.href}
              className="group bg-white rounded-xl overflow-hidden shadow-brand hover:shadow-brand-lg transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-gray-200">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                
                {/* Fallback gradient */}
                <div className={`${post.image ? 'hidden' : ''} w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center`}>
                  <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-block px-3 py-1 bg-secondary-500 text-white text-xs font-semibold rounded-full shadow-lg">
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Read More Link */}
                <div className="flex items-center gap-2 text-primary-600 font-semibold group-hover:gap-3 transition-all">
                  <span>Read More</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Link (Mobile) */}
        <div className="text-center mt-10 md:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
          >
            View All Articles
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </Container>
    </section>
  )
}
