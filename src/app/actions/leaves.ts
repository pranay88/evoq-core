'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function applyLeaveAction(employeeId: string, leaveType: string, startDate: string, endDate: string, reason: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'EMPLOYEE' && session.role !== 'HR')) {
      return { success: false, message: 'Unauthorized.' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = await db.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        startDate: start,
        endDate: end,
        days,
        reason,
        status: 'PENDING',
      },
    });

    // Notify HR
    await db.notification.create({
      data: {
        title: 'New Leave Request',
        description: `Leave request for ${days} days from Employee ID: ${employeeId}.`,
        type: 'LEAVE',
        targetRole: 'HR',
        link: '/hr/leaves',
      }
    });

    revalidatePath('/employee');
    return { success: true, message: 'Leave application submitted successfully.' };
  } catch (error) {
    console.error('Leave application error:', error);
    return { success: false, message: 'Failed to apply for leave.' };
  }
}

export async function updateLeaveStatusAction(leaveId: string, status: 'APPROVED' | 'REJECTED', remarks: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR') {
      return { success: false, message: 'Unauthorized. Only HR can update leave status.' };
    }

    const leave = await db.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        hrRemarks: remarks,
        approvedById: session.userId,
      },
      include: { employee: true },
    });

    // Notify Employee
    await db.notification.create({
      data: {
        title: `Leave Request ${status}`,
        description: `Your leave request for ${leave.days} days has been ${status.toLowerCase()}.${remarks ? ` Remarks: ${remarks}` : ''}`,
        type: 'LEAVE',
        targetUserId: leave.employee.userId,
        link: '/employee',
      }
    });

    revalidatePath('/hr/leaves');
    return { success: true, message: `Leave request ${status.toLowerCase()} successfully.` };
  } catch (error) {
    console.error('Update leave status error:', error);
    return { success: false, message: 'Failed to update leave status.' };
  }
}
