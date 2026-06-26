import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCategories() {
  console.log('🌱 Seeding categories...')

  try {
    const categories = [
      // Main Categories
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Clothing, apparel, and fashion items',
        level: 1,
        displayOrder: 1,
        menuOrder: 1,
        isActive: true,
        showInMenu: true,
        isFeatured: true,
      },
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices, gadgets, and accessories',
        level: 1,
        displayOrder: 2,
        menuOrder: 2,
        isActive: true,
        showInMenu: true,
        isFeatured: true,
      },
      {
        name: 'Cookware',
        slug: 'cookware',
        description: 'Kitchen cookware, utensils, and appliances',
        level: 1,
        displayOrder: 3,
        menuOrder: 3,
        isActive: true,
        showInMenu: true,
        isFeatured: true,
      },
      {
        name: 'Furniture',
        slug: 'furniture',
        description: 'Home and office furniture',
        level: 1,
        displayOrder: 4,
        menuOrder: 4,
        isActive: true,
        showInMenu: true,
        isFeatured: true,
      },
      {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home decor, garden tools, and outdoor items',
        level: 1,
        displayOrder: 5,
        menuOrder: 5,
        isActive: true,
        showInMenu: true,
        isFeatured: false,
      },
      {
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        description: 'Sports equipment, outdoor gear, and fitness items',
        level: 1,
        displayOrder: 6,
        menuOrder: 6,
        isActive: true,
        showInMenu: true,
        isFeatured: false,
      },
      {
        name: 'Toys & Games',
        slug: 'toys-games',
        description: 'Toys, games, and entertainment for all ages',
        level: 1,
        displayOrder: 7,
        menuOrder: 7,
        isActive: true,
        showInMenu: true,
        isFeatured: false,
      },
      {
        name: 'Beauty & Personal Care',
        slug: 'beauty-personal-care',
        description: 'Cosmetics, skincare, and personal care products',
        level: 1,
        displayOrder: 8,
        menuOrder: 8,
        isActive: true,
        showInMenu: true,
        isFeatured: false,
      },
      {
        name: 'Office Supplies',
        slug: 'office-supplies',
        description: 'Office equipment, stationery, and supplies',
        level: 1,
        displayOrder: 9,
        menuOrder: 9,
        isActive: true,
        showInMenu: true,
        isFeatured: false,
      },
      {
        name: 'Automotive',
        slug: 'automotive',
        description: 'Car parts, accessories, and automotive tools',
        level: 1,
        displayOrder: 10,
        menuOrder: 10,
        isActive: true,
        showInMenu: true,
        isFeatured: false,
      },
    ]

    let createdCount = 0
    let skippedCount = 0

    for (const categoryData of categories) {
      try {
        // Check if category already exists
        const existing = await prisma.category.findUnique({
          where: { slug: categoryData.slug }
        })

        if (existing) {
          console.log(`   ⏭️  Skipped: ${categoryData.name} (already exists)`)
          skippedCount++
          continue
        }

        // Create category
        const category = await prisma.category.create({
          data: categoryData
        })

        console.log(`   ✅ Created: ${category.name}`)
        createdCount++
      } catch (error: any) {
        console.error(`   ❌ Error creating ${categoryData.name}:`, error.message)
      }
    }

    // Now add some subcategories
    console.log('\n📂 Creating subcategories...')

    const subcategories = [
      // Clothing subcategories
      { name: "Men's Clothing", slug: 'mens-clothing', parentSlug: 'clothing', level: 2, displayOrder: 1 },
      { name: "Women's Clothing", slug: 'womens-clothing', parentSlug: 'clothing', level: 2, displayOrder: 2 },
      { name: "Kids' Clothing", slug: 'kids-clothing', parentSlug: 'clothing', level: 2, displayOrder: 3 },
      { name: 'Shoes', slug: 'shoes', parentSlug: 'clothing', level: 2, displayOrder: 4 },
      { name: 'Accessories', slug: 'accessories-clothing', parentSlug: 'clothing', level: 2, displayOrder: 5 },

      // Electronics subcategories
      { name: 'Smartphones', slug: 'smartphones', parentSlug: 'electronics', level: 2, displayOrder: 1 },
      { name: 'Laptops', slug: 'laptops', parentSlug: 'electronics', level: 2, displayOrder: 2 },
      { name: 'Tablets', slug: 'tablets', parentSlug: 'electronics', level: 2, displayOrder: 3 },
      { name: 'Audio', slug: 'audio', parentSlug: 'electronics', level: 2, displayOrder: 4 },
      { name: 'Cameras', slug: 'cameras', parentSlug: 'electronics', level: 2, displayOrder: 5 },

      // Cookware subcategories
      { name: 'Pots & Pans', slug: 'pots-pans', parentSlug: 'cookware', level: 2, displayOrder: 1 },
      { name: 'Bakeware', slug: 'bakeware', parentSlug: 'cookware', level: 2, displayOrder: 2 },
      { name: 'Kitchen Utensils', slug: 'kitchen-utensils', parentSlug: 'cookware', level: 2, displayOrder: 3 },
      { name: 'Small Appliances', slug: 'small-appliances', parentSlug: 'cookware', level: 2, displayOrder: 4 },
      { name: 'Cutlery', slug: 'cutlery', parentSlug: 'cookware', level: 2, displayOrder: 5 },

      // Furniture subcategories
      { name: 'Living Room', slug: 'living-room', parentSlug: 'furniture', level: 2, displayOrder: 1 },
      { name: 'Bedroom', slug: 'bedroom', parentSlug: 'furniture', level: 2, displayOrder: 2 },
      { name: 'Office Furniture', slug: 'office-furniture', parentSlug: 'furniture', level: 2, displayOrder: 3 },
      { name: 'Dining Room', slug: 'dining-room', parentSlug: 'furniture', level: 2, displayOrder: 4 },
      { name: 'Outdoor Furniture', slug: 'outdoor-furniture', parentSlug: 'furniture', level: 2, displayOrder: 5 },
    ]

    let subCreatedCount = 0
    let subSkippedCount = 0

    for (const subData of subcategories) {
      try {
        // Find parent category
        const parent = await prisma.category.findUnique({
          where: { slug: subData.parentSlug }
        })

        if (!parent) {
          console.log(`   ⚠️  Parent not found for: ${subData.name}`)
          continue
        }

        // Check if subcategory already exists
        const existing = await prisma.category.findUnique({
          where: { slug: subData.slug }
        })

        if (existing) {
          console.log(`   ⏭️  Skipped: ${subData.name} (already exists)`)
          subSkippedCount++
          continue
        }

        // Create subcategory
        const subcategory = await prisma.category.create({
          data: {
            name: subData.name,
            slug: subData.slug,
            parentId: parent.id,
            level: subData.level,
            displayOrder: subData.displayOrder,
            menuOrder: subData.displayOrder,
            isActive: true,
            showInMenu: true,
            isFeatured: false,
          }
        })

        console.log(`   ✅ Created: ${subcategory.name} (under ${parent.name})`)
        subCreatedCount++
      } catch (error: any) {
        console.error(`   ❌ Error creating ${subData.name}:`, error.message)
      }
    }

    console.log(`\n✨ Seeding complete!`)
    console.log(`   📊 Main categories created: ${createdCount}`)
    console.log(`   ⏭️  Main categories skipped: ${skippedCount}`)
    console.log(`   📂 Subcategories created: ${subCreatedCount}`)
    console.log(`   ⏭️  Subcategories skipped: ${subSkippedCount}`)

    // Show summary
    const totalCategories = await prisma.category.count()
    const mainCategories = await prisma.category.count({
      where: { level: 1 }
    })
    const subCategories = await prisma.category.count({
      where: { level: 2 }
    })

    console.log(`\n📋 Database Summary:`)
    console.log(`   Total categories: ${totalCategories}`)
    console.log(`   Main categories: ${mainCategories}`)
    console.log(`   Subcategories: ${subCategories}`)

  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  }
}

async function main() {
  await seedCategories()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
