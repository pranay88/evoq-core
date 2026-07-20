'use server';

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

// Interface for score breakdowns
export interface EmployeeLeaderboardRow {
  id: string;
  employeeId: string;
  fullName: string;
  photoUrl: string | null;
  designation: string;
  departmentName: string;
  siteName: string;
  attendanceScore: number; // max 50
  punctualityScore: number; // max 50
  totalScore: number; // max 100
  presentDays: number;
  earlyCheckinsCount: number;
  lateCheckinsCount: number;
  lateCheckoutsCount: number;
}

// Fetch leaderboard for a given month and year
export async function getLeaderboardAction(month: number, year: number): Promise<{ success: boolean; data?: EmployeeLeaderboardRow[]; message?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Unauthorized.' };
  }

  try {
    // 1. Fetch all active employees
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
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const leaderboard: EmployeeLeaderboardRow[] = [];

    // 2. Loop and calculate scores for each employee
    for (const emp of employees) {
      // A. Query attendance logs for this month
      const attendanceLogs = await db.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const presentLogs = attendanceLogs.filter(
        l => l.status === 'Present' || l.status === 'Work From Home' || l.status === 'On Site'
      );
      const presentDays = presentLogs.length;

      // Attendance score (max 50 pts): present days / 22 typical work days
      const presentRate = Math.min(presentDays / 22, 1);
      const attendanceScore = Math.round(presentRate * 50 * 10) / 10;

      // Punctuality & Overtime score (max 50 pts)
      let earlyCheckinsCount = 0;
      let lateCheckinsCount = 0;
      let lateCheckoutsCount = 0;
      let pPoints = 0;

      for (const log of presentLogs) {
        if (log.checkIn) {
          const checkInTime = new Date(log.checkIn);
          const inHours = checkInTime.getHours();
          const inMinutes = checkInTime.getMinutes();
          
          // coming early is good (on or before 09:00 AM)
          if (inHours < 9 || (inHours === 9 && inMinutes === 0)) {
            earlyCheckinsCount++;
            pPoints += 2;
          } else {
            lateCheckinsCount++;
            pPoints -= 2; // coming late is penalized
          }
        }

        if (log.checkOut) {
          const checkOutTime = new Date(log.checkOut);
          const outHours = checkOutTime.getHours();
          const outMinutes = checkOutTime.getMinutes();

          // going late is very good (leaving after 06:00 PM)
          if (outHours > 18 || (outHours === 18 && outMinutes >= 1)) {
            lateCheckoutsCount++;
            pPoints += 3;
          }
        }
      }

      // Cap Punctuality & Overtime between 0 and 50 points
      const punctualityScore = Math.max(0, Math.min(pPoints, 50));

      // D. Sum total score (max 100)
      const totalScore = Math.round((attendanceScore + punctualityScore) * 10) / 10;

      leaderboard.push({
        id: emp.id,
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        photoUrl: emp.photoUrl,
        designation: emp.designation,
        departmentName: emp.department?.name || '-',
        siteName: emp.site?.name || '-',
        attendanceScore,
        punctualityScore,
        totalScore,
        presentDays,
        earlyCheckinsCount,
        lateCheckinsCount,
        lateCheckoutsCount,
      });
    }

    // 3. Sort leaderboard by totalScore descending
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);

    return { success: true, data: leaderboard };

  } catch (error: any) {
    console.error('Fetch leaderboard calculations error:', error);
    return { success: false, message: error.message || 'Failed to fetch leaderboard.' };
  }
}

// Nominate/Declare Employee of the Month
export async function declareEmployeeOfTheMonthAction(
  employeeId: string,
  month: number,
  year: number,
  score: number,
  remarks: string
) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can declare Employee of the Month.' };
  }

  if (!employeeId || !month || !year || !score) {
    return { success: false, message: 'Missing nomination details.' };
  }

  try {
    // 1. Fetch leaderboard standings to verify Rank 1 nomination check
    const leaderboardRes = await getLeaderboardAction(month, year);
    if (!leaderboardRes.success || !leaderboardRes.data || leaderboardRes.data.length === 0) {
      return { success: false, message: 'Could not fetch leaderboard to verify standings.' };
    }

    const topEmployee = leaderboardRes.data[0];
    if (topEmployee.id !== employeeId) {
      return {
        success: false,
        message: `Nomination Rejected: Only the highest-scoring employee (${topEmployee.fullName} with ${topEmployee.totalScore} pts) can be declared Employee of the Month!`,
      };
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Check if award already exists for this month & year
      const existing = await tx.employeeOfTheMonth.findFirst({
        where: { month, year },
      });

      // Fetch employee details to construct name/designation for broadcast
      const employee = await tx.employee.findUnique({
        where: { id: employeeId },
        include: { department: true },
      });

      if (!employee) {
        throw new Error('Employee not found.');
      }

      let award;
      if (existing) {
        // Update declaration
        award = await tx.employeeOfTheMonth.update({
          where: { id: existing.id },
          data: {
            employeeId,
            score,
            remarks: remarks || null,
            declaredById: session.userId,
            declaredAt: new Date(),
          },
        });
      } else {
        // Insert new declaration
        award = await tx.employeeOfTheMonth.create({
          data: {
            employeeId,
            month,
            year,
            score,
            remarks: remarks || null,
            declaredById: session.userId,
          },
        });
      }

      // 2. Create a global notification announcement broadcast to all users
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[month - 1];

      await tx.notification.create({
        data: {
          title: `🏆 Employee of the Month Declared!`,
          description: `Congratulations to ${employee.fullName} (${employee.designation}, ${employee.department?.name}) for being declared Employee of the Month for ${monthName} ${year} with an outstanding performance score of ${score} pts!`,
          type: 'FESTIVAL',
          link: '/hr/leaderboard',
        },
      });

      return { award, employee };
    });

    await logAudit(session.userId, session.name, session.role, 'USERS', 'DECLARE_EMPLOYEE_OF_THE_MONTH', {
      recordId: result.award.id,
      newValues: {
        employeeName: result.employee.fullName,
        month,
        year,
        score,
      },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/leaderboard');
    revalidatePath('/hr/dashboard');
    revalidatePath('/admin/dashboard');
    revalidatePath('/frontdesk/dashboard');

    return {
      success: true,
      message: `Successfully declared ${result.employee.fullName} as Employee of the Month!`,
    };

  } catch (error: any) {
    console.error('Declare Employee of the Month error:', error);
    return { success: false, message: error.message || 'Failed to nominate Employee of the Month.' };
  }
}
