/**
 * One-time backfill: seed `product_translations` (locale='en') from the legacy
 * `name`/`description` columns for every existing product.
 *
 * Idempotent: uses upsert on (productId, locale) so re-running is safe.
 * Run with:  npx tsx scripts/backfill-product-translations.ts
 */
import { prisma } from '../lib/db'

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, description: true }
  })

  console.log(`Found ${products.length} products to backfill.`)

  let created = 0
  let updated = 0

  for (const p of products) {
    const result = await prisma.productTranslation.upsert({
      where: { productId_locale: { productId: p.id, locale: 'en' } },
      create: {
        productId: p.id,
        locale: 'en',
        name: p.name,
        description: p.description ?? null
      },
      update: {
        name: p.name,
        description: p.description ?? null
      }
    })
    // upsert does not report created vs updated; treat as created when none existed.
    if (result) created++
  }

  console.log('Data migration complete! All base items safely copied to language tables.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
