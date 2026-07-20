import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import CalendarDashboard from '@/components/calendar/calendar-dashboard';

interface CalendarPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function HrCalendarPage({ searchParams }: CalendarPageProps) {
  const session = await getSession();

  if (!session) {
    notFound();
  }

  const params = await searchParams;
  const activeTab = params.tab || 'birthdays';

  // Fetch all active employees (needed for birthday calculations)
  const employees = await db.employee.findMany({
    where: {
      employmentStatus: {
        notIn: ['RESIGNED', 'TERMINATED', 'INACTIVE'],
      },
    },
    include: {
      department: true,
      site: true,
    },
    orderBy: {
      fullName: 'asc',
    },
  });

  // Fetch all festivals
  const festivals = await db.festival.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Fetch reminders
  const reminders = await db.reminder.findMany({
    include: {
      site: true,
      department: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Fetch active sites and departments for selection dropdowns
  const [sites, departments] = await Promise.all([
    db.site.findMany({ where: { status: 'ACTIVE' } }),
    db.department.findMany({ where: { status: 'ACTIVE' } }),
  ]);

  return (
    <CalendarDashboard
      employees={employees}
      festivals={festivals}
      reminders={reminders}
      sites={sites}
      departments={departments}
      userRole={session.role}
      defaultTab={activeTab}
    />
  );
}
