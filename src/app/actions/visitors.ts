'use server';

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

// Lookup previous visitor by phone number (returns basic reusable info)
export async function lookupVisitorPhoneAction(phone: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Unauthorized' };
  }

  if (!phone || phone.length < 10) {
    return { success: false, found: false };
  }

  try {
    const lastVisit = await db.visitor.findFirst({
      where: { phone },
      orderBy: { entryTime: 'desc' },
      select: {
        name: true,
        company: true,
      },
    });

    if (lastVisit) {
      return {
        success: true,
        found: true,
        name: lastVisit.name,
        company: lastVisit.company,
      };
    }

    return { success: true, found: false };
  } catch (error) {
    console.error('Visitor phone lookup error:', error);
    return { success: false, found: false };
  }
}

// Create a new visitor entry (locked and non-editable upon submission)
export async function createVisitorAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Unauthorized.' };
  }

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const company = formData.get('company') as string;
  const category = formData.get('category') as string;
  const purpose = formData.get('purpose') as string;
  const personToMeet = formData.get('personToMeet') as string;
  const siteId = formData.get('siteId') as string;
  const numVisitors = parseInt(formData.get('numberOfVisitors') as string || '1', 10);
  const vehicleNumber = formData.get('vehicleNumber') as string;
  const itemsCarried = formData.get('itemsCarried') as string;
  const remarks = formData.get('remarks') as string;

  if (!name || !phone || !category || !purpose || !personToMeet || !siteId) {
    return { success: false, message: 'Missing required check-in fields.' };
  }

  try {
    // 1. Check if they are an existing visitor
    const previous = await db.visitor.findFirst({
      where: { phone },
    });

    const isExisting = !!previous;

    // 2. Create visitor log
    const visitor = await db.visitor.create({
      data: {
        name,
        phone,
        company: company || null,
        category,
        purpose,
        personToMeet,
        siteId,
        numberOfVisitors: numVisitors,
        vehicleNumber: vehicleNumber || null,
        itemsCarried: itemsCarried || null,
        isExisting,
        remarks: remarks || null,
        createdById: session.userId,
      },
    });

    // Log to Audit Trail
    await logAudit(session.userId, session.name, session.role, 'VISITORS', 'CHECK_IN_VISITOR', {
      recordId: visitor.id,
      newValues: { name, phone, isExisting, siteId },
      siteCode: session.siteCode,
    });

    revalidatePath('/frontdesk/visitors');
    revalidatePath('/frontdesk/dashboard');

    return {
      success: true,
      message: 'Visitor checked in successfully.',
    };

  } catch (error) {
    console.error('Check in visitor error:', error);
    return { success: false, message: 'Failed to record visitor check-in.' };
  }
}

// Record visitor exit
export async function recordVisitorExitAction(visitorId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Unauthorized.' };
  }

  try {
    const visitor = await db.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!visitor) {
      return { success: false, message: 'Visitor record not found.' };
    }

    if (visitor.exitTime) {
      return { success: false, message: 'Visitor has already checked out.' };
    }

    const exitTime = new Date();

    const result = await db.$transaction(async (tx) => {
      // 1. Update visitor exitTime
      const updated = await tx.visitor.update({
        where: { id: visitorId },
        data: { exitTime },
      });

      // 2. Record in VisitorExit table
      await tx.visitorExit.create({
        data: {
          visitorId,
          exitTime,
          recordedById: session.userId,
        },
      });

      return updated;
    });

    // Log in Audit Trail
    await logAudit(session.userId, session.name, session.role, 'VISITORS', 'RECORD_EXIT', {
      recordId: visitorId,
      newValues: { exitTime },
      siteCode: session.siteCode,
    });

    revalidatePath('/frontdesk/visitors');
    revalidatePath('/frontdesk/dashboard');

    return { success: true, message: 'Visitor checkout recorded successfully.' };

  } catch (error) {
    console.error('Record visitor exit error:', error);
    return { success: false, message: 'Failed to record visitor exit.' };
  }
}

// Add a correction note (preserving original entry)
export async function addVisitorCorrectionAction(visitorId: string, note: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Unauthorized.' };
  }

  if (!note) {
    return { success: false, message: 'Correction note content cannot be empty.' };
  }

  try {
    const visitor = await db.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) {
      return { success: false, message: 'Visitor record not found.' };
    }

    // Add note to correction log
    const correction = await db.visitorCorrection.create({
      data: {
        visitorId,
        correctionNote: note,
        correctedById: session.userId,
      },
    });

    // Log in Audit Trail
    await logAudit(session.userId, session.name, session.role, 'VISITORS', 'ADD_CORRECTION', {
      recordId: visitorId,
      reason: note,
      siteCode: session.siteCode,
    });

    revalidatePath('/frontdesk/visitors');

    return { success: true, message: 'Correction note appended successfully.' };

  } catch (error) {
    console.error('Visitor correction note error:', error);
    return { success: false, message: 'Failed to save correction note.' };
  }
}
