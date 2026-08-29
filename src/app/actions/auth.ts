'use server';

import { z } from 'zod';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { setSession, clearSession, getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { sanitizeHtml } from '@/lib/sanitize';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Legacy hashing algorithm
function hashPasswordLegacy(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Secure Scrypt hashing algorithm
function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

// Verify password with fallback for legacy hashes
function verifyPassword(password: string, storedHash: string): { isValid: boolean; needsMigration: boolean } {
  if (storedHash.includes(':')) {
    // It's a scrypt hash
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    
    // Protect against timing attacks
    const isValid = crypto.timingSafeEqual(keyBuffer, derivedKey);
    return { isValid, needsMigration: false };
  } else {
    // Legacy sha256 hash
    const isValid = storedHash === hashPasswordLegacy(password);
    return { isValid, needsMigration: isValid }; // If valid, migrate!
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const rawEmail = formData.get('email') as string || '';
  const email = sanitizeHtml(rawEmail);
  const password = formData.get('password') as string;

  // Validate fields
  const validatedFields = loginSchema.safeParse({ email, password });
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid input fields.',
    };
  }

  try {
    // Check user in database, including site relation
    const user = await db.user.findUnique({
      where: { email },
      include: {
        site: true,
      },
    });

    if (!user) {
      // Log failed attempt
      await db.loginAttempt.create({
        data: {
          email,
          status: 'FAILED',
        },
      });

      return {
        success: false,
        message: 'Invalid email or password.',
      };
    }

    // Check account status
    if (user.status === 'INACTIVE') {
      await db.loginAttempt.create({ data: { email, status: 'FAILED' } });
      return { success: false, message: 'This account has been deactivated. Please contact HR.' };
    }

    if (user.status === 'LOCKED' || user.failedLoginAttempts >= 5) {
      await db.loginAttempt.create({ data: { email, status: 'FAILED' } });
      return { success: false, message: 'Account locked due to too many failed attempts. Please contact HR.' };
    }

    const { isValid, needsMigration } = verifyPassword(password, user.passwordHash);

    if (!isValid) {
      // Increment failed login attempts
      const updatedFailedAttempts = user.failedLoginAttempts + 1;
      
      const updateData: any = { failedLoginAttempts: updatedFailedAttempts };
      if (updatedFailedAttempts >= 5) {
        updateData.status = 'LOCKED';
      }
      
      await db.user.update({
        where: { id: user.id },
        data: updateData,
      });

      await db.loginAttempt.create({ data: { email, status: 'FAILED' } });

      if (updatedFailedAttempts >= 5) {
        return { success: false, message: 'Account locked due to too many failed attempts. Please contact HR.' };
      }

      return { success: false, message: 'Invalid email or password.' };
    }

    // Success! Reset failed attempts and update last login
    const updateData: any = {
      failedLoginAttempts: 0,
      lastLogin: new Date(),
    };
    
    // Migrate to Scrypt if they were on legacy hash
    if (needsMigration) {
      updateData.passwordHash = hashPasswordScrypt(password);
    }

    await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Create session payload
    await setSession({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      siteId: user.siteId,
      siteCode: user.site?.code || null,
      siteName: user.site?.name || null,
      departmentId: user.departmentId,
    });

    // Log success login attempt
    await db.loginAttempt.create({
      data: {
        email,
        status: 'SUCCESS',
      },
    });

    // Log Audit Trail
    await logAudit(user.id, user.name, user.role, 'AUTH', 'LOGIN', {
      siteCode: user.site?.code,
    });

    return {
      success: true,
      role: user.role,
      message: 'Login successful.',
    };

  } catch (error) {
    console.error('Login action error:', error);
    return {
      success: false,
      message: 'An unexpected database error occurred. Please try again.',
    };
  }
}

import { redirect } from 'next/navigation';

export async function logoutAction(userId: string, userName: string, userRole: string) {
  try {
    await logAudit(userId, userName, userRole, 'AUTH', 'LOGOUT');
  } catch (error) {}
  
  await clearSession();
  redirect('/login');
}

export async function resetPasswordAction(rawEmail: string, password: string) {
  const email = sanitizeHtml(rawEmail);
  const validatedFields = loginSchema.safeParse({ email, password });
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid password. Must be at least 6 characters.',
    };
  }

  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return {
        success: false,
        message: 'No account registered with this email.',
      };
    }

    const hashedPassword = hashPasswordScrypt(password);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        failedLoginAttempts: 0,
        status: 'ACTIVE', // Unlocks the account if it was locked!
      },
    });

    await logAudit(user.id, user.name, user.role, 'AUTH', 'PASSWORD_RESET', {
      reason: 'User self-reset password via link.',
    });

    return {
      success: true,
      message: 'Password reset successfully.',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: 'Failed to reset password due to database error.',
    };
  }
}

export async function switchSiteAction(siteId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No active session' };
  }

  // Check that only HR and ADMIN are allowed to switch sites
  if (session.role !== 'HR' && session.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized site switch' };
  }

  try {
    const site = await db.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return { success: false, message: 'Site not found' };
    }

    // Write updated session cookie
    await setSession({
      ...session,
      siteId: site.id,
      siteCode: site.code,
      siteName: site.name,
    });

    await logAudit(session.userId, session.name, session.role, 'AUTH', 'SITE_SWITCH', {
      siteCode: site.code,
      reason: `User switched context to site: ${site.name}`,
    });

    return { success: true, message: 'Site switched successfully.' };
  } catch (error) {
    console.error('Switch site error:', error);
    return { success: false, message: 'Failed to switch site context.' };
  }
}
