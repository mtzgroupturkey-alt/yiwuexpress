const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.category.findMany();
  const map = new Map(all.map(c => [c.id, c]));
  let updated = 0;

  for (const c of all) {
    let depth = 1;
    let cur = c;
    while (cur.parentId && map.has(cur.parentId)) {
      depth++;
      cur = map.get(cur.parentId);
      if (depth > 10) break;
    }
    if (c.level !== depth) {
      await prisma.category.update({
        where: { id: c.id },
        data: { level: depth }
      });
      console.log(`Updated ${c.name} (${c.id}) from level ${c.level} to ${depth}`);
      updated++;
    }
  }
  console.log(`Finished category level sync. Updated ${updated} categories.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
