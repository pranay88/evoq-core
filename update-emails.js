const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEmails() {
  console.log('Starting email domain update...');
  
  const users = await prisma.user.findMany();
  for (const user of users) {
    if (user.email.includes('@evoqrealtech.com')) {
      const newEmail = user.email.replace('@evoqrealtech.com', '@houseofevoq.com');
      await prisma.user.update({
        where: { id: user.id },
        data: { email: newEmail }
      });
      console.log('Updated User:', newEmail);
    }
  }

  const employees = await prisma.employee.findMany();
  for (const emp of employees) {
    if (emp.officialEmail && emp.officialEmail.includes('@evoqrealtech.com')) {
      const newEmail = emp.officialEmail.replace('@evoqrealtech.com', '@houseofevoq.com');
      await prisma.employee.update({
        where: { id: emp.id },
        data: { officialEmail: newEmail }
      });
      console.log('Updated Employee:', newEmail);
    }
  }

  console.log('Email domains successfully migrated in the database!');
}

updateEmails()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
