const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating site addresses...');
  
  await prisma.site.updateMany({
    where: { code: 'EVOQ-HQ' },
    data: { address: '101 Prestige Tower, Sector 62, Mohali, PB, 160062' }
  });

  await prisma.site.updateMany({
    where: { code: 'EVOQ-ON' },
    data: { address: 'Plot 12, Tech Park, Sector 66, Mohali, PB, 160062' }
  });

  await prisma.site.updateMany({
    where: { code: 'EVOQ-HZ' },
    data: { address: 'Floor 5, Sky Rise, Sector 74, Mohali, PB, 160071' }
  });

  await prisma.site.updateMany({
    where: { code: 'EVOQ-VT' },
    data: { address: 'Building B, Industrial Area, Phase 8, Mohali, PB, 160071' }
  });

  console.log('Done!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
