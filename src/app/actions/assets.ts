'use server';

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

// Issue asset to employee
export async function issueAssetAction(
  itemId: string,
  assetCode: string,
  serialNumber: string,
  employeeId: string,
  expectedReturnDateVal: string,
  conditionAtIssue: string,
  remarks?: string
) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'HR')) {
    return { success: false, message: 'Unauthorized. Only Admin or HR can issue assets.' };
  }

  if (!itemId || !assetCode || !employeeId || !conditionAtIssue) {
    return { success: false, message: 'Missing required fields.' };
  }

  try {
    // Run database transaction to ensure negative stock prevention and synchronization
    const result = await db.$transaction(async (tx) => {
      // 1. Get the inventory item and lock it/check stock
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error('Inventory item not found.');
      }

      if (item.currentStock <= 0) {
        throw new Error(`Insufficient stock. Current available stock: ${item.currentStock}`);
      }

      // Check unique asset code constraint
      const existingAsset = await tx.issuedAsset.findUnique({
        where: { assetCode },
      });

      if (existingAsset) {
        throw new Error(`Asset code ${assetCode} already exists. Asset codes must be unique.`);
      }

      // Get employee department and site details
      const employee = await tx.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new Error('Employee not found.');
      }

      // 2. Deduct 1 from item stock
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStock: item.currentStock - 1,
        },
      });

      const expectedReturnDate = expectedReturnDateVal ? new Date(expectedReturnDateVal) : null;

      // 3. Create the IssuedAsset
      const asset = await tx.issuedAsset.create({
        data: {
          itemId,
          assetCode,
          serialNumber: serialNumber || null,
          employeeId,
          departmentId: employee.departmentId,
          siteId: employee.siteId,
          issueDate: new Date(),
          expectedReturnDate,
          conditionAtIssue,
          issuedById: session.userId,
          remarks: remarks || null,
          status: 'Issued',
        },
      });

      // 4. Create the Inventory transaction
      await tx.inventoryTransaction.create({
        data: {
          itemId,
          quantity: 1,
          type: 'Stock Issued',
          employeeId,
          remarks: `Issued asset code: ${assetCode}. Current stock now: ${updatedItem.currentStock}`,
          createdById: session.userId,
        },
      });

      return asset;
    });

    // Log in Audit Trail
    await logAudit(session.userId, session.name, session.role, 'ASSETS', 'ISSUE_ASSET', {
      recordId: result.id,
      newValues: { assetCode, employeeId, itemId },
      siteCode: session.siteCode,
    });

    revalidatePath('/admin/assets');
    revalidatePath(`/hr/employees/${employeeId}`);

    return {
      success: true,
      message: `Asset ${assetCode} issued successfully.`,
    };

  } catch (error: any) {
    console.error('Issue asset error:', error);
    return {
      success: false,
      message: error.message || 'Failed to issue asset due to transaction issue.',
    };
  }
}

// Return issued asset
export async function returnAssetAction(
  assetId: string,
  conditionAtReturn: string,
  missingAccessories?: string,
  damageDetails?: string,
  recoveryAmountVal?: number,
  remarks?: string
) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'HR')) {
    return { success: false, message: 'Unauthorized. Only Admin or HR can record asset returns.' };
  }

  if (!assetId || !conditionAtReturn) {
    return { success: false, message: 'Missing required fields.' };
  }

  try {
    const recoveryAmount = recoveryAmountVal || 0.0;

    const result = await db.$transaction(async (tx) => {
      // 1. Find issued asset
      const asset = await tx.issuedAsset.findUnique({
        where: { id: assetId },
      });

      if (!asset) {
        throw new Error('Issued asset record not found.');
      }

      if (asset.status === 'Returned') {
        throw new Error('This asset has already been marked as returned.');
      }

      // Check condition to decide if stock should be added back
      // If lost, retired, or completely damaged beyond use, we don't increase stock
      const isUsable = conditionAtReturn !== 'Lost' && conditionAtReturn !== 'Retired' && conditionAtReturn !== 'Damaged Unusable';
      const newStatus = conditionAtReturn === 'Lost' 
        ? 'Lost' 
        : conditionAtReturn === 'Damaged Unusable' 
          ? 'Retired' 
          : conditionAtReturn === 'Damaged Needs Repair' 
            ? 'Under Repair' 
            : 'Returned';

      // 2. Update asset status
      const updatedAsset = await tx.issuedAsset.update({
        where: { id: assetId },
        data: {
          status: newStatus,
        },
      });

      // 3. Create AssetReturn log
      await tx.assetReturn.create({
        data: {
          assetId,
          returnDate: new Date(),
          conditionAtReturn,
          receivedById: session.userId,
          missingAccessories: missingAccessories || null,
          damageDetails: damageDetails || null,
          recoveryAmount,
          remarks: remarks || null,
        },
      });

      // 4. Update Inventory stock & log transaction if usable
      if (isUsable) {
        const item = await tx.inventoryItem.findUnique({
          where: { id: asset.itemId },
        });

        if (item) {
          await tx.inventoryItem.update({
            where: { id: asset.itemId },
            data: {
              currentStock: item.currentStock + 1,
            },
          });
        }
      }

      // 5. Create Inventory transaction log
      const transType = conditionAtReturn === 'Lost' 
        ? 'Stock Lost' 
        : conditionAtReturn === 'Damaged Unusable' || conditionAtReturn === 'Damaged Needs Repair' 
          ? 'Stock Damaged' 
          : 'Stock Returned';

      await tx.inventoryTransaction.create({
        data: {
          itemId: asset.itemId,
          quantity: 1,
          type: transType,
          employeeId: asset.employeeId,
          remarks: `Asset code: ${asset.assetCode} returned. Condition: ${conditionAtReturn}. Status updated to: ${newStatus}`,
          createdById: session.userId,
        },
      });

      return updatedAsset;
    });

    // Log in Audit Trail
    await logAudit(session.userId, session.name, session.role, 'ASSETS', 'RETURN_ASSET', {
      recordId: assetId,
      newValues: { status: result.status, conditionAtReturn },
      siteCode: session.siteCode,
    });

    revalidatePath('/admin/assets');
    revalidatePath(`/hr/employees/${result.employeeId}`);

    return {
      success: true,
      message: `Asset return recorded successfully. Status: ${result.status}`,
    };

  } catch (error: any) {
    console.error('Return asset error:', error);
    return {
      success: false,
      message: error.message || 'Failed to record asset return.',
    };
  }
}
