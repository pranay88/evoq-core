const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding started...');

  // 1. Create Sites
  const siteHq = await prisma.site.upsert({
    where: { code: 'EVOQ-HQ' },
    update: {},
    create: {
      name: 'Evoq Headquarters 80',
      code: 'EVOQ-HQ',
      address: '101 Prestige Tower, MG Road, Bangalore, KA, 560001',
      phone: '+91 80 4567 8901',
      email: 'hq@houseofevoq.com',
      status: 'ACTIVE',
    },
  });

  const siteNoida = await prisma.site.upsert({
    where: { code: 'EVOQ-ON' },
    update: {},
    create: {
      name: 'Evoq Antalia 66',
      code: 'EVOQ-ON',
      address: 'Plot 12, Tech Park, Sector 62, Noida, UP, 201301',
      phone: '+91 120 456 7892',
      email: 'noida@houseofevoq.com',
      status: 'ACTIVE',
    },
  });

  const siteHyd = await prisma.site.upsert({
    where: { code: 'EVOQ-HZ' },
    update: {},
    create: {
      name: 'Evoq select 102',
      code: 'EVOQ-HZ',
      address: 'Floor 5, Sky Rise, Gachibowli, Hyderabad, TS, 500032',
      phone: '+91 40 4567 8903',
      email: 'hyd@houseofevoq.com',
      status: 'ACTIVE',
    },
  });

  const siteMumbai = await prisma.site.upsert({
    where: { code: 'EVOQ-VT' },
    update: {},
    create: {
      name: 'Evoq 82',
      code: 'EVOQ-VT',
      address: 'Building B, Ocean View, Andheri West, Mumbai, MH, 400053',
      phone: '+91 22 4567 8904',
      email: 'mumbai@houseofevoq.com',
      status: 'ACTIVE',
    },
  });

  console.log('Sites seeded.');

  // 2. Create Departments
  const deptHr = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: { name: 'Human Resources', code: 'HR', headName: 'Aisha Sharma', status: 'ACTIVE' },
  });

  const deptAdmin = await prisma.department.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: { name: 'Administration', code: 'ADMIN', headName: 'Vikram Malhotra', status: 'ACTIVE' },
  });

  const deptTech = await prisma.department.upsert({
    where: { code: 'TECH' },
    update: {},
    create: { name: 'Technology', code: 'TECH', headName: 'Rohan Sen', status: 'ACTIVE' },
  });

  const deptOps = await prisma.department.upsert({
    where: { code: 'OPS' },
    update: {},
    create: { name: 'Operations', code: 'OPS', headName: 'Priya Nair', status: 'ACTIVE' },
  });

  const deptMkt = await prisma.department.upsert({
    where: { code: 'MKT' },
    update: {},
    create: { name: 'Sales & Marketing', code: 'MKT', headName: 'Arjun Kapoor', status: 'ACTIVE' },
  });

  console.log('Departments seeded.');

  // 3. Create Users
  const defaultPasswordHash = hashPassword('Password@123');

  // HR User
  const userHr = await prisma.user.upsert({
    where: { email: 'hr@houseofevoq.com' },
    update: {},
    create: {
      name: 'Aisha Sharma',
      email: 'hr@houseofevoq.com',
      passwordHash: defaultPasswordHash,
      role: 'HR',
      status: 'ACTIVE',
    },
  });

  // Admin User
  const userAdmin = await prisma.user.upsert({
    where: { email: 'admin@houseofevoq.com' },
    update: {},
    create: {
      name: 'Vikram Malhotra',
      email: 'admin@houseofevoq.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Front Desk Users (8 users, 2 per site)
  const frontDeskUsersInfo = [
    { name: 'Rahul Gowda', email: 'fd1.hq@houseofevoq.com', siteId: siteHq.id },
    { name: 'Kavitha Raj', email: 'fd2.hq@houseofevoq.com', siteId: siteHq.id },
    { name: 'Amit Verma', email: 'fd1.on@houseofevoq.com', siteId: siteNoida.id },
    { name: 'Pooja Singh', email: 'fd2.on@houseofevoq.com', siteId: siteNoida.id },
    { name: 'Suresh Reddy', email: 'fd1.hz@houseofevoq.com', siteId: siteHyd.id },
    { name: 'Divya Teja', email: 'fd2.hz@houseofevoq.com', siteId: siteHyd.id },
    { name: 'Rajesh Patil', email: 'fd1.vt@houseofevoq.com', siteId: siteMumbai.id },
    { name: 'Sneha Joshi', email: 'fd2.vt@houseofevoq.com', siteId: siteMumbai.id },
  ];

  for (const fd of frontDeskUsersInfo) {
    await prisma.user.upsert({
      where: { email: fd.email },
      update: { siteId: fd.siteId },
      create: {
        name: fd.name,
        email: fd.email,
        passwordHash: defaultPasswordHash,
        role: 'FRONT_DESK',
        siteId: fd.siteId,
        status: 'ACTIVE',
      },
    });
  }

  console.log('Users (HR, Admin, and 8 Front Desk) seeded.');

  // 4. Create Employees
  const today = new Date();
  
  // Rohan Sen (TECH, Bangalore HQ, EVOQ101) - Birthday Today!
  const empRohan = await prisma.employee.upsert({
    where: { employeeId: 'EVOQ101' },
    update: {},
    create: {
      employeeId: 'EVOQ101',
      fullName: 'Rohan Sen',
      dateOfBirth: new Date(today.getFullYear() - 28, today.getMonth(), today.getDate()), // exact birthday today
      gender: 'Male',
      bloodGroup: 'O+',
      mobileNumber: '+91 98765 43210',
      personalEmail: 'rohan.sen@gmail.com',
      currentAddress: '45, 2nd Main, Indiranagar, Bangalore, KA, 560038',
      permanentAddress: '45, 2nd Main, Indiranagar, Bangalore, KA, 560038',
      emergencyContactName: 'Sumati Sen',
      emergencyContactNumber: '+91 98765 43211',
      emergencyContactRelationship: 'Mother',
      departmentId: deptTech.id,
      designation: 'Senior Software Engineer',
      siteId: siteHq.id,
      joiningDate: new Date('2024-03-15'),
      employmentType: 'FULL_TIME',
      employmentStatus: 'CONFIRMED',
      officialEmail: 'rohan.sen@houseofevoq.com',
      bankName: 'HDFC Bank',
      bankAccountHolderName: 'Rohan Sen',
      bankAccountNumber: '50100234567890',
      bankIfscCode: 'HDFC0000123',
      panNumber: 'ABCPS1234K',
      aadhaarNumber: '123456789012',
    },
  });

  // Priya Nair (OPS, Noida, EVOQ102) - Birthday in 3 days
  const birthdayPriya = new Date(today);
  birthdayPriya.setDate(today.getDate() + 3);
  birthdayPriya.setFullYear(today.getFullYear() - 26);
  const empPriya = await prisma.employee.upsert({
    where: { employeeId: 'EVOQ102' },
    update: {},
    create: {
      employeeId: 'EVOQ102',
      fullName: 'Priya Nair',
      dateOfBirth: birthdayPriya,
      gender: 'Female',
      bloodGroup: 'A+',
      mobileNumber: '+91 98765 43220',
      personalEmail: 'priya.nair@gmail.com',
      currentAddress: 'Flat 302, Sector 15, Noida, UP, 201301',
      permanentAddress: '12, Greenfield Layout, Kochi, KL, 682024',
      emergencyContactName: 'K. Nair',
      emergencyContactNumber: '+91 98765 43221',
      emergencyContactRelationship: 'Father',
      departmentId: deptOps.id,
      designation: 'Operations Lead',
      siteId: siteNoida.id,
      joiningDate: new Date(today.getFullYear(), today.getMonth() - 2, 1), // 2 months ago
      employmentType: 'FULL_TIME',
      employmentStatus: 'PROBATION', // still on probation
      officialEmail: 'priya.nair@houseofevoq.com',
      bankName: 'ICICI Bank',
      bankAccountHolderName: 'Priya Nair',
      bankAccountNumber: '000401234567',
      bankIfscCode: 'ICIC0000004',
      panNumber: 'ABCPS5678L',
      aadhaarNumber: '987654321098',
    },
  });

  // Arjun Kapoor (MKT, Mumbai, EVOQ103) - Birthday in 5 days
  const birthdayArjun = new Date(today);
  birthdayArjun.setDate(today.getDate() + 5);
  birthdayArjun.setFullYear(today.getFullYear() - 32);
  const empArjun = await prisma.employee.upsert({
    where: { employeeId: 'EVOQ103' },
    update: {},
    create: {
      employeeId: 'EVOQ103',
      fullName: 'Arjun Kapoor',
      dateOfBirth: birthdayArjun,
      gender: 'Male',
      bloodGroup: 'B+',
      mobileNumber: '+91 98765 43230',
      personalEmail: 'arjun.k@gmail.com',
      currentAddress: '9B, Pearl Sea, Bandra West, Mumbai, MH, 400050',
      permanentAddress: '9B, Pearl Sea, Bandra West, Mumbai, MH, 400050',
      emergencyContactName: 'Neetu Kapoor',
      emergencyContactNumber: '+91 98765 43231',
      emergencyContactRelationship: 'Wife',
      departmentId: deptMkt.id,
      designation: 'Marketing Manager',
      siteId: siteMumbai.id,
      joiningDate: new Date('2023-08-01'),
      employmentType: 'FULL_TIME',
      employmentStatus: 'CONFIRMED',
      officialEmail: 'arjun.kapoor@houseofevoq.com',
      bankName: 'Axis Bank',
      bankAccountHolderName: 'Arjun Kapoor',
      bankAccountNumber: '912010045678901',
      bankIfscCode: 'UTIB0000001',
      panNumber: 'ABCPS9012M',
      aadhaarNumber: '456789012345',
    },
  });

  // Vikram Malhotra (ADMIN, Bangalore HQ, EVOQ002)
  const empVikram = await prisma.employee.upsert({
    where: { employeeId: 'EVOQ002' },
    update: {},
    create: {
      employeeId: 'EVOQ002',
      fullName: 'Vikram Malhotra',
      dateOfBirth: new Date('1985-05-12'),
      gender: 'Male',
      mobileNumber: '+91 99999 88888',
      personalEmail: 'vikram.m@gmail.com',
      currentAddress: 'Chancery Pavilion Road, Bangalore, KA, 560025',
      permanentAddress: 'Chancery Pavilion Road, Bangalore, KA, 560025',
      emergencyContactName: 'Sanjay Malhotra',
      emergencyContactNumber: '+91 99999 77777',
      emergencyContactRelationship: 'Brother',
      departmentId: deptAdmin.id,
      designation: 'Admin Head',
      siteId: siteHq.id,
      joiningDate: new Date('2022-01-10'),
      employmentType: 'FULL_TIME',
      employmentStatus: 'CONFIRMED',
      officialEmail: 'admin@houseofevoq.com',
    },
  });

  // Aisha Sharma (HR, Bangalore HQ, EVOQ001)
  const empAisha = await prisma.employee.upsert({
    where: { employeeId: 'EVOQ001' },
    update: {},
    create: {
      employeeId: 'EVOQ001',
      fullName: 'Aisha Sharma',
      dateOfBirth: new Date('1990-11-20'),
      gender: 'Female',
      mobileNumber: '+91 88888 77777',
      personalEmail: 'aisha.sharma@gmail.com',
      currentAddress: 'Koramangala 3rd Block, Bangalore, KA, 560034',
      permanentAddress: 'Koramangala 3rd Block, Bangalore, KA, 560034',
      emergencyContactName: 'Rajesh Sharma',
      emergencyContactNumber: '+91 88888 66666',
      emergencyContactRelationship: 'Father',
      departmentId: deptHr.id,
      designation: 'HR Head',
      siteId: siteHq.id,
      joiningDate: new Date('2022-02-15'),
      employmentType: 'FULL_TIME',
      employmentStatus: 'CONFIRMED',
      officialEmail: 'hr@houseofevoq.com',
    },
  });

  console.log('Employees seeded.');

  // 5. Create Documents
  await prisma.document.upsert({
    where: { id: 'doc-rohan-aadhaar' },
    update: {},
    create: {
      id: 'doc-rohan-aadhaar',
      employeeId: empRohan.id,
      category: 'Aadhaar Card',
      fileName: 'rohan_aadhaar.pdf',
      filePath: '/uploads/documents/rohan_aadhaar.pdf',
      version: 1,
      verificationStatus: 'VERIFIED',
      uploadedById: userHr.id,
    },
  });

  await prisma.document.upsert({
    where: { id: 'doc-priya-pan' },
    update: {},
    create: {
      id: 'doc-priya-pan',
      employeeId: empPriya.id,
      category: 'PAN Card',
      fileName: 'priya_pan.jpg',
      filePath: '/uploads/documents/priya_pan.jpg',
      version: 1,
      verificationStatus: 'PENDING',
      uploadedById: userHr.id,
    },
  });

  console.log('Documents seeded.');

  // 6. Create Attendance Logs (Present for Rohan, Priya, Arjun, Vikram, Aisha for the last 3 days)
  const attendanceStatuses = ['Present', 'Present', 'Present'];
  for (let i = 1; i <= 3; i++) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);
    logDate.setHours(0, 0, 0, 0);

    const employeesList = [empRohan, empPriya, empArjun, empVikram, empAisha];
    for (const emp of employeesList) {
      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: logDate,
          checkIn: new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate(), 9, 15, 0),
          checkOut: new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate(), 18, 0, 0),
          status: 'Present',
          workLocation: emp.siteId === siteHq.id ? 'Site' : 'On Site',
          workingHours: 8.75,
          lateArrival: false,
          enteredById: userHr.id,
        },
      });
    }
  }

  // Today's attendance - Rohan Present, Priya WFH, Arjun Absent, Vikram Present, Aisha Present
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  await prisma.attendance.create({
    data: {
      employeeId: empRohan.id,
      date: todayStart,
      checkIn: new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate(), 9, 45, 0), // Late arrival!
      status: 'Present',
      workLocation: 'Site',
      workingHours: 0,
      lateArrival: true,
      remarks: 'Late entry due to traffic.',
      enteredById: userHr.id,
    },
  });

  await prisma.attendance.create({
    data: {
      employeeId: empPriya.id,
      date: todayStart,
      checkIn: new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate(), 9, 0, 0),
      status: 'Work From Home',
      workLocation: 'WFH',
      workingHours: 0,
      enteredById: userHr.id,
    },
  });

  await prisma.attendance.create({
    data: {
      employeeId: empArjun.id,
      date: todayStart,
      status: 'Absent',
      workLocation: 'Site',
      workingHours: 0,
      leaveType: 'Unpaid Leave',
      enteredById: userHr.id,
    },
  });

  console.log('Attendance seeded.');

  // 7. Create Inventory Categories
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

  console.log('Inventory Categories seeded.');

  // 8. Create Inventory Items
  // Dell Latitude Laptop (IT Items, Bangalore HQ)
  const itemDell = await prisma.inventoryItem.upsert({
    where: { itemCode: 'IT-LAP-DELL-5420' },
    update: {},
    create: {
      itemCode: 'IT-LAP-DELL-5420',
      name: 'Dell Latitude 5420 Laptop',
      categoryId: catIt.id,
      unit: 'Pcs',
      openingStock: 20,
      currentStock: 18,
      minimumStockLevel: 5,
      siteId: siteHq.id,
      purchaseRate: 65000.00,
      supplier: 'Dell India',
      condition: 'New',
    },
  });

  // Wireless Mouse (IT Items, Noida)
  const itemMouse = await prisma.inventoryItem.upsert({
    where: { itemCode: 'IT-MOU-LOGI-M331' },
    update: {},
    create: {
      itemCode: 'IT-MOU-LOGI-M331',
      name: 'Logitech M331 Wireless Mouse',
      categoryId: catIt.id,
      unit: 'Pcs',
      openingStock: 50,
      currentStock: 48,
      minimumStockLevel: 10,
      siteId: siteNoida.id,
      purchaseRate: 999.00,
      supplier: 'Logitech Retail',
      condition: 'New',
    },
  });

  // A4 Paper Reams (Stationery, Bangalore HQ) - LOW STOCK ALERT!
  const itemPaper = await prisma.inventoryItem.upsert({
    where: { itemCode: 'ST-PAP-JK-A4' },
    update: {},
    create: {
      itemCode: 'ST-PAP-JK-A4',
      name: 'JK A4 Paper Ream (75GSM)',
      categoryId: catStationery.id,
      unit: 'Box',
      openingStock: 30,
      currentStock: 4, // below minimum 10
      minimumStockLevel: 10,
      siteId: siteHq.id,
      purchaseRate: 250.00,
      supplier: 'Stationery World',
    },
  });

  // Coffee Beans (Pantry, Noida) - OUT OF STOCK!
  const itemCoffee = await prisma.inventoryItem.upsert({
    where: { itemCode: 'PT-COF-NES-500G' },
    update: {},
    create: {
      itemCode: 'PT-COF-NES-500G',
      name: 'Nescafe Gold Coffee Beans 500g',
      categoryId: catPantry.id,
      unit: 'Pack',
      openingStock: 15,
      currentStock: 0, // Out of stock!
      minimumStockLevel: 3,
      siteId: siteNoida.id,
      purchaseRate: 1200.00,
      supplier: 'Nescafé Wholesale',
    },
  });

  // Premium Leather Gift Box (Gifting, Bangalore HQ)
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

  // Corrugated Shipping Box (Packaging, Bangalore HQ)
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

  console.log('Inventory Items seeded.');

  // 9. Record Stock Transactions
  await prisma.inventoryTransaction.create({
    data: {
      itemId: itemDell.id,
      quantity: 20,
      type: 'Stock Added',
      remarks: 'Initial inventory load',
      createdById: userAdmin.id,
    },
  });

  await prisma.inventoryTransaction.create({
    data: {
      itemId: itemPaper.id,
      quantity: 30,
      type: 'Stock Added',
      remarks: 'Initial inventory load',
      createdById: userAdmin.id,
    },
  });

  console.log('Stock transactions recorded.');

  // 10. Issued Assets to Employees
  // Issue Dell Laptop to Rohan Sen
  const assetRohan = await prisma.issuedAsset.upsert({
    where: { assetCode: 'AST-DELL-101' },
    update: {},
    create: {
      itemId: itemDell.id,
      assetCode: 'AST-DELL-101',
      serialNumber: 'CN-0X827D-101',
      employeeId: empRohan.id,
      departmentId: deptTech.id,
      siteId: siteHq.id,
      issueDate: new Date('2024-03-15'),
      expectedReturnDate: new Date('2027-03-15'),
      conditionAtIssue: 'New',
      issuedById: userAdmin.id,
      employeeAcknowledgement: true,
      remarks: 'Issued on joining.',
      status: 'Issued',
    },
  });

  // Issue Dell Laptop to Priya Nair
  const assetPriya = await prisma.issuedAsset.upsert({
    where: { assetCode: 'AST-DELL-102' },
    update: {},
    create: {
      itemId: itemDell.id,
      assetCode: 'AST-DELL-102',
      serialNumber: 'CN-0X827D-102',
      employeeId: empPriya.id,
      departmentId: deptOps.id,
      siteId: siteNoida.id,
      issueDate: new Date('2024-05-01'),
      expectedReturnDate: new Date('2027-05-01'),
      conditionAtIssue: 'New',
      issuedById: userAdmin.id,
      employeeAcknowledgement: true,
      remarks: 'Issued for remote operational tracking.',
      status: 'Issued',
    },
  });

  console.log('Assets issued.');

  // 11. Visitor Management Logs
  // Noida Site Candidate (Exit Recorded)
  const visitorKunal = await prisma.visitor.create({
    data: {
      name: 'Kunal Shah',
      phone: '9876543210',
      company: 'Cred',
      category: 'Candidate',
      purpose: 'Technical Interview',
      personToMeet: 'Rohan Sen',
      departmentId: deptTech.id,
      siteId: siteNoida.id,
      numberOfVisitors: 1,
      entryTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
      exitTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30, 0),
      isExisting: false,
      createdById: frontDeskUsersInfo[2].email === 'fd1.on@houseofevoq.com' 
        ? (await prisma.user.findUnique({ where: { email: 'fd1.on@houseofevoq.com' } })).id 
        : userAdmin.id,
    },
  });

  // Record separate exit entry
  await prisma.visitorExit.create({
    data: {
      visitorId: visitorKunal.id,
      exitTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30, 0),
      recordedById: visitorKunal.createdById,
    },
  });

  // HQ Client (Currently Inside, No Exit Time)
  const visitorSarah = await prisma.visitor.create({
    data: {
      name: 'Sarah Connor',
      phone: '9988776655',
      company: 'Cyberdyne Systems',
      category: 'Client',
      purpose: 'Partnership Discussion',
      personToMeet: 'Aisha Sharma',
      departmentId: deptHr.id,
      siteId: siteHq.id,
      numberOfVisitors: 2,
      entryTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0),
      isExisting: false,
      createdById: (await prisma.user.findUnique({ where: { email: 'fd1.hq@houseofevoq.com' } })).id,
    },
  });

  console.log('Visitors seeded.');

  // 12. Seed Indian Festivals & Holidays
  const currentYear = today.getFullYear();
  const festivalsData = [
    { name: 'Republic Day', date: new Date(`${currentYear}-01-26`), isCompanyHoliday: true, desc: 'National Holiday' },
    { name: 'Holi', date: new Date(`${currentYear}-03-14`), isCompanyHoliday: true, desc: 'Festival of Colors' },
    { name: 'Independence Day', date: new Date(`${currentYear}-08-15`), isCompanyHoliday: true, desc: 'National Holiday' },
    { name: 'Gandhi Jayanti', date: new Date(`${currentYear}-10-02`), isCompanyHoliday: true, desc: 'National Holiday' },
    { name: 'Diwali', date: new Date(`${currentYear}-11-08`), isCompanyHoliday: true, desc: 'Festival of Lights' },
  ];

  for (const f of festivalsData) {
    await prisma.festival.create({
      data: {
        name: f.name,
        date: f.date,
        year: currentYear,
        description: f.desc,
        isCompanyHoliday: f.isCompanyHoliday,
        applicableSites: JSON.stringify([siteHq.id, siteNoida.id, siteHyd.id, siteMumbai.id]),
        createdById: userHr.id,
      },
    });
  }

  console.log('Festivals seeded.');

  // 13. Seed Reminders
  await prisma.reminder.create({
    data: {
      title: 'A4 Paper Procurement',
      description: 'Stock of A4 paper is low at Bangalore HQ. Need to place purchase order.',
      date: new Date(today.getTime() + 24 * 60 * 60 * 1000 * 2), // in 2 days
      priority: 'HIGH',
      siteId: siteHq.id,
      assignedRole: 'ADMIN',
      createdById: userAdmin.id,
    },
  });

  await prisma.reminder.create({
    data: {
      title: 'Priya Nair 3-Month Confirmation Review',
      description: 'Schedule probation confirmation meeting with Priya Nair.',
      date: new Date(today.getTime() + 24 * 60 * 60 * 1000 * 5), // in 5 days
      priority: 'MEDIUM',
      siteId: siteNoida.id,
      assignedRole: 'HR',
      createdById: userHr.id,
    },
  });

  console.log('Reminders seeded.');

  // 14. Seed Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: userHr.id,
      userName: userHr.name,
      userRole: 'HR',
      module: 'SEEDED_DATA',
      action: 'INITIAL_SEED',
      reason: 'Database pre-population for development and demo.',
    },
  });

  console.log('Seed database finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
