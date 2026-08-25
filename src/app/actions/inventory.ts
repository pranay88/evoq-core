'use server';

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const itemSchema = z.object({
  itemCode: z.string().min(2, 'Item code must be at least 2 characters'),
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  openingStock: z.coerce.number().min(0, 'Opening stock cannot be negative'),
  minimumStockLevel: z.coerce.number().min(0, 'Minimum stock cannot be negative'),
  siteId: z.string().min(1, 'Site location is required'),
  storageLocation: z.string().optional(),
  supplier: z.string().optional(),
  purchaseRate: z.coerce.number().optional(),
  remarks: z.string().optional(),
});

import { sanitizeHtml } from '@/lib/sanitize';

// Create new inventory item
export async function createInventoryItemAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'HR')) {
    return { success: false, message: 'Unauthorized. Only Admin or HR can manage inventory.' };
  }

  const rawData: any = {};
  formData.forEach((value, key) => {
    rawData[key] = typeof value === 'string' ? sanitizeHtml(value) : value;
  });

  const validatedFields = itemSchema.safeParse(rawData);
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  const data = validatedFields.data;

  try {
    // Validate unique item code
    const existing = await db.inventoryItem.findUnique({
      where: { itemCode: data.itemCode },
    });

    if (existing) {
      return { success: false, message: `Item code ${data.itemCode} already exists. Code must be unique.` };
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Create inventory item
      const item = await tx.inventoryItem.create({
        data: {
          itemCode: data.itemCode,
          name: data.name,
          categoryId: data.categoryId,
          unit: data.unit,
          openingStock: data.openingStock,
          currentStock: data.openingStock, // defaults to opening stock
          minimumStockLevel: data.minimumStockLevel,
          siteId: data.siteId,
          storageLocation: data.storageLocation || null,
          supplier: data.supplier || null,
          purchaseRate: data.purchaseRate || null,
          remarks: data.remarks || null,
        },
      });

      // 2. Create Stock Added transaction
      await tx.inventoryTransaction.create({
        data: {
          itemId: item.id,
          quantity: data.openingStock,
          type: 'Stock Added',
          remarks: 'Initial stock load upon item creation.',
          createdById: session.userId,
        },
      });

      return item;
    });

    // Log audit log
    await logAudit(session.userId, session.name, session.role, 'INVENTORY', 'CREATE_ITEM', {
      recordId: result.id,
      newValues: { itemCode: data.itemCode, name: data.name, currentStock: data.openingStock },
      siteCode: session.siteCode,
    });

    revalidatePath('/admin/inventory');

    return { success: true, message: `Inventory item ${data.name} created successfully.` };

  } catch (error) {
    console.error('Create item database error:', error);
    return { success: false, message: 'Failed to create inventory item.' };
  }
}

// Add stock to an existing item
export async function addStockAction(itemId: string, quantity: number, remarks?: string) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'HR')) {
    return { success: false, message: 'Unauthorized.' };
  }

  if (quantity <= 0) {
    return { success: false, message: 'Quantity must be greater than zero.' };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) {
        throw new Error('Item not found.');
      }

      const updated = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStock: item.currentStock + quantity,
          lastPurchaseDate: new Date(),
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          itemId,
          quantity,
          type: 'Stock Added',
          remarks: remarks || `Restocked item. Added ${quantity} ${item.unit}.`,
          createdById: session.userId,
        },
      });

      return updated;
    });

    await logAudit(session.userId, session.name, session.role, 'INVENTORY', 'ADD_STOCK', {
      recordId: itemId,
      newValues: { addedQuantity: quantity, newStock: result.currentStock },
      siteCode: session.siteCode,
    });

    revalidatePath('/admin/inventory');

    return { success: true, message: `Successfully added ${quantity} units.` };
  } catch (error: any) {
    console.error('Add stock error:', error);
    return { success: false, message: error.message || 'Failed to add stock.' };
  }
}

