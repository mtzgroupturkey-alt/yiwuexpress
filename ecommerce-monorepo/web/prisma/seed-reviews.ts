import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SAMPLE_TESTIMONIALS = [
  {
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

async function main() {
  console.log('Seeding testimonials...')
  for (const t of SAMPLE_TESTIMONIALS) {
    await prisma.testimonial.create({
      data: t
    })
  }

  // Get a user and product to link reviews
  const user = await prisma.user.findFirst()
  const product = await prisma.product.findFirst()

  if (user && product) {
    console.log(`Seeding reviews for user ${user.name} and product ${product.name}...`)
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: 5,
        title: 'Outstanding Quality & Bulk Price!',
        comment: 'We imported this product to the UK and the quality control was spot on. Yiwu Express handled the shipping and everything arrived perfectly.',
        isVerifiedPurchase: true,
        isApproved: true,
        helpfulCount: 5,
        replies: {
          create: {
            userId: user.id,
            comment: 'Thank you for your feedback! We are glad we could help streamline your UK shipping process.',
            isAdminReply: true
          }
        }
      }
    })
  }

  console.log('Seeding completed successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
