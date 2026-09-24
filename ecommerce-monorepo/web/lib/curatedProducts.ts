import { prisma } from '@/lib/db'
import { getAuthUser, isApprovedWholesaleUser } from '@/lib/auth'
import { sanitizeProductForClient } from '@/lib/utils/productSanitizer'
import { getLocalField, localizeEntity } from '@/lib/utils/localize'

export interface CuratedProductsOptions {
  where?: any
  orderBy?: any
  defaultLimit?: number
}

export async function fetchCuratedProducts(req: Request, options: CuratedProductsOptions = {}) {
  const { searchParams } = new URL(req.url)
  const locale = searchParams.get('locale') || 'en'
  const limitParam = searchParams.get('limit')
  const limit = Math.min(Math.max(parseInt(limitParam || String(options.defaultLimit || 8)) || (options.defaultLimit || 8), 1), 50)

  const whereClause: any = {
    isActive: true,
    ...(options.where || {}),
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
              translations: {
                where: { locale: { in: [locale, 'en'] } },
                select: { locale: true, name: true },
              },
            },
          },
          translations: {
            where: { locale: { in: [locale, 'en'] } },
            select: { locale: true, name: true },
          },
        },
      },
      translations: {
        where: { locale: { in: [locale, 'en'] } },
        select: { locale: true, name: true, description: true },
      },
    },
    orderBy: options.orderBy || [{ createdAt: 'desc' }],
    take: limit,
  })

  // Localize product and category names with fallback
  const localizedProducts = products.map((product: any) => {
    const { name, description } = localizeEntity(
      product.translations,
      locale,
      { name: product.name, description: product.description }
    )
    const category = product.category
      ? {
          ...product.category,
          name: getLocalField(
            product.category.translations,
            locale,
            'name',
            product.category.name
          ),
          parent: product.category.parent
            ? {
                ...product.category.parent,
                name: getLocalField(
                  product.category.parent.translations,
                  locale,
                  'name',
                  product.category.parent.name
                ),
              }
            : null,
        }
      : product.category

    return {
      ...product,
      name,
      description,
      category,
    }
  })

  // Sanitize wholesale fields according to user role
  const currentUser = await getAuthUser(req)
  const canViewWholesale = isApprovedWholesaleUser(currentUser)
  const isAdmin = currentUser?.role === 'ADMIN'

  const safeProducts = localizedProducts.map((p) =>
    sanitizeProductForClient(p, canViewWholesale, isAdmin)
  )

  return safeProducts
}
