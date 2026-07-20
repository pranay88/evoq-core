'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { declareEmployeeOfTheMonthAction } from '@/app/actions/leaderboard';
import {
  Trophy,
  Award,
  Medal,
  Calendar,
  X,
  Loader2,
  CheckCircle2,
  Users,
  Clock,
  HardHat,
  Eye,
  TrendingUp,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardDashboardProps {
  initialLeaderboard: any[];
  declaredWinner: any | null;
  selectedMonth: number;
  selectedYear: number;
  userRole: string;
}

export default function LeaderboardDashboard({
  initialLeaderboard,
  declaredWinner,
  selectedMonth,
  selectedYear,
  userRole
}: LeaderboardDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [month, setMonth] = useState(selectedMonth);
  const [year, setYear] = useState(selectedYear);

  // Nomination modal state
  const [nominateModalOpen, setNominateModalOpen] = useState(false);
  const [nomTargetId, setNomTargetId] = useState('');
  const [nomTargetName, setNomTargetName] = useState('');
  const [nomTargetScore, setNomTargetScore] = useState(0);
  const [nomRemarks, setNomRemarks] = useState('');
  const [nomError, setNomError] = useState('');

  const isHr = userRole === 'HR';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Submit declaration
  const handleNominateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomTargetId || !nomRemarks) {
      setNomError('Please enter nomination remarks.');
      return;
    }
    setNomError('');

    startTransition(async () => {
      const res = await declareEmployeeOfTheMonthAction(
        nomTargetId,
        month,
        year,
        nomTargetScore,
        nomRemarks
      );

      if (res.success) {
        setNominateModalOpen(false);
        setNomTargetId('');
        setNomTargetName('');
        setNomRemarks('');
        router.refresh();
      } else {
        setNomError(res.message);
      }
    });
  };

  const handleFilterChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
    router.push(`/hr/leaderboard?month=${m}&year=${y}`);
  };

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />;
      case 2:
        return <Medal className="w-5 h-5 text-zinc-400 shrink-0" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-700 shrink-0" />;
      default:
        return <span className="font-semibold text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans text-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Office Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            View employee score rankings based on monthly attendance rates, meeting counts, and compliance logs.
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-md shadow-sm">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <select
            value={month}
            onChange={(e) => handleFilterChange(parseInt(e.target.value) || 1, year)}
            className="bg-transparent text-xs font-semibold text-foreground focus:outline-none"
          >
            {monthNames.map((m, idx) => (
              <option key={idx} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => handleFilterChange(month, parseInt(e.target.value) || 2026)}
            className="bg-transparent text-xs font-semibold text-foreground focus:outline-none"
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Declared Employee of the Month banner */}
      {declaredWinner ? (
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/30 rounded-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 select-none">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-500">
              <Trophy className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[10px] bg-amber-500/20 text-amber-800 border border-amber-500/30 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Winner: {monthNames[month - 1]} {year}
              </span>
              <h2 className="text-2xl font-serif font-bold text-foreground mt-2">
                {isHr ? (
                  <Link href={`/hr/employees/${declaredWinner.employee?.id}`} className="hover:underline hover:text-amber-600 transition-colors">
                    {declaredWinner.employee?.fullName}
                  </Link>
                ) : (
                  declaredWinner.employee?.fullName
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {declaredWinner.employee?.designation} &bull; {declaredWinner.employee?.site?.name}
              </p>
              {declaredWinner.remarks && (
                <p className="text-xs italic text-foreground mt-2 border-l-2 border-amber-500/40 pl-3 py-0.5 leading-relaxed max-w-xl">
                  "{declaredWinner.remarks}"
                </p>
              )}
            </div>
          </div>

          <div className="text-center md:text-right shrink-0">
            <span className="text-xs text-muted-foreground uppercase font-semibold block">Performance Score</span>
            <span className="text-4xl font-serif font-bold text-amber-600 block mt-1">{declaredWinner.score} pts</span>
          </div>
        </div>
      ) : (
        <div className="p-6 border border-dashed border-border rounded-lg text-center text-muted-foreground select-none">
          <Award className="w-10 h-10 text-primary/30 mx-auto mb-2" />
          <h3 className="font-serif text-md text-foreground">Employee of the Month not yet declared</h3>
          <p className="text-xs mt-1">HR has not nominated a winner for {monthNames[month - 1]} {year}. Review the standings below.</p>
        </div>
      )}

      {/* Standings table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-secondary/15">
          <h2 className="text-md font-serif font-bold text-foreground">
            Standings &mdash; {monthNames[month - 1]} {year}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3 w-16">Rank</th>
                <th className="px-5 py-3">Employee Name</th>
                <th className="px-5 py-3">Site / Department</th>
                <th className="px-5 py-3 text-center">Attendance (Max 50)</th>
                <th className="px-5 py-3 text-center">Punctuality & Overtime (Max 50)</th>
                <th className="px-5 py-3 text-center">Total Score (Max 100)</th>
                {isHr && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {initialLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={isHr ? 7 : 6} className="px-5 py-8 text-center text-muted-foreground">
                    No score data registered for the selected month. Verify attendance registry check-ins are logged.
                  </td>
                </tr>
              ) : (
                initialLeaderboard.map((item, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap flex items-center justify-center mt-1">
                        {getRankMedal(rank)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-semibold text-foreground font-sans">
                            {isHr ? (
                              <Link href={`/hr/employees/${item.id}`} className="hover:underline hover:text-primary transition-colors">
                                {item.fullName}
                              </Link>
                            ) : (
                              item.fullName
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.designation}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-foreground font-medium">{item.siteName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.departmentName}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="font-medium text-foreground">{item.attendanceScore} / 50</span>
                        <span className="block text-[9px] text-muted-foreground/85 mt-0.5">{item.presentDays} days present</span>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="font-medium text-foreground">{item.punctualityScore} / 50</span>
                        <span className="block text-[9px] text-muted-foreground/85 mt-0.5">
                          {item.earlyCheckinsCount} early &bull; {item.lateCheckoutsCount} late-checkout
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="text-base font-bold text-primary">{item.totalScore}</span>
                        <span className="block text-[9px] text-muted-foreground font-bold mt-0.5">pts</span>
                      </td>
                      {isHr && (
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          {rank === 1 ? (
                            <button
                              onClick={() => {
                                setNomTargetId(item.id);
                                setNomTargetName(item.fullName);
                                setNomTargetScore(item.totalScore);
                                setNomRemarks('');
                                setNominateModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold rounded transition-colors"
                            >
                              Nominate
                            </button>
                          ) : (
                            <button
                              disabled
                              title="Only the top-scoring employee can be nominated"
                              className="px-2.5 py-1 bg-secondary/40 text-muted-foreground border border-border/40 text-xs font-semibold rounded cursor-not-allowed select-none opacity-60"
                            >
                              Nominate
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Declare Employee of the Month */}
      {nominateModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Declare Employee of the Month</h3>
              <button onClick={() => setNominateModalOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {nomError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{nomError}</div>}

            <form onSubmit={handleNominateSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <span className="block font-semibold text-muted-foreground uppercase mb-1">Nominated Employee</span>
                <p className="text-sm font-semibold text-foreground py-1">
                  {nomTargetName} &bull; Score: <strong className="text-amber-600">{nomTargetScore} pts</strong>
                </p>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Declaring this candidate will assign them the award title for **{monthNames[month - 1]} {year}**, publish a featured trophy card, and broadcast a congratulations announcement notification to all regional staff.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Nomination Commendation Remarks *</label>
                <textarea
                  required
                  value={nomRemarks}
                  onChange={(e) => setNomRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/50"
                  placeholder="e.g. Exhibited exceptional teamwork, logged perfect attendance, and met clients with zero overdue assets..."
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Declare Winner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
