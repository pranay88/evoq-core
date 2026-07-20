import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import { getLeaderboardAction } from '@/app/actions/leaderboard';
import LeaderboardDashboard from '@/components/leaderboard/leaderboard-dashboard';

interface LeaderboardPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const session = await getSession();

  if (!session) {
    notFound();
  }

  const params = await searchParams;
  const now = new Date();
  const selectedMonth = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const selectedYear = params.year ? parseInt(params.year, 10) : now.getFullYear();

  // Run the dynamic scoring ledger algorithm
  const leaderboardResult = await getLeaderboardAction(selectedMonth, selectedYear);
  const leaderboardData = leaderboardResult.success ? leaderboardResult.data || [] : [];

  // Query if there is already a declared Employee of the Month award winner
  const declaredWinner = await db.employeeOfTheMonth.findFirst({
    where: {
      month: selectedMonth,
      year: selectedYear,
    },
    include: {
      employee: {
        include: {
          site: true,
          department: true,
        },
      },
    },
  });

  return (
    <LeaderboardDashboard
      initialLeaderboard={leaderboardData}
      declaredWinner={declaredWinner}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      userRole={session.role}
    />
  );
}
