'use server';

import { sanitizeHtml } from '@/lib/sanitize';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

const employeeSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of Birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  bloodGroup: z.string().optional(),
  mobileNumber: z.string().min(10, 'Mobile must be at least 10 digits'),
  personalEmail: z.string().email('Invalid personal email address'),
  currentAddress: z.string().min(5, 'Current address is required'),
  permanentAddress: z.string().min(5, 'Permanent address is required'),
  
  emergencyContactName: z.string().min(2, 'Contact name is required'),
  emergencyContactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
  emergencyContactRelationship: z.string().min(1, 'Relationship is required'),
  
  departmentId: z.string().min(1, 'Department is required'),
  designation: z.string().min(2, 'Designation is required'),
  reportingManagerId: z.string().optional(),
  siteId: z.string().min(1, 'Site location is required'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  employmentType: z.string().min(1, 'Employment type is required'),
  probationPeriodDays: z.coerce.number().default(90),
  officialEmail: z.string().email().optional().or(z.literal('')),
  officialPhone: z.string().optional(),
  shift: z.string().optional(),
  noticePeriodDays: z.coerce.number().default(30),
  employmentStatus: z.string().default('ACTIVE'),

  bankName: z.string().optional(),
  bankAccountHolderName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  uanNumber: z.string().optional(),
  pfDetails: z.string().optional(),
  esiDetails: z.string().optional(),
});

export async function createEmployeeAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can add employees.' };
  }

  // Parse and sanitize raw form values
  const rawData: any = {};
  formData.forEach((value, key) => {
    rawData[key] = typeof value === 'string' ? sanitizeHtml(value) : value;
  });

  // Validate fields
  const validatedFields = employeeSchema.safeParse(rawData);
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  const data = validatedFields.data;

  try {
    // Check personal email uniqueness
    const emailExists = await db.employee.findFirst({
      where: {
        OR: [
          { personalEmail: data.personalEmail },
          data.officialEmail ? { officialEmail: data.officialEmail } : {},
        ].filter(cond => Object.keys(cond).length > 0)
      }
    });

    if (emailExists) {
      return {
        success: false,
        message: 'An employee with this email already exists.',
      };
    }

    // Auto-generate employee ID (EVOQ + sequential number starting at 101)
    const empCount = await db.employee.count();
    const nextSeq = 101 + empCount;
    const employeeId = `EVOQ${nextSeq}`;

    // Create the employee record
    const employee = await db.employee.create({
      data: {
        employeeId,
        fullName: data.fullName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        bloodGroup: data.bloodGroup || null,
        mobileNumber: data.mobileNumber,
        personalEmail: data.personalEmail,
        currentAddress: data.currentAddress,
        permanentAddress: data.permanentAddress,
        emergencyContactName: data.emergencyContactName,
        emergencyContactNumber: data.emergencyContactNumber,
        emergencyContactRelationship: data.emergencyContactRelationship,
        departmentId: data.departmentId,
        designation: data.designation,
        reportingManagerId: data.reportingManagerId || null,
        siteId: data.siteId,
        joiningDate: new Date(data.joiningDate),
        employmentType: data.employmentType,
        probationPeriodDays: data.probationPeriodDays,
        officialEmail: data.officialEmail || null,
        officialPhone: data.officialPhone || null,
        shift: data.shift || null,
        noticePeriodDays: data.noticePeriodDays,
        employmentStatus: data.employmentStatus,
        
        bankName: data.bankName || null,
        bankAccountHolderName: data.bankAccountHolderName || null,
        bankAccountNumber: data.bankAccountNumber || null,
        bankIfscCode: data.bankIfscCode || null,
        panNumber: data.panNumber || null,
        aadhaarNumber: data.aadhaarNumber || null,
        uanNumber: data.uanNumber || null,
        pfDetails: data.pfDetails || null,
        esiDetails: data.esiDetails || null,
      },
    });

    // Log to Audit Trail
    await logAudit(session.userId, session.name, session.role, 'EMPLOYEES', 'CREATE_EMPLOYEE', {
      recordId: employee.id,
      newValues: { employeeId, fullName: employee.fullName },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/employees');

    return {
      success: true,
      message: 'Employee record created successfully.',
    };

  } catch (error) {
    console.error('Create employee database error:', error);
    return {
      success: false,
      message: 'Failed to create employee profile due to a database issue.',
    };
  }
}

export async function updateEmployeeAction(id: string, prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can update employees.' };
  }

  // Parse and sanitize raw form values
  const rawData: any = {};
  formData.forEach((value, key) => {
    rawData[key] = typeof value === 'string' ? sanitizeHtml(value) : value;
  });

  const validatedFields = employeeSchema.safeParse(rawData);
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  const data = validatedFields.data;

  try {
    const existing = await db.employee.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, message: 'Employee not found.' };
    }

    // Update record
    const updated = await db.employee.update({
      where: { id },
      data: {
        fullName: data.fullName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        bloodGroup: data.bloodGroup || null,
        mobileNumber: data.mobileNumber,
        personalEmail: data.personalEmail,
        currentAddress: data.currentAddress,
        permanentAddress: data.permanentAddress,
        emergencyContactName: data.emergencyContactName,
        emergencyContactNumber: data.emergencyContactNumber,
        emergencyContactRelationship: data.emergencyContactRelationship,
        departmentId: data.departmentId,
        designation: data.designation,
        reportingManagerId: data.reportingManagerId || null,
        siteId: data.siteId,
        joiningDate: new Date(data.joiningDate),
        employmentType: data.employmentType,
        probationPeriodDays: data.probationPeriodDays,
        officialEmail: data.officialEmail || null,
        officialPhone: data.officialPhone || null,
        shift: data.shift || null,
        noticePeriodDays: data.noticePeriodDays,
        employmentStatus: data.employmentStatus,
        
        bankName: data.bankName || null,
        bankAccountHolderName: data.bankAccountHolderName || null,
        bankAccountNumber: data.bankAccountNumber || null,
        bankIfscCode: data.bankIfscCode || null,
        panNumber: data.panNumber || null,
        aadhaarNumber: data.aadhaarNumber || null,
        uanNumber: data.uanNumber || null,
        pfDetails: data.pfDetails || null,
        esiDetails: data.esiDetails || null,
      },
    });

    // Log to Audit Trail
    await logAudit(session.userId, session.name, session.role, 'EMPLOYEES', 'UPDATE_EMPLOYEE', {
      recordId: id,
      previousValues: { fullName: existing.fullName, status: existing.employmentStatus },
      newValues: { fullName: updated.fullName, status: updated.employmentStatus },
      siteCode: session.siteCode,
    });

    revalidatePath(`/hr/employees/${id}`);

    return {
      success: true,
      message: 'Employee profile updated successfully.',
    };

  } catch (error) {
    console.error('Update employee database error:', error);
    return {
      success: false,
      message: 'Failed to update employee profile due to a database issue.',
    };
  }
}

