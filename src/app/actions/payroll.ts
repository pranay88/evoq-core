'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function calculatePayrollAction(employeeId: string, month: number, year: number) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can calculate payroll.' };
  }

  try {
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return { success: false, message: 'Employee not found.' };
    }

    // Get total days in the month
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    // Query attendance records for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    
    const attendances = await db.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lt: endDate,
        },
        status: {
          in: ['PRESENT', 'HALF_DAY'],
        },
      },
    });

    let daysPresent = 0;
    attendances.forEach(a => {
      if (a.status === 'PRESENT') {
        daysPresent += 1;
      } else if (a.status === 'HALF_DAY') {
        daysPresent += 0.5;
      }
    });

    const baseSalary = employee.baseSalary || 0;
    const perDaySalary = baseSalary / totalDaysInMonth;
    const calculatedSalary = perDaySalary * daysPresent;

    return {
      success: true,
      data: {
        baseSalary,
        totalDaysInMonth,
        daysPresent,
        perDaySalary,
        calculatedSalary: Math.round(calculatedSalary),
      }
    };
  } catch (error) {
    console.error('Calculate payroll error:', error);
    return { success: false, message: 'Failed to calculate payroll.' };
  }
}
