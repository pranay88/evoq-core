'use server';

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

// Create a new company holiday / festival
export async function createFestivalAction(
  name: string,
  dateVal: string,
  isCompanyHoliday: boolean,
  description?: string
) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can add festivals.' };
  }

  if (!name || !dateVal) {
    return { success: false, message: 'Festival name and date are required.' };
  }

  try {
    const festivalDate = new Date(dateVal);
    const year = festivalDate.getFullYear();

    // Fetch all active site IDs to apply to all sites by default
    const sites = await db.site.findMany({ where: { status: 'ACTIVE' } });
    const siteIds = sites.map(s => s.id);

    const festival = await db.festival.create({
      data: {
        name,
        date: festivalDate,
        year,
        description: description || null,
        isCompanyHoliday,
        applicableSites: JSON.stringify(siteIds),
        isActive: true,
        createdById: session.userId,
      },
    });

    await logAudit(session.userId, session.name, session.role, 'CALENDAR', 'CREATE_FESTIVAL', {
      recordId: festival.id,
      newValues: { name, date: dateVal, isCompanyHoliday },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/calendar');

    return { success: true, message: `Festival ${name} added to calendar.` };

  } catch (error) {
    console.error('Create festival error:', error);
    return { success: false, message: 'Failed to add festival.' };
  }
}

// Create a reminder
export async function createReminderAction(
  title: string,
  description: string,
  dateVal: string,
  priority: string,
  assignedRole?: string,
  siteId?: string,
  departmentId?: string
) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Unauthorized.' };
  }

  if (!title || !dateVal || !priority) {
    return { success: false, message: 'Missing required reminder fields.' };
  }

  try {
    const reminder = await db.reminder.create({
      data: {
        title,
        description: description || null,
        date: new Date(dateVal),
        priority,
        assignedRole: assignedRole || null,
        siteId: siteId || null,
        departmentId: departmentId || null,
        createdById: session.userId,
        status: 'PENDING',
      },
    });

    await logAudit(session.userId, session.name, session.role, 'REMINDERS', 'CREATE_REMINDER', {
      recordId: reminder.id,
      newValues: { title, date: dateVal, priority, assignedRole },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/calendar');
    revalidatePath('/hr/reminders');
    revalidatePath('/admin/dashboard');
    revalidatePath('/frontdesk/dashboard');

    return { success: true, message: 'Reminder set successfully.' };

  } catch (error) {
    console.error('Create reminder error:', error);
    return { success: false, message: 'Failed to create reminder.' };
  }
}

// Complete a reminder task
export async function completeReminderAction(reminderId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Unauthorized.' };
  }

  try {
    const reminder = await db.reminder.findUnique({ where: { id: reminderId } });
    if (!reminder) {
      return { success: false, message: 'Reminder not found.' };
    }

    const updated = await db.reminder.update({
      where: { id: reminderId },
      data: {
        status: 'COMPLETED',
        completionDate: new Date(),
      },
    });

    await logAudit(session.userId, session.name, session.role, 'REMINDERS', 'COMPLETE_REMINDER', {
      recordId: reminderId,
      newValues: { status: 'COMPLETED' },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/calendar');
    revalidatePath('/hr/reminders');
    revalidatePath('/admin/dashboard');
    revalidatePath('/frontdesk/dashboard');

    return { success: true, message: 'Reminder marked as completed.' };

  } catch (error) {
    console.error('Complete reminder error:', error);
    return { success: false, message: 'Failed to update reminder.' };
  }
}
