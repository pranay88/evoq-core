import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import AttendanceDashboard from '@/components/attendance/attendance-dashboard';

interface AttendancePageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const session = await getSession();

  if (!session) {
    notFound();
  }

  const params = await searchParams;
  // Get date from query params or default to today's date in YYYY-MM-DD
  const dateText = params.date || new Date().toISOString().split('T')[0];
  const dateObj = new Date(dateText);
  dateObj.setHours(0, 0, 0, 0);

  // Fetch attendance records recorded for this selected date
  const attendanceLogs = await db.attendance.findMany({
    where: {
      date: dateObj,
    },
    include: {
      corrections: {
        include: {
          correctedBy: { select: { name: true } },
        },
      },
    },
  });

  // Fetch active employees to populate the grid
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

  return (
    <AttendanceDashboard
      attendanceLogs={attendanceLogs}
      employees={employees}
      selectedDate={dateText}
      userRole={session.role}
    />
  );
}
