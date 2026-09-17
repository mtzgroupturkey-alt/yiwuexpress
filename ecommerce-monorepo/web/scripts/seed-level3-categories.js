const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding sample Level 3 categories...');

  const level3Data = [
    // Under Men's Clothing
    {
      parentSlug: 'mens-clothing',
      name: 'T-Shirts & Polos',
      slug: 'tshirts-polos',
      icon: 'Shirt',
      displayOrder: 1,
      translations: {
        en: 'T-Shirts & Polos',
        ru: 'Футболки и поло',
        zh: 'T恤与POLO衫',
      }
    },
    // Under Women's Clothing
    {
      parentSlug: 'womens-clothing',
      name: 'Dresses & Skirts',
      slug: 'dresses-skirts',
      icon: 'Sparkles',
      displayOrder: 1,
      translations: {
        en: 'Dresses & Skirts',
        ru: 'Платья и юбки',
        zh: '连衣裙与短裙',
      }
    },
    {
      parentSlug: 'womens-clothing',
      name: 'Bags & Purses',
      slug: 'bags-purses',
      icon: 'ShoppingBag',
      displayOrder: 2,
      translations: {
        en: 'Bags & Purses',
        ru: 'Сумки и кошельки',
        zh: '手袋与女包',
      }
    },
    // Under Laptops
    {
      parentSlug: 'laptops',
      name: 'Gaming Laptops',
      slug: 'gaming-laptops',
      icon: 'Gamepad2',
      displayOrder: 1,
      translations: {
        en: 'Gaming Laptops',
        ru: 'Игровые ноутбуки',
        zh: '游戏本',
      }
    },
    {
      parentSlug: 'laptops',
      name: 'Ultrabooks & Notebooks',
      slug: 'ultrabooks',
      icon: 'Laptop',
      displayOrder: 2,
      translations: {
        en: 'Ultrabooks & Notebooks',
        ru: 'Ультрабуки и ноутбки',
        zh: '轻薄本与便携本',
      }
    },
    // Under Living Room
    {
      parentSlug: 'living-room',
      name: 'Sofas & Couches',
      slug: 'sofas-couches',
      icon: 'Armchair',
      displayOrder: 1,
      translations: {
        en: 'Sofas & Couches',
        ru: 'Диваны и кушетки',
        zh: '沙发与长椅',
      }
    },
    {
      parentSlug: 'living-room',
      name: 'Coffee & Side Tables',
      slug: 'coffee-tables',
      icon: 'Coffee',
      displayOrder: 2,
      translations: {
        en: 'Coffee & Side Tables',
        ru: 'Журнальные столики',
        zh: '茶几与边几',
      }
    },
  ];

  for (const item of level3Data) {
    const parent = await prisma.category.findUnique({
      where: { slug: item.parentSlug }
    });

    if (!parent) {
      console.log(`Parent category not found for slug: ${item.parentSlug}`);
      continue;
    }

    const existing = await prisma.category.findUnique({
      where: { slug: item.slug }
    });

    let catId;
    if (existing) {
      console.log(`Category ${item.name} already exists. Updating level and parent...`);
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          parentId: parent.id,
          level: 3,
          isActive: true,
          showInMenu: true,
          icon: item.icon,
        }
      });
      catId = existing.id;
    } else {
      console.log(`Creating Level 3 category: ${item.name} under ${parent.name}`);
      const created = await prisma.category.create({
        data: {
          name: item.name,
          slug: item.slug,
          parentId: parent.id,
          level: 3,
          displayOrder: item.displayOrder,
          menuOrder: item.displayOrder,
          isActive: true,
          showInMenu: true,
          icon: item.icon,
        }
      });
      catId = created.id;
    }

    // Seed translations
    for (const [locale, translatedName] of Object.entries(item.translations)) {
      await prisma.categoryTranslation.upsert({
        where: {
          categoryId_locale: {
            categoryId: catId,
            locale: locale,
          }
        },
        create: {
          categoryId: catId,
          locale: locale,
          name: translatedName,
        },
        update: {
          name: translatedName,
        }
      });
    }
  }

  console.log('Finished seeding Level 3 categories.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
