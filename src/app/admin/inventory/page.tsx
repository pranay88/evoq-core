import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import InventoryDashboard from '@/components/inventory/inventory-dashboard';

export default async function InventoryPage() {
  const session = await getSession();

  if (!session) {
    notFound();
  }

  const siteId = session.siteId;
  const siteName = session.siteName || 'HQ';

  // Fetch items for the user's currently selected site
  const items = await db.inventoryItem.findMany({
    where: {
      siteId: siteId || undefined,
    },
    include: {
      category: true,
      site: true,
    },
    orderBy: {
      itemCode: 'asc',
    },
  });

  // Fetch active categories and sites
  const [categories, sites] = await Promise.all([
    db.inventoryCategory.findMany({
      orderBy: { name: 'asc' },
    }),
    db.site.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <InventoryDashboard
      items={items}
      categories={categories}
      sites={sites}
      activeSiteId={siteId}
      activeSiteName={siteName}
    />
  );
}
