'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { approveSubmissionAction, requestCorrectionAction } from '@/app/actions/onboarding';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  X,
  User,
  Landmark,
  ShieldCheck,
  Calendar,
  Briefcase
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SubmissionsListProps {
  submissions: any[];
  departments: Array<{ id: string; name: string }>;
  sites: Array<{ id: string; name: string }>;
}

export default function SubmissionsList({ submissions, departments, sites }: SubmissionsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  
  // Correction form state
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionRemarks, setCorrectionRemarks] = useState('');
  const [correctionError, setCorrectionError] = useState('');

  // Approval form state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [deptId, setDeptId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [designation, setDesignation] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [empType, setEmpType] = useState('FULL_TIME');
  const [baseSalary, setBaseSalary] = useState('');
  const [approvalError, setApprovalError] = useState('');

  // Request Correction submit handler
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !correctionRemarks) return;
    setCorrectionError('');

    startTransition(async () => {
      const res = await requestCorrectionAction(selectedSub.id, correctionRemarks);
      if (res.success) {
        setCorrectionModalOpen(false);
        setCorrectionRemarks('');
        setSelectedSub(null);
        router.refresh();
      } else {
        setCorrectionError(res.message);
      }
    });
  };

  // Approve & Onboard submit handler
  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !deptId || !siteId || !designation || !joiningDate) {
      setApprovalError('Please fill in all required fields.');
      return;
    }
    setApprovalError('');

    startTransition(async () => {
      const res = await approveSubmissionAction(
        selectedSub.id,
        deptId,
        siteId,
        designation,
        joiningDate,
        empType,
        baseSalary ? parseFloat(baseSalary) : 0
      );

      if (res.success) {
        setApprovalModalOpen(false);
        setSelectedSub(null);
        router.refresh();
      } else {
        setApprovalError(res.message);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CORRECTION_REQUESTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  // Parse candidate personal data JSON Sync
  const getCandidateData = (sub: any) => {
    try {
      return JSON.parse(sub.personalData);
    } catch (e) {
      return {};
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-sm">
      {/* Submissions List Column */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-secondary/15">
            <h2 className="text-md font-serif font-bold text-foreground">Pending Reviews</h2>
          </div>
          <div className="divide-y divide-border/60 max-h-[calc(100vh-220px)] overflow-y-auto">
            {submissions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">
                No self-onboarding submissions require review.
              </div>
            ) : (
              submissions.map((sub) => {
                const data = getCandidateData(sub);
                const isSelected = selectedSub?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSub(sub);
                      setApprovalModalOpen(false);
                      setCorrectionModalOpen(false);
                    }}
                    className={`w-full p-4 text-left transition-colors flex flex-col gap-2 ${
                      isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-semibold text-foreground truncate">{data.fullName || sub.invitation.email}</span>
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusBadge(sub.status)}`}>
                        {sub.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{sub.invitation.email}</p>
                    <span className="text-[10px] text-muted-foreground/80 mt-1">Submitted: {formatDate(sub.submittedAt)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Submissions Detail View Column */}
      <div className="lg:col-span-2">
        {selectedSub ? (
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
            {/* Header Action area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">
                  Review: {getCandidateData(selectedSub).fullName}
                </h2>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Invitation Email: <strong>{selectedSub.invitation.email}</strong>
                </p>
              </div>

              {selectedSub.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCorrectionModalOpen(true);
                      setApprovalModalOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground rounded-md transition-colors"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Request Correction
                  </button>
                  <button
                    onClick={() => {
                      setApprovalModalOpen(true);
                      setCorrectionModalOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-xs font-semibold text-primary-foreground rounded-md shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Onboard
                  </button>
                </div>
              )}
            </div>

            {/* Correction Form Overlay panel */}
            {correctionModalOpen && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-md space-y-3 animate-fade-in text-sm font-sans">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-amber-800">Specify Correction Request</span>
                  <button onClick={() => setCorrectionModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {correctionError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{correctionError}</div>}
                <form onSubmit={handleCorrectionSubmit} className="space-y-3">
                  <textarea
                    required
                    value={correctionRemarks}
                    onChange={(e) => setCorrectionRemarks(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/50"
                    placeholder="Describe exactly what needs modification (e.g. Uploaded Aadhaar card copy is blurry, please replace)..."
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary/95 text-xs font-semibold text-primary-foreground rounded-md shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                    Submit Request
                  </button>
                </form>
              </div>
            )}

            {/* Approval Form Overlay panel */}
            {approvalModalOpen && (
              <div className="p-5 bg-primary/5 border border-primary/20 rounded-md space-y-4 animate-fade-in text-sm font-sans">
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="font-semibold text-primary">Assign Profile Details & Onboard</span>
                  <button onClick={() => setApprovalModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {approvalError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{approvalError}</div>}
                
                <form onSubmit={handleApprovalSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Site Location *</label>
                    <select
                      required
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select Site</option>
                      {sites.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Department *</label>
                    <select
                      required
                      value={deptId}
                      onChange={(e) => setDeptId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Designation *</label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. Sales Executive"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Employment Type *</label>
                    <select
                      value={empType}
                      onChange={(e) => setEmpType(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERN">Intern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Joining Date *</label>
                    <input
                      type="date"
                      required
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Base Salary (INR) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      placeholder={selectedSub?.data?.baseSalary || "Enter salary"}
                      className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {selectedSub?.data?.baseSalary && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Candidate requested: ₹{selectedSub.data.baseSalary}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex items-center justify-center px-5 py-2 bg-primary hover:bg-primary/95 text-xs font-semibold text-primary-foreground rounded-md shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                      Approve & Create Profile
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Candidate details panel */}
            <div className="space-y-6">
              {/* Personal Details */}
              <div className="bg-secondary/20 p-5 rounded-lg border border-border space-y-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/60 pb-2">
                  <User className="w-4 h-4 text-primary" /> Personal Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Full Name:</span>
                    <p className="font-semibold text-foreground mt-0.5">{getCandidateData(selectedSub).fullName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mobile & Email:</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {getCandidateData(selectedSub).mobileNumber} &bull; {getCandidateData(selectedSub).personalEmail}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date of Birth & Gender:</span>
                    <p className="text-foreground mt-0.5">
                      {formatDate(getCandidateData(selectedSub).dateOfBirth)} ({getCandidateData(selectedSub).gender})
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Emergency Contact:</span>
                    <p className="text-foreground mt-0.5">
                      {getCandidateData(selectedSub).emergencyContactName} ({getCandidateData(selectedSub).emergencyContactRelationship}) &bull; {getCandidateData(selectedSub).emergencyContactNumber}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Residential Addresses (Current & Permanent):</span>
                    <p className="text-foreground mt-1 whitespace-pre-line leading-relaxed">
                      {getCandidateData(selectedSub).currentAddress}
                      <br />
                      <span className="text-muted-foreground/60 italic text-[10px] block mt-1">Permanent:</span>
                      {getCandidateData(selectedSub).permanentAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-secondary/20 p-5 rounded-lg border border-border space-y-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/60 pb-2">
                  <Landmark className="w-4 h-4 text-primary" /> Bank & Statutory Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Bank Name & Holder:</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {getCandidateData(selectedSub).bankName} &bull; {getCandidateData(selectedSub).bankAccountHolderName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account & IFSC:</span>
                    <p className="font-semibold text-foreground mt-0.5 font-mono">
                      {getCandidateData(selectedSub).bankAccountNumber} ({getCandidateData(selectedSub).bankIfscCode})
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PAN & Aadhaar:</span>
                    <p className="text-foreground mt-0.5 font-mono">
                      PAN: {getCandidateData(selectedSub).panNumber} &bull; Aadhaar: {getCandidateData(selectedSub).aadhaarNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Uploaded Scans */}
              <div className="bg-secondary/20 p-5 rounded-lg border border-border space-y-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/60 pb-2">
                  <FileText className="w-4 h-4 text-primary" /> Uploaded Scanned Files
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {getCandidateData(selectedSub).documents &&
                    Object.entries(getCandidateData(selectedSub).documents).flatMap(([category, files]: any) => {
                      const fileArray = Array.isArray(files) ? files : [files];
                      return fileArray.map((file: any, idx: number) => (
                        <div key={`${category}-${idx}`} className="p-3 bg-card border border-border rounded flex flex-col justify-between">
                          <div>
                            <span className="font-semibold text-foreground block">{category} {fileArray.length > 1 ? `(${idx + 1})` : ''}</span>
                            <span className="text-[10px] text-muted-foreground truncate block mt-0.5" title={file.name}>{file.name}</span>
                          </div>
                          <a
                            href={file.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs font-semibold inline-flex items-center gap-1 mt-3.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Scan
                          </a>
                        </div>
                      ));
                    })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-12 bg-card border border-border rounded-lg text-center text-muted-foreground">
            <div>
              <User className="w-12 h-12 text-primary/30 mx-auto mb-3" />
              <p className="font-serif text-lg">Select a Pending Submission</p>
              <p className="text-xs mt-1">Select a candidate on the left to review their uploaded files, emergency contacts, and banking details.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
