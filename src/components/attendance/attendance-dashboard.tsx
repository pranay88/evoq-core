'use client';

import { useState, useTransition, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  logAttendanceAction,
  correctAttendanceAction,
  importAttendanceAction
} from '@/app/actions/attendance';
import {
  Clock,
  Plus,
  ArrowRightLeft,
  Loader2,
  FileSpreadsheet,
  Building,
  CheckCircle2,
  X,
  FileUp,
  AlertTriangle,
  History,
  Download,
  Search,
  Calendar
} from 'lucide-react';
import { cn, formatDate, formatDateTime } from '@/lib/utils';

interface AttendanceDashboardProps {
  attendanceLogs: any[]; // logs already recorded for selected date
  employees: any[]; // list of all employees
  selectedDate: string;
  userRole: string;
}

interface ImportSummary {
  inserted: number;
  skipped: number;
  errors: string[];
}

export default function AttendanceDashboard({
  attendanceLogs,
  employees,
  selectedDate,
  userRole
}: AttendanceDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logEmployeeId, setLogEmployeeId] = useState('');
  const [logStatus, setLogStatus] = useState('Present');
  const [logLocation, setLogLocation] = useState('Site');
  const [logCheckIn, setLogCheckIn] = useState('');
  const [logCheckOut, setLogCheckOut] = useState('');
  const [logRemarks, setLogRemarks] = useState('');
  const [logError, setLogError] = useState('');

  const [correctModalOpen, setCorrectModalOpen] = useState(false);
  const [correctLogId, setCorrectLogId] = useState('');
  const [correctEmployeeName, setCorrectEmployeeName] = useState('');
  const [correctStatus, setCorrectStatus] = useState('Present');
  const [correctRemarks, setCorrectRemarks] = useState('');
  const [correctError, setCorrectError] = useState('');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState('');

  // Date selection state
  const [dateQuery, setDateQuery] = useState(selectedDate);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'late' | 'absent'>('all');

  // Submit manual log
  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logEmployeeId || !logStatus || !logLocation) {
      setLogError('Please fill in all required fields.');
      return;
    }
    setLogError('');

    startTransition(async () => {
      const res = await logAttendanceAction(
        logEmployeeId,
        dateQuery,
        logStatus,
        logLocation,
        logCheckIn,
        logCheckOut,
        logRemarks
      );

      if (res.success) {
        setLogModalOpen(false);
        setLogEmployeeId('');
        setLogStatus('Present');
        setLogLocation('Site');
        setLogCheckIn('');
        setLogCheckOut('');
        setLogRemarks('');
        router.refresh();
      } else {
        setLogError(res.message);
      }
    });
  };

  // Submit correction
  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctLogId || !correctStatus || !correctRemarks) {
      setCorrectError('Please specify reason in remarks.');
      return;
    }
    setCorrectError('');

    startTransition(async () => {
      const res = await correctAttendanceAction(correctLogId, correctStatus, correctRemarks);
      if (res.success) {
        setCorrectModalOpen(false);
        setCorrectLogId('');
        setCorrectRemarks('');
        router.refresh();
      } else {
        setCorrectError(res.message);
      }
    });
  };

  // Submit bulk import
  const handleImportSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setImportError('');
    setImportSummary(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await importAttendanceAction(formData);
      if (res.success) {
        setImportSummary(res.summary || null);
        router.refresh();
      } else {
        setImportError(res.message);
      }
    });
  };

  // Generate and download a sample CSV template pre-populated with active employee IDs
  const downloadTemplate = () => {
    const headers = 'Employee ID,Date (YYYY-MM-DD),Status (Present/Absent/Half Day/WFH/Holiday),Check-In (HH:MM),Check-Out (HH:MM),Location (Site/WFH)\n';
    
    // Create sample rows using active employee IDs
    const sampleRows = employees.map(emp => {
      return `${emp.employeeId},${dateQuery},Present,09:15,18:00,Site`;
    }).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + sampleRows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `evoq_attendance_template_${dateQuery}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Match employees to logs recorded for the day
  const getAttendanceMap = () => {
    const map = new Map();
    attendanceLogs.forEach((log) => {
      map.set(log.employeeId, log);
    });
    return map;
  };

  const attendanceMap = getAttendanceMap();

  // Combine employees and logs for display
  const combinedEntries = employees.map((emp) => {
    const log = attendanceMap.get(emp.id);
    return {
      employee: emp,
      log: log || null,
    };
  }).filter((entry) => {
    // Apply name/ID search
    if (searchQuery) {
      const cleanSearch = searchQuery.toLowerCase();
      const matchName = entry.employee.fullName.toLowerCase().includes(cleanSearch);
      const matchId = entry.employee.employeeId.toLowerCase().includes(cleanSearch);
      if (!matchName && !matchId) return false;
    }

    // Apply view filters (Late / Absent reports)
    if (viewFilter === 'late') {
      return entry.log?.lateArrival === true;
    }
    if (viewFilter === 'absent') {
      return !entry.log || entry.log.status === 'Absent';
    }

    return true;
  });

  const presentCount = attendanceLogs.filter(l => l.status === 'Present' || l.status === 'Work From Home' || l.status === 'On Site').length;
  const absentCount = employees.length - presentCount;

  return (
    <div className="space-y-6 font-sans text-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Attendance Logs</h1>
          <p className="text-sm text-muted-foreground">
            Manage daily registry checks, verify timesheets, and run late-arrival or absence reports.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground text-sm font-sans rounded-md transition-colors shadow-sm"
          >
            <FileUp className="w-4 h-4 text-muted-foreground" />
            Bulk Import Excel
          </button>
          <button
            onClick={() => setLogModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-medium rounded-md shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Log Attendance
          </button>
        </div>
      </div>

      {/* Date and Search filter line */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-card border border-border rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-primary shrink-0" />
            <input
              type="date"
              value={dateQuery}
              onChange={(e) => {
                setDateQuery(e.target.value);
                router.push(`/hr/attendance?date=${e.target.value}`);
              }}
              className="px-3 py-1.5 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            />
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm w-full sm:w-64"
            />
          </div>
        </div>

        <div className="flex gap-2 select-none">
          <button
            onClick={() => setViewFilter('all')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded border transition-colors',
              viewFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border-border'
            )}
          >
            All Staff ({employees.length})
          </button>
          <button
            onClick={() => setViewFilter('late')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded border transition-colors',
              viewFilter === 'late'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border-border'
            )}
          >
            Late Arrivals
          </button>
          <button
            onClick={() => setViewFilter('absent')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded border transition-colors',
              viewFilter === 'absent'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border-border'
            )}
          >
            Absences / Leaves ({absentCount})
          </button>
        </div>
      </div>

      {/* Grid listing */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3">Employee ID</th>
                <th className="px-5 py-3">Employee Name</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Check-In</th>
                <th className="px-5 py-3">Check-Out</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Hours</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {combinedEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-muted-foreground">
                    No matching attendance logs found.
                  </td>
                </tr>
              ) : (
                combinedEntries.map(({ employee, log }) => (
                  <tr key={employee.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-5 py-4 font-semibold text-foreground">{employee.employeeId}</td>
                    <td className="px-5 py-4 font-semibold text-foreground">
                      <Link href={`/hr/employees/${employee.id}`} className="hover:underline hover:text-primary transition-colors">
                        {employee.fullName}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{employee.department?.name}</td>
                    <td className="px-5 py-4">
                      {log ? (
                        <span
                          className={cn(
                            'inline-flex px-2 py-0.5 text-xs font-medium rounded-full border',
                            log.status === 'Present' || log.status === 'Work From Home' || log.status === 'On Site'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.status === 'Absent'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                        >
                          {log.status}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-secondary text-muted-foreground border-border">
                          Not Logged
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{log?.checkIn ? formatDateTime(log.checkIn).split(' ')[1] : '-'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{log?.checkOut ? formatDateTime(log.checkOut).split(' ')[1] : '-'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{log?.workLocation || '-'}</td>
                    <td className="px-5 py-4 font-medium text-foreground">
                      {log?.workingHours > 0 ? `${log.workingHours} hrs` : '-'}
                      {log?.lateArrival && (
                        <span className="block text-[9px] text-rose-600 font-bold uppercase tracking-wider mt-0.5">Late</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {log ? (
                        <button
                          onClick={() => {
                            setCorrectLogId(log.id);
                            setCorrectEmployeeName(employee.fullName);
                            setCorrectStatus(log.status);
                            setCorrectModalOpen(true);
                          }}
                          className="px-2 py-1 border border-border bg-card hover:bg-secondary text-xs font-semibold rounded transition-colors"
                        >
                          Correct
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setLogEmployeeId(employee.id);
                            setLogModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded transition-colors"
                        >
                          + Log
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Manual Log Attendance */}
      {logModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Log Attendance</h3>
              <button onClick={() => setLogModalOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {logError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{logError}</div>}

            <form onSubmit={handleLogSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Select Employee *</label>
                <select
                  required
                  value={logEmployeeId}
                  onChange={(e) => setLogEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Choose Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Status *</label>
                  <select
                    value={logStatus}
                    onChange={(e) => setLogStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Work From Home">Work From Home</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Paid Leave">Paid Leave</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Location *</label>
                  <select
                    value={logLocation}
                    onChange={(e) => setLogLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Site">Site / Office</option>
                    <option value="WFH">WFH</option>
                    <option value="On Site">On Site / Field</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Check-In Time</label>
                  <input
                    type="time"
                    value={logCheckIn}
                    onChange={(e) => setLogCheckIn(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Check-Out Time</label>
                  <input
                    type="time"
                    value={logCheckOut}
                    onChange={(e) => setLogCheckOut(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Remarks</label>
                <textarea
                  value={logRemarks}
                  onChange={(e) => setLogRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Additional observations..."
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Log Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Correct Attendance */}
      {correctModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">File Attendance Correction</h3>
              <button onClick={() => setCorrectModalOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {correctError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{correctError}</div>}

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <span className="block font-semibold text-muted-foreground uppercase mb-1">Employee</span>
                <p className="text-sm font-semibold text-foreground py-1">{correctEmployeeName} (Date: {formatDate(dateQuery)})</p>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Note: The original entry will not be deleted. An audit record of this change (including previous and new values, reasons, and author) will be created.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Corrected Status *</label>
                <select
                  value={correctStatus}
                  onChange={(e) => setCorrectStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Work From Home">Work From Home</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Paid Leave">Paid Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Reason for Correction *</label>
                <textarea
                  required
                  value={correctRemarks}
                  onChange={(e) => setCorrectRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/50"
                  placeholder="Specify why this correction is needed (e.g. Employee forgot to check in, biometric system error)..."
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Approve Correction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Bulk Import Excel Sheet */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Bulk Import Attendance</h3>
              <button onClick={() => setImportModalOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {importError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{importError}</div>}

            {importSummary ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded space-y-3">
                <div className="flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> Bulk Import Completed!
                </div>
                <div className="space-y-1 text-xs">
                  <div>Successful rows inserted: <strong>{importSummary.inserted}</strong></div>
                  <div>Skipped duplicate rows: <strong>{importSummary.skipped}</strong></div>
                  {importSummary.errors.length > 0 && (
                    <div className="pt-2 border-t border-emerald-200 mt-2">
                      <span className="font-semibold text-rose-700">Row Failures ({importSummary.errors.length}):</span>
                      <ul className="list-disc pl-4 space-y-1 text-rose-700 font-mono text-[10px] mt-1 max-h-32 overflow-y-auto">
                        {importSummary.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setImportSummary(null);
                    setImportModalOpen(false);
                  }}
                  className="w-full mt-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded transition-colors text-center block text-xs"
                >
                  Close & Refresh Grid
                </button>
              </div>
            ) : (
              <form onSubmit={handleImportSubmit} className="space-y-4 text-xs font-sans">
                <p className="text-muted-foreground leading-normal">
                  You can upload a CSV or Excel sheet mapping daily logs. Use the download template below to pre-populate current Employee IDs for this date.
                </p>

                <div className="p-3 bg-secondary/50 border border-border rounded flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-foreground block">Download Sheet Template</span>
                    <span className="text-[10px] text-muted-foreground">Contains active employee IDs for {dateQuery}</span>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="flex items-center gap-1 px-3 py-1.5 border border-border bg-card hover:bg-secondary text-[11px] font-semibold rounded text-foreground transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>

                <div className="pt-2">
                  <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Select Sheet File (CSV/Excel)</label>
                  <input
                    name="file"
                    type="file"
                    required
                    accept=".csv,.xlsx"
                    className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Import Records
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
