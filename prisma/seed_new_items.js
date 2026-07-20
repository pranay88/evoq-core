const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding new inventory items...');

  // Get categories
  const catGifting = await prisma.inventoryCategory.findUnique({
    where: { name: 'Gifting' },
  });
  const catPackaging = await prisma.inventoryCategory.findUnique({
    where: { name: 'Packaging' },
  });

  const siteHq = await prisma.site.findFirst({
    where: { code: 'EVOQ-HQ' },
  });

  if (!catGifting || !catPackaging || !siteHq) {
    console.log('Error: Missing categories or site. Run recategorize first.');
    return;
  }

  // 1. Seed Premium Gift Box
  const itemGift = await prisma.inventoryItem.upsert({
    where: { itemCode: 'GF-PLA-LEA-BOX' },
    update: {},
    create: {
      itemCode: 'GF-PLA-LEA-BOX',
      name: 'EVOQ Premium Leather Planner Gift Box',
      categoryId: catGifting.id,
      unit: 'Pcs',
      openingStock: 50,
      currentStock: 45,
      minimumStockLevel: 10,
      siteId: siteHq.id,
      purchaseRate: 850.00,
      supplier: 'Gifts Galore',
      condition: 'New',
    },
  });

  // 2. Seed Corrugated Box
  const itemPack = await prisma.inventoryItem.upsert({
    where: { itemCode: 'PK-BOX-COR-MED' },
    update: {},
    create: {
      itemCode: 'PK-BOX-COR-MED',
      name: 'Corrugated Shipping Box (Medium)',
      categoryId: catPackaging.id,
      unit: 'Pcs',
      openingStock: 200,
      currentStock: 180,
      minimumStockLevel: 50,
      siteId: siteHq.id,
      purchaseRate: 15.00,
      supplier: 'Packers Supply',
      condition: 'New',
    },
  });

  console.log('New items seeded successfully:', itemGift.name, 'and', itemPack.name);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
