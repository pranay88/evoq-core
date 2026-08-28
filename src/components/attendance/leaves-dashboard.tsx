'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Search
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { updateLeaveStatusAction } from '@/app/actions/leaves';

export default function LeavesDashboard({ leaves }: { leaves: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState('PENDING');
  
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionError, setActionError] = useState('');

  const filteredLeaves = leaves.filter(l => filter === 'ALL' || l.status === filter);

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedLeave) return;
    setActionError('');
    startTransition(async () => {
      const res = await updateLeaveStatusAction(selectedLeave.id, status, remarks);
      if (res.success) {
        setSelectedLeave(null);
        setRemarks('');
        router.refresh();
      } else {
        setActionError(res.message);
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and approve employee leave applications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center">
              <h3 className="font-serif font-bold text-foreground">Leave Requests</h3>
              <select value={filter} onChange={e => setFilter(e.target.value)} className="px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="ALL">All Requests</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            
            <div className="divide-y divide-border/60">
              {filteredLeaves.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <CalendarClock className="w-10 h-10 opacity-20" />
                  <p>No leave requests found.</p>
                </div>
              ) : (
                filteredLeaves.map(leave => (
                  <button
                    key={leave.id}
                    onClick={() => setSelectedLeave(leave)}
                    className={`w-full p-4 text-left hover:bg-secondary/40 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${selectedLeave?.id === leave.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{leave.employee.fullName}</span>
                        <span className="text-xs text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">{leave.employee.employeeId}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{leave.employee.department?.name}</span>
                        <span>{leave.employee.site?.name}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="font-semibold text-foreground">{leave.leaveType.replace('_', ' ')}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(leave.startDate)} to {formatDate(leave.endDate)} ({leave.days} days)</div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          {selectedLeave ? (
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6 sticky top-6">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground mb-1">Request Details</h3>
                <p className="text-sm text-muted-foreground">Submitted on {formatDate(selectedLeave.appliedAt)}</p>
              </div>

              <div className="space-y-4 text-sm bg-secondary/20 p-4 rounded-lg border border-border">
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Employee</span>
                  <span className="font-semibold text-foreground">{selectedLeave.employee.fullName}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Leave Type</span>
                    <span className="text-foreground">{selectedLeave.leaveType.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Duration</span>
                    <span className="text-foreground">{selectedLeave.days} days</span>
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Dates</span>
                  <span className="text-foreground">{formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Reason</span>
                  <p className="text-foreground bg-background p-2 rounded border border-border/50 text-sm">{selectedLeave.reason}</p>
                </div>
              </div>

              {selectedLeave.status === 'PENDING' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">HR Remarks (Optional)</label>
                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Add remarks for the employee..."></textarea>
                  </div>
                  
                  {actionError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{actionError}</div>}

                  <div className="flex gap-3">
                    <button onClick={() => handleAction('REJECTED')} disabled={isPending} className="flex-1 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                    </button>
                    <button onClick={() => handleAction('APPROVED')} disabled={isPending} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${getStatusColor(selectedLeave.status)}`}>
                    <p className="text-sm font-semibold mb-1">Status: {selectedLeave.status}</p>
                    {selectedLeave.remarks && <p className="text-xs mt-2"><strong>Remarks:</strong> {selectedLeave.remarks}</p>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 text-center text-muted-foreground h-full flex flex-col items-center justify-center gap-3">
              <Clock className="w-12 h-12 opacity-20" />
              <p className="text-sm">Select a leave request to view details and take action.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