export async function toggleEmployeeStatusAction(id: string, status: string) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can perform this action.' };
  }

  try {
    const existing = await db.employee.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, message: 'Employee not found.' };
    }

    const updated = await db.employee.update({
      where: { id },
      data: {
        employmentStatus: status,
      },
    });

    // Log to Audit Trail
    await logAudit(session.userId, session.name, session.role, 'EMPLOYEES', 'CHANGE_STATUS', {
      recordId: id,
      previousValues: { status: existing.employmentStatus },
      newValues: { status: updated.employmentStatus },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/employees');
    revalidatePath(`/hr/employees/${id}`);

    return { success: true, message: `Status updated to ${status}.` };
  } catch (error) {
    console.error('Toggle status error:', error);
    return { success: false, message: 'Failed to update employee status.' };
  }
}

export async function updateEmployeeProfileAction(
  id: string,
  data: {
    fullName: string,
    mobileNumber: string,
    gender: string,
    bloodGroup: string,
    currentAddress: string,
    permanentAddress: string,
    emergencyContactName: string,
    emergencyContactNumber: string,
    emergencyContactRelationship: string,
  }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'EMPLOYEE' && session.role !== 'HR' && session.role !== 'SUPER_ADMIN')) {
      return { success: false, message: 'Unauthorized.' };
    }

    await db.employee.update({
      where: { id },
      data: {
        fullName: data.fullName,
        mobileNumber: data.mobileNumber,
        gender: data.gender,
        bloodGroup: data.bloodGroup || null,
        currentAddress: data.currentAddress,
        permanentAddress: data.permanentAddress,
        emergencyContactName: data.emergencyContactName,
        emergencyContactNumber: data.emergencyContactNumber,
        emergencyContactRelationship: data.emergencyContactRelationship,
      }
    });

    if (session.role === 'EMPLOYEE') {
      await db.user.updateMany({
        where: { email: session.email },
        data: { name: data.fullName }
      });
      revalidatePath('/employee/dashboard');
    }

    return { success: true, message: 'Profile updated successfully.' };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, message: 'Failed to update profile.' };
  }
}

export async function deleteEmployeeAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== "HR") {
    return { success: false, message: "Unauthorized." };
  }

  try {
    await db.$transaction(async (tx) => {
      // 1. EmployeeOfTheMonth
      await tx.employeeOfTheMonth.deleteMany({ where: { employeeId: id } });
      
      // 2. Documents and Versions
      const docs = await tx.document.findMany({ where: { employeeId: id }, select: { id: true } });
      const docIds = docs.map(d => d.id);
      if (docIds.length > 0) {
        await tx.documentVersion.deleteMany({ where: { documentId: { in: docIds } } });
        await tx.document.deleteMany({ where: { employeeId: id } });
      }

      // 3. Attendance and Corrections
      const atts = await tx.attendance.findMany({ where: { employeeId: id }, select: { id: true } });
      const attIds = atts.map(a => a.id);
      if (attIds.length > 0) {
        await tx.attendanceCorrection.deleteMany({ where: { attendanceId: { in: attIds } } });
        await tx.attendance.deleteMany({ where: { employeeId: id } });
      }

      // 4. Leaves
      await tx.leaveBalance.deleteMany({ where: { employeeId: id } });
      await tx.leaveRequest.deleteMany({ where: { employeeId: id } });

      // 5. Assets
      const assets = await tx.issuedAsset.findMany({ where: { employeeId: id }, select: { id: true } });
      const assetIds = assets.map(a => a.id);
      if (assetIds.length > 0) {
        await tx.assetReturn.deleteMany({ where: { issuedAssetId: { in: assetIds } } });
        await tx.issuedAsset.deleteMany({ where: { employeeId: id } });
      }

      // Nullify inventory transactions
      await tx.inventoryTransaction.updateMany({
        where: { employeeId: id },
        data: { employeeId: null }
      });

      // 6. Audit Logs
      await tx.auditLog.deleteMany({ where: { recordId: id } });

      // 7. Finally Employee
      await tx.employee.delete({ where: { id } });
    });

    revalidatePath("/hr/employees");
    return { success: true, message: "Employee profile deleted." };
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    return { success: false, message: error.message || "Failed to delete employee." };
  }
}
