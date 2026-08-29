import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import AppShell from '@/components/layout/shell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Protect path: requires ADMIN or HR role
  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN' && session.role !== 'HR' && session.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  // Get active sites
  const sites = await db.site.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, code: true },
  });

  return (
    <AppShell user={session} sites={sites}>
      {children}
    </AppShell>
  );
}
