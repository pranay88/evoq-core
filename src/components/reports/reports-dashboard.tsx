'use client';

import { useState } from 'react';
import {
  Download,
  Users,
  Package,
  HardHat,
  Eye
} from 'lucide-react';

interface ReportsDashboardProps {
  sites: Array<{ id: string; name: string; code: string }>;
}

export default function ReportsDashboard({ sites }: ReportsDashboardProps) {
  // Use state to bind values instead of raw DOM selectors
  const [empSite, setEmpSite] = useState('');
  const [invSite, setInvSite] = useState('');
  const [assetSite, setAssetSite] = useState('');
  const [visitorSite, setVisitorSite] = useState('');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-sm">
      {/* Card 1: Employees */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col justify-between space-y-4">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">Employee Directory</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Export staff list details including mobile numbers, emails, locations, designation, joining dates, and employment statuses.
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <select
            value={empSite}
            onChange={(e) => setEmpSite(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border rounded text-xs focus:outline-none"
          >
            <option value="">All Sites</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          <a
            href={`/api/reports?type=employees${empSite ? `&siteId=${empSite}` : ''}`}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded shadow-sm transition-colors text-center"
          >
            <Download className="w-4 h-4" /> Download Excel
          </a>
        </div>
      </div>

      {/* Card 2: Inventory */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col justify-between space-y-4">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">Inventory Audits</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Export site stock levels, procurement item rates, categories, minimum thresholds, and current counts.
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <select
            value={invSite}
            onChange={(e) => setInvSite(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border rounded text-xs focus:outline-none"
          >
            <option value="">All Sites</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          <a
            href={`/api/reports?type=inventory${invSite ? `&siteId=${invSite}` : ''}`}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded shadow-sm transition-colors text-center"
          >
            <Download className="w-4 h-4" /> Download Excel
          </a>
        </div>
      </div>

      {/* Card 3: Issued Assets */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col justify-between space-y-4">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">Issued Company Assets</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Export hardware issue details, serial numbers, expected return dates, item conditions, and return status indicators.
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <select
            value={assetSite}
            onChange={(e) => setAssetSite(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border rounded text-xs focus:outline-none"
          >
            <option value="">All Sites</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          <a
            href={`/api/reports?type=assets${assetSite ? `&siteId=${assetSite}` : ''}`}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded shadow-sm transition-colors text-center"
          >
            <Download className="w-4 h-4" /> Download Excel
          </a>
        </div>
      </div>

      {/* Card 4: Visitors */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col justify-between space-y-4">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">Visitor Logs</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Export visitor checks, company details, entry times, exit logs, host names, and check-in category listings.
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <select
            value={visitorSite}
            onChange={(e) => setVisitorSite(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border rounded text-xs focus:outline-none"
          >
            <option value="">All Sites</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          <a
            href={`/api/reports?type=visitors${visitorSite ? `&siteId=${visitorSite}` : ''}`}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded shadow-sm transition-colors text-center"
          >
            <Download className="w-4 h-4" /> Download Excel
          </a>
        </div>
      </div>
    </div>
  );
}
