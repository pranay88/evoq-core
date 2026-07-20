import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import { formatDateTime } from '@/lib/utils';
import { ShieldCheck, Search, Filter, Database, FileText } from 'lucide-react';
import Link from 'next/link';

interface AuditPageProps {
  searchParams: Promise<{ query?: string; module?: string }>;
}

export default async function AuditTrailPage({ searchParams }: AuditPageProps) {
  const session = await getSession();

  if (!session || (session.role !== 'HR' && session.role !== 'ADMIN')) {
    notFound();
  }

  const params = await searchParams;
  const query = params.query || '';
  const moduleFilter = params.module || '';

  // Construct search filters
  const whereClause: any = {};

  if (moduleFilter) {
    whereClause.module = moduleFilter;
  }

  if (query) {
    whereClause.OR = [
      { userName: { contains: query } },
      { action: { contains: query } },
    ];
  }

  // Fetch audit logs
  const logs = await db.auditLog.findMany({
    where: whereClause,
    orderBy: {
      timestamp: 'desc',
    },
    take: 100, // Capped at 100 recent entries for UI efficiency
  });

  const modulesList = ['AUTH', 'EMPLOYEE', 'DOCUMENT', 'INVENTORY', 'ASSETS', 'VISITORS', 'CALENDAR', 'REMINDERS', 'ATTENDANCE', 'USERS'];

  return (
    <div className="space-y-6 font-sans text-sm">
      {/* Header Banner */}
      <div>
        <h1 className="text-3xl font-serif text-foreground">Security Audit Trail</h1>
        <p className="text-sm text-muted-foreground">
          Review append-only database action trails, including profile modifications, asset issues, restocks, and authorization events.
        </p>
      </div>

      {/* Filter and search form */}
      <form method="GET" className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-card border border-border rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              name="query"
              type="text"
              placeholder="Search user or action..."
              defaultValue={query}
              className="pl-9 pr-4 py-1.5 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm w-full sm:w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary shrink-0" />
            <select
              name="module"
              defaultValue={moduleFilter}
              className="px-3 py-1.5 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            >
              <option value="">All Modules</option>
              {modulesList.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded shadow-sm transition-colors text-center"
          >
            Apply Filters
          </button>
          <Link
            href="/admin/audit"
            className="px-4 py-1.5 border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold rounded transition-colors text-center"
          >
            Reset
          </Link>
        </div>
      </form>

      {/* Audit logs registry */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-secondary/15 flex justify-between items-center">
          <h2 className="text-md font-serif font-bold text-foreground">
            Audit Feed ({logs.length} entries shown)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Module</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Performed By</th>
                <th className="px-5 py-3">Details / Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs font-mono text-muted-foreground">
              {logs.length === 0 ? (
                <tr className="font-sans">
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No matching audit records located in the log stream.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-foreground font-semibold">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-secondary border border-border rounded text-[10px] text-foreground font-bold">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-foreground font-bold uppercase tracking-wide">
                      {log.action.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-foreground">
                      {log.userName}
                      <span className="block text-[10px] text-muted-foreground font-sans mt-0.5">{log.userRole}</span>
                    </td>
                    <td className="px-5 py-4 text-xs font-sans max-w-md leading-relaxed text-foreground/80 break-words">
                      {log.reason || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
