'use server';

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getSession, setSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import ExcelJS from 'exceljs';

// Manual attendance logging
export async function logAttendanceAction(
  employeeId: string,
  dateVal: string,
  status: string,
  workLocation: string,
  checkInVal?: string,
  checkOutVal?: string,
  remarks?: string
) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can record attendance.' };
  }

  if (!employeeId || !dateVal || !status || !workLocation) {
    return { success: false, message: 'Missing required attendance fields.' };
  }

  try {
    const attendanceDate = new Date(dateVal);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if record already exists
    const existing = await db.attendance.findFirst({
      where: {
        employeeId,
        date: attendanceDate,
      },
    });

    if (existing) {
      return {
        success: false,
        message: 'Attendance record already exists for this date. Please use the Correction system.',
      };
    }

    const checkIn = checkInVal ? new Date(`${dateVal}T${checkInVal}`) : null;
    const checkOut = checkOutVal ? new Date(`${dateVal}T${checkOutVal}`) : null;

    let workingHours = 0.0;
    if (checkIn && checkOut) {
      workingHours = Math.round(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)) * 100) / 100;
    }

    const attendance = await db.attendance.create({
      data: {
        employeeId,
        date: attendanceDate,
        checkIn,
        checkOut,
        status,
        workLocation,
        workingHours,
        remarks: remarks || null,
        enteredById: session.userId,
      },
    });

    await logAudit(session.userId, session.name, session.role, 'ATTENDANCE', 'LOG_ATTENDANCE', {
      recordId: attendance.id,
      newValues: { employeeId, date: dateVal, status },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/attendance');

    return { success: true, message: 'Attendance recorded successfully.' };

  } catch (error) {
    console.error('Log attendance error:', error);
    return { success: false, message: 'Failed to record attendance.' };
  }
}

// Attendance Correction
export async function correctAttendanceAction(
  attendanceId: string,
  correctedValue: string,
  reason: string
) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can correct attendance.' };
  }

  if (!attendanceId || !correctedValue || !reason) {
    return { success: false, message: 'Missing correction fields.' };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const attendance = await tx.attendance.findUnique({
        where: { id: attendanceId },
      });

      if (!attendance) {
        throw new Error('Attendance record not found.');
      }

      if (attendance.status === correctedValue) {
        throw new Error('New status is same as the current status.');
      }

      // 1. Create correction history log
      await tx.attendanceCorrection.create({
        data: {
          attendanceId,
          originalValue: attendance.status,
          correctedValue,
          reason,
          correctedById: session.userId,
        },
      });

      // 2. Update attendance record
      const updated = await tx.attendance.update({
        where: { id: attendanceId },
        data: {
          status: correctedValue,
          remarks: attendance.remarks 
            ? `${attendance.remarks} (Corrected: ${reason})` 
            : `Corrected: ${reason}`,
        },
      });

      return updated;
    });

    await logAudit(session.userId, session.name, session.role, 'ATTENDANCE', 'CORRECT_ATTENDANCE', {
      recordId: attendanceId,
      previousValues: { status: result.status }, // wait, previous is in correction
      newValues: { status: correctedValue, reason },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/attendance');

    return { success: true, message: 'Attendance correction recorded.' };

  } catch (error: any) {
    console.error('Correct attendance error:', error);
    return { success: false, message: error.message || 'Failed to record attendance correction.' };
  }
}

