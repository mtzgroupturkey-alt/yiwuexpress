import { prisma } from '@/lib/db'

interface BreadcrumbData {
  backgroundImage: string | null
  mobileImage: string | null
  overlayColor: string
  title: string | null
  subtitle: string | null
}

export async function getBreadcrumbData(
  pageType: 'static' | 'category' | 'product' | 'shop',
  identifier?: string
): Promise<BreadcrumbData> {
  // Default values
  const defaultData: BreadcrumbData = {
    backgroundImage: '/images/default-breadcrumb.jpg',
    mobileImage: null,
    overlayColor: 'rgba(26,58,92,0.6)',
    title: null,
    subtitle: null,
  }

  // 1. Check for specific page setting
  let setting: any = null

  if (pageType === 'static' && identifier) {
    setting = await prisma.breadcrumbSetting.findFirst({
      where: {
        pageType: 'static',
        pageSlug: identifier,
        isActive: true,
      },
    })
  }

  if (pageType === 'category' && identifier) {
    // First check if there's a specific category setting
    setting = await prisma.breadcrumbSetting.findFirst({
      where: {
        pageType: 'category',
        categoryId: identifier,
        isActive: true,
      },
    })
  }

  // 2. If no specific setting, check for shop default
  if (!setting && (pageType === 'category' || pageType === 'product' || pageType === 'shop')) {
    setting = await prisma.breadcrumbSetting.findFirst({
      where: {
        pageType: 'shop_default',
        isActive: true,
      },
    })
  }

  // 3. If still no setting, use default
  if (setting) {
    return {
      backgroundImage: setting.imageUrl || defaultData.backgroundImage,
      mobileImage: setting.mobileImageUrl || null,
      overlayColor: setting.overlayColor || defaultData.overlayColor,
      title: setting.title || defaultData.title,
      subtitle: setting.subtitle || defaultData.subtitle,
    }
  }

  return defaultData
}

export async function getCategoryBreadcrumb(categoryId: string): Promise<BreadcrumbData> {
  // Check if category has specific setting
  const categorySetting = await prisma.breadcrumbSetting.findFirst({
    where: {
      pageType: 'category',
      categoryId,
      isActive: true,
    },
  })

  if (categorySetting) {
    return {
      backgroundImage: categorySetting.imageUrl,
      mobileImage: categorySetting.mobileImageUrl,
      overlayColor: categorySetting.overlayColor || 'rgba(26,58,92,0.6)',
      title: categorySetting.title,
      subtitle: categorySetting.subtitle,
    }
  }

  // Fallback to shop default
  return getBreadcrumbData('shop')
}

// New function for the API to fetch raw setting
export async function getBreadcrumbBackground(params: {
  pageType: 'static' | 'category' | 'shop_default'
  pageSlug?: string
  categoryId?: string
}) {
  const { pageType, pageSlug, categoryId } = params

  let setting: any = null

  if (pageType === 'static' && pageSlug) {
    setting = await prisma.breadcrumbSetting.findFirst({
      where: {
        pageType: 'static',
        pageSlug,
        isActive: true,
      },
    })
  } else if (pageType === 'category' && categoryId) {
    setting = await prisma.breadcrumbSetting.findFirst({
      where: {
        pageType: 'category',
        categoryId,
        isActive: true,
      },
    })
  } else if (pageType === 'shop_default') {
    console.log('[BreadcrumbService] Looking for shop_default setting')
    setting = await prisma.breadcrumbSetting.findFirst({
      where: {
        pageType: 'shop_default',
        isActive: true,
      },
    })
    console.log('[BreadcrumbService] Shop default query result:', setting)
  }

  if (!setting) {
    return null
  }

  return {
    imageUrl: setting.imageUrl,
    mobileImageUrl: setting.mobileImageUrl,
    overlayColor: setting.overlayColor,
    title: setting.title,
    subtitle: setting.subtitle,
  }
}

// New function: Get breadcrumb background with parent hierarchy fallback
export async function getBreadcrumbBackgroundWithParentFallback(categoryId: string) {
  console.log('[BreadcrumbService] Starting parent fallback for category:', categoryId)
  
  // First try the specific category
  let setting = await getBreadcrumbBackground({
    pageType: 'category',
    categoryId
  })
  
  if (setting) {
    console.log('[BreadcrumbService] Found direct category setting')
    return setting
  }
  
  // If no direct setting, look for parent category settings
  console.log('[BreadcrumbService] No direct setting, checking parent hierarchy')
  
  try {
    // Get the category with its parent information
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: true
      }
    })
    
    if (!category) {
      console.log('[BreadcrumbService] Category not found')
      return null
    }
    
    console.log('[BreadcrumbService] Category found:', { id: category.id, name: category.name, parentId: category.parentId })
    
    // If has parent, recursively check parent hierarchy
    if (category.parentId) {
      console.log('[BreadcrumbService] Checking parent category:', category.parentId)
      const parentSetting = await getBreadcrumbBackgroundWithParentFallback(category.parentId)
      
      if (parentSetting) {
        console.log('[BreadcrumbService] Found parent category setting')
        return parentSetting
      }
    }
    
    console.log('[BreadcrumbService] No parent settings found')
    return null
    
  } catch (error) {
    console.error('[BreadcrumbService] Error in parent hierarchy check:', error)
    return null
  }
}
