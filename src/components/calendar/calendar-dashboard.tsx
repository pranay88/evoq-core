'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createFestivalAction, createReminderAction, completeReminderAction } from '@/app/actions/calendar';
import {
  Calendar,
  Gift,
  AlertCircle,
  Plus,
  X,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Building,
  Bell,
  Check,
  Loader2,
  PartyPopper
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface CalendarDashboardProps {
  employees: any[];
  festivals: any[];
  reminders: any[];
  sites: any[];
  departments: any[];
  userRole: string;
  defaultTab?: string;
}

export default function CalendarDashboard({
  employees,
  festivals,
  reminders,
  sites,
  departments,
  userRole,
  defaultTab = 'birthdays'
}: CalendarDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Modals state
  const [festivalModalOpen, setFestivalModalOpen] = useState(false);
  const [festivalName, setFestivalName] = useState('');
  const [festivalDate, setFestivalDate] = useState('');
  const [festivalHoliday, setFestivalHoliday] = useState(true);
  const [festivalDesc, setFestivalDesc] = useState('');
  const [festivalError, setFestivalError] = useState('');

  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remDesc, setRemDesc] = useState('');
  const [remDate, setRemDate] = useState('');
  const [remPriority, setRemPriority] = useState('MEDIUM');
  const [remRole, setRemRole] = useState('');
  const [remSiteId, setRemSiteId] = useState('');
  const [remDeptId, setRemDeptId] = useState('');
  const [remError, setRemError] = useState('');

  const isHr = userRole === 'HR';
  const isFrontDesk = userRole === 'FRONT_DESK';

  // 1. Calculate Birthdays
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  const getBirthdayCategory = (dobString: string | Date) => {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return 'none';

    const m = dob.getMonth();
    const d = dob.getDate();

    if (m === currentMonth && d === currentDate) {
      return 'today';
    }

    // Check tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (m === tomorrow.getMonth() && d === tomorrow.getDate()) {
      return 'tomorrow';
    }

    // Check next 7 days
    const next7Days = [];
    for (let i = 2; i <= 7; i++) {
      const nextD = new Date(today);
      nextD.setDate(today.getDate() + i);
      next7Days.push({ month: nextD.getMonth(), date: nextD.getDate() });
    }

    const matches7Days = next7Days.some(day => day.month === m && day.date === d);
    if (matches7Days) {
      return 'upcoming';
    }

    if (m === currentMonth) {
      return 'month';
    }

    return 'none';
  };

  const birthdaysToday = employees.filter(e => getBirthdayCategory(e.dateOfBirth) === 'today');
  const birthdaysTomorrow = employees.filter(e => getBirthdayCategory(e.dateOfBirth) === 'tomorrow');
  const birthdaysUpcoming = employees.filter(e => getBirthdayCategory(e.dateOfBirth) === 'upcoming');
  const birthdaysThisMonth = employees.filter(e => getBirthdayCategory(e.dateOfBirth) === 'month');

  // Submit Festival
  const handleFestivalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!festivalName || !festivalDate) {
      setFestivalError('Please fill in name and date.');
      return;
    }
    setFestivalError('');

    startTransition(async () => {
      const res = await createFestivalAction(festivalName, festivalDate, festivalHoliday, festivalDesc);
      if (res.success) {
        setFestivalModalOpen(false);
        setFestivalName('');
        setFestivalDate('');
        setFestivalHoliday(true);
        setFestivalDesc('');
        router.refresh();
      } else {
        setFestivalError(res.message);
      }
    });
  };

  // Submit Reminder
  const handleReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle || !remDate || !remPriority) {
      setRemError('Please fill in title, date, and priority.');
      return;
    }
    setRemError('');

    startTransition(async () => {
      const res = await createReminderAction(
        remTitle,
        remDesc,
        remDate,
        remPriority,
        remRole || undefined,
        remSiteId || undefined,
        remDeptId || undefined
      );

      if (res.success) {
        setReminderModalOpen(false);
        setRemTitle('');
        setRemDesc('');
        setRemDate('');
        setRemPriority('MEDIUM');
        setRemRole('');
        setRemSiteId('');
        setRemDeptId('');
        router.refresh();
      } else {
        setRemError(res.message);
      }
    });
  };

  // Complete Reminder
  const handleCompleteReminder = (id: string) => {
    startTransition(async () => {
      const res = await completeReminderAction(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'HIGH':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'MEDIUM':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="space-y-6 font-sans text-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Calendar & Events</h1>
          <p className="text-sm text-muted-foreground">
            Track employee birthdays, upcoming holidays, and manage operational reminders.
          </p>
        </div>
        
        {isHr && (
          <div className="flex gap-2">
            {activeTab === 'festivals' && (
              <button
                onClick={() => setFestivalModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-medium rounded-md shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Festival
              </button>
            )}
            {activeTab === 'reminders' && (
              <button
                onClick={() => setReminderModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-medium rounded-md shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Reminder
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex space-x-6 pb-px select-none">
        <button
          onClick={() => setActiveTab('birthdays')}
          className={cn(
            'py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5',
            activeTab === 'birthdays' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Gift className="w-4.5 h-4.5" /> Birthdays
        </button>
        <button
          onClick={() => setActiveTab('festivals')}
          className={cn(
            'py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5',
            activeTab === 'festivals' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar className="w-4.5 h-4.5" /> Indian Festivals & Holidays
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={cn(
            'py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5',
            activeTab === 'reminders' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Bell className="w-4.5 h-4.5" /> Reminders Checklist
        </button>
      </div>

      {/* Panels */}
      <div className="py-2">
        {/* PANEL 1: Birthdays */}
        {activeTab === 'birthdays' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Birthdays Today card */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
              <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60 flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-primary animate-bounce" /> Birthdays Today ({birthdaysToday.length})
              </h3>
              
              {birthdaysToday.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">No employee birthdays today.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {birthdaysToday.map(emp => (
                    <div key={emp.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{emp.fullName}</p>
                          <p className="text-xs text-muted-foreground">{emp.designation} &bull; {emp.department?.name}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-primary font-semibold block">{emp.site?.name}</span>
                        {!isFrontDesk && <span className="text-muted-foreground">Born: {new Date(emp.dateOfBirth).getFullYear()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Birthdays Tomorrow card */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
              <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60 flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" /> Birthdays Tomorrow ({birthdaysTomorrow.length})
              </h3>
              
              {birthdaysTomorrow.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">No employee birthdays tomorrow.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {birthdaysTomorrow.map(emp => (
                    <div key={emp.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{emp.fullName}</p>
                          <p className="text-xs text-muted-foreground">{emp.designation} &bull; {emp.department?.name}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-primary font-semibold block">{emp.site?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Birthdays (Next 7 Days) */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
              <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60">
                Next 7 Days ({birthdaysUpcoming.length})
              </h3>
              
              {birthdaysUpcoming.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">No upcoming birthdays in the next 7 days.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {birthdaysUpcoming.map(emp => (
                    <div key={emp.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{emp.fullName}</p>
                        <p className="text-xs text-muted-foreground">{emp.designation} &bull; {emp.department?.name}</p>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-primary font-semibold block">{emp.site?.name}</span>
                        <span className="text-muted-foreground font-medium">
                          {new Date(emp.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Birthdays This Month */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
              <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60">
                Remainder of this Month ({birthdaysThisMonth.length})
              </h3>
              
              {birthdaysThisMonth.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">No other birthdays this month.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {birthdaysThisMonth.map(emp => (
                    <div key={emp.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{emp.fullName}</p>
                        <p className="text-xs text-muted-foreground">{emp.designation} &bull; {emp.department?.name}</p>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-primary font-semibold block">{emp.site?.name}</span>
                        <span className="text-muted-foreground font-medium">
                          {new Date(emp.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 2: Festivals & Holidays */}
        {activeTab === 'festivals' && (
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-secondary/15">
              <h3 className="text-md font-serif font-bold text-foreground">Holiday Calendar</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-5 py-3">Festival Name</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Holiday Type</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {festivals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-muted-foreground">
                        No festivals registered.
                      </td>
                    </tr>
                  ) : (
                    festivals.map(f => (
                      <tr key={f.id} className="hover:bg-secondary/10">
                        <td className="px-5 py-4 font-semibold text-foreground">{f.name}</td>
                        <td className="px-5 py-4 text-muted-foreground">{formatDate(f.date)}</td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'inline-flex px-2 py-0.5 text-xs font-semibold rounded',
                              f.isCompanyHoliday
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : 'bg-secondary text-muted-foreground border border-border'
                            )}
                          >
                            {f.isCompanyHoliday ? 'Company Holiday' : 'Observance'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground max-w-sm truncate">{f.description || '-'}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-xs font-semibold">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PANEL 3: Reminders */}
        {activeTab === 'reminders' && (
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-secondary/15 flex justify-between items-center">
              <h3 className="text-md font-serif font-bold text-foreground">Operational Reminders</h3>
            </div>
            
            <div className="divide-y divide-border/60">
              {reminders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No pending reminders found.
                </div>
              ) : (
                reminders.map(rem => {
                  const isCompleted = rem.status === 'COMPLETED';
                  return (
                    <div
                      key={rem.id}
                      className={cn(
                        'p-4 flex justify-between items-start gap-4 transition-colors',
                        isCompleted ? 'bg-secondary/10 opacity-60' : 'hover:bg-secondary/10'
                      )}
                    >
                      <div className="flex gap-3 items-start">
                        {!isCompleted && (
                          <button
                            onClick={() => handleCompleteReminder(rem.id)}
                            disabled={isPending}
                            className="mt-1 w-5 h-5 border border-border hover:border-primary bg-card hover:bg-primary/5 rounded flex items-center justify-center text-primary transition-all shrink-0 cursor-pointer"
                            title="Mark Completed"
                          >
                            <Check className="w-3.5 h-3.5 opacity-0 hover:opacity-100" />
                          </button>
                        )}
                        {isCompleted && (
                          <span className="mt-1 w-5 h-5 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-center text-emerald-700 shrink-0 select-none">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div>
                          <p className={cn('font-semibold text-foreground', isCompleted ? 'line-through' : '')}>
                            {rem.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rem.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-muted-foreground font-semibold">
                            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-primary" /> Due: {formatDate(rem.date)}</span>
                            {rem.assignedRole && <span className="uppercase border border-border px-1.5 rounded">Role: {rem.assignedRole}</span>}
                            {rem.site?.code && <span className="uppercase border border-border px-1.5 rounded">Site: {rem.site.code}</span>}
                            {rem.department?.code && <span className="uppercase border border-border px-1.5 rounded">Dept: {rem.department.code}</span>}
                          </div>
                        </div>
                      </div>

                      <span className={cn('inline-flex px-1.5 py-0.5 text-[9px] font-bold border rounded', getPriorityColor(rem.priority))}>
                        {rem.priority}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Add Festival */}
      {festivalModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Add Festival / Holiday</h3>
              <button onClick={() => setFestivalModalOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {festivalError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{festivalError}</div>}

            <form onSubmit={handleFestivalSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Festival Name *</label>
                <input
                  type="text"
                  required
                  value={festivalName}
                  onChange={(e) => setFestivalName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Diwali, Eid, Christmas"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Holiday Date *</label>
                  <input
                    type="date"
                    required
                    value={festivalDate}
                    onChange={(e) => setFestivalDate(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Company Holiday *</label>
                  <select
                    value={festivalHoliday ? 'true' : 'false'}
                    onChange={(e) => setFestivalHoliday(e.target.value === 'true')}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="true">Yes (Paid Off)</option>
                    <option value="false">No (Observance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Description</label>
                <textarea
                  value={festivalDesc}
                  onChange={(e) => setFestivalDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Short observance descriptions..."
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Holiday
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Reminder */}
      {reminderModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Create Operational Reminder</h3>
              <button onClick={() => setReminderModalOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {remError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{remError}</div>}

            <form onSubmit={handleReminderSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Reminder Title *</label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Dell Asset Audit, Restock Pantry"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Description</label>
                <textarea
                  value={remDesc}
                  onChange={(e) => setRemDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Detailed task list..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={remDate}
                    onChange={(e) => setRemDate(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Priority *</label>
                  <select
                    value={remPriority}
                    onChange={(e) => setRemPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-border mt-2 space-y-3">
                <span className="font-semibold text-muted-foreground uppercase block text-[10px]">Assignment Details (Optional)</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Target Role</label>
                    <select
                      value={remRole}
                      onChange={(e) => setRemRole(e.target.value)}
                      className="w-full px-2 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none"
                    >
                      <option value="">Any</option>
                      <option value="HR">HR</option>
                      <option value="ADMIN">Admin</option>
                      <option value="FRONT_DESK">Front Desk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Target Site</label>
                    <select
                      value={remSiteId}
                      onChange={(e) => setRemSiteId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none"
                    >
                      <option value="">Any</option>
                      {sites.map(s => (
                        <option key={s.id} value={s.id}>{s.code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Target Dept</label>
                    <select
                      value={remDeptId}
                      onChange={(e) => setRemDeptId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none"
                    >
                      <option value="">Any</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.code}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Reminder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
