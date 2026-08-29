'use client';

import { useState, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createInventoryItemAction,
  addStockAction,
  transferStockAction,
  adjustStockAction,
  createCategoryAction
} from '@/app/actions/inventory';
import {
  Package,
  Plus,
  ArrowRightLeft,
  ShieldAlert,
  Loader2,
  Trash2,
  FileSpreadsheet,
  Building,
  CheckCircle2,
  X,
  TrendingDown,
  AlertTriangle,
  ChevronLeft,
  Laptop,
  PenTool,
  Coffee,
  Gift,
  Box
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface InventoryDashboardProps {
  items: any[];
  categories: any[];
  sites: any[];
  activeSiteId: string | null;
  activeSiteName: string;
}

export default function InventoryDashboard({
  items,
  categories,
  sites,
  activeSiteId,
  activeSiteName
}: InventoryDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'available' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const [restockItemId, setRestockItemId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState(1);
  const [restockRemarks, setRestockRemarks] = useState('');
  const [restockError, setRestockError] = useState('');

  const [transferItemId, setTransferItemId] = useState<string | null>(null);
  const [transferQty, setTransferQty] = useState(1);
  const [transferDestSite, setTransferDestSite] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');
  const [transferError, setTransferError] = useState('');

  const [adjustItemId, setAdjustItemId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'Stock Damaged' | 'Stock Lost' | 'Stock Adjusted'>('Stock Damaged');
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [adjustError, setAdjustError] = useState('');

  // Create Item form action state
  const [createState, createAction, createPending] = useActionState(createInventoryItemAction, {
    success: false,
    message: '',
    errors: {} as Record<string, string[]>,
  });

  // Reset Create Modal on success
  if (createState.success && createModalOpen) {
    setCreateModalOpen(false);
    createState.success = false; // reset
    router.refresh();
  }

  // Calculate statistics
  const totalItems = items.length;
  const availableStock = items.reduce((sum, item) => sum + item.currentStock, 0);
  const lowStockItems = items.filter(item => item.currentStock <= item.minimumStockLevel && item.currentStock > 0);
  const outOfStockItems = items.filter(item => item.currentStock === 0);

  // Filter items
  const filteredItems = items.filter(item => {
    if (selectedCategoryId && item.categoryId !== selectedCategoryId) return false;
    if (filterType === 'available') return item.currentStock > 0;
    if (filterType === 'low_stock') return item.currentStock <= item.minimumStockLevel && item.currentStock > 0;
    if (filterType === 'out_of_stock') return item.currentStock === 0;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.itemCode.toLowerCase().includes(q)) {
        return false;
      }
    }
    
    return true;
  });

  // Helpers
  const getCategoryIcon = (name: string) => {
    switch (name) {
      case 'IT Items':
        return Laptop;
      case 'Stationery':
        return PenTool;
      case 'Pantry':
        return Coffee;
      case 'Gifting':
        return Gift;
      case 'Packaging':
        return Box;
      default:
        return Package;
    }
  };

  const getCategoryItems = (catId: string) => {
    return filteredItems.filter(item => item.categoryId === catId);
  };

  const activeCategory = categories.find(c => c.id === selectedCategoryId);

  // Submit New Category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategoryError('');
    startTransition(async () => {
      const res = await createCategoryAction(newCategoryName);
      if (res.success) {
        setCreateCategoryOpen(false);
        setNewCategoryName('');
        router.refresh();
      } else {
        setCategoryError(res.message);
      }
    });
  };

  // Submit Restock
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItemId || restockQty <= 0) return;
    setRestockError('');

    startTransition(async () => {
      const res = await addStockAction(restockItemId, restockQty, restockRemarks);
      if (res.success) {
        setRestockItemId(null);
        setRestockQty(1);
        setRestockRemarks('');
        router.refresh();
      } else {
        setRestockError(res.message);
      }
    });
  };

  // Submit Transfer
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItemId || transferQty <= 0 || !transferDestSite) {
      setTransferError('Please fill in all required fields.');
      return;
    }
    setTransferError('');

    startTransition(async () => {
      const res = await transferStockAction(transferItemId, transferQty, transferDestSite, transferRemarks);
      if (res.success) {
        setTransferItemId(null);
        setTransferQty(1);
        setTransferDestSite('');
        setTransferRemarks('');
        router.refresh();
      } else {
        setTransferError(res.message);
      }
    });
  };

  // Submit Adjust
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItemId || adjustQty <= 0 || !adjustRemarks) {
      setAdjustError('Please specify reason in remarks.');
      return;
    }
    setAdjustError('');

    startTransition(async () => {
      const res = await adjustStockAction(adjustItemId, adjustQty, adjustType, adjustRemarks);
      if (res.success) {
        setAdjustItemId(null);
        setAdjustQty(1);
        setAdjustRemarks('');
        router.refresh();
      } else {
        setAdjustError(res.message);
      }
    });
  };

  const getActiveItem = (id: string | null) => items.find(i => i.id === id);

  return (
    <div className="space-y-6 font-sans text-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Inventory Control</h1>
          <p className="text-sm text-muted-foreground">
            Manage site stock levels, log procurement restocks, and transfer assets between EVOQ offices.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/api/reports?type=inventory&siteId=${activeSiteId || ''}`}
            className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground text-sm rounded-md transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            Export Inventory
          </Link>
          <button
            onClick={() => setCreateCategoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium rounded-md shadow-sm transition-all border border-border"
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-medium rounded-md shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div
          onClick={() => setFilterType('all')}
          className={cn(
            "border p-5 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
            filterType === 'all'
              ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
              : "bg-card border-border"
          )}
        >
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Categories</span>
          <p className="text-3xl font-serif font-bold text-foreground mt-2">{totalItems} Unique Items</p>
        </div>
        <div
          onClick={() => setFilterType('available')}
          className={cn(
            "border p-5 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
            filterType === 'available'
              ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
              : "bg-card border-border"
          )}
        >
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Available Stock</span>
          <p className="text-3xl font-serif font-bold text-primary mt-2">{availableStock} Units</p>
        </div>
        <div
          onClick={() => setFilterType('low_stock')}
          className={cn(
            "border p-5 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-amber-500/50",
            filterType === 'low_stock'
              ? "bg-amber-500/5 border-amber-500 shadow-sm ring-1 ring-amber-500/20"
              : "bg-card border-border"
          )}
        >
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Low Stock Items</span>
          <p className="text-3xl font-serif font-bold text-amber-600 mt-2">{lowStockItems.length} Alerts</p>
        </div>
        <div
          onClick={() => setFilterType('out_of_stock')}
          className={cn(
            "border p-5 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-rose-500/50",
            filterType === 'out_of_stock'
              ? "bg-rose-500/5 border-rose-500 shadow-sm ring-1 ring-rose-500/20"
              : "bg-card border-border"
          )}
        >
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Out of Stock</span>
          <p className="text-3xl font-serif font-bold text-rose-600 mt-2">{outOfStockItems.length} Items</p>
        </div>
      </div>

      {/* Low Stock Alerts Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex gap-3 items-start">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Low-Stock Procurement Warning</h4>
            <p className="text-xs text-destructive/90 mt-1 leading-relaxed">
              The following items at <strong>{activeSiteName}</strong> have fallen below their safety threshold and require procurement:
              <br />
              <span className="font-medium mt-1 inline-block">
                {lowStockItems.map(i => `${i.name} (${i.currentStock} remaining)`).join(', ')}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Main Stock Table or Categories Grid */}
      {(!selectedCategoryId && filterType === 'all') ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 py-2 border-b border-border/60 gap-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-foreground">
                Select Inventory Category &mdash; {activeSiteName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-sans">Click on a category card below to view and manage its stock items.</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search items by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="absolute left-3 top-3 text-muted-foreground">
                <Box className="w-4 h-4" />
              </div>
            </div>
          </div>
          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const catItems = getCategoryItems(cat.id);
              const catItemsCount = catItems.length;
              const catLowStock = catItems.filter(i => i.currentStock <= i.minimumStockLevel && i.currentStock > 0).length;
              const catOutOfStock = catItems.filter(i => i.currentStock === 0).length;
              const Icon = getCategoryIcon(cat.name);

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="bg-card border border-border p-6 rounded-xl hover:shadow-md hover:border-primary/50 cursor-pointer transition-all duration-300 flex flex-col justify-between h-44 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex gap-1.5">
                      {catOutOfStock > 0 && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold rounded-full font-sans">
                          {catOutOfStock} Out
                        </span>
                      )}
                      {catLowStock > 0 && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold rounded-full font-sans">
                          {catLowStock} Low
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-foreground mt-4 group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-sans">
                      {catItemsCount} {catItemsCount === 1 ? 'item' : 'items'} registered in stock
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Back Navigation Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 select-none border-b border-border/60 pb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  setSearchQuery('');
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-secondary/30 px-3 py-1.5 rounded-md"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Categories
              </button>
              <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
                {activeCategory?.name} <span className="text-muted-foreground text-sm font-sans font-normal">&mdash; {activeSiteName}</span>
              </h2>
            </div>
            
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search items by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                <Box className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Main Stock Table */}
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-secondary/15 flex justify-between items-center">
              <h2 className="text-md font-serif font-bold text-foreground">
                {selectedCategoryId ? activeCategory?.name : 'All Categories'} &mdash; {activeSiteName}
              </h2>
              {filterType !== 'all' && (
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-secondary text-muted-foreground border-border font-sans">
                  Filter: <strong className="text-foreground uppercase">{filterType.replace('_', ' ')}</strong>
                  <button
                    onClick={() => setFilterType('all')}
                    className="ml-1 text-muted-foreground hover:text-foreground text-[10px] font-bold"
                    title="Clear Filter"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-5 py-3">Item Code</th>
                    <th className="px-5 py-3">Item Name</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Stock Level</th>
                    <th className="px-5 py-3">Minimum Level</th>
                    <th className="px-5 py-3">Purchase Rate</th>
                    <th className="px-5 py-3 text-right">Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                        No inventory records match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isLow = item.currentStock <= item.minimumStockLevel;
                      const isOut = item.currentStock === 0;
                      return (
                        <tr key={item.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="px-5 py-4 font-mono text-xs font-semibold text-foreground">{item.itemCode}</td>
                          <td className="px-5 py-4 font-semibold text-foreground">{item.name}</td>
                          <td className="px-5 py-4 text-muted-foreground">{item.category?.name}</td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                'font-bold',
                                isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
                              )}
                            >
                              {item.currentStock} {item.unit}
                            </span>
                            {isOut && <span className="ml-2 text-[10px] bg-rose-50 border border-rose-100 text-rose-600 font-semibold px-1 rounded font-sans">Out of Stock</span>}
                            {!isOut && isLow && <span className="ml-2 text-[10px] bg-amber-50 border border-amber-100 text-amber-600 font-semibold px-1 rounded font-sans">Low Stock</span>}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {item.minimumStockLevel} {item.unit}
                          </td>
                          <td className="px-5 py-4 font-medium text-foreground">
                            {item.purchaseRate ? formatCurrency(item.purchaseRate) : '-'}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setRestockItemId(item.id)}
                                className="px-2.5 py-1 border border-border bg-card hover:bg-secondary text-xs font-semibold rounded transition-colors font-sans"
                                title="Restock"
                              >
                                Restock
                              </button>
                              <button
                                onClick={() => {
                                  setTransferItemId(item.id);
                                  const target = sites.find(s => s.id !== activeSiteId);
                                  if (target) setTransferDestSite(target.id);
                                }}
                                className="px-2.5 py-1 border border-border bg-card hover:bg-secondary text-xs font-semibold rounded transition-colors font-sans"
                                title="Transfer Stock"
                              >
                                Transfer
                              </button>
                              <button
                                onClick={() => setAdjustItemId(item.id)}
                                className="px-2.5 py-1 border border-border bg-card text-destructive hover:bg-destructive/5 text-xs font-semibold rounded transition-colors font-sans"
                                title="Adjust Damage/Loss"
                              >
                                Adjust
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Item */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Create Inventory Item</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createState.message && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{createState.message}</div>
            )}

            <form action={createAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              {activeSiteId ? (
                <input type="hidden" name="siteId" value={activeSiteId} />
              ) : (
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Select Site *</label>
                  <select name="siteId" required className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">-- Select Site --</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Item Code *</label>
                <input
                  name="itemCode"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  placeholder="e.g. IT-LAP-DELL"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Item Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Dell Latitude Laptop"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Category *</label>
                <select
                  name="categoryId"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Unit Type *</label>
                <select
                  name="unit"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Pcs">Pieces (Pcs)</option>
                  <option value="Box">Boxes</option>
                  <option value="Pack">Packs</option>
                  <option value="Ream">Reams</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Opening Stock *</label>
                <input
                  name="openingStock"
                  type="number"
                  required
                  defaultValue={0}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Minimum Alert level *</label>
                <input
                  name="minimumStockLevel"
                  type="number"
                  required
                  defaultValue={5}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Purchase Rate (INR)</label>
                <input
                  name="purchaseRate"
                  type="number"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. 500"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Supplier</label>
                <input
                  name="supplier"
                  type="text"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Supplier name"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Remarks</label>
                <textarea
                  name="remarks"
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Additional remarks..."
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-3 border-t border-border mt-2">
                <button
                  type="submit"
                  disabled={createPending}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-sans font-medium rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {createPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Restock Stock */}
      {restockItemId && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Restock Inventory Item</h3>
              <button onClick={() => setRestockItemId(null)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {restockError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{restockError}</div>}

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <span className="block font-semibold text-muted-foreground uppercase mb-1">Item Selected</span>
                <p className="text-sm font-semibold text-foreground py-1">{getActiveItem(restockItemId)?.name}</p>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Restock Quantity *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Remarks / Supplier Notes</label>
                <textarea
                  value={restockRemarks}
                  onChange={(e) => setRestockRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Procurement purchase description..."
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Stock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Transfer Stock */}
      {transferItemId && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Transfer Stock to another site</h3>
              <button onClick={() => setTransferItemId(null)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{transferError}</div>}

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <span className="block font-semibold text-muted-foreground uppercase mb-1">Transfer Item</span>
                <p className="text-sm font-semibold text-foreground py-1">{getActiveItem(transferItemId)?.name}</p>
                <p className="text-[10px] text-muted-foreground">Available Stock: {getActiveItem(transferItemId)?.currentStock} units</p>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Destination Site Location *</label>
                <select
                  required
                  value={transferDestSite}
                  onChange={(e) => setTransferDestSite(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Destination Site</option>
                  {sites.filter(s => s.id !== activeSiteId).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Transfer Quantity *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={getActiveItem(transferItemId)?.currentStock || 1}
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Remarks / Reason</label>
                <textarea
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="e.g. Office expansion stock dispatch..."
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Transfer Stock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Adjust Stock (Damage/Loss) */}
      {adjustItemId && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Record Damaged / Lost Items</h3>
              <button onClick={() => setAdjustItemId(null)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{adjustError}</div>}

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <span className="block font-semibold text-muted-foreground uppercase mb-1">Adjust Item</span>
                <p className="text-sm font-semibold text-foreground py-1">{getActiveItem(adjustItemId)?.name}</p>
                <p className="text-[10px] text-muted-foreground">Available Stock: {getActiveItem(adjustItemId)?.currentStock} units</p>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Adjustment Type *</label>
                <select
                  required
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Stock Damaged">Stock Damaged</option>
                  <option value="Stock Lost">Stock Lost</option>
                  <option value="Stock Adjusted">Stock Adjusted (Deduction)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Quantity to Deduct *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={getActiveItem(adjustItemId)?.currentStock || 1}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Remarks / Reason *</label>
                <textarea
                  required
                  value={adjustRemarks}
                  onChange={(e) => setAdjustRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/50"
                  placeholder="Specify details of damage, lost case, or audit adjustment reason..."
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Deduct Stock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Create Category */}
      {createCategoryOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Create New Category</h3>
              <button onClick={() => setCreateCategoryOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {categoryError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{categoryError}</div>}

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Heavy Machinery, Vehicles"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
