import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import ReportsDashboard from '@/components/reports/reports-dashboard';

export default async function ReportsPage() {
  const session = await getSession();

  if (!session || (session.role !== 'HR' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    notFound();
  }

  // Fetch active sites
  const sites = await db.site.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 font-sans text-sm">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Reports Export Center</h1>
        <p className="text-sm text-muted-foreground font-sans">
          Download structured Excel spreadsheet logs for organizational audits, inventory stockpiles, issued assets, and front desk check-ins.
        </p>
      </div>

      <ReportsDashboard sites={sites} />
    </div>
  );
}
