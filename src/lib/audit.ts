import { db } from './db';

interface AuditLogOptions {
  recordId?: string;
  previousValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  reason?: string;
  siteCode?: string | null;
  ipAddress?: string;
  deviceInfo?: string;
}

export async function logAudit(
  userId: string,
  userName: string,
  userRole: string,
  module: string,
  action: string,
  options: AuditLogOptions = {}
) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        siteCode: options.siteCode || null,
        module,
        action,
        recordId: options.recordId || null,
        previousValues: options.previousValues ? JSON.stringify(options.previousValues) : null,
        newValues: options.newValues ? JSON.stringify(options.newValues) : null,
        reason: options.reason || null,
        ipAddress: options.ipAddress || null,
        deviceInfo: options.deviceInfo || null,
      },
    });
  } catch (error) {
    console.error('Failed to log audit trail:', error);
  }
}
