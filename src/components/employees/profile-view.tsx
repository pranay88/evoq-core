'use client';

import { useState, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  Landmark,
  FileText,
  Clock,
  HardHat,
  Bell,
  History,
  FileUp,
  Check,
  X,
  Calendar,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Edit,
  ShieldAlert,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn, formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import { returnAssetAction } from '@/app/actions/assets';

interface ProfileViewProps {
  employee: any;
  auditLogs: any[];
  userRole: string;
}

export default function ProfileView({ employee, auditLogs, userRole }: ProfileViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isPending, startTransition] = useTransition();

  // Document upload state
  const [docCategory, setDocCategory] = useState('Aadhaar Card');
  const [docRemarks, setDocRemarks] = useState('');
  const [docExpiry, setDocExpiry] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Asset return form state
  const [returningAssetId, setReturningAssetId] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState('Returned'); // Returned, Damaged Needs Repair, Damaged Unusable, Lost
  const [missingAcc, setMissingAcc] = useState('');
  const [damageDet, setDamageDet] = useState('');
  const [recoveryAmt, setRecoveryAmt] = useState(0);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returnError, setReturnError] = useState('');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'employment', name: 'Employment', icon: Briefcase },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'attendance', name: 'Attendance', icon: Clock },
    { id: 'assets', name: 'Issued Assets', icon: HardHat },
    { id: 'emergency', name: 'Emergency Contact', icon: Bell },
    { id: 'bank', name: 'Bank & Statutory', icon: Landmark, secure: true },
    { id: 'payroll', name: 'Payroll & Leaves', icon: Landmark, secure: true },
    { id: 'history', name: 'Activity History', icon: History },
  ];

  // Document Upload Submit handler
  const handleDocUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadMessage('');
    setUploadError('');

    const formData = new FormData(e.currentTarget);
    formData.append('employeeId', employee.id);
    formData.append('category', docCategory);
    formData.append('remarks', docRemarks);
    formData.append('expiryDate', docExpiry);

    // Dynamic import to avoid circular dependency in imports
    const { uploadDocumentAction } = await import('@/app/actions/documents');
    
    startTransition(async () => {
      const res = await uploadDocumentAction(null, formData);
      if (res.success) {
        setUploadMessage(res.message);
        setDocRemarks('');
        setDocExpiry('');
        // Reset file input
        const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        router.refresh();
      } else {
        setUploadError(res.message);
      }
    });
  };

  // Document Verification Action
  const handleDocVerify = async (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    const remarks = prompt(`Enter verification remarks (optional) for marking as ${status}:`);
    if (remarks === null) return; // user cancelled

    const { verifyDocumentAction } = await import('@/app/actions/documents');

    startTransition(async () => {
      const res = await verifyDocumentAction(docId, status, remarks);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  // Asset Return Submit handler
  const handleAssetReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningAssetId) return;
    setReturnError('');

    startTransition(async () => {
      const res = await returnAssetAction(
        returningAssetId,
        returnCondition,
        missingAcc,
        damageDet,
        recoveryAmt,
        returnRemarks
      );

      if (res.success) {
        setReturningAssetId(null);
        setMissingAcc('');
        setDamageDet('');
        setRecoveryAmt(0);
        setReturnRemarks('');
        router.refresh();
      } else {
        setReturnError(res.message);
      }
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'PROBATION':
        return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'LEAVE':
        return 'bg-blue-50 text-blue-700 border-blue-200/50';
      case 'NOTICE':
        return 'bg-rose-50 text-rose-700 border-rose-200/50';
      default:
        return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const isHr = userRole === 'HR';

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif font-bold text-2xl border border-primary/20 select-none">
            {employee.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif font-bold text-foreground">{employee.fullName}</h1>
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadgeClass(employee.employmentStatus)}`}>
                {employee.employmentStatus}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {employee.designation} &bull; {employee.department?.name}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" /> {employee.site?.name} &bull; ID: <strong>{employee.employeeId}</strong>
            </p>
          </div>
        </div>

        {isHr && (
          <Link
            href={`/hr/employees/${employee.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground text-sm font-medium rounded-md shadow-sm transition-all"
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
            Edit Profile
          </Link>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-border overflow-x-auto select-none flex">
        <div className="flex space-x-6 min-w-max pb-px">
          {tabs.map((tab) => {
            if (tab.secure && !isHr) return null; // hide secure tabs for non-HR
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-all',
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="py-4">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Profile Details Card */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60">Contact & Personal Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mobile Number</span>
                    <span className="text-foreground flex items-center gap-1.5 mt-0.5"><Phone className="w-3.5 h-3.5 text-primary" /> {employee.mobileNumber}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personal Email</span>
                    <span className="text-foreground flex items-center gap-1.5 mt-0.5"><Mail className="w-3.5 h-3.5 text-primary" /> {employee.personalEmail}</span>
                  </div>
                  <div>
                      <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Birth Details</span>
                      <span className="text-foreground mt-0.5">{formatDate(employee.dateOfBirth)} {employee.timeOfBirth ? `at ${employee.timeOfBirth}` : ''}</span>
                      {employee.placeOfBirth && <span className="text-muted-foreground text-xs block mt-0.5">Place: {employee.placeOfBirth}</span>}
                    </div>
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gender / Blood Group</span>
                    <span className="text-foreground mt-0.5">{employee.gender} &bull; {employee.bloodGroup || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Addresses Card */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60">Address Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Address</span>
                    <p className="text-foreground mt-1 whitespace-pre-line leading-relaxed">{employee.currentAddress}</p>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Permanent Address</span>
                    <p className="text-foreground mt-1 whitespace-pre-line leading-relaxed">{employee.permanentAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats sidebar */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60">Employment Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-2 border-b border-border/40">
                    <span className="text-muted-foreground">Joining Date</span>
                    <span className="font-semibold text-foreground">{formatDate(employee.joiningDate)}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-border/40">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-semibold text-foreground">{employee.employmentType}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-border/40">
                    <span className="text-muted-foreground">Official Email</span>
                    <span className="font-semibold text-foreground">{employee.officialEmail || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reporting Manager</span>
                    <span className="font-semibold text-foreground">{employee.reportingManagerId || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Employment */}
        {activeTab === 'employment' && (
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-serif font-bold text-foreground pb-2 border-b border-border/60">Job & Shift Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Official Email</span>
                <span className="text-foreground block mt-0.5 font-medium">{employee.officialEmail || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Official Phone</span>
                <span className="text-foreground block mt-0.5">{employee.officialPhone || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Designated Shift</span>
                <span className="text-foreground block mt-0.5">{employee.shift || 'General Shift (9:00 AM - 6:00 PM)'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Probation Period</span>
                <span className="text-foreground block mt-0.5">{employee.probationPeriodDays} Days</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Confirmation Date</span>
                <span className="text-foreground block mt-0.5">{formatDate(employee.confirmationDate)}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notice Period</span>
                <span className="text-foreground block mt-0.5">{employee.noticePeriodDays} Days</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Working Date</span>
                <span className="text-foreground block mt-0.5">{formatDate(employee.lastWorkingDate)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Upload form card (HR Only) */}
            {isHr && (
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h3 className="text-md font-serif font-bold text-foreground mb-4 flex items-center gap-1.5">
                  <FileUp className="w-5 h-5 text-primary" /> Upload New File
                </h3>
                
                {uploadMessage && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-md">{uploadMessage}</div>}
                {uploadError && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">{uploadError}</div>}

                <form onSubmit={handleDocUpload} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Document Category</label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Offer Letter">Offer Letter</option>
                      <option value="Appointment Letter">Appointment Letter</option>
                      <option value="NDA">NDA</option>
                      <option value="Address Proof">Address Proof</option>
                      <option value="Educational Certificates">Educational Certificates</option>
                      <option value="Experience Letter">Experience Letter</option>
                      <option value="NDA Agreement">Employment Agreement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={docExpiry}
                      onChange={(e) => setDocExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Select File (PDF, JPG, PNG - Max 5MB)</label>
                    <div className="flex gap-2">
                      <input
                        id="doc-file-input"
                        name="file"
                        type="file"
                        required
                        className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary file:cursor-pointer"
                      />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-sans font-medium text-sm rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Upload
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Document Listing Table */}
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-secondary/20">
                <h3 className="text-md font-serif font-bold text-foreground">Employee Document Registry</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase text-muted-foreground">Category</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase text-muted-foreground">File Name</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase text-muted-foreground">Version</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase text-muted-foreground">Uploaded By</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase text-muted-foreground">Upload Date</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase text-muted-foreground">Expiry</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                      {isHr && <th className="px-6 py-3.5 text-xs font-semibold uppercase text-muted-foreground text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {employee.documents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                          No documents uploaded yet.
                        </td>
                      </tr>
                    ) : (
                      employee.documents.map((doc: any) => (
                        <tr key={doc.id} className="hover:bg-secondary/10">
                          <td className="px-6 py-4 font-semibold text-foreground">{doc.category}</td>
                          <td className="px-6 py-4">
                            <a
                              href={doc.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-medium"
                            >
                              {doc.fileName}
                            </a>
                          </td>
                          <td className="px-6 py-4">v{doc.version}</td>
                          <td className="px-6 py-4 text-muted-foreground">{doc.uploadedBy?.name || 'HR Portal'}</td>
                          <td className="px-6 py-4 text-muted-foreground">{formatDate(doc.uploadDate)}</td>
                          <td className="px-6 py-4 text-muted-foreground">{doc.expiryDate ? formatDate(doc.expiryDate) : '-'}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${
                                doc.verificationStatus === 'VERIFIED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : doc.verificationStatus === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {doc.verificationStatus}
                            </span>
                          </td>
                          {isHr && (
                            <td className="px-6 py-4 text-right">
                              {doc.verificationStatus === 'PENDING' && (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleDocVerify(doc.id, 'VERIFIED')}
                                    className="p-1 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-700 border border-border bg-card"
                                    title="Approve"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDocVerify(doc.id, 'REJECTED')}
                                    className="p-1 hover:bg-rose-50 rounded text-rose-600 hover:text-rose-700 border border-border bg-card"
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Attendance */}
        {activeTab === 'attendance' && (
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary/20">
              <h3 className="text-md font-serif font-bold text-foreground">Attendance Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-xs font-semibold uppercase text-muted-foreground">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Check-In</th>
                    <th className="px-6 py-3.5">Check-Out</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5">Hours</th>
                    <th className="px-6 py-3.5">Late / Early</th>
                    <th className="px-6 py-3.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {employee.attendance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                        No attendance logs found.
                      </td>
                    </tr>
                  ) : (
                    employee.attendance.map((att: any) => (
                      <tr key={att.id} className="hover:bg-secondary/10">
                        <td className="px-6 py-4 font-semibold">{formatDate(att.date)}</td>
                        <td className="px-6 py-4 text-muted-foreground">{att.checkIn ? formatDateTime(att.checkIn).split(' ')[1] : '-'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{att.checkOut ? formatDateTime(att.checkOut).split(' ')[1] : '-'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${
                              att.status === 'Present' || att.status === 'Work From Home' || att.status === 'On Site'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : att.status === 'Absent'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{att.workLocation}</td>
                        <td className="px-6 py-4 font-medium">{att.workingHours > 0 ? `${att.workingHours} hrs` : '-'}</td>
                        <td className="px-6 py-4">
                          {att.lateArrival && <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">Late Arrival</span>}
                          {att.earlyDeparture && <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 ml-1">Early Exit</span>}
                          {!att.lateArrival && !att.earlyDeparture && <span className="text-muted-foreground text-xs">-</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">{att.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Issued Assets */}
        {activeTab === 'assets' && (
          <div className="space-y-6">
            {/* Asset Return Modal Form overlay */}
            {returningAssetId && (
              <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <h3 className="text-md font-serif font-bold text-foreground">Record Asset Return</h3>
                    <button onClick={() => setReturningAssetId(null)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {returnError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md">{returnError}</div>}

                  <form onSubmit={handleAssetReturnSubmit} className="space-y-4 text-sm font-sans">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Return Condition *</label>
                      <select
                        value={returnCondition}
                        onChange={(e) => setReturnCondition(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="Returned">Good / Usable</option>
                        <option value="Damaged Needs Repair">Damaged (Needs Repair)</option>
                        <option value="Damaged Unusable">Damaged beyond repair (Retired)</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Missing Accessories (Optional)</label>
                      <input
                        type="text"
                        value={missingAcc}
                        onChange={(e) => setMissingAcc(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. charger, cable"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Damage Details (Optional)</label>
                      <input
                        type="text"
                        value={damageDet}
                        onChange={(e) => setDamageDet(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. cracked screen, dent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Recovery Amount (INR)</label>
                      <input
                        type="number"
                        value={recoveryAmt}
                        onChange={(e) => setRecoveryAmt(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Remarks</label>
                      <textarea
                        value={returnRemarks}
                        onChange={(e) => setReturnRemarks(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        placeholder="General return remarks..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-sans font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
                    >
                      {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Record Asset Return
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Issued Assets Table */}
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-secondary/20">
                <h3 className="text-md font-serif font-bold text-foreground">Company-Issued Assets</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40 text-xs font-semibold uppercase text-muted-foreground">
                      <th className="px-6 py-3.5">Asset Code</th>
                      <th className="px-6 py-3.5">Item Name</th>
                      <th className="px-6 py-3.5">Serial Number</th>
                      <th className="px-6 py-3.5">Issue Date</th>
                      <th className="px-6 py-3.5">Expected Return</th>
                      <th className="px-6 py-3.5">Condition at Issue</th>
                      <th className="px-6 py-3.5">Status</th>
                      {(userRole === 'ADMIN' || isHr) && <th className="px-6 py-3.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {employee.issuedAssets.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                          No company assets issued to this employee.
                        </td>
                      </tr>
                    ) : (
                      employee.issuedAssets.map((asset: any) => (
                        <tr key={asset.id} className="hover:bg-secondary/10">
                          <td className="px-6 py-4 font-semibold text-foreground">{asset.assetCode}</td>
                          <td className="px-6 py-4">{asset.item?.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">{asset.serialNumber || '-'}</td>
                          <td className="px-6 py-4 text-muted-foreground">{formatDate(asset.issueDate)}</td>
                          <td className="px-6 py-4 text-muted-foreground">{asset.expectedReturnDate ? formatDate(asset.expectedReturnDate) : '-'}</td>
                          <td className="px-6 py-4 text-muted-foreground">{asset.conditionAtIssue}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${
                                asset.status === 'Issued'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : asset.status === 'Returned'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {asset.status}
                            </span>
                          </td>
                          {(userRole === 'ADMIN' || isHr) && (
                            <td className="px-6 py-4 text-right">
                              {asset.status === 'Issued' && (
                                <button
                                  onClick={() => setReturningAssetId(asset.id)}
                                  className="px-3 py-1 bg-secondary text-foreground hover:bg-accent border border-border text-xs font-semibold rounded-md transition-colors"
                                >
                                  Record Return
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Emergency Contact */}
        {activeTab === 'emergency' && (
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-serif font-bold text-foreground pb-2 border-b border-border/60">Emergency Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact Person</span>
                <span className="text-foreground font-semibold block mt-0.5">{employee.emergencyContactName}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Relationship</span>
                <span className="text-foreground block mt-0.5">{employee.emergencyContactRelationship}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mobile Number</span>
                <span className="text-foreground block mt-0.5">{employee.emergencyContactNumber}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Bank & Statutory Details (Confidential - HR Only) */}
        {activeTab === 'bank' && isHr && (
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-serif font-bold text-foreground">Confidential Bank & Statutory Registry</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bank Name</span>
                <span className="text-foreground block mt-0.5 font-medium">{employee.bankName || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account Holder</span>
                <span className="text-foreground block mt-0.5 font-medium">{employee.bankAccountHolderName || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account Number</span>
                <span className="text-foreground block mt-0.5 font-mono tracking-wider font-semibold">{employee.bankAccountNumber || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">IFSC Code</span>
                <span className="text-foreground block mt-0.5 font-mono font-semibold">{employee.bankIfscCode || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">PAN Number</span>
                <span className="text-foreground block mt-0.5 font-mono font-semibold">{employee.panNumber || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aadhaar Number</span>
                <span className="text-foreground block mt-0.5 font-mono font-semibold">{employee.aadhaarNumber || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">UAN Number</span>
                <span className="text-foreground block mt-0.5 font-mono font-semibold">{employee.uanNumber || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Provident Fund (PF) Details</span>
                <span className="text-foreground block mt-0.5 font-semibold">{employee.pfDetails || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">ESI Insurance Details</span>
                <span className="text-foreground block mt-0.5 font-semibold">{employee.esiDetails || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && isHr && (
          <PayrollTab employee={employee} />
        )}

        {/* Tab 8: Activity History */}
        {activeTab === 'history' && (
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-serif font-bold text-foreground pb-2 border-b border-border/60">Activity Audit Trail</h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recorded activity history for this employee.</p>
            ) : (
              <div className="relative border-l border-border pl-6 space-y-6 text-sm font-sans ml-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative">
                    {/* Circle icon on the timeline */}
                    <span className="absolute -left-9 top-1 w-3 h-3 rounded-full bg-primary border-2 border-card shadow-sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-foreground">{log.action.replace(/_/g, ' ')}</strong>
                        <span className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Performed by: <strong>{log.userName}</strong> ({log.userRole})
                      </p>
                      {log.reason && (
                        <p className="text-xs italic text-muted-foreground/90 mt-0.5">
                          Reason: {log.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PayrollTab({ employee }: { employee: any }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [payrollData, setPayrollData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculate = async () => {
    setLoading(true);
    setError('');
    const { calculatePayrollAction } = await import('@/app/actions/payroll');
    const res = await calculatePayrollAction(employee.id, month, year);
    if (res.success) {
      setPayrollData(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-border/60">
        <Landmark className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-serif font-bold text-foreground">Payroll & Salary Calculation</h2>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Month</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-3 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary">
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Year</label>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="px-3 py-1.5 bg-background border border-border rounded text-sm w-24 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <button onClick={calculate} disabled={loading} className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded shadow-sm transition-colors flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Calculate Salary
        </button>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-800 text-sm rounded border border-rose-200">{error}</div>}

      {payrollData && (
        <div className="p-4 bg-secondary/20 border border-border rounded grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-4">
          <div>
            <span className="block text-xs text-muted-foreground uppercase">Base Salary</span>
            <span className="font-semibold text-lg">?{payrollData.baseSalary}</span>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground uppercase">Working Days (Month)</span>
            <span className="font-semibold text-lg">{payrollData.totalDaysInMonth}</span>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground uppercase">Days Present</span>
            <span className="font-semibold text-lg">{payrollData.daysPresent}</span>
          </div>
          <div className="bg-primary/5 p-2 rounded border border-primary/20 -m-2">
            <span className="block text-xs text-primary font-semibold uppercase">Calculated Payout</span>
            <span className="font-bold text-xl text-primary">?{payrollData.calculatedSalary}</span>
          </div>
        </div>
      )}
    </div>
  );
}
