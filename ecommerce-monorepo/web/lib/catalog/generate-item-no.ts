import { PrismaClient } from '@prisma/client'

/**
 * Generates a unique, hierarchical Dromkok Item Number:
 * Format: DK-CCC.SSS.NN
 * - DK = Dromkok prefix
 * - CCC = 3-digit category code (from top-level Category.code, e.g. "100")
 * - SSS = 3-digit subcategory code (from subcategory Category.code, e.g. "001" or subcategory code)
 * - NN = 2-digit sequence within the category/subcategory (pads to 2 or more digits if > 99)
 *
 * Fallback to DK-999.000.NN if category is missing or has no code.
 */
export async function generateDromkokItemNo(
  prisma: PrismaClient,
  categoryId?: string | null
): Promise<string> {
  if (!categoryId) {
    return getNextItemNoWithPrefix(prisma, '999', '000')
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      code: true,
      parentId: true,
      level: true,
      parent: {
        select: {
          code: true,
          parentId: true,
          parent: {
            select: {
              code: true,
            },
          },
        },
      },
    },
  })

  if (!category) {
    return getNextItemNoWithPrefix(prisma, '999', '000')
  }

  let categoryCode = '999'
  let subCode = '000'

  if (category.level === 1 || !category.parentId) {
    categoryCode = category.code ? String(category.code).padStart(3, '0') : '999'
    subCode = '000'
  } else if (category.level === 2) {
    categoryCode = category.parent?.code ? String(category.parent.code).padStart(3, '0') : '999'
    subCode = category.code ? String(category.code).padStart(3, '0') : '000'
  } else {
    // Level 3 (or deeper)
    // CCC is the root ancestor (parent's parent if level 3)
    const rootCode = category.parent?.parent?.code || category.parent?.code
    categoryCode = rootCode ? String(rootCode).padStart(3, '0') : '999'
    subCode = category.code ? String(category.code).padStart(3, '0') : '000'
  }

  return getNextItemNoWithPrefix(prisma, categoryCode, subCode)
}

async function getNextItemNoWithPrefix(
  prisma: PrismaClient,
  categoryCode: string,
  subCode: string
): Promise<string> {
  const prefix = `DK-${categoryCode}.${subCode}.`

  // Find the highest existing item number starting with this prefix
  const last = await prisma.product.findFirst({
    where: {
      dromkokItemNo: { startsWith: prefix },
    },
    orderBy: { dromkokItemNo: 'desc' },
    select: { dromkokItemNo: true },
  })

  let nextSeq = 1
  if (last?.dromkokItemNo) {
    const parts = last.dromkokItemNo.split('.')
    const lastNumStr = parts[parts.length - 1]
    const parsed = parseInt(lastNumStr, 10)
    if (!isNaN(parsed)) {
      nextSeq = parsed + 1
    }
  }

  // Sequence format: at least 2 digits (e.g. 01, 02, ..., 99, 100...)
  const seqStr = String(nextSeq).padStart(2, '0')
  return `${prefix}${seqStr}`
}
