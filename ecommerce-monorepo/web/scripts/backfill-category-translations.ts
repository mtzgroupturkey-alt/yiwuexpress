/**
 * One-time backfill: seed `category_translations` (locale='en') from the legacy
 * `name`/`description` columns for every existing category.
 *
 * Idempotent: uses upsert on (categoryId, locale) so re-running is safe.
 * Run with:  npx tsx scripts/backfill-category-translations.ts
 */
import { prisma } from '../lib/db'

async function main() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, description: true }
  })

  console.log(`Found ${categories.length} categories to backfill.`)

  let created = 0
  let updated = 0

  for (const c of categories) {
    const result = await prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: c.id, locale: 'en' } },
      create: {
        categoryId: c.id,
        locale: 'en',
        name: c.name,
        description: c.description ?? null
      },
      update: {
        name: c.name,
        description: c.description ?? null
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
