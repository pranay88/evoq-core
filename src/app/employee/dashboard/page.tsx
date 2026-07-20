import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import EmployeeDashboardView from '@/components/dashboard/employee-dashboard-view';
import { getEmployeeDashboardDataAction } from '@/app/actions/employee';

export default async function EmployeeDashboardPage() {
  const session = await getSession();

  if (!session || !session.userId) {
    notFound();
  }

  // Fetch all necessary data for the employee dashboard
  const response = await getEmployeeDashboardDataAction();

  if (!response.success || !response.employee) {
    // Failsafe in case employee profile is missing
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="bg-destructive/10 text-destructive p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-xl font-bold mb-2">Profile Link Error</h2>
          <p>{response.message || 'We could not load your employee dashboard. Please contact HR.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto">
      <EmployeeDashboardView 
        user={session}
        employee={response.employee}
        stats={response.stats}
        monthlyAttendance={response.monthlyAttendance}
        leaveBalances={response.leaveBalances}
        recentLeaves={response.recentLeaves}
      />
    </div>
  );
}
