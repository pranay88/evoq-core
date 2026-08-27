import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import LeavesDashboard from '@/components/attendance/leaves-dashboard';

export const metadata = {
  title: 'Leave Management | HR Portal | Evoq Core',
};

export default async function HRLeavesPage() {
  const session = await getSession();
  
  if (!session || session.role !== 'HR') {
    redirect('/unauthorized');
  }

  // Fetch all pending leave requests, along with a few recent approved/rejected ones
  const leaves = await db.leaveRequest.findMany({
    where: {
      status: {
        in: ['PENDING', 'APPROVED', 'REJECTED']
      }
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          employeeId: true,
          department: { select: { name: true } },
          site: { select: { name: true } }
        }
      },
      approvedBy: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100
  });

  return <LeavesDashboard leaves={leaves} />;
}
