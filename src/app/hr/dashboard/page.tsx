import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { formatDate, formatDateTime } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Clock,
  FileText,
  Gift,
  Bell,
  HardHat,
  Eye,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  MapPin,
  Calendar,
  Building,
  Trophy
} from 'lucide-react';

export default async function HrDashboard() {
  const session = await getSession();

  if (!session) {
    notFound();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);

  // Run queries sequentially or in small batches to prevent connection pool exhaustion in serverless environments
  const siteFilter = session.siteId ? { siteId: session.siteId } : {};
  const siteCodeFilter = session.siteCode ? { siteCode: session.siteCode } : {};
  
  const totalEmp = await db.employee.count({ where: siteFilter });
  const activeEmp = await db.employee.count({ where: { ...siteFilter, employmentStatus: { in: ['ACTIVE', 'CONFIRMED', 'PROBATION'] } } });
  const probationEmp = await db.employee.count({ where: { ...siteFilter, employmentStatus: 'PROBATION' } });
  const noticeEmp = await db.employee.count({ where: { ...siteFilter, employmentStatus: 'NOTICE' } });
  const newJoiners = await db.employee.count({ where: { ...siteFilter, joiningDate: { gte: oneMonthAgo } } });
  
  // Note: attendance relation is to employee which has siteId. To keep it simple, we filter attendance if it has siteCode, else we don't.
  // Actually attendance doesn't have siteId directly. It belongs to employee.
  const absentToday = await db.attendance.count({ where: { date: today, status: 'Absent', employee: siteFilter } });
  const pendingDocs = await db.document.count({ where: { verificationStatus: 'PENDING', employee: siteFilter } });
  const pendingSubmissions = await db.employeeSubmission.count({ where: { status: 'PENDING' } }); // Not strictly tied to site yet
  const issuedAssets = await db.issuedAsset.count({ where: { status: 'Issued', siteId: session.siteId || undefined } });
  
  const recentActivity = await db.auditLog.findMany({ where: siteCodeFilter, orderBy: { timestamp: 'desc' }, take: 6 });
  const recentVisitors = await db.visitor.findMany({ where: siteFilter, orderBy: { entryTime: 'desc' }, take: 4, include: { site: true } });
  const reminders = await db.reminder.findMany({ where: { status: 'PENDING' }, orderBy: { date: 'asc' }, take: 4 });
  const festivals = await db.festival.findMany({ where: { date: { gte: today } }, orderBy: { date: 'asc' }, take: 2 });
  
  const sitesCount = await db.site.findMany({ include: { _count: { select: { employees: true } } } });
  const lastEom = await db.employeeOfTheMonth.findFirst({
    orderBy: { declaredAt: 'desc' },
    include: { employee: { include: { department: true, site: true } } },
  });

  // Birthday today calculation
  const allEmployees = await db.employee.findMany({
    select: { fullName: true, dateOfBirth: true, department: { select: { name: true } } },
  });

  const bdayTodayList = allEmployees.filter((emp) => {
    const dob = new Date(emp.dateOfBirth);
    return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
  });

  return (
    <div className="space-y-6 font-sans text-sm">
      {/* Header banner */}
      <div>
        <h1 className="text-3xl font-serif text-foreground">Operational Overview</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, <strong>{session.name}</strong>. Here is the operational state of EVOQ Realtech offices.
        </p>
      </div>

      {/* Employee of the Month Banner */}
      {lastEom && (
        <Link
          href="/hr/leaderboard"
          className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 rounded-lg flex items-center justify-between gap-4 select-none cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-600 shrink-0">
              <Trophy className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Featured Employee of the Month</p>
              <h3 className="font-semibold text-foreground mt-0.5">{lastEom.employee?.fullName}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {lastEom.employee?.designation} &bull; {lastEom.employee?.department?.name} &bull; Score: <strong className="text-amber-600">{lastEom.score} pts</strong>
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1 shrink-0">
            View Standings <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <Link
          href="/hr/employees"
          className="bg-card border border-border p-5 rounded-lg shadow-sm flex items-center justify-between hover:border-primary/50 hover:shadow-md cursor-pointer transition-all"
        >
          <div>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Staff</span>
            <p className="text-3xl font-serif font-bold text-foreground mt-1">{totalEmp}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Active: {activeEmp} &bull; Probation: {probationEmp}</span>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
        </Link>

        <Link
          href="/hr/attendance"
          className="bg-card border border-border p-5 rounded-lg shadow-sm flex items-center justify-between hover:border-primary/50 hover:shadow-md cursor-pointer transition-all"
        >
          <div>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Leaves / Absences</span>
            <p className="text-3xl font-serif font-bold text-foreground mt-1">{absentToday}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Absent staff today</span>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Clock className="w-6 h-6" />
          </div>
        </Link>

        <Link
          href="/hr/submissions"
          className="bg-card border border-border p-5 rounded-lg shadow-sm flex items-center justify-between hover:border-primary/50 hover:shadow-md cursor-pointer transition-all"
        >
          <div>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Onboarding Queue</span>
            <p className="text-3xl font-serif font-bold text-foreground mt-1">{pendingSubmissions}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Pending self-onboardings</span>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <ClipboardList className="w-6 h-6" />
          </div>
        </Link>

        <Link
          href="/hr/submissions"
          className="bg-card border border-border p-5 rounded-lg shadow-sm flex items-center justify-between hover:border-primary/50 hover:shadow-md cursor-pointer transition-all"
        >
          <div>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Document Audits</span>
            <p className="text-3xl font-serif font-bold text-foreground mt-1">{pendingDocs}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Files pending HR verification</span>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <FileText className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* Main layout splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Middle: Distribution & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Site distribution graph (visual CSS bars) */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60">Office Site Staff Distribution</h3>
            <div className="space-y-4">
              {sitesCount.map((site) => {
                const percentage = totalEmp > 0 ? (site._count.employees / totalEmp) * 100 : 0;
                return (
                  <div key={site.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" /> {site.name} ({site.code})</span>
                      <span>{site._count.employees} employees ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Visitor Logs */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <h3 className="text-md font-serif font-bold text-foreground">Recent Visitor Logs</h3>
              <Link href="/frontdesk/visitors" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 select-none">
                View All Visitors <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentVisitors.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No recent visitors logged.</p>
            ) : (
              <div className="divide-y divide-border/60 text-xs">
                {recentVisitors.map((visitor) => {
                  const entryTimeFormatted = formatDateTime(visitor.entryTime);
                  const exitTimeFormatted = visitor.exitTime ? formatDateTime(visitor.exitTime) : null;
                  return (
                    <div key={visitor.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{visitor.name}</span>
                          <span className="px-1.5 py-0.5 bg-secondary text-muted-foreground border border-border rounded text-[9px] font-medium font-sans">
                            {visitor.category}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          From <strong className="text-foreground">{visitor.company}</strong> &bull; Meeting <strong className="text-foreground">{visitor.personToMeet}</strong> ({visitor.purpose})
                        </p>
                        <p className="text-muted-foreground text-[10px] flex items-center gap-1 mt-0.5 font-sans">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {visitor.site?.name}
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="font-medium text-foreground block font-sans">In: {entryTimeFormatted}</span>
                        {visitor.exitTime ? (
                          <span className="text-emerald-600 block font-sans">Out: {exitTimeFormatted}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 mt-0.5 animate-pulse font-sans">
                            Active Visitor
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent System Activity log */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60">System Security Logs</h3>
            <div className="divide-y divide-border/60 text-xs">
              {recentActivity.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Module: <span className="uppercase">{log.module}</span> &bull; By: <strong>{log.userName}</strong> ({log.userRole})
                    </p>
                  </div>
                  <span className="text-muted-foreground/80 font-mono text-[10px]">{formatDateTime(log.timestamp).split(' ')[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Calendars */}
        <div className="space-y-6">
          {/* Birthdays today alert */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60 flex items-center gap-1.5">
              <Gift className="w-5 h-5 text-primary" /> Birthdays Today ({bdayTodayList.length})
            </h3>
            {bdayTodayList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No staff birthdays today.</p>
            ) : (
              <div className="space-y-3">
                {bdayTodayList.map((emp, idx) => (
                  <div key={idx} className="p-3 bg-secondary/30 border border-border/50 rounded flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{emp.fullName}</p>
                      <p className="text-[10px] text-muted-foreground">{emp.department?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operational Reminders checklist summary */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60">Operational Reminders</h3>
            <div className="space-y-3 text-xs">
              {reminders.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No pending reminders.</p>
              ) : (
                reminders.map(rem => (
                  <div key={rem.id} className="p-3 bg-secondary/35 border border-border/50 rounded flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-foreground truncate max-w-[150px]">{rem.title}</span>
                      <span className="text-[9px] px-1 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold">{rem.priority}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{rem.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
