import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import VisitorsLog from '@/components/visitors/visitors-log';

export default async function VisitorLogPage() {
  const session = await getSession();

  if (!session) {
    notFound();
  }

  const siteId = session.siteId;
  const siteName = session.siteName || 'HQ';

  // Fetch visitors for the current site context
  const visitors = await db.visitor.findMany({
    where: {
      siteId: siteId || undefined,
    },
    include: {
      corrections: {
        orderBy: { correctedAt: 'desc' },
      },
    },
    orderBy: {
      entryTime: 'desc',
    },
  });

  return (
    <VisitorsLog
      visitors={visitors}
      activeSiteId={siteId}
      activeSiteName={siteName}
      userRole={session.role}
    />
  );
}
