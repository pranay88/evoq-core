'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createEmployeeAction, updateEmployeeAction } from '@/app/actions/employees';
import { ArrowLeft, Save, Loader2, Landmark, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';

interface EmployeeFormProps {
  initialData?: any;
  sites: Array<{ id: string; name: string }>;
  departments: Array<{ id: string; name: string }>;
}

export default function EmployeeForm({ initialData, sites, departments }: EmployeeFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [matchError, setMatchError] = useState('');
  const actionFn = isEdit 
    ? updateEmployeeAction.bind(null, initialData.id) 
    : createEmployeeAction;

  const [state, formAction, isPending] = useActionState(actionFn, {
    success: false,
    message: '',
    errors: {} as Record<string, string[]>,
  });

  useEffect(() => {
    if (state.success) {
      router.push(isEdit ? `/hr/employees/${initialData.id}` : '/hr/employees');
      router.refresh();
    }
  }, [state.success, router, isEdit, initialData]);

  // Format date helper for input type="date"
  const formatDateForInput = (dateString?: string | Date) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <form action={formAction} className="space-y-8 max-w-5xl font-sans">
      {/* Top action bar */}
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <Link
          href={isEdit ? `/hr/employees/${initialData.id}` : '/hr/employees'}
          className="inline-flex items-center text-xs font-semibold text-primary hover:underline gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEdit ? 'Update Profile' : 'Save Employee'}
        </button>
      </div>

      {state.message && (
        <div className={`p-4 rounded-md border text-sm ${state.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
          {state.message}
        </div>
      )}

      {/* Section 1: Personal Details */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-serif font-bold text-foreground">Personal Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Full Name *</label>
            <input
              name="fullName"
              type="text"
              required
              defaultValue={initialData?.fullName || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="e.g. Rahul Sharma"
            />
            {state.errors?.fullName && <p className="text-xs text-destructive mt-1">{state.errors.fullName[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Date of Birth *</label>
            <input
              name="dateOfBirth"
              type="date"
              required
              defaultValue={formatDateForInput(initialData?.dateOfBirth)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            {state.errors?.dateOfBirth && <p className="text-xs text-destructive mt-1">{state.errors.dateOfBirth[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Gender *</label>
            <select
              name="gender"
              required
              defaultValue={initialData?.gender || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {state.errors?.gender && <p className="text-xs text-destructive mt-1">{state.errors.gender[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Blood Group</label>
            <select
              name="bloodGroup"
              defaultValue={initialData?.bloodGroup || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            >
              <option value="">Unknown</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Mobile Number *</label>
            <input
              name="mobileNumber"
              type="tel"
              required
              defaultValue={initialData?.mobileNumber || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="+91 98765 43210"
            />
            {state.errors?.mobileNumber && <p className="text-xs text-destructive mt-1">{state.errors.mobileNumber[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Personal Email *</label>
            <input
              name="personalEmail"
              type="email"
              required
              defaultValue={initialData?.personalEmail || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="personal@gmail.com"
            />
            {state.errors?.personalEmail && <p className="text-xs text-destructive mt-1">{state.errors.personalEmail[0]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Current Address *</label>
            <textarea
              name="currentAddress"
              required
              rows={3}
              defaultValue={initialData?.currentAddress || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
              placeholder="Current residential address..."
            />
            {state.errors?.currentAddress && <p className="text-xs text-destructive mt-1">{state.errors.currentAddress[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Permanent Address *</label>
            <textarea
              name="permanentAddress"
              required
              rows={3}
              defaultValue={initialData?.permanentAddress || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
              placeholder="Permanent address..."
            />
            {state.errors?.permanentAddress && <p className="text-xs text-destructive mt-1">{state.errors.permanentAddress[0]}</p>}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="pt-4 border-t border-border/60">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">Emergency Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Contact Name *</label>
              <input
                name="emergencyContactName"
                type="text"
                required
                defaultValue={initialData?.emergencyContactName || ''}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                placeholder="Emergency contact full name"
              />
              {state.errors?.emergencyContactName && <p className="text-xs text-destructive mt-1">{state.errors.emergencyContactName[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Contact Number *</label>
              <input
                name="emergencyContactNumber"
                type="tel"
                required
                defaultValue={initialData?.emergencyContactNumber || ''}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                placeholder="Emergency contact mobile number"
              />
              {state.errors?.emergencyContactNumber && <p className="text-xs text-destructive mt-1">{state.errors.emergencyContactNumber[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Relationship *</label>
              <input
                name="emergencyContactRelationship"
                type="text"
                required
                defaultValue={initialData?.emergencyContactRelationship || ''}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                placeholder="e.g. Spouse, Father, Friend"
              />
              {state.errors?.emergencyContactRelationship && <p className="text-xs text-destructive mt-1">{state.errors.emergencyContactRelationship[0]}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Employment Details */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-serif font-bold text-foreground">Employment Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Department *</label>
            <select
              name="departmentId"
              required
              defaultValue={initialData?.departmentId || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {state.errors?.departmentId && <p className="text-xs text-destructive mt-1">{state.errors.departmentId[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Designation *</label>
            <input
              name="designation"
              type="text"
              required
              defaultValue={initialData?.designation || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="e.g. Business Analyst"
            />
            {state.errors?.designation && <p className="text-xs text-destructive mt-1">{state.errors.designation[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Reporting Manager</label>
            <input
              name="reportingManagerId"
              type="text"
              defaultValue={initialData?.reportingManagerId || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="Manager name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Site Location *</label>
            <select
              name="siteId"
              required
              defaultValue={initialData?.siteId || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            >
              <option value="">Select Site Location</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            {state.errors?.siteId && <p className="text-xs text-destructive mt-1">{state.errors.siteId[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Joining Date *</label>
            <input
              name="joiningDate"
              type="date"
              required
              defaultValue={formatDateForInput(initialData?.joiningDate)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            {state.errors?.joiningDate && <p className="text-xs text-destructive mt-1">{state.errors.joiningDate[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Employment Type *</label>
            <select
              name="employmentType"
              required
              defaultValue={initialData?.employmentType || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            >
              <option value="">Select Type</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
            </select>
            {state.errors?.employmentType && <p className="text-xs text-destructive mt-1">{state.errors.employmentType[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Probation Period (Days)</label>
            <input
              name="probationPeriodDays"
              type="number"
              defaultValue={initialData?.probationPeriodDays ?? 90}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Official Email</label>
            <input
              name="officialEmail"
              type="email"
              defaultValue={initialData?.officialEmail || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="username@evoqrealtech.com"
            />
            {state.errors?.officialEmail && <p className="text-xs text-destructive mt-1">{state.errors.officialEmail[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Official Phone</label>
            <input
              name="officialPhone"
              type="tel"
              defaultValue={initialData?.officialPhone || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="e.g. +91 80 4567 8900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Shift</label>
            <input
              name="shift"
              type="text"
              defaultValue={initialData?.shift || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="e.g. General (9 AM - 6 PM)"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Notice Period (Days)</label>
            <input
              name="noticePeriodDays"
              type="number"
              defaultValue={initialData?.noticePeriodDays ?? 30}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Employment Status</label>
            <select
              name="employmentStatus"
              defaultValue={initialData?.employmentStatus || 'ACTIVE'}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            >
              <option value="ACTIVE">Active</option>
              <option value="PROBATION">On Probation</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="LEAVE">On Leave</option>
              <option value="NOTICE">Notice Period</option>
              <option value="RESIGNED">Resigned</option>
              <option value="TERMINATED">Terminated</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Bank & Statutory Details (Confidential) */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <Landmark className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-serif font-bold text-foreground">Bank & Statutory Details</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          This details section is classified as strictly confidential and is visible only to authorized HR and Auditing roles.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Bank Name</label>
            <input
              name="bankName"
              type="text"
              defaultValue={initialData?.bankName || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="e.g. HDFC Bank"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Account Holder Name</label>
            <input
              name="bankAccountHolderName"
              type="text"
              defaultValue={initialData?.bankAccountHolderName || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="Name as in bank passbook"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Account Number</label>
            <input
              name="bankAccountNumber"
              type="text"
              defaultValue={initialData?.bankAccountNumber || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="Bank account number"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">IFSC Code</label>
            <input
              name="bankIfscCode"
              type="text"
              defaultValue={initialData?.bankIfscCode || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="11 digit bank IFSC"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">PAN Card Number</label>
            <input
              name="panNumber"
              type="text"
              defaultValue={initialData?.panNumber || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="10 digit PAN"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Aadhaar Card Number</label>
            <input
              name="aadhaarNumber"
              type="text"
              defaultValue={initialData?.aadhaarNumber || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="12 digit Aadhaar"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">UAN Number</label>
            <input
              name="uanNumber"
              type="text"
              defaultValue={initialData?.uanNumber || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="12 digit Universal Account Number"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">PF Account Details</label>
            <input
              name="pfDetails"
              type="text"
              defaultValue={initialData?.pfDetails || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="Provident Fund ID"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">ESI Insurance Details</label>
            <input
              name="esiDetails"
              type="text"
              defaultValue={initialData?.esiDetails || ''}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="ESI Number"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
