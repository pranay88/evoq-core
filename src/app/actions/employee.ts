'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Fetches attendance and leave stats for the currently logged-in employee.
 */
export async function getEmployeeDashboardDataAction() {
  const session = await getSession();
  
  if (!session || !session.userId) {
    return { success: false, message: 'Unauthorized. Please login.' };
  }

  try {
    // 1. Get the User record to find their email
    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    // 2. Find the corresponding Employee record
    const employee = await db.employee.findFirst({
      where: {
        OR: [
          { personalEmail: { equals: user.email, mode: 'insensitive' } },
          { officialEmail: { equals: user.email, mode: 'insensitive' } },
        ],
      },
      include: {
        department: true,
        site: true,
      }
    });

    if (!employee) {
      return { success: false, message: 'Employee profile not linked to this account.' };
    }

    // 3. Get Attendance for the current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const monthlyAttendance = await db.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // 4. Calculate stats
    let totalPresent = 0;
    let totalLate = 0;
    let totalHours = 0;

    monthlyAttendance.forEach(record => {
      if (record.status === 'Present') totalPresent++;
      if (record.lateArrival) totalLate++;
      totalHours += record.workingHours || 0;
    });

    // 5. Get Leave Balances for current year
    const currentYear = today.getFullYear();
    const leaveBalances = await db.leaveBalance.findMany({
      where: {
        employeeId: employee.id,
        year: currentYear,
      }
    });

    // 6. Get Recent Leave Requests
    const recentLeaves = await db.leaveRequest.findMany({
      where: {
        employeeId: employee.id,
      },
      orderBy: {
        appliedAt: 'desc'
      },
      take: 5
    });

    return {
      success: true,
      employee,
      stats: {
        totalPresent,
        totalLate,
        totalHours: Math.round(totalHours * 10) / 10,
      },
      monthlyAttendance,
      leaveBalances,
      recentLeaves
    };

  } catch (error: any) {
    console.error('Error fetching employee dashboard data:', error);
    return { success: false, message: 'Failed to load dashboard data.' };
  }
}
