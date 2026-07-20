import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import SubmissionsList from '@/components/onboarding/submissions-list';

export default async function SubmissionsPage() {
  const session = await getSession();

  // Fetch pending or correction-requested submissions
  const submissions = await db.employeeSubmission.findMany({
    where: {
      status: {
        in: ['PENDING', 'CORRECTION_REQUESTED'],
      },
    },
    include: {
      invitation: true,
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  // Fetch active departments and sites for job assignment
  const [departments, sites] = await Promise.all([
    db.department.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    }),
    db.site.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Self-Onboarding Submissions</h1>
        <p className="text-sm text-muted-foreground font-sans">
          Review self-onboarding forms submitted by new hires. Verify documents, request corrections, or approve to create employee profiles.
        </p>
      </div>

      <SubmissionsList
        submissions={submissions}
        departments={departments}
        sites={sites}
      />
    </div>
  );
}