// Bulk Excel Import for Attendance sheets
export async function importAttendanceAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can import attendance sheets.' };
  }

  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { success: false, message: 'Please select an Excel sheet to upload.' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer) as any;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { success: false, message: 'Invalid Excel structure. No sheets found.' };
    }

    const rowsInserted: any[] = [];
    const rowsSkipped: any[] = [];
    const errors: string[] = [];

    // Columns schema validation (Row 1 is headers)
    // Col 1: Employee ID, Col 2: Date (YYYY-MM-DD), Col 3: Status, Col 4: Check-In (HH:MM), Col 5: Check-Out (HH:MM), Col 6: Location (Site/WFH)
    
    // Start looping from Row 2
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row.values || row.values.length === 0) continue;

      const employeeId = row.getCell(1).text?.trim();
      const dateText = row.getCell(2).text?.trim();
      const status = row.getCell(3).text?.trim();
      const checkInText = row.getCell(4).text?.trim();
      const checkOutText = row.getCell(5).text?.trim();
      const location = row.getCell(6).text?.trim() || 'Site';

      if (!employeeId || !dateText || !status) {
        if (employeeId || dateText || status) {
          errors.push(`Row ${rowNumber}: Missing Employee ID, Date, or Status.`);
        }
        continue;
      }

      try {
        const dateObj = new Date(dateText);
        if (isNaN(dateObj.getTime())) {
          errors.push(`Row ${rowNumber}: Invalid date format "${dateText}". Use YYYY-MM-DD.`);
          continue;
        }
        dateObj.setHours(0, 0, 0, 0);

        // Find employee
        const employee = await db.employee.findUnique({
          where: { employeeId },
        });

        if (!employee) {
          errors.push(`Row ${rowNumber}: Employee ID "${employeeId}" not found.`);
          continue;
        }

        // Check if attendance already exists
        const existing = await db.attendance.findFirst({
          where: {
            employeeId: employee.id,
            date: dateObj,
          },
        });

        if (existing) {
          rowsSkipped.push({ employeeId, date: dateText, reason: 'Record already exists.' });
          continue;
        }

        const checkIn = checkInText ? new Date(`${dateText}T${checkInText}`) : null;
        const checkOut = checkOutText ? new Date(`${dateText}T${checkOutText}`) : null;

        let workingHours = 0.0;
        if (checkIn && checkOut) {
          workingHours = Math.round(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)) * 100) / 100;
        }

        // Insert attendance
        await db.attendance.create({
          data: {
            employeeId: employee.id,
            date: dateObj,
            checkIn,
            checkOut,
            status,
            workLocation: location,
            workingHours,
            enteredById: session.userId,
            remarks: 'Uploaded via bulk Excel import.',
          },
        });

        rowsInserted.push({ employeeId, date: dateText });

      } catch (rowErr: any) {
        errors.push(`Row ${rowNumber}: Database insertion error. Details: ${rowErr.message}`);
      }
    }

    // Log in Audit Trail
    await logAudit(session.userId, session.name, session.role, 'ATTENDANCE', 'IMPORT_EXCEL', {
      reason: `Imported attendance sheet: ${rowsInserted.length} rows inserted. ${rowsSkipped.length} skipped. ${errors.length} errors.`,
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/attendance');

    return {
      success: true,
      message: `Import completed: ${rowsInserted.length} loaded. ${rowsSkipped.length} skipped.`,
      summary: {
        inserted: rowsInserted.length,
        skipped: rowsSkipped.length,
        errors,
      },
    };

  } catch (error: any) {
    console.error('Import attendance error:', error);
    return { success: false, message: error.message || 'An error occurred during file parsing.' };
  }
}

