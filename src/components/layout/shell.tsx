'use client';

import { useState } from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
    siteId: string | null;
    siteCode?: string | null;
    siteName?: string | null;
  };
  sites: Array<{ id: string; name: string; code: string }>;
  children: React.ReactNode;
}

export default function AppShell({ user, sites, children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          user={user}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-card shadow-lg flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="h-16 px-6 border-b border-border flex items-center justify-between">
              <span className="font-serif text-lg font-bold text-foreground">EVOQ CORE</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              user={user}
              isCollapsed={false}
              setIsCollapsed={() => {}}
            />
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          user={user}
          sites={sites}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
