'use server';

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate a secure self-onboarding invitation
export async function generateInvitationAction(email: string, phone?: string) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can generate invitations.' };
  }

  if (!email) {
    return { success: false, message: 'Candidate email is required.' };
  }

  try {
    // Check if email already belongs to an employee
    const existingEmp = await db.employee.findFirst({
      where: {
        OR: [{ personalEmail: email }, { officialEmail: email }],
      },
    });

    if (existingEmp) {
      return { success: false, message: 'An employee with this email already exists.' };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Link active for 7 days

    const invitation = await db.employeeInvitation.create({
      data: {
        email,
        phone: phone || null,
        token,
        expiresAt,
        createdById: session.userId,
      },
    });

    await logAudit(session.userId, session.name, session.role, 'ONBOARDING', 'GENERATE_INVITATION', {
      recordId: invitation.id,
      newValues: { email, token },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/invitations');

    return {
      success: true,
      message: 'Invitation link generated successfully.',
      token,
    };
  } catch (error) {
    console.error('Generate invitation error:', error);
    return { success: false, message: 'Failed to generate invitation link.' };
  }
}

// Candidate submits onboarding form
export async function submitOnboardingAction(token: string, formData: FormData) {
  try {
    const invitation = await db.employeeInvitation.findUnique({
      where: { token },
      include: { submissions: true },
    });

    if (!invitation) {
      return { success: false, message: 'Invalid onboarding link.' };
    }

    if (invitation.status === 'SUBMITTED') {
      return { success: false, message: 'This onboarding form has already been submitted.' };
    }

    if (new Date() > invitation.expiresAt) {
      // Update status to EXPIRED
      await db.employeeInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return { success: false, message: 'This onboarding link has expired.' };
    }

    // Process files and bundle personal data
    const rawData: any = {};
    formData.forEach((value, key) => {
      if (key !== 'file_aadhaar' && key !== 'file_pan' && key !== 'file_photo' && key !== 'file_academic') {
        rawData[key] = value;
      }
    });

    const fileAadhaar = formData.getAll('file_aadhaar') as File[];
    const filePan = formData.getAll('file_pan') as File[];
    const filePhoto = formData.getAll('file_photo') as File[];
    const fileAcademic = formData.getAll('file_academic') as File[];

    const savedFiles: Record<string, any> = {};

    const saveCandidateFiles = async (files: File[], category: string) => {
      if (!files || files.length === 0) return;
      const fileObjects = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file || file.size === 0) continue;
        const arrayBuffer = await file.arrayBuffer();
        
        const timestamp = Date.now();
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const diskName = `ONBOARD_${invitation.id.substring(0, 8)}_${category.replace(/\s+/g, '_')}_${i + 1}_${timestamp}_${cleanFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(diskName, arrayBuffer, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.error('Supabase upload error for onboarding:', uploadError);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(diskName);
        
        fileObjects.push({
          name: file.name,
          path: publicUrlData.publicUrl,
        });
      }
      
      if (fileObjects.length > 0) {
        savedFiles[category] = fileObjects;
      }
    };

    await saveCandidateFiles(fileAadhaar, 'Aadhaar Card');
    await saveCandidateFiles(filePan, 'PAN Card');
    await saveCandidateFiles(filePhoto, 'Photograph');
    await saveCandidateFiles(fileAcademic, 'Academic Documents');

    // Combine form input and paths
    const submissionPayload = {
      ...rawData,
      documents: savedFiles,
    };

    // Create or update Submission
    let submission;
    const existingSubmission = invitation.submissions[0];

    if (existingSubmission) {
      submission = await db.employeeSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          status: 'PENDING',
          personalData: JSON.stringify(submissionPayload),
          submittedAt: new Date(),
        },
      });
    } else {
      submission = await db.employeeSubmission.create({
        data: {
          invitationId: invitation.id,
          status: 'PENDING',
          personalData: JSON.stringify(submissionPayload),
        },
      });
    }

    // Mark invitation as submitted (deactivates the token)
    await db.employeeInvitation.update({
      where: { id: invitation.id },
      data: { status: 'SUBMITTED' },
    });

    // Create a notification for HR
    await db.notification.create({
      data: {
        title: 'New Onboarding Submission',
        description: `Candidate ${rawData.fullName} submitted their onboarding form. Approval pending.`,
        type: 'ONBOARDING',
        targetRole: 'HR',
        link: `/hr/submissions`,
      },
    });

    return {
      success: true,
      message: 'Your onboarding details have been submitted successfully. Thank you!',
    };

  } catch (error) {
    console.error('Candidate onboarding submission error:', error);
    return {
      success: false,
      message: 'Failed to submit onboarding form. Please check file sizes and try again.',
    };
  }
}

// HR Approves submission, creating the employee profile
export async function approveSubmissionAction(
  submissionId: string,
  departmentId: string,
  siteId: string,
  designation: string,
  joiningDateVal: string,
  employmentType: string,
  baseSalary: number
) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can approve submissions.' };
  }

  try {
    const submission = await db.employeeSubmission.findUnique({
      where: { id: submissionId },
      include: { invitation: true },
    });

    if (!submission || submission.status === 'APPROVED') {
      return { success: false, message: 'Submission not found or already approved.' };
    }

    const data = JSON.parse(submission.personalData);

    // Auto-generate employee ID (EVOQ + sequential number starting at 101)
    const empCount = await db.employee.count();
    const nextSeq = 101 + empCount;
    const employeeId = `EVOQ${nextSeq}`;

    // Database transaction to create/update employee and save uploaded documents
    const result = await db.$transaction(async (tx) => {
      // 1. Check if Employee placeholder exists (created during User Registration)
      // Match by invitation email (which is reliable) or personal email
      const targetEmail = submission.invitation.email;
      const existingEmployee = await tx.employee.findFirst({
        where: {
          OR: [
            { personalEmail: { equals: targetEmail, mode: 'insensitive' } },
            { officialEmail: { equals: targetEmail, mode: 'insensitive' } },
            { personalEmail: { equals: data.personalEmail || '', mode: 'insensitive' } }
          ]
        }
      });

      let employee;
      const empData = {
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
        
        departmentId,
        designation,
        siteId,
        joiningDate: new Date(joiningDateVal),
        employmentType,
        employmentStatus: 'ACTIVE',
        baseSalary,
        
        bankName: data.bankName || null,
        bankAccountHolderName: data.bankAccountHolderName || null,
        bankAccountNumber: data.bankAccountNumber || null,
        bankIfscCode: data.bankIfscCode || null,
        panNumber: data.panNumber || null,
        aadhaarNumber: data.aadhaarNumber || null,
        uanNumber: data.uanNumber || null,
      };

      if (existingEmployee) {
        employee = await tx.employee.update({
          where: { id: existingEmployee.id },
          data: empData
        });
      } else {
        const empCount = await tx.employee.count();
        const nextSeq = 101 + empCount;
        const uniqueSuffix = Date.now().toString().slice(-4);
        const employeeId = `EVOQ${nextSeq}-${uniqueSuffix}`;
        
        employee = await tx.employee.create({
          data: {
            ...empData,
            employeeId
          }
        });
      }

      // 2. Add Uploaded Documents into the Document Registry
      if (data.documents) {
        for (const [category, fileDetails] of Object.entries(data.documents) as any[]) {
          if (Array.isArray(fileDetails)) {
            for (const file of fileDetails) {
              await tx.document.create({
                data: {
                  employeeId: employee.id,
                  category,
                  fileName: file.name,
                  filePath: file.path,
                  version: 1,
                  verificationStatus: 'VERIFIED',
                  uploadedById: session.userId,
                },
              });
            }
          } else {
            await tx.document.create({
              data: {
                employeeId: employee.id,
                category,
                fileName: fileDetails.name,
                filePath: fileDetails.path,
                version: 1,
                verificationStatus: 'VERIFIED', // auto-verified since uploaded by candidate and approved by HR
                uploadedById: session.userId,
              },
            });
          }
        }
      }

      // 3. Mark submission as APPROVED
      await tx.employeeSubmission.update({
        where: { id: submissionId },
        data: { status: 'APPROVED' },
      });

      // 4. Update invitation status to SUBMITTED
      await tx.employeeInvitation.update({
        where: { id: submission.invitationId },
        data: { status: 'SUBMITTED' },
      });

      return employee;
    });

    // Log to Audit Trail
    await logAudit(session.userId, session.name, session.role, 'ONBOARDING', 'APPROVE_ONBOARDING', {
      recordId: result.id,
      newValues: { employeeId: result.employeeId, fullName: result.fullName },
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/submissions');
    revalidatePath('/hr/employees');

    return {
      success: true,
      message: `Submission approved. Employee profile ${employeeId} created successfully.`,
    };

  } catch (error) {
    console.error('Approve onboarding submission error:', error);
    return {
      success: false,
      message: 'Failed to approve submission and create employee profile.',
    };
  }
}

// HR requests corrections on submission (sends form back to candidate)
export async function requestCorrectionAction(submissionId: string, remarks: string) {
  const session = await getSession();
  if (!session || session.role !== 'HR') {
    return { success: false, message: 'Unauthorized. Only HR can perform this action.' };
  }

  if (!remarks) {
    return { success: false, message: 'Please specify correction details in remarks.' };
  }

  try {
    const submission = await db.employeeSubmission.findUnique({
      where: { id: submissionId },
      include: { invitation: true },
    });

    if (!submission) {
      return { success: false, message: 'Submission not found.' };
    }

    // 1. Update Submission status
    await db.employeeSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'CORRECTION_REQUESTED',
        remarks,
      },
    });

    // 2. Reactivate Onboarding Invitation link (status becomes PENDING again)
    await db.employeeInvitation.update({
      where: { id: submission.invitationId },
      data: {
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // extend link by 5 days
      },
    });

    // Log to Audit Trail
    await logAudit(session.userId, session.name, session.role, 'ONBOARDING', 'REQUEST_CORRECTION', {
      recordId: submissionId,
      reason: remarks,
      siteCode: session.siteCode,
    });

    revalidatePath('/hr/submissions');

    return {
      success: true,
      message: 'Correction request submitted. Candidate can now modify their details.',
    };

  } catch (error) {
    console.error('Request correction error:', error);
    return { success: false, message: 'Failed to submit correction request.' };
  }
}