// Attendance Portal Kiosk Check-In / Check-Out Action
export async function markPortalAttendanceAction(emailOrId: string, password: string) {
  if (!emailOrId || !password) {
    return { success: false, message: 'Please enter Email/Employee ID and Password.' };
  }

  try {
    // 1. Fetch Employee record first by email or employee ID
    const employee = await db.employee.findFirst({
      where: {
        OR: [
          { employeeId: emailOrId },
          { personalEmail: emailOrId },
          { officialEmail: emailOrId },
        ],
      },
    });

    if (!employee) {
      return { success: false, message: 'Invalid credentials. Employee not found.' };
    }

    // 2. Fetch corresponding User account using the employee emails to verify the password
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: employee.personalEmail },
          { email: employee.officialEmail || 'undefined-email' },
        ],
      },
    });

    if (!user) {
      return { success: false, message: 'No portal login account associated with this employee. Contact HR.' };
    }

    // Verify Password Hash (supports both scrypt and legacy sha256)
    const crypto = await import('crypto');
    const storedHash = user.passwordHash;
    let isValid = false;

    if (storedHash.includes(':')) {
      const [salt, key] = storedHash.split(':');
      const keyBuffer = Buffer.from(key, 'hex');
      const derivedKey = crypto.scryptSync(password, salt, 64);
      isValid = crypto.timingSafeEqual(keyBuffer, derivedKey);
    } else {
      const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
      isValid = storedHash === legacyHash;
    }

    if (!isValid) {
      return { success: false, message: 'Invalid credentials. Password incorrect.' };
    }

    if (user.status === 'INACTIVE') {
      return { success: false, message: 'This account has been deactivated. Contact HR.' };
    }

    // 3. Find today's log for the employee
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const existing = await db.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (!existing) {
      // Record Check-in (Entry Done)
      const now = new Date();
      
      // check if late arrival (after 09:00:59 AM)
      const standardTime = new Date(now);
      standardTime.setHours(9, 0, 59, 999);
      const isLate = now > standardTime;

      await db.attendance.create({
        data: {
          employee: { connect: { id: employee.id } },
          date: startOfDay,
          status: 'Present',
          checkIn: now,
          lateArrival: isLate,
          workLocation: 'OFFICE',
          enteredBy: { connect: { id: user.id } },
          remarks: 'Logged via Quick Attendance Portal.',
        },
      });

      await logAudit(user.id, user.name, user.role, 'ATTENDANCE', 'CHECK_IN', {
        newValues: {
          employeeName: employee.fullName,
          checkInTime: now.toLocaleTimeString(),
        },
        siteCode: user.siteId || 'HQ',
      });

      // Establish session for Dashboard access
      await setSession({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        siteId: user.siteId,
        siteCode: user.siteId || null,
        siteName: null,
        departmentId: user.departmentId,
      });

      return {
        success: true,
        type: 'CHECK_IN',
        name: employee.fullName,
        time: now.toLocaleTimeString(),
      };
    } else if (!existing.checkOut) {
      // Record Check-out (Exit Done)
      const now = new Date();
      
      // Calculate working hours if checkIn exists
      let workingHours = 0.0;
      if (existing.checkIn) {
        const diffMs = now.getTime() - new Date(existing.checkIn).getTime();
        workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // in hours, rounded to 1 decimal
      }

      await db.attendance.update({
        where: { id: existing.id },
        data: {
          checkOut: now,
          workingHours,
        },
      });

      await logAudit(user.id, user.name, user.role, 'ATTENDANCE', 'CHECK_OUT', {
        newValues: {
          employeeName: employee.fullName,
          checkOutTime: now.toLocaleTimeString(),
          workingHours,
        },
        siteCode: user.siteId || 'HQ',
      });

      // Establish session for Dashboard access
      await setSession({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        siteId: user.siteId,
        siteCode: user.siteId || null,
        siteName: null,
        departmentId: user.departmentId,
      });

      return {
        success: true,
        type: 'CHECK_OUT',
        name: employee.fullName,
        time: now.toLocaleTimeString(),
        workingHours,
      };
    } else {
      // Already checked out - still establish session so they can view dashboard
      await setSession({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        siteId: user.siteId,
        siteCode: user.siteId || null,
        siteName: null,
        departmentId: user.departmentId,
      });

      return {
        success: true,
        type: 'ALREADY_LOGGED',
        name: employee.fullName,
        time: new Date().toLocaleTimeString(),
        message: `You have already logged both entry and exit check-ins for today!`,
      };
    }
  } catch (error: any) {
    console.error('Portal attendance marker error:', error);
    return { success: false, message: error.message || 'Server error logging attendance.' };
  }
}
