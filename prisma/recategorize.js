const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Recategorizing inventory database...');

  // 1. Ensure target categories exist
  const catIt = await prisma.inventoryCategory.upsert({
    where: { name: 'IT Items' },
    update: {},
    create: { name: 'IT Items' },
  });

  const catStationery = await prisma.inventoryCategory.upsert({
    where: { name: 'Stationery' },
    update: {},
    create: { name: 'Stationery' },
  });

  const catPantry = await prisma.inventoryCategory.upsert({
    where: { name: 'Pantry' },
    update: {},
    create: { name: 'Pantry' },
  });

  const catGifting = await prisma.inventoryCategory.upsert({
    where: { name: 'Gifting' },
    update: {},
    create: { name: 'Gifting' },
  });

  const catPackaging = await prisma.inventoryCategory.upsert({
    where: { name: 'Packaging' },
    update: {},
    create: { name: 'Packaging' },
  });

  // 2. Map existing items
  // Find old "IT Equipment" category
  const oldIt = await prisma.inventoryCategory.findUnique({
    where: { name: 'IT Equipment' },
  });
  if (oldIt) {
    await prisma.inventoryItem.updateMany({
      where: { categoryId: oldIt.id },
      data: { categoryId: catIt.id },
    });
    console.log('Moved items from IT Equipment to IT Items.');
  }

  // Find old "Pantry Supplies" category
  const oldPantry = await prisma.inventoryCategory.findUnique({
    where: { name: 'Pantry Supplies' },
  });
  if (oldPantry) {
    await prisma.inventoryItem.updateMany({
      where: { categoryId: oldPantry.id },
      data: { categoryId: catPantry.id },
    });
    console.log('Moved items from Pantry Supplies to Pantry.');
  }

  // 3. Delete old empty categories
  if (oldIt) {
    try {
      await prisma.inventoryCategory.delete({ where: { id: oldIt.id } });
      console.log('Deleted old IT Equipment category.');
    } catch (e) {
      console.log('Could not delete IT Equipment category:', e.message);
    }
  }
  if (oldPantry) {
    try {
      await prisma.inventoryCategory.delete({ where: { id: oldPantry.id } });
      console.log('Deleted old Pantry Supplies category.');
    } catch (e) {
      console.log('Could not delete Pantry Supplies category:', e.message);
    }
  }

  console.log('Recategorization complete!');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
