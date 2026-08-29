'use client';

import { useState, useTransition, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createVisitorAction,
  recordVisitorExitAction,
  addVisitorCorrectionAction,
  lookupVisitorPhoneAction
} from '@/app/actions/visitors';
import {
  UserCheck,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Phone,
  Building,
  UserMinus,
  MessageSquare,
  History,
  FileSpreadsheet,
  Clock
} from 'lucide-react';
import { cn, formatDate, formatDateTime } from '@/lib/utils';

interface VisitorsLogProps {
  visitors: any[];
  activeSiteId: string | null;
  activeSiteName: string;
  userRole: string;
  sites?: any[];
}

export default function VisitorsLog({
  visitors,
  activeSiteId,
  activeSiteName,
  userRole,
  sites = []
}: VisitorsLogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewTab, setViewTab] = useState<'all' | 'inside'>('all');

  // Handle initial tab selection via query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'inside') {
        setViewTab('inside');
      }
    }
  }, []);

  // Modals state
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [correctionSubId, setCorrectionSubId] = useState<string | null>(null);
  const [correctionNote, setCorrectionNote] = useState('');
  const [correctionError, setCorrectionError] = useState('');

  // Phone lookup states
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');

  const [state, formAction, createPending] = useActionState(createVisitorAction, {
    success: false,
    message: '',
  });

  // Reset check-in modal on success
  useEffect(() => {
    if (state.success && checkInOpen) {
      setCheckInOpen(false);
      setPhone('');
      setName('');
      setCompany('');
      setLookupMessage('');
      state.success = false; // reset
      router.refresh();
    }
  }, [state.success, checkInOpen, router, state]);

  // Trigger phone lookup on 10 digit entries
  useEffect(() => {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length >= 10) {
      setIsLookupLoading(true);
      setLookupMessage('');
      
      lookupVisitorPhoneAction(cleanPhone).then((res) => {
        setIsLookupLoading(false);
        if (res.success && res.found) {
          setName(res.name || '');
          setCompany(res.company || '');
          setLookupMessage('Returning visitor recognized. Name & company auto-filled.');
        } else {
          setLookupMessage('New visitor detected.');
        }
      });
    }
  }, [phone]);

  // Submit checkout exit time
  const handleCheckout = (visitorId: string) => {
    if (!confirm('Record visitor checkout exit time?')) return;
    
    startTransition(async () => {
      const res = await recordVisitorExitAction(visitorId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  // Submit Correction note
  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionSubId || !correctionNote) return;
    setCorrectionError('');

    startTransition(async () => {
      const res = await addVisitorCorrectionAction(correctionSubId, correctionNote);
      if (res.success) {
        setCorrectionSubId(null);
        setCorrectionNote('');
        router.refresh();
      } else {
        setCorrectionError(res.message);
      }
    });
  };

  // Filter visitors by Inside status
  const displayedVisitors = visitors.filter((v) => {
    if (viewTab === 'inside') {
      return !v.exitTime;
    }
    return true;
  });

  const visitorsInsideCount = visitors.filter((v) => !v.exitTime).length;
  const returningCount = visitors.filter((v) => v.isExisting).length;

  return (
    <div className="space-y-6 font-sans text-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Visitor Logs</h1>
          <p className="text-sm text-muted-foreground">
            Manage daily appointments, candidates, clients, and vendor check-ins at <strong>{activeSiteName}</strong>.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/hr/reports?type=visitors&siteId=${activeSiteId || ''}`}
            className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground text-sm rounded-md transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            Export Visitors
          </Link>
          <button
            onClick={() => setCheckInOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-medium rounded-md shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Visitor Check-in
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
        <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Today's Visits</span>
          <p className="text-3xl font-serif font-bold text-foreground mt-2">{visitors.length} Registrations</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Currently Inside</span>
          <p className="text-3xl font-serif font-bold text-primary mt-2">{visitorsInsideCount} Inside</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Returning Visitors</span>
          <p className="text-3xl font-serif font-bold text-foreground mt-2">{returningCount} Recognized</p>
        </div>
      </div>

      {/* Tab controls */}
      <div className="border-b border-border flex justify-between items-center select-none">
        <div className="flex space-x-6 pb-px">
          <button
            onClick={() => setViewTab('all')}
            className={cn(
              'py-3 text-sm font-semibold border-b-2 transition-all',
              viewTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            All Check-ins
          </button>
          <button
            onClick={() => setViewTab('inside')}
            className={cn(
              'py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5',
              viewTab === 'inside' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Currently Inside
            <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded-full font-bold font-sans">
              {visitorsInsideCount}
            </span>
          </button>
        </div>
      </div>

      {/* Visitor logs Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3">Visitor Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Purpose</th>
                <th className="px-5 py-3">Host (Person to Meet)</th>
                <th className="px-5 py-3">Entry Time</th>
                <th className="px-5 py-3">Exit Time</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {displayedVisitors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                    No visitor check-ins recorded for this filter.
                  </td>
                </tr>
              ) : (
                displayedVisitors.map((v) => (
                  <tr key={v.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-foreground">{v.name}</p>
                        <p className="text-[10px] text-muted-foreground/80 font-sans mt-0.5">
                          {v.phone} {v.company ? `| ${v.company}` : ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">{v.category}</td>
                    <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">{v.purpose}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-foreground font-medium">{v.personToMeet}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-muted-foreground flex items-center gap-1 mt-1.5"><Clock className="w-3.5 h-3.5 text-primary shrink-0" /> {formatDateTime(v.entryTime).split(' ')[1]}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                      {v.exitTime ? (
                        formatDateTime(v.exitTime).split(' ')[1]
                      ) : (
                        <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Inside</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded border',
                          v.isExisting
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        )}
                      >
                        {v.isExisting ? 'Returning' : 'New'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setCorrectionSubId(v.id)}
                          className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                          title="Add Correction Note"
                        >
                          <MessageSquare className="w-4.5 h-4.5" />
                        </button>
                        {!v.exitTime && (
                          <button
                            onClick={() => handleCheckout(v.id)}
                            disabled={isPending}
                            className="px-2.5 py-1 bg-secondary text-foreground hover:bg-accent border border-border text-xs font-semibold rounded transition-colors disabled:opacity-50"
                          >
                            Checkout
                          </button>
                        )}
                      </div>

                      {/* Display correction notes if any */}
                      {v.corrections && v.corrections.length > 0 && (
                        <span className="block text-[10px] text-amber-600 text-right mt-1 italic">
                          Modified: {v.corrections.length} audit notes
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Check-in Visitor */}
      {checkInOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Visitor Registration Check-In</h3>
              <button onClick={() => setCheckInOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {state.message && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{state.message}</div>
            )}

            <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              {activeSiteId ? (
                <input type="hidden" name="siteId" value={activeSiteId} />
              ) : (
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Select Site *</label>
                  <select name="siteId" required className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">-- Select Site --</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Phone Number *</label>
                <div className="relative">
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Candidate mobile number"
                  />
                  {isLookupLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    </span>
                  )}
                </div>
                {lookupMessage && (
                  <p className="text-[10px] text-primary mt-1 font-semibold">{lookupMessage}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Visitor Full Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Visitor full name"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Company / Organization</label>
                <input
                  name="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Visitor Category *</label>
                <select
                  name="category"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Client">Client</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Candidate">Candidate</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Government Official">Government Official</option>
                  <option value="Delivery Person">Delivery Person</option>
                  <option value="Service Provider">Service Provider</option>
                  <option value="Personal Visitor">Personal Visitor</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Person to Meet *</label>
                <input
                  name="personToMeet"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Employee name host"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Purpose of Visit *</label>
                <input
                  name="purpose"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Interview, Sales meeting"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Number of Visitors</label>
                <input
                  name="numberOfVisitors"
                  type="number"
                  defaultValue={1}
                  min={1}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Vehicle Number</label>
                <input
                  name="vehicleNumber"
                  type="text"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. KA-01-AB-1234"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Items Carried</label>
                <input
                  name="itemsCarried"
                  type="text"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Laptop, Toolbag"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Remarks</label>
                <textarea
                  name="remarks"
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="General check-in remarks..."
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-3 border-t border-border mt-2">
                <button
                  type="submit"
                  disabled={createPending}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-sans font-medium rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {createPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Register Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Correction Note */}
      {correctionSubId && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">File Visitor Correction Note</h3>
              <button onClick={() => setCorrectionSubId(null)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {correctionError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{correctionError}</div>}

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <span className="block font-semibold text-muted-foreground uppercase mb-1">Original Entry</span>
                <p className="text-sm font-semibold text-foreground py-1">
                  {visitors.find(v => v.id === correctionSubId)?.name} (Checked in today)
                </p>
                <p className="text-[10px] text-muted-foreground/80 leading-normal">
                  Note: The original visitor entry is permanently locked and cannot be edited. This correction note will be attached to the record for audit review.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Correction Description *</label>
                <textarea
                  required
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/50"
                  placeholder="e.g. Corrected spelling of name from Sarah to Sara, or corrected person met to Vikram..."
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Correction Note
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
