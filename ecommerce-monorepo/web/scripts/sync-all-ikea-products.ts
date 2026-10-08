import { PrismaClient, Prisma } from '@prisma/client'
import { fetchIkeaProduct, cleanIkeaItemNumber } from '../lib/ikea/fetchProduct'
import { processIkeaSpecsToAttributes, enrichProductDescriptionWithLeftoverSpecs } from '../lib/ikea/ensureAttributes'

const prisma = new PrismaClient()

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const args = process.argv.slice(2)
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined

  const delayArg = args.find((a) => a.startsWith('--delay='))
  const delayMs = delayArg ? parseInt(delayArg.split('=')[1], 10) : 1200

  const overwrite = args.includes('--overwrite')
  const singleId = args.find((a) => a.startsWith('--id='))?.split('=')[1]

  console.log(`=======================================================`)
  console.log(`🚀 IKEA AUTOMATIC CATALOG SYNC & ATTRIBUTE POPULATOR`)
  console.log(`=======================================================`)
  console.log(`Delay between fetches: ${delayMs}ms`)
  console.log(`Overwrite existing: ${overwrite ? 'YES' : 'NO (skipping already synced)'}`)
  if (limit) console.log(`Limit: ${limit} products`)

  if (singleId) {
    const singleProduct = await prisma.product.findUnique({
      where: { id: singleId },
      include: { category: true },
    })

    if (!singleProduct) {
      console.error(`Product not found: ${singleId}`)
      process.exit(1)
    }

    const itemNo = (singleProduct as any).ikeaItemNo || singleProduct.ikeaItemNumber || singleProduct.sku.replace('IKEA-', '')
    console.log(`Syncing single product: ${singleProduct.name} (IKEA #${itemNo})...`)

    const fetched = await fetchIkeaProduct(itemNo)
    if (!fetched) {
      console.error(`Failed to fetch IKEA product for item #${itemNo}`)
      process.exit(1)
    }

    await prisma.product.update({
      where: { id: singleProduct.id },
      data: {
        rawIkeaPayload: fetched as any,
        ikeaItemNumber: itemNo,
        description: singleProduct.description || fetched.description,
      },
    })

    console.log(`✅ Successfully synced single product!`)
    return
  }

  // Find all products that have an IKEA item number
  const whereClause: any = {
    OR: [
      { ikeaItemNo: { not: null } },
      { ikeaItemNumber: { not: null } },
      { sku: { startsWith: 'IKEA-' } },
    ],
  }

  if (!overwrite) {
    whereClause.rawIkeaPayload = { equals: Prisma.DbNull }
  }

  const totalCount = await prisma.product.count({ where: whereClause })
  console.log(`\nFound ${totalCount} candidate products needing IKEA sync in database.`)

  if (totalCount === 0) {
    console.log(`✅ All products with IKEA item numbers are already synchronized!`)
    return
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    select: {
      id: true,
      sku: true,
      name: true,
      categoryId: true,
      ikeaItemNo: true,
      ikeaItemNumber: true,
      description: true,
    },
    take: limit,
  })

  let successCount = 0
  let failedCount = 0

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const rawNo = p.ikeaItemNumber || p.ikeaItemNo || (p.sku.startsWith('IKEA-') ? p.sku.replace('IKEA-', '') : '')
    const cleanNo = cleanIkeaItemNumber(rawNo)

    if (!cleanNo) {
      console.log(`[${i + 1}/${products.length}] ⚠️  Skip ${p.sku}: Missing or invalid item number`)
      continue
    }

    process.stdout.write(`[${i + 1}/${products.length}] Fetching ${cleanNo} (${p.name.slice(0, 30)})... `)

    try {
      const fetched = await fetchIkeaProduct(cleanNo)
      if (!fetched) {
        failedCount++
        console.log(`❌ Not found / parse error`)
        await sleep(delayMs)
        continue
      }

      // Auto-create category attributes and enrich description
      let enrichedDesc = p.description || fetched.description
      if (p.categoryId) {
        try {
          const mappingResult = await processIkeaSpecsToAttributes(
            prisma,
            p.categoryId,
            fetched.specs || {},
            []
          )
          if (mappingResult.leftoverSpecs.length > 0) {
            enrichedDesc = enrichProductDescriptionWithLeftoverSpecs(enrichedDesc, mappingResult.leftoverSpecs)
          }
        } catch (mapErr) {
          // Non-blocking attribute mapping
        }
      }

      await prisma.product.update({
        where: { id: p.id },
        data: {
          rawIkeaPayload: fetched as any,
          ikeaItemNumber: cleanNo,
          description: enrichedDesc,
        },
      })

      successCount++
      const specsCount = Object.keys(fetched.specs || {}).length
      const pkgCount = fetched.measurementsTab?.packaging?.length || 0
      console.log(`✅ OK (${specsCount} specs, ${pkgCount} packages)`)

      // Polite rate-limiting pause
      await sleep(delayMs)
    } catch (err: any) {
      failedCount++
      console.log(`❌ Error: ${err.message}`)
      await sleep(delayMs)
    }
  }

  console.log(`\n=======================================================`)
  console.log(`🎉 SYNC FINISHED: ${successCount} updated successfully, ${failedCount} failed.`)
  console.log(`=======================================================\n`)
}

main()
  .catch((e) => {
    console.error('Fatal sync script error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
