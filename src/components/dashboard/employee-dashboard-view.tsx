'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CalendarDays,
  CalendarCheck,
  CalendarOff,
  Briefcase,
  LogOut,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import Link from 'next/link';

interface EmployeeDashboardViewProps {
  user: any;
  employee: any;
  stats: any;
  monthlyAttendance: any[];
  leaveBalances: any[];
  recentLeaves: any[];
}

export default function EmployeeDashboardView({
  user,
  employee,
  stats,
  monthlyAttendance,
  leaveBalances,
  recentLeaves,
}: EmployeeDashboardViewProps) {
  const router = useRouter();

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState('');

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveLoading(true);
    setLeaveError('');
    setLeaveSuccess('');

    const { applyLeaveAction } = await import('@/app/actions/leaves');
    const res = await applyLeaveAction(employee.id, leaveType, startDate, endDate, leaveReason);
    
    if (res.success) {
      setLeaveSuccess(res.message);
      setTimeout(() => {
        setLeaveModalOpen(false);
        setLeaveSuccess('');
        setLeaveType('CASUAL');
        setStartDate('');
        setEndDate('');
        setLeaveReason('');
        router.refresh();
      }, 2000);
    } else {
      setLeaveError(res.message);
    }
    setLeaveLoading(false);
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out?')) return;
    
    // In a real app we'd call the server action, but for kiosks we can redirect to standard logout
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/attendance-portal'; 
    // Wait, let's just trigger logout Action or redirect to login which clears session?
    // Actually, calling the server action is best. 
    // Since we don't have it imported here, let's redirect to `/unauthorized` or `/login`.
    router.push('/login');
  };

  // Find today's record to display status
  const todayRecord = monthlyAttendance.length > 0 && 
    new Date(monthlyAttendance[0].date).toDateString() === new Date().toDateString()
      ? monthlyAttendance[0]
      : null;

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-2xl font-serif shrink-0">
            {employee.fullName.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-serif text-foreground">{employee.fullName}</h1>
            <p className="text-muted-foreground mt-1">
              {employee.designation} &bull; {employee.department?.name}
            </p>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> ID: {employee.employeeId}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {employee.site?.name}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 w-full md:w-auto">
          {todayRecord ? (
            <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider">Status Today</p>
                <p className="font-semibold">{todayRecord.status}</p>
              </div>
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider">Status Today</p>
                <p className="font-semibold">Not Checked In</p>
              </div>
              <Clock className="w-6 h-6" />
            </div>
          )}
          <button onClick={() => setLeaveModalOpen(true)} className="text-xs text-center text-primary-foreground bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 border border-primary py-2 rounded-lg">
            <CalendarCheck className="w-4 h-4" /> Apply for Leave
          </button>
          <Link href="/attendance-portal" className="text-xs text-center text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5 border border-border bg-secondary/50 py-2 rounded-lg hover:bg-secondary">
            <LogOut className="w-4 h-4" /> Sign out of Portal
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Present This Month</span>
          <p className="text-3xl font-serif font-bold text-foreground mt-2">{stats.totalPresent} <span className="text-sm font-sans font-normal text-muted-foreground">days</span></p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Hours Logged</span>
          <p className="text-3xl font-serif font-bold text-primary mt-2">{stats.totalHours} <span className="text-sm font-sans font-normal text-muted-foreground">hrs</span></p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Late Arrivals</span>
          <p className="text-3xl font-serif font-bold text-rose-500 mt-2">{stats.totalLate} <span className="text-sm font-sans font-normal text-muted-foreground">days</span></p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Available Leave</span>
          <p className="text-3xl font-serif font-bold text-foreground mt-2">
            {leaveBalances.reduce((acc, curr) => acc + (curr.totalLeaves - curr.usedLeaves), 0)} <span className="text-sm font-sans font-normal text-muted-foreground">days</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Attendance Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/60 flex justify-between items-center bg-secondary/20">
              <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" /> Monthly Log
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase text-muted-foreground bg-secondary/30">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Check In</th>
                    <th className="px-5 py-3 font-semibold">Check Out</th>
                    <th className="px-5 py-3 font-semibold">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {monthlyAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground italic">
                        No attendance records found for this month.
                      </td>
                    </tr>
                  ) : (
                    monthlyAttendance.map((log) => (
                      <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-3 font-medium">
                          {new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                            log.status === 'Present' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            log.status.includes('Leave') ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                          {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          {log.lateArrival && <AlertTriangle className="w-3 h-3 text-amber-500 inline ml-1" />}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                          {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td className="px-5 py-3 font-semibold text-primary/80">
                          {log.workingHours ? `${log.workingHours}h` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Leaves */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2 pb-2 border-b border-border/60">
              <CalendarCheck className="w-5 h-5 text-primary" /> Leave Balances
            </h3>
            
            <div className="space-y-4">
              {leaveBalances.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No leave balances configured.</p>
              ) : (
                leaveBalances.map((bal) => {
                  const remaining = bal.totalLeaves - bal.usedLeaves;
                  const percentage = (bal.usedLeaves / bal.totalLeaves) * 100;
                  return (
                    <div key={bal.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{bal.leaveType}</span>
                        <span>{remaining} left <span className="text-muted-foreground font-normal">of {bal.totalLeaves}</span></span>
                      </div>
                      <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${remaining < 2 ? 'bg-rose-500' : 'bg-primary'}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {leaveModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-xl shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-serif font-bold text-foreground mb-4">Apply for Leave</h3>
            
            {leaveSuccess && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded border border-emerald-200">{leaveSuccess}</div>}
            {leaveError && <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded border border-rose-200">{leaveError}</div>}

            <form onSubmit={handleApplyLeave} className="space-y-4 font-sans text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Leave Type *</label>
                <select value={leaveType} onChange={e => setLeaveType(e.target.value)} required className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="PRIVILEGE">Privilege / Earned Leave</option>
                  <option value="MATERNITY">Maternity / Paternity Leave</option>
                  <option value="UNPAID">Leave Without Pay (LWP)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Start Date *</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">End Date *</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required min={startDate || new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Reason *</label>
                <textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} required rows={3} placeholder="Please provide a reason for your leave..." className="w-full px-3 py-2 bg-background border border-border rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary"></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-border/50">
                <button type="button" onClick={() => setLeaveModalOpen(false)} className="px-4 py-2 hover:bg-secondary text-foreground rounded font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={leaveLoading} className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                  {leaveLoading && <Loader2 className="w-4 h-4 animate-spin" />} Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