// Transfer stock between sites
export async function transferStockAction(
  itemId: string,
  quantity: number,
  destSiteId: string,
  remarks?: string
) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'HR')) {
    return { success: false, message: 'Unauthorized. Only Admin or HR can transfer stock.' };
  }

  if (quantity <= 0) {
    return { success: false, message: 'Quantity must be greater than zero.' };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Get source item
      const sourceItem = await tx.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!sourceItem) {
        throw new Error('Source inventory item not found.');
      }

      if (sourceItem.currentStock < quantity) {
        throw new Error(`Insufficient stock for transfer. Available: ${sourceItem.currentStock}`);
      }

      if (sourceItem.siteId === destSiteId) {
        throw new Error('Source site and destination site cannot be the same.');
      }

      // 2. Find or create matching item code at destination site
      let destItem = await tx.inventoryItem.findFirst({
        where: {
          itemCode: sourceItem.itemCode,
          siteId: destSiteId,
        },
      });

      if (destItem) {
        // Update stock at destination
        destItem = await tx.inventoryItem.update({
          where: { id: destItem.id },
          data: {
            currentStock: destItem.currentStock + quantity,
          },
        });
      } else {
        // Fetch target site details to build code
        const destSite = await tx.site.findUnique({ where: { id: destSiteId } });
        if (!destSite) {
          throw new Error('Destination site not found.');
        }

        // Create new item entry at target site
        destItem = await tx.inventoryItem.create({
          data: {
            itemCode: sourceItem.itemCode,
            name: sourceItem.name,
            categoryId: sourceItem.categoryId,
            unit: sourceItem.unit,
            openingStock: 0,
            currentStock: quantity,
            minimumStockLevel: sourceItem.minimumStockLevel,
            siteId: destSiteId,
            storageLocation: sourceItem.storageLocation,
            supplier: sourceItem.supplier,
            purchaseRate: sourceItem.purchaseRate,
            remarks: `Auto-created upon transfer from ${session.siteName || 'other site'}.`,
          },
        });
      }

      // 3. Deduct stock from source item
      const updatedSource = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStock: sourceItem.currentStock - quantity,
        },
      });

      // 4. Log transfer transactions (Stock Transferred)
      await tx.inventoryTransaction.create({
        data: {
          itemId,
          quantity,
          type: 'Stock Transferred',
          sourceSiteId: sourceItem.siteId,
          destinationSiteId: destSiteId,
          remarks: remarks || `Transferred ${quantity} ${sourceItem.unit} to ${destSiteId}. Remaining: ${updatedSource.currentStock}`,
          createdById: session.userId,
        },
      });

      return { source: updatedSource, dest: destItem };
    });

    await logAudit(session.userId, session.name, session.role, 'INVENTORY', 'TRANSFER_STOCK', {
      recordId: itemId,
      newValues: { quantity, destSiteId },
      siteCode: session.siteCode,
    });

    revalidatePath('/admin/inventory');

    return { success: true, message: `Successfully transferred ${quantity} units.` };

  } catch (error: any) {
    console.error('Transfer stock error:', error);
    return { success: false, message: error.message || 'Failed to transfer stock.' };
  }
}

// Record damage or loss of items
export async function adjustStockAction(
  itemId: string,
  quantity: number,
  type: 'Stock Damaged' | 'Stock Lost' | 'Stock Adjusted',
  remarks: string
) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'HR')) {
    return { success: false, message: 'Unauthorized. Only Admin or HR can adjust stock.' };
  }

  if (quantity <= 0) {
    return { success: false, message: 'Quantity must be greater than zero.' };
  }

  if (!remarks) {
    return { success: false, message: 'Please specify the reason in remarks.' };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) {
        throw new Error('Item not found.');
      }

      if (item.currentStock < quantity) {
        throw new Error(`Insufficient stock to adjust. Available: ${item.currentStock}`);
      }

      const updated = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStock: item.currentStock - quantity,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          itemId,
          quantity,
          type,
          remarks: remarks || `Adjusted stock. Decreased by ${quantity} units. Current stock: ${updated.currentStock}`,
          createdById: session.userId,
        },
      });

      return updated;
    });

    await logAudit(session.userId, session.name, session.role, 'INVENTORY', 'ADJUST_STOCK', {
      recordId: itemId,
      newValues: { adjustmentType: type, quantity, reason: remarks, newStock: result.currentStock },
      siteCode: session.siteCode,
    });

    revalidatePath('/admin/inventory');
    revalidatePath('/hr/inventory');

    return { success: true, message: `Successfully recorded ${type.toLowerCase()} of ${quantity} units.` };
  } catch (error: any) {
    console.error('Adjust stock error:', error);
    return { success: false, message: error.message || 'Failed to adjust stock.' };
  }
}

// Create new inventory category
export async function createCategoryAction(name: string) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'HR')) {
    return { success: false, message: 'Unauthorized. Only Admin or HR can manage categories.' };
  }

  const sanitizedName = sanitizeHtml(name);

  if (!sanitizedName || sanitizedName === '') {
    return { success: false, message: 'Category name is required.' };
  }

  try {
    const existing = await db.inventoryCategory.findUnique({
      where: { name: sanitizedName },
    });

    if (existing) {
      return { success: false, message: 'Category already exists.' };
    }

    await db.inventoryCategory.create({
      data: { name: sanitizedName },
    });

    revalidatePath('/admin/inventory');
    revalidatePath('/hr/inventory');

    return { success: true, message: 'Category created successfully.' };
  } catch (error: any) {
    console.error('Create category error:', error);
    return { success: false, message: error.message || 'Failed to create category.' };
  }
}
