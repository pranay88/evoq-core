import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import AssetsDashboard from '@/components/assets/assets-dashboard';

export default async function AssetsPage() {
  const session = await getSession();

  if (!session) {
    notFound();
  }

  const siteId = session.siteId;
  const siteName = session.siteName || 'HQ';

  // Fetch issued assets for this site context
  const assets = await db.issuedAsset.findMany({
    where: {
      siteId: siteId || undefined,
    },
    include: {
      item: true,
      employee: {
        select: { id: true, employeeId: true, fullName: true },
      },
      returns: {
        orderBy: { returnDate: 'desc' },
      },
    },
    orderBy: {
      issueDate: 'desc',
    },
  });

  // Fetch active employees at this site to populate the issuance target dropdown
  const employees = await db.employee.findMany({
    where: {
      siteId: siteId || undefined,
      employmentStatus: {
        notIn: ['RESIGNED', 'TERMINATED', 'INACTIVE'],
      },
    },
    select: {
      id: true,
      employeeId: true,
      fullName: true,
    },
    orderBy: {
      fullName: 'asc',
    },
  });

  // Fetch items currently in stock at this site
  const inStockItems = await db.inventoryItem.findMany({
    where: {
      siteId: siteId || undefined,
      currentStock: {
        gt: 0,
      },
    },
    select: {
      id: true,
      name: true,
      currentStock: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <AssetsDashboard
      assets={assets}
      employees={employees}
      inStockItems={inStockItems}
      activeSiteId={siteId}
      activeSiteName={siteName}
      userRole={session.role}
    />
  );
}
