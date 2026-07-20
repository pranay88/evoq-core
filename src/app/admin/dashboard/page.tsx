import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  HardHat,
  TrendingDown,
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  Building,
  CheckCircle2,
  FileText,
  Trophy,
  ArrowRight
} from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session) {
    notFound();
  }

  const siteId = session.siteId;
  const siteName = session.siteName || 'HQ';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all inventory items for this site
  const items = await db.inventoryItem.findMany({
    where: { siteId: siteId || undefined },
  });

  // Calculate metrics in memory
  const totalItemsCount = items.length;
  const availableStock = items.reduce((sum, i) => sum + i.currentStock, 0);
  const lowStockCount = items.filter(i => i.currentStock <= i.minimumStockLevel && i.currentStock > 0).length;
  const outOfStockCount = items.filter(i => i.currentStock === 0).length;

  // Query transactions for this site
  const transactionsToday = await db.inventoryTransaction.findMany({
    where: {
      createdAt: { gte: today },
      item: { siteId: siteId || undefined },
    },
    include: { item: true },
  });

  const issuedToday = transactionsToday.filter(t => t.type === 'Stock Issued').length;
  const returnedToday = transactionsToday.filter(t => t.type === 'Stock Returned').length;
  const damagedToday = transactionsToday.filter(t => t.type === 'Stock Damaged').length;

  // Pending returns (assets issued at this site that are not returned yet)
  const pendingReturns = await db.issuedAsset.count({
    where: {
      siteId: siteId || undefined,
      status: 'Issued',
    },
  });

  // Recent transactions at this site
  const recentTransactions = await db.inventoryTransaction.findMany({
    where: {
      item: { siteId: siteId || undefined },
    },
    include: { item: true, createdBy: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  // Fetch last declared Employee of the Month
  const lastEom = await db.employeeOfTheMonth.findFirst({
    orderBy: { declaredAt: 'desc' },
    include: { employee: { include: { department: true, site: true } } },
  });

  return (
    <div className="space-y-6 font-sans text-sm">
      {/* Header Banner */}
      <div>
        <h1 className="text-3xl font-serif text-foreground">Administration Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, <strong>{session.name}</strong>. Operations context set to office: <strong>{siteName}</strong>.
        </p>
      </div>

      {/* Employee of the Month Banner */}
      {lastEom && (
        <Link
          href="/hr/leaderboard"
          className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 rounded-lg flex items-center justify-between gap-4 select-none cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-600 shrink-0">
              <Trophy className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Featured Employee of the Month</p>
              <h3 className="font-semibold text-foreground mt-0.5">{lastEom.employee?.fullName}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {lastEom.employee?.designation} &bull; {lastEom.employee?.department?.name} &bull; Score: <strong className="text-amber-600">{lastEom.score} pts</strong>
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1 shrink-0">
            View Standings <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <Link
          href="/admin/inventory"
          className="bg-card border border-border p-5 rounded-lg shadow-sm flex items-center justify-between hover:border-primary/50 hover:shadow-md cursor-pointer transition-all"
        >
          <div>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Items Types</span>
            <p className="text-3xl font-serif font-bold text-foreground mt-1">{totalItemsCount}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Total stock: {availableStock} units</span>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Package className="w-6 h-6" />
          </div>
        </Link>

        <Link
          href="/admin/inventory"
          className="bg-card border border-border p-5 rounded-lg shadow-sm flex items-center justify-between hover:border-primary/50 hover:shadow-md cursor-pointer transition-all"
        >
          <div>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Low Stock alerts</span>
            <p className="text-3xl font-serif font-bold text-amber-600 mt-1">{lowStockCount}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Out of stock: {outOfStockCount} items</span>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </Link>

        <Link
          href="/admin/assets"
          className="bg-card border border-border p-5 rounded-lg shadow-sm flex items-center justify-between hover:border-primary/50 hover:shadow-md cursor-pointer transition-all"
        >
          <div>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Pending Returns</span>
            <p className="text-3xl font-serif font-bold text-foreground mt-1">{pendingReturns}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Assets issued to employees</span>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <HardHat className="w-6 h-6" />
          </div>
        </Link>

        <Link
          href="/admin/inventory"
          className="bg-card border border-border p-5 rounded-lg shadow-sm flex items-center justify-between hover:border-primary/50 hover:shadow-md cursor-pointer transition-all"
        >
          <div>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Transactions Today</span>
            <p className="text-3xl font-serif font-bold text-foreground mt-1">{transactionsToday.length}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Issued: {issuedToday} &bull; Returned: {returnedToday}</span>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions list */}
        <div className="lg:col-span-2 bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
          <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60">Recent Stock Transactions</h3>
          
          <div className="divide-y divide-border/60">
            {recentTransactions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">No recent stock transactions recorded.</p>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3.5 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{tx.item?.name}</span>
                      <span className="text-[10px] font-mono bg-secondary px-1 border border-border rounded">{tx.item?.itemCode}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: <strong className="text-primary">{tx.type}</strong> &bull; Qty: <strong>{tx.quantity}</strong> &bull; By: {tx.createdBy?.name}
                    </p>
                    {tx.remarks && <p className="text-[10px] italic text-muted-foreground/80 mt-0.5">{tx.remarks}</p>}
                  </div>
                  <span className="text-muted-foreground/80 text-[10px] font-mono">{formatDateTime(tx.createdAt).split(' ')[1]}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock checklist/sidebar */}
        <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
          <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60">Procurement Alerts</h3>
          <div className="space-y-3">
            {items.filter(i => i.currentStock <= i.minimumStockLevel).length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">All stock levels are optimal.</p>
            ) : (
              items.filter(i => i.currentStock <= i.minimumStockLevel).map(item => (
                <div key={item.id} className="p-3 bg-secondary/35 border border-border/60 rounded flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-foreground truncate max-w-[130px]">{item.name}</span>
                    <span className={cn('text-[9px] px-1 border rounded font-bold', item.currentStock === 0 ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700')}>
                      {item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Available: <strong className="text-foreground">{item.currentStock} {item.unit}</strong> &bull; Safety Limit: {item.minimumStockLevel}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
