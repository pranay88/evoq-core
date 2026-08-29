'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { issueAssetAction, returnAssetAction } from '@/app/actions/assets';
import {
  HardHat,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Building,
  FileSpreadsheet,
  AlertTriangle,
  Info
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface AssetsDashboardProps {
  assets: any[];
  employees: any[];
  inStockItems: any[];
  activeSiteId: string | null;
  activeSiteName: string;
  userRole: string;
}

export default function AssetsDashboard({
  assets,
  employees,
  inStockItems,
  activeSiteId,
  activeSiteName,
  userRole
}: AssetsDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueError, setIssueError] = useState('');
  
  const [returningAssetId, setReturningAssetId] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState('Returned'); // Returned, Damaged Needs Repair, Damaged Unusable, Lost
  const [missingAcc, setMissingAcc] = useState('');
  const [damageDet, setDamageDet] = useState('');
  const [recoveryAmt, setRecoveryAmt] = useState(0);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returnError, setReturnError] = useState('');

  // Asset details popup state
  const [detailedAsset, setDetailedAsset] = useState<any | null>(null);

  // Issue form fields state
  const [itemId, setItemId] = useState('');
  const [assetCode, setAssetCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [conditionAtIssue, setConditionAtIssue] = useState('New');
  const [issueRemarks, setIssueRemarks] = useState('');

  // Submit Issue Asset
  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !assetCode || !employeeId || !conditionAtIssue) {
      setIssueError('Please fill in all required fields.');
      return;
    }
    setIssueError('');

    startTransition(async () => {
      const res = await issueAssetAction(
        itemId,
        assetCode,
        serialNumber,
        employeeId,
        expectedReturnDate,
        conditionAtIssue,
        issueRemarks
      );

      if (res.success) {
        setIssueModalOpen(false);
        setItemId('');
        setAssetCode('');
        setSerialNumber('');
        setEmployeeId('');
        setExpectedReturnDate('');
        setConditionAtIssue('New');
        setIssueRemarks('');
        router.refresh();
      } else {
        setIssueError(res.message);
      }
    });
  };

  // Submit Return Asset
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningAssetId || !returnCondition) return;
    setReturnError('');

    startTransition(async () => {
      const res = await returnAssetAction(
        returningAssetId,
        returnCondition,
        missingAcc,
        damageDet,
        recoveryAmt,
        returnRemarks
      );

      if (res.success) {
        setReturningAssetId(null);
        setMissingAcc('');
        setDamageDet('');
        setRecoveryAmt(0);
        setReturnRemarks('');
        router.refresh();
      } else {
        setReturnError(res.message);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Issued':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Returned':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Lost':
      case 'Retired':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Under Repair':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-secondary text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6 font-sans text-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Company Assets</h1>
          <p className="text-sm text-muted-foreground">
            Track hardware, electronics, and office resources issued to employees. Enforces stock controls.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/api/reports?type=assets&siteId=${activeSiteId || ''}`}
            className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground text-sm rounded-md transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            Export Assets
          </Link>
          <button
            onClick={() => setIssueModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-medium rounded-md shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Issue Asset
          </button>
        </div>
      </div>

      {/* Assets Listing Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-secondary/15 flex justify-between items-center">
          <h2 className="text-md font-serif font-bold text-foreground">
            Asset Registry &mdash; {activeSiteName}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3">Asset Code</th>
                <th className="px-5 py-3">Item Description</th>
                <th className="px-5 py-3">Issued Employee</th>
                <th className="px-5 py-3">Issue Date</th>
                <th className="px-5 py-3">Expected Return</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                    No issued assets listed for this site context.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-5 py-4 font-semibold text-foreground">{asset.assetCode}</td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-foreground">{asset.item?.name}</p>
                        {asset.serialNumber && <p className="text-[10px] text-muted-foreground font-mono mt-0.5">SN: {asset.serialNumber}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">
                      {userRole === 'HR' ? (
                        <Link href={`/hr/employees/${asset.employee?.id}`} className="hover:underline hover:text-primary transition-colors">
                          {asset.employee?.fullName}
                        </Link>
                      ) : (
                        asset.employee?.fullName
                      )}
                      <span className="block text-[10px] text-muted-foreground mt-0.5">{asset.employee?.employeeId}</span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(asset.issueDate)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{asset.expectedReturnDate ? formatDate(asset.expectedReturnDate) : '-'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadge(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setDetailedAsset(asset)}
                          className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="Details"
                        >
                          <Info className="w-4.5 h-4.5" />
                        </button>
                        {asset.status === 'Issued' && (
                          <button
                            onClick={() => setReturningAssetId(asset.id)}
                            className="px-2.5 py-1 border border-border bg-card hover:bg-secondary text-xs font-semibold rounded transition-colors text-foreground"
                          >
                            Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Issue Asset */}
      {issueModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Issue Company Asset</h3>
              <button onClick={() => setIssueModalOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {issueError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{issueError}</div>}

            <form onSubmit={handleIssueSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Select In-Stock Item *</label>
                <select
                  required
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Item</option>
                  {inStockItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.currentStock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Asset Code * (Unique)</label>
                <input
                  type="text"
                  required
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  placeholder="e.g. AST-DELL-103"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Serial Number</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  placeholder="Manufacturer serial no."
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Issue to Employee *</label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Expected Return Date</label>
                <input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Condition at Issue *</label>
                <select
                  required
                  value={conditionAtIssue}
                  onChange={(e) => setConditionAtIssue(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="New">Brand New</option>
                  <option value="Good">Good / Working</option>
                  <option value="Fair">Fair / Used</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Remarks</label>
                <textarea
                  value={issueRemarks}
                  onChange={(e) => setIssueRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Details of issuance..."
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-3 border-t border-border mt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-sans font-medium rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Issue Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Return */}
      {returningAssetId && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Record Asset Return</h3>
              <button onClick={() => setReturningAssetId(null)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {returnError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{returnError}</div>}

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Return Condition *</label>
                <select
                  required
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Returned">Good / Usable</option>
                  <option value="Damaged Needs Repair">Damaged (Needs Repair)</option>
                  <option value="Damaged Unusable">Damaged beyond use (Retired)</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Missing Accessories (if any)</label>
                <input
                  type="text"
                  value={missingAcc}
                  onChange={(e) => setMissingAcc(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. charger, pouch"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Damage Details (if any)</label>
                <input
                  type="text"
                  value={damageDet}
                  onChange={(e) => setDamageDet(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. cracked plastic, scratch"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Penalty / Recovery Amount (INR)</label>
                <input
                  type="number"
                  value={recoveryAmt}
                  onChange={(e) => setRecoveryAmt(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Remarks</label>
                <textarea
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Return observation notes..."
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Record Return
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POPUP 3: Detailed Asset Audit log viewer */}
      {detailedAsset && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Asset Details: {detailedAsset.assetCode}</h3>
              <button onClick={() => setDetailedAsset(null)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex justify-between pb-1 border-b border-border/40">
                <span className="text-muted-foreground font-semibold">Item:</span>
                <span className="text-foreground">{detailedAsset.item?.name}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-border/40">
                <span className="text-muted-foreground font-semibold">Serial Number:</span>
                <span className="text-foreground font-mono">{detailedAsset.serialNumber || '-'}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-border/40">
                <span className="text-muted-foreground font-semibold">Issued Employee:</span>
                <span className="text-foreground">{detailedAsset.employee?.fullName} ({detailedAsset.employee?.employeeId})</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-border/40">
                <span className="text-muted-foreground font-semibold">Issued Date:</span>
                <span className="text-foreground">{formatDate(detailedAsset.issueDate)}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-border/40">
                <span className="text-muted-foreground font-semibold">Condition at Issue:</span>
                <span className="text-foreground">{detailedAsset.conditionAtIssue}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-border/40">
                <span className="text-muted-foreground font-semibold">Current Status:</span>
                <span className={cn('font-bold', getStatusBadge(detailedAsset.status))}>{detailedAsset.status}</span>
              </div>
              {detailedAsset.remarks && (
                <div className="pb-1 border-b border-border/40">
                  <span className="text-muted-foreground font-semibold block mb-1">Remarks at Issue:</span>
                  <p className="text-foreground p-2 bg-secondary/35 rounded">{detailedAsset.remarks}</p>
                </div>
              )}

              {/* Show return logs if returned */}
              {detailedAsset.returns && detailedAsset.returns.length > 0 && (
                <div className="pt-2 border-t border-border mt-3 space-y-2">
                  <span className="font-semibold text-foreground block text-xs font-serif">Return Details:</span>
                  <div className="space-y-1.5 p-3 bg-secondary/35 rounded text-[11px] leading-relaxed text-muted-foreground">
                    <div>Return Date: <strong className="text-foreground">{formatDate(detailedAsset.returns[0].returnDate)}</strong></div>
                    <div>Return Condition: <strong className="text-foreground">{detailedAsset.returns[0].conditionAtReturn}</strong></div>
                    {detailedAsset.returns[0].missingAccessories && <div>Missing Accessories: <span className="text-foreground">{detailedAsset.returns[0].missingAccessories}</span></div>}
                    {detailedAsset.returns[0].damageDetails && <div>Damaged Details: <span className="text-foreground">{detailedAsset.returns[0].damageDetails}</span></div>}
                    {detailedAsset.returns[0].recoveryAmount > 0 && <div>Recovery Amount: <span className="text-foreground font-semibold">INR {detailedAsset.returns[0].recoveryAmount}</span></div>}
                    {detailedAsset.returns[0].remarks && <div className="mt-1 border-t border-border/40 pt-1 italic">Remarks: {detailedAsset.returns[0].remarks}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
