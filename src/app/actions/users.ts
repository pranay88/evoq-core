'use server';

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

// Create user account
export async function createUserAction(
  name: string,
  email: string,
  passwordVal: string,
  role: string,
  siteId: string
) {
  const session = await getSession();
  if (!session || (session.role !== 'HR' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized. Only HR or Admin can manage user accounts.' };
  }

  if (role === 'SUPER_ADMIN' && session.role !== 'SUPER_ADMIN') {
    return { success: false, message: 'Unauthorized. Only Super Admins can create Super Admins.' };
  }

  if (!name || !email || !role || !siteId) {
    return { success: false, message: 'Missing required account registration fields.' };
  }

  try {
    // Validate unique email
    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, message: `Email ${email} is already registered.` };
    }

    const defaultPassword = `${name.split(' ')[0]}@evoq`;
    const finalPassword = passwordVal || defaultPassword;
    const hashedPassword = hashPassword(finalPassword);

    const result = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          role,
          siteId,
          status: 'ACTIVE',
        },
      });

      const isEmployeeRole = ['EMPLOYEE', 'CRM', 'ACCOUNTS', 'IT', 'DIGITAL', 'LEGAL', 'CIVIL', 'SUPERVISOR'].includes(role);

      if (isEmployeeRole) {
        const existingEmployee = await tx.employee.findFirst({
          where: {
            OR: [
              { personalEmail: email },
              { officialEmail: email }
            ]
          }
        });

        if (!existingEmployee) {
          const empCount = await tx.employee.count();
          // Use timestamp to guarantee unique employeeId in high concurrency, avoiding duplicate EVOQ105 etc
          const nextSeq = 101 + empCount;
          const uniqueSuffix = Date.now().toString().slice(-4);
          const employeeId = `EVOQ${nextSeq}-${uniqueSuffix}`;

          let dept = await tx.department.findFirst();
          if (!dept) {
            dept = await tx.department.create({ data: { name: 'General', code: 'GEN', headName: 'Admin', status: 'ACTIVE' } });
          }

          await tx.employee.create({
            data: {
              employeeId,
              fullName: name,
              personalEmail: email,
              officialEmail: email,
              mobileNumber: 'PENDING',
              dateOfBirth: new Date(),
              gender: 'PENDING',
              currentAddress: 'PENDING',
              permanentAddress: 'PENDING',
              emergencyContactName: 'PENDING',
              emergencyContactNumber: 'PENDING',
              emergencyContactRelationship: 'PENDING',
              departmentId: dept.id,
              designation: 'PENDING',
              siteId: siteId,
              joiningDate: new Date(),
              employmentType: 'FULL_TIME',
              employmentStatus: 'ACTIVE',
            }
          });
        }
      }
      return newUser;
    });

    await logAudit(session.userId, session.name, session.role, 'USERS', 'CREATE_USER', {
      recordId: result.id,
      newValues: { name, email, role, siteId },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/users');

    return { success: true, message: `User account for ${name} registered successfully.` };

  } catch (error: any) {
    console.error('Create user error:', error);
    return { success: false, message: `Failed to create user account: ${error?.message || 'Unknown error'}` };
  }
}

