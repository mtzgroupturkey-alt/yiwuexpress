import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Category codes...');

  // 1. Level 1 Departments
  const l1Codes: Record<string, string> = {
    'Furniture': '100',
    'Kitchen & Dining': '200',
    'Lighting & Home Smart': '300',
    'Beds & Mattresses': '400',
    'Storage & Organization': '500',
    'Textiles & Rugs': '600',
    'Home Decor & Plants': '700',
    'Bathroom': '800',
    'Baby & Children': '900',
    'Outdoor & Balcony': '950',
  };

  // Get all categories
  const allCategories = await prisma.category.findMany({
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
  });

  const level1 = allCategories.filter((c) => !c.parentId || c.level === 1);
  const level2 = allCategories.filter((c) => c.level === 2);
  const level3 = allCategories.filter((c) => c.level === 3);

  // Update Level 1
  let nextL1Code = 110;
  for (const cat of level1) {
    let code = l1Codes[cat.name];
    if (!code) {
      code = String(nextL1Code);
      nextL1Code += 10;
    }
    await prisma.category.update({
      where: { id: cat.id },
      data: { code },
    });
    console.log(`L1: ${cat.name} -> ${code}`);
  }

  // Update Level 2
  // We can assign sequential subcodes per parent, or global 3-digit subcodes:
  // e.g. parent "100" has children: 010, 020, 030, etc.
  // Or simply sequential numbers padded to 3 digits (e.g. 001, 002, 003...)
  // But note Category.code has @unique constraint!
  // Since code is @unique across ALL categories, every category must have a distinct code!
  // E.g.
  // L1: 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
  // L2: 101, 102, 103, 104, 201, 202, 203, ...
  // L3: 111, 112, 113, ... OR 3-digit numbers unique across categories.
  // Let's ensure uniqueness:
  // For each L1 (e.g. 100):
  // L2 can be 110, 120, 130... or 101, 102, 103...
  // Let's check how many L2 and L3 per L1:
  // L1 max subcategories is 4. L2 max sub-subcategories is 4.
  // If L2 = base + (idx + 1)*10 -> e.g. Furniture (100) -> 110, 120, 130, 140
  // L3 = L2 code + (idx + 1) -> e.g. 110 -> 111, 112, 113, 114!
  // All fit in 3 digits, all perfectly hierarchical, and all globally unique!

  const updatedL1 = await prisma.category.findMany({ where: { level: 1 } });
  const l1Map = new Map(updatedL1.map((c) => [c.id, c.code!]));

  const usedCodes = new Set<string>(updatedL1.map((c) => c.code!));

  for (const l1 of updatedL1) {
    const l1CodeNum = parseInt(l1.code || '900', 10);
    const childrenL2 = level2.filter((c) => c.parentId === l1.id).sort((a, b) => a.name.localeCompare(b.name));

    let l2Counter = 1;
    for (const l2 of childrenL2) {
      let code = String(l1CodeNum + l2Counter * 10).padStart(3, '0');
      // If code clash, find next available
      while (usedCodes.has(code)) {
        l2Counter++;
        code = String(l1CodeNum + l2Counter * 10).padStart(3, '0');
      }
      usedCodes.add(code);
      await prisma.category.update({
        where: { id: l2.id },
        data: { code },
      });
      console.log(`  L2: ${l2.name} -> ${code}`);

      const childrenL3 = level3.filter((c) => c.parentId === l2.id).sort((a, b) => a.name.localeCompare(b.name));
      let l3Counter = 1;
      const l2CodeNum = parseInt(code, 10);
      for (const l3 of childrenL3) {
        let l3Code = String(l2CodeNum + l3Counter).padStart(3, '0');
        while (usedCodes.has(l3Code)) {
          l3Counter++;
          l3Code = String(l2CodeNum + l3Counter).padStart(3, '0');
        }
        usedCodes.add(l3Code);
        await prisma.category.update({
          where: { id: l3.id },
          data: { code: l3Code },
        });
        console.log(`    L3: ${l3.name} -> ${l3Code}`);
        l3Counter++;
      }
      l2Counter++;
    }
  }

  // Any remaining categories without code
  const remaining = await prisma.category.findMany({ where: { code: null } });
  let fallback = 951;
  for (const r of remaining) {
    while (usedCodes.has(String(fallback))) {
      fallback++;
    }
    const code = String(fallback);
    usedCodes.add(code);
    await prisma.category.update({
      where: { id: r.id },
      data: { code },
    });
    console.log(`Fallback: ${r.name} -> ${code}`);
    fallback++;
  }

  console.log('Category codes seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
