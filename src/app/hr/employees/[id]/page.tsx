import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import ProfileView from '@/components/employees/profile-view';

interface EmployeeProfileProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeProfilePage({ params }: EmployeeProfileProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    notFound();
  }

  // Fetch the employee with all necessary relations
  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      department: true,
      site: true,
      documents: {
        include: {
          uploadedBy: {
            select: { name: true },
          },
        },
        orderBy: {
          uploadDate: 'desc',
        },
      },
      attendance: {
        orderBy: {
          date: 'desc',
        },
        take: 30,
      },
      issuedAssets: {
        include: {
          item: true,
        },
        orderBy: {
          issueDate: 'desc',
        },
      },
    },
  });

  if (!employee) {
    notFound();
  }

  // Fetch audit logs related to this employee record
  const auditLogs = await db.auditLog.findMany({
    where: {
      recordId: employee.id,
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: 30, // limit to latest 30 actions
  });

  return (
    <ProfileView
      employee={employee}
      auditLogs={auditLogs}
      userRole={session.role}
    />
  );
}