// Toggle user status (Active/Inactive)
export async function toggleUserStatusAction(userId: string, currentStatus: string) {
  const session = await getSession();
  if (!session || (session.role !== 'HR' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized.' };
  }

  if (userId === session.userId) {
    return { success: false, message: 'Self-deactivation is prohibited.' };
  }

  try {
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (targetUser?.role === 'SUPER_ADMIN' && session.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Unauthorized. Only Super Admins can manage Super Admins.' };
    }

    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await db.user.update({
      where: { id: userId },
      data: { status: nextStatus },
    });

    await logAudit(session.userId, session.name, session.role, 'USERS', 'TOGGLE_STATUS', {
      recordId: userId,
      newValues: { status: nextStatus },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/users');

    return { success: true, message: `User status changed to ${nextStatus.toLowerCase()}.` };

  } catch (error) {
    console.error('Toggle status error:', error);
    return { success: false, message: 'Failed to update user status.' };
  }
}

// Reset password directly
export async function resetUserPasswordAction(userId: string, newPasswordVal: string) {
  const session = await getSession();
  if (!session || (session.role !== 'HR' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized.' };
  }

  if (!newPasswordVal || newPasswordVal.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }

  try {
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (targetUser?.role === 'SUPER_ADMIN' && session.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Unauthorized. Only Super Admins can manage Super Admins.' };
    }

    const hashedPassword = hashPassword(newPasswordVal);

    await db.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    await logAudit(session.userId, session.name, session.role, 'USERS', 'RESET_PASSWORD', {
      recordId: userId,
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/users');

    return { success: true, message: 'User password reset successfully.' };

  } catch (error) {
    console.error('Reset user password error:', error);
    return { success: false, message: 'Failed to reset user password.' };
  }
}

// Delete user login permanently
export async function deleteUserAction(targetUserId: string) {
  const session = await getSession();
  if (!session || (session.role !== 'HR' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized. Only HR or Admin can manage user accounts.' };
  }

  if (targetUserId === session.userId) {
    return { success: false, message: 'Self-deletion is prohibited.' };
  }

  try {
    // 1. Verify if user exists
    const userToDelete = await db.user.findUnique({
      where: { id: targetUserId },
    });

    if (!userToDelete) {
      return { success: false, message: 'User account not found.' };
    }

    if (userToDelete.role === 'SUPER_ADMIN' && session.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Unauthorized. Only Super Admins can manage Super Admins.' };
    }

    // 2. Database transaction to reassign attribution to current HR user and delete target user cleanly
    await db.$transaction(async (tx) => {
      // Reassign document uploads
      await tx.document.updateMany({
        where: { uploadedById: targetUserId },
        data: { uploadedById: session.userId },
      });

      // Reassign invitation creations
      await tx.employeeInvitation.updateMany({
        where: { createdById: targetUserId },
        data: { createdById: session.userId },
      });

      // Reassign attendance entries
      await tx.attendance.updateMany({
        where: { enteredById: targetUserId },
        data: { enteredById: session.userId },
      });

      // Reassign attendance corrections
      await tx.attendanceCorrection.updateMany({
        where: { correctedById: targetUserId },
        data: { correctedById: session.userId },
      });

      // Reassign inventory transactions
      await tx.inventoryTransaction.updateMany({
        where: { createdById: targetUserId },
        data: { createdById: session.userId },
      });

      // Reassign assets issued
      await tx.issuedAsset.updateMany({
        where: { issuedById: targetUserId },
        data: { issuedById: session.userId },
      });

      // Reassign assets returns received
      await tx.assetReturn.updateMany({
        where: { receivedById: targetUserId },
        data: { receivedById: session.userId },
      });

      // Reassign visitors created
      await tx.visitor.updateMany({
        where: { createdById: targetUserId },
        data: { createdById: session.userId },
      });

      // Reassign visitor exits recorded
      await tx.visitorExit.updateMany({
        where: { recordedById: targetUserId },
        data: { recordedById: session.userId },
      });

      // Reassign visitor corrections made
      await tx.visitorCorrection.updateMany({
        where: { correctedById: targetUserId },
        data: { correctedById: session.userId },
      });

      // Reassign festivals created
      await tx.festival.updateMany({
        where: { createdById: targetUserId },
        data: { createdById: session.userId },
      });

      // Reassign reminders created
      await tx.reminder.updateMany({
        where: { createdById: targetUserId },
        data: { createdById: session.userId },
      });

      // Finally, delete the User record permanently
      await tx.user.delete({
        where: { id: targetUserId },
      });
    });

    // 3. Log to audit trail
    await logAudit(session.userId, session.name, session.role, 'USERS', 'DELETE_USER', {
      recordId: targetUserId,
      reason: `Permanently deleted user account for ${userToDelete.name} (${userToDelete.email}). All operational attributions reassigned to ${session.name}.`,
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/users');

    return { success: true, message: `Permanently deleted user account for ${userToDelete.name}.` };

  } catch (error: any) {
    console.error('Delete user login error:', error);
    return { success: false, message: error.message || 'Failed to delete user login permanently.' };
  }
}
