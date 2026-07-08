/**
 * SHARED LAYOUT TEMPLATE
 * 
 * Copy this template when creating new pages to ensure
 * consistent layout with header, navigation, and footer.
 * 
 * The SharedLayout component automatically includes:
 * - TopBar (contact info, language, currency)
 * - MainHeader (logo, search, cart)
 * - CategoryMenu (navigation links)
 * - PageHero OR HeroSection (depending on page)
 * - Footer
 */

'use client'

import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'

// ============================================
// TEMPLATE 1: Simple Page (No Breadcrumbs)
// ============================================
export function SimplePageTemplate() {
  return (
    <SharedLayout 
      pageTitle="Your Page Title"
      pageDescription="A brief description of your page content"
    >
      <div className="bg-gray-50 py-12">
        <Container maxWidth="2xl">
          {/* Your page content goes here */}
          <h2>Welcome to your page</h2>
        </Container>
      </div>
    </SharedLayout>
  )
}

// ============================================
// TEMPLATE 2: Page with Single Breadcrumb
// ============================================
export function SingleBreadcrumbTemplate() {
  return (
    <SharedLayout 
      pageTitle="About Us"
      pageDescription="Learn about our company and mission"
      breadcrumbs={[
        { name: 'About', href: '/about' }
      ]}
      backgroundImage="/images/breadcrumb-bg.jpg"
    >
      <div className="bg-white py-12">
        <Container maxWidth="2xl" children={<></>}>
          {/* Your content */}
        </Container>
      </div>
    </SharedLayout>
  )
}

// ============================================
// TEMPLATE 3: Page with Multiple Breadcrumbs
// ============================================
export function MultipleBreadcrumbsTemplate() {
  return (
    <SharedLayout 
      pageTitle="Customs Clearance"
      pageDescription="Professional customs clearance services"
      breadcrumbs={[
        { name: 'Services', href: '/services' },
        { name: 'Logistics', href: '/services/logistics' },
        { name: 'Customs Clearance', href: '/services/customs-clearance' }
      ]}
      backgroundImage="/images/services-bg.jpg"
    >
      <div className="bg-gray-50 py-12">
        <Container maxWidth="2xl" children={<></>}>
          {/* Your content */}
        </Container>
      </div>
    </SharedLayout>
  )
}

// ============================================
// TEMPLATE 4: Dynamic Page (Using params)
// ============================================
export function DynamicPageTemplate({ params }: { params: { slug: string } }) {
  // Fetch your data
  const data = {
    title: "Dynamic Page Title",
    description: "Dynamic description",
    category: "Category Name"
  }

  // Build breadcrumbs dynamically
  const breadcrumbs = [
    { name: 'Parent', href: '/parent' },
    { name: data.category, href: `/parent/${data.category}` },
    { name: data.title, href: `/parent/${params.slug}` }
  ]

  return (
    <SharedLayout 
      pageTitle={data.title}
      pageDescription={data.description}
      breadcrumbs={breadcrumbs}
      backgroundImage="/images/dynamic-bg.jpg"
    >
      <div className="bg-white py-12">
        <Container maxWidth="2xl" children={<></>}>
          {/* Your dynamic content */}
          <h2>{data.title}</h2>
        </Container>
      </div>
    </SharedLayout>
  )
}

// ============================================
// TEMPLATE 5: Page with Loading State
// ============================================
export function LoadingStateTemplate() {
  const loading = true // Replace with actual loading state
  const error = null   // Replace with actual error state

  if (loading) {
    return (
      <SharedLayout 
        pageTitle="Loading..."
        pageDescription="Please wait"
        breadcrumbs={[{ name: 'Page', href: '/page' }]}
      >
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </SharedLayout>
    )
  }

  if (error) {
    return (
      <SharedLayout 
        pageTitle="Error"
        pageDescription="Something went wrong"
        breadcrumbs={[{ name: 'Page', href: '/page' }]}
      >
        <div className="py-12">
          <Container maxWidth="2xl" children={<></>}>
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <p className="text-red-800">Error loading page</p>
            </div>
          </Container>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout 
      pageTitle="Success"
      pageDescription="Content loaded successfully"
      breadcrumbs={[{ name: 'Page', href: '/page' }]}
    >
      <div className="bg-gray-50 py-12">
        <Container maxWidth="2xl" children={<></>}>
          {/* Your content */}
        </Container>
      </div>
    </SharedLayout>
  )
}

// ============================================
// TEMPLATE 6: Homepage (Shows Hero)
// ============================================
export function HomepageTemplate() {
  return (
    <SharedLayout showHero={true}>
      {/* Stats Section */}
      <section className="py-12 bg-white">
        <Container maxWidth="2xl" children={<></>}>
          <div>Your homepage content</div>
        </Container>
      </section>

      {/* More sections... */}
    </SharedLayout>
  )
}

// ============================================
// TEMPLATE 7: Listing Page (Products/Blog)
// ============================================
export function ListingPageTemplate() {
  const category = "Cookware" // Replace with actual category
  const totalItems = 45       // Replace with actual count

  return (
    <SharedLayout 
      pageTitle={category}
      pageDescription={`Browse ${totalItems} items in ${category}`}
      breadcrumbs={[
        { name: 'Shop', href: '/products' },
        { name: category, href: `/products?category=${category.toLowerCase()}` }
      ]}
      backgroundImage="/images/category-bg.jpg"
    >
      <div className="bg-gray-50 py-8">
        <Container maxWidth="2xl" children={<></>}>
          {/* Filters and Grid */}
          <div className="grid grid-cols-4 gap-6">
            {/* Your items */}
          </div>
        </Container>
      </div>
    </SharedLayout>
  )
}

// ============================================
// TEMPLATE 8: Detail Page (Product/Post)
// ============================================
export function DetailPageTemplate({ params }: { params: { slug: string } }) {
  const item = {
    name: "Item Name",
    category: { name: "Category", slug: "category" },
    description: "Item description"
  }

  const breadcrumbs = [
    { name: 'Items', href: '/items' },
    { name: item.category.name, href: `/items?category=${item.category.slug}` },
    { name: item.name, href: `/items/${params.slug}` }
  ]

  return (
    <SharedLayout 
      pageTitle={item.name}
      pageDescription={item.description}
      breadcrumbs={breadcrumbs}
      backgroundImage="/images/detail-bg.jpg"
    >
      <div className="bg-gray-50 py-8">
        <Container maxWidth="2xl" children={<></>}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Your detail content */}
          </div>
        </Container>
      </div>
    </SharedLayout>
  )
}

// ============================================
// QUICK REFERENCE
// ============================================

/*

PROPS:
------
children           : React.ReactNode (required) - Your page content
showHero          : boolean (optional) - Show HeroSection (homepage only)
pageTitle         : string (optional) - Page title for PageHero
pageDescription   : string (optional) - Page description
breadcrumbs       : BreadcrumbItem[] (optional) - Navigation trail
backgroundImage   : string (optional) - Background image URL

BREADCRUMB ITEM:
----------------
{
  name: string,  // Display name
  href: string   // Link URL
}

USAGE:
------
1. Import SharedLayout and Container
2. Define breadcrumbs array (if needed)
3. Wrap content in SharedLayout
4. Pass pageTitle, pageDescription, breadcrumbs
5. Add your content inside

EXAMPLE:
--------
<SharedLayout 
  pageTitle="Contact Us"
  pageDescription="Get in touch"
  breadcrumbs={[{ name: 'Contact', href: '/contact' }]}
>
  <div className="py-12">
    <Container maxWidth="2xl" children={<></>}>
      <YourContent />
    </Container>
  </div>
</SharedLayout>

*/
