const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching users...');
  const users = await prisma.user.findMany();
  
  const deptAdmin = await prisma.department.findUnique({ where: { code: 'ADMIN' } });
  const deptHr = await prisma.department.findUnique({ where: { code: 'HR' } });

  let fdCount = 1;

  for (const user of users) {
    // Check if employee already exists
    const existing = await prisma.employee.findFirst({
      where: { officialEmail: user.email }
    });

    if (!existing) {
      let deptId = deptAdmin.id;
      let designation = 'Staff';
      let empIdPrefix = 'EMP';

      if (user.role === 'FRONT_DESK') {
        deptId = deptAdmin.id;
        designation = 'Front Desk Executive';
        empIdPrefix = 'FD';
      } else if (user.role === 'HR') {
        deptId = deptHr.id;
        designation = 'HR Manager';
        empIdPrefix = 'HR';
      } else if (user.role === 'ADMIN') {
        deptId = deptAdmin.id;
        designation = 'System Administrator';
        empIdPrefix = 'ADM';
      }

      const empId = `${empIdPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      console.log(`Creating Employee profile for ${user.name} (${user.email})...`);
      
      await prisma.employee.create({
        data: {
          employeeId: empId,
          fullName: user.name,
          dateOfBirth: new Date('1990-01-01'), // placeholder
          gender: 'Not Specified',
          mobileNumber: '+91 00000 00000',
          personalEmail: user.email,
          officialEmail: user.email,
          currentAddress: 'N/A',
          permanentAddress: 'N/A',
          emergencyContactName: 'N/A',
          emergencyContactNumber: 'N/A',
          emergencyContactRelationship: 'N/A',
          departmentId: deptId,
          designation: designation,
          siteId: user.siteId || (await prisma.site.findFirst()).id,
          joiningDate: new Date(),
          employmentType: 'FULL_TIME',
          employmentStatus: 'CONFIRMED'
        }
      });
      fdCount++;
    }
  }
  
  console.log('Finished migrating users to employees.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
