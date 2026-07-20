const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding operational performance data for the current month...');

  // 1. Fetch all active employees
  const employees = await db.employee.findMany();
  if (employees.length === 0) {
    console.log('❌ No employees found. Please seed primary database first.');
    return;
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // Start of this month
  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0); // Last day of month

  // Clear existing attendance for this month to avoid duplicates
  await db.attendance.deleteMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      }
    }
  });

  // Fetch a user to act as creator
  const user = await db.user.findFirst();
  const creatorId = user ? user.id : 'system';

  console.log(`Generating logs from ${startDate.toDateString()} to ${today.toDateString()}...`);

  // Loop through days from start of month until today
  for (let d = 1; d <= today.getDate(); d++) {
    const currentDate = new Date(currentYear, currentMonth, d);
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      
      let status = 'Present';
      let lateArrival = false;

      if (i === 0) {
        status = 'Present';
        lateArrival = false;
      } else if (i === 1) {
        status = Math.random() > 0.1 ? 'Present' : 'Absent';
        lateArrival = Math.random() > 0.9;
      } else if (i === 2) {
        status = 'Present';
        lateArrival = Math.random() > 0.4; // 40% late rate
      } else {
        status = Math.random() > 0.35 ? 'Present' : 'Absent'; // 35% absence rate
        lateArrival = Math.random() > 0.5;
      }

      const checkInDate = new Date(currentDate);
      checkInDate.setHours(9, 0, 0, 0);

      const checkOutDate = new Date(currentDate);
      checkOutDate.setHours(18, 0, 0, 0);

      await db.attendance.create({
        data: {
          employee: { connect: { id: emp.id } },
          date: currentDate,
          status,
          checkIn: status === 'Present' ? checkInDate : null,
          checkOut: status === 'Present' ? checkOutDate : null,
          lateArrival: status === 'Present' ? lateArrival : false,
          workLocation: 'OFFICE',
          enteredBy: { connect: { id: creatorId } },
        }
      });
    }
  }

  // 2. Seed visitor check-ins (meetings hosted)
  // Clear visitor dependent records first to avoid foreign key violations
  await db.visitorCorrection.deleteMany({});
  await db.visitorExit.deleteMany({});
  await db.visitor.deleteMany({
    where: {
      entryTime: {
        gte: startDate,
        lte: endDate,
      }
    }
  });

  const meetingCounts = [6, 3, 1, 0];
  const visitorsList = [
    { name: 'Karan Sharma', company: 'Adani Group' },
    { name: 'Priya Iyer', company: 'Tata Capital' },
    { name: 'John Doe', company: 'Microsoft India' },
    { name: 'Sunita Rao', company: 'HDFC Bank' },
    { name: 'Vikram Singh', company: 'DLF Group' },
    { name: 'Sanjay Dutt', company: 'Reddy Labs' },
  ];

  for (let i = 0; i < Math.min(employees.length, meetingCounts.length); i++) {
    const emp = employees[i];
    const count = meetingCounts[i];

    for (let c = 0; c < count; c++) {
      const vis = visitorsList[c % visitorsList.length];
      await db.visitor.create({
        data: {
          name: `${vis.name} - ${c}`,
          company: vis.company,
          phone: `98765432${i}${c}`,
          purpose: 'Project Consultation',
          category: 'CLIENT',
          personToMeet: emp.fullName,
          site: { connect: { id: emp.siteId } },
          entryTime: new Date(currentYear, currentMonth, Math.max(1, today.getDate() - c), 10 + c, 0),
          createdBy: { connect: { id: creatorId } },
        }
      });
    }
  }

  // 3. Seed issued assets compliance
  // Clear any existing test assets issued to prevent SN violations
  await db.issuedAsset.deleteMany({
    where: {
      serialNumber: {
        in: ['SN-TEST-GOOD-01', 'SN-TEST-OVERDUE-99']
      }
    }
  });

  // Employee 0: Returned asset in good condition (+5 pts)
  if (employees[0]) {
    const item = await db.inventoryItem.findFirst();
    if (item) {
      const issued = await db.issuedAsset.create({
        data: {
          employee: { connect: { id: employees[0].id } },
          item: { connect: { id: item.id } },
          serialNumber: 'SN-TEST-GOOD-01',
          assetCode: 'AST-GOOD-01',
          issueDate: new Date(),
          conditionAtIssue: 'GOOD',
          expectedReturnDate: new Date(),
          status: 'Returned',
          departmentId: employees[0].departmentId,
          siteId: employees[0].siteId,
          issuedBy: { connect: { id: creatorId } },
        }
      });

      await db.assetReturn.create({
        data: {
          asset: { connect: { id: issued.id } },
          returnDate: new Date(),
          conditionAtReturn: 'Returned',
          receivedBy: { connect: { id: creatorId } },
        }
      });
    }
  }

  // Employee 3: Overdue asset (-10 pts)
  if (employees[3]) {
    const item = await db.inventoryItem.findFirst();
    if (item) {
      await db.issuedAsset.create({
        data: {
          employee: { connect: { id: employees[3].id } },
          item: { connect: { id: item.id } },
          serialNumber: 'SN-TEST-OVERDUE-99',
          assetCode: 'AST-OVERDUE-99',
          issueDate: new Date(),
          conditionAtIssue: 'GOOD',
          expectedReturnDate: new Date(currentYear, currentMonth, 1),
          status: 'Issued',
          departmentId: employees[3].departmentId,
          siteId: employees[3].siteId,
          issuedBy: { connect: { id: creatorId } },
        }
      });
    }
  }

  console.log('✅ Seeding completed! Standings are populated.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
