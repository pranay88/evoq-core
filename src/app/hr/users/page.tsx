import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import UsersDashboard from '@/components/users/users-dashboard';

export default async function UserManagementPage() {
  const session = await getSession();

  if (!session || (session.role !== 'HR' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    notFound();
  }

  // Fetch all user accounts
  const users = await db.user.findMany({
    where: session.role === 'SUPER_ADMIN' ? {} : {
      role: { not: 'SUPER_ADMIN' }
    },
    include: {
      site: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Fetch active sites for assignments
  const sites = await db.site.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  });

  return (
    <UsersDashboard
      users={users}
      sites={sites}
      currentUserSession={session}
    />
  );
}
