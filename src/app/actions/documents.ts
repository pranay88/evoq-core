'use server';

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

export async function uploadDocumentAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can upload documents.' };
  }

  const employeeId = formData.get('employeeId') as string;
  const category = formData.get('category') as string;
  const remarks = formData.get('remarks') as string;
  const expiryDateVal = formData.get('expiryDate') as string;
  const file = formData.get('file') as File;

  if (!employeeId || !category || !file) {
    return { success: false, message: 'Missing required fields.' };
  }

  if (file.size === 0) {
    return { success: false, message: 'Please select a file to upload.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, message: 'File size exceeds the 5MB limit.' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, message: 'Invalid file type. Only PDF, JPEG, and PNG are allowed.' };
  }

  try {
    const employee = await db.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return { success: false, message: 'Employee not found.' };
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const diskFileName = `${employee.employeeId}_${category.replace(/\s+/g, '_')}_${timestamp}_${cleanFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(diskFileName, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return { success: false, message: 'Failed to upload document to cloud storage.' };
    }

    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(diskFileName);

    const publicUrl = publicUrlData.publicUrl;

    const expiryDate = expiryDateVal ? new Date(expiryDateVal) : null;

    // Check if document of this category already exists for this employee
    const existingDoc = await db.document.findFirst({
      where: { employeeId, category },
    });

    let savedDoc;

    if (existingDoc) {
      // 1. Move current doc details to DocumentVersion table
      await db.documentVersion.create({
        data: {
          documentId: existingDoc.id,
          fileName: existingDoc.fileName,
          filePath: existingDoc.filePath,
          version: existingDoc.version,
          uploadedById: existingDoc.uploadedById,
          uploadDate: existingDoc.uploadDate,
        },
      });

      // 2. Update existing doc with new details
      savedDoc = await db.document.update({
        where: { id: existingDoc.id },
        data: {
          fileName: file.name,
          filePath: publicUrl,
          version: existingDoc.version + 1,
          verificationStatus: 'PENDING', // resets to pending on overwrite
          expiryDate,
          remarks,
          uploadedById: session.userId,
          uploadDate: new Date(),
        },
      });
    } else {
      // Create new document entry
      savedDoc = await db.document.create({
        data: {
          employeeId,
          category,
          fileName: file.name,
          filePath: publicUrl,
          version: 1,
          verificationStatus: 'PENDING',
          expiryDate,
          remarks,
          uploadedById: session.userId,
        },
      });
    }

    // Log in Audit Trail
    await logAudit(session.userId, session.name, session.role, 'DOCUMENTS', 'UPLOAD_DOCUMENT', {
      recordId: savedDoc.id,
      newValues: {
        category,
        fileName: file.name,
        version: savedDoc.version,
        employeeId: employee.employeeId,
      },
      siteCode: session.siteCode,
    });

    revalidatePath(`/hr/employees/${employeeId}`);

    return {
      success: true,
      message: 'Document uploaded successfully.',
    };

  } catch (error) {
    console.error('File upload action error:', error);
    return {
      success: false,
      message: 'An error occurred while saving the file. Please try again.',
    };
  }
}

export async function verifyDocumentAction(
  documentId: string,
  status: 'VERIFIED' | 'REJECTED',
  remarks?: string
) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can verify documents.' };
  }

  try {
    const doc = await db.document.findUnique({
      where: { id: documentId },
      include: { employee: true },
    });

    if (!doc) {
      return { success: false, message: 'Document not found.' };
    }

    const updated = await db.document.update({
      where: { id: documentId },
      data: {
        verificationStatus: status,
        remarks: remarks || doc.remarks,
      },
    });

    // Log to Audit Trail
    await logAudit(session.userId, session.name, session.role, 'DOCUMENTS', 'VERIFY_DOCUMENT', {
      recordId: documentId,
      previousValues: { status: doc.verificationStatus },
      newValues: { status, remarks },
      siteCode: session.siteCode,
    });

    revalidatePath(`/hr/employees/${doc.employeeId}`);

    return {
      success: true,
      message: `Document status marked as ${status}.`,
    };

  } catch (error) {
    console.error('Verify document error:', error);
    return {
      success: false,
      message: 'Failed to update document verification status.',
    };
  }
}
