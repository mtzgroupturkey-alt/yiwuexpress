// Test script to verify category API without dev server
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCategoryAPI() {
  console.log('='.repeat(60))
  console.log('CATEGORY API SIMULATION TEST')
  console.log('='.repeat(60))
  console.log()

  try {
    // Simulate the API call
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`✓ Total categories in DB: ${categories.length}`)
    console.log()

    // Simulate frontend filtering
    const parentCategories = categories
      .filter(cat => !cat.parentId && cat.isActive && cat.showInMenu !== false)
      .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0))

    console.log(`✓ Parent categories (will show in menu): ${parentCategories.length}`)
    console.log()

    if (parentCategories.length === 0) {
      console.log('⚠️  WARNING: No parent categories found!')
      console.log('   Possible reasons:')
      console.log('   - All categories have a parentId (no root categories)')
      console.log('   - All categories have showInMenu = false')
      console.log('   - All categories have isActive = false')
      console.log()
    }

    // Show each parent with its children
    parentCategories.forEach((parent, index) => {
      const children = categories
        .filter(child => child.parentId === parent.id && child.isActive && child.showInMenu !== false)
        .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0))

      console.log(`${index + 1}. ${parent.name.toUpperCase()}`)
      console.log(`   Slug: /${parent.slug}`)
      console.log(`   MenuOrder: ${parent.menuOrder}`)
      console.log(`   Products: ${parent._count.products}`)
      console.log(`   Children: ${children.length}`)
      
      if (children.length > 0) {
        children.forEach((child, childIndex) => {
          console.log(`      ${childIndex + 1}. ${child.name} (/${child.slug}) - ${child._count.products} products - MenuOrder: ${child.menuOrder}`)
        })
      }
      console.log()
    })

    console.log('='.repeat(60))
    console.log('FRONTEND MENU STRUCTURE')
    console.log('='.repeat(60))
    console.log()

    const menuStructure = parentCategories.map(cat => {
      const children = categories
        .filter(child => child.parentId === cat.id && child.isActive && child.showInMenu !== false)
        .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0))
      
      return {
        id: cat.id,
        name: cat.name.toUpperCase(),
        slug: cat.slug,
        hasDropdown: children.length > 0,
        childrenCount: children.length
      }
    })

    console.log('Menu items that will render:')
    menuStructure.forEach((item, i) => {
      const action = item.hasDropdown ? '📋 Dropdown' : '🔗 Link'
      console.log(`${i + 1}. ${item.name} ${action} (${item.childrenCount} children)`)
    })

    console.log()
    console.log('✅ Test complete!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testCategoryAPI()
