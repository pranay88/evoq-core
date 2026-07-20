import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import FrontDeskDashboardView from '@/components/dashboard/frontdesk-dashboard-view';

export default async function FrontDeskDashboardPage() {
  const session = await getSession();

  if (!session) {
    notFound();
  }

  const siteId = session.siteId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch visitors registered today at this site context
  const visitorsToday = await db.visitor.findMany({
    where: {
      siteId: siteId || undefined,
      entryTime: { gte: today },
    },
    orderBy: {
      entryTime: 'desc',
    },
  });

  // Fetch active employee birthdays
  const allEmployees = await db.employee.findMany({
    where: {
      siteId: siteId || undefined,
      employmentStatus: { notIn: ['RESIGNED', 'TERMINATED', 'INACTIVE'] },
    },
    include: {
      department: true,
    },
  });

  // Birthdays today
  const birthdaysToday = allEmployees.filter((emp) => {
    const dob = new Date(emp.dateOfBirth);
    return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
  });

  // Birthdays upcoming (next 7 days)
  const upcomingBirthdays = allEmployees.filter((emp) => {
    const dob = new Date(emp.dateOfBirth);
    const m = dob.getMonth();
    const d = dob.getDate();
    
    // Check if within next 7 days (excluding today)
    const next7Days = [];
    for (let i = 1; i <= 7; i++) {
      const nextD = new Date(today);
      nextD.setDate(today.getDate() + i);
      next7Days.push({ month: nextD.getMonth(), date: nextD.getDate() });
    }
    return next7Days.some(day => day.month === m && day.date === d);
  });

  // Fetch upcoming Indian festivals
  const upcomingFestivals = await db.festival.findMany({
    where: {
      date: { gte: today },
      isActive: true,
    },
    orderBy: { date: 'asc' },
    take: 3,
  });

  // Fetch active reminders assigned to this site or roles matching FRONT_DESK
  const reminders = await db.reminder.findMany({
    where: {
      status: 'PENDING',
      OR: [
        { siteId: siteId || undefined },
        { assignedRole: 'FRONT_DESK' },
      ],
    },
    orderBy: { date: 'asc' },
    take: 5,
  });

  // Fetch last declared Employee of the Month
  const lastEom = await db.employeeOfTheMonth.findFirst({
    orderBy: { declaredAt: 'desc' },
    include: { employee: { include: { department: true, site: true } } },
  });

  return (
    <FrontDeskDashboardView
      user={session}
      visitorsToday={visitorsToday}
      birthdaysToday={birthdaysToday}
      upcomingBirthdays={upcomingBirthdays}
      upcomingFestivals={upcomingFestivals}
      reminders={reminders}
      lastEom={lastEom}
    />
  );
}
