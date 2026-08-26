const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating site names...');
  
  await prisma.site.updateMany({
    where: { code: 'EVOQ-HQ' },
    data: { name: 'Evoq Headquarters 80' }
  });

  await prisma.site.updateMany({
    where: { code: 'EVOQ-ON' },
    data: { name: 'Evoq Antalia 66' }
  });

  await prisma.site.updateMany({
    where: { code: 'EVOQ-HZ' },
    data: { name: 'Evoq select 102' }
  });

  await prisma.site.updateMany({
    where: { code: 'EVOQ-VT' },
    data: { name: 'Evoq 82' }
  });

  console.log('Done!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
