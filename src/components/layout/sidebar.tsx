'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Clock,
  Package,
  HardHat,
  BarChart3,
  UserCheck,
  ClipboardList,
  User,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Users2,
  Bell,
  Trophy,
  CalendarOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to check utility file (will write this helper shortly)
import { logoutAction } from '@/app/actions/auth';

interface SidebarProps {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ user, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  // Define navigation items based on roles
  const getNavItems = () => {
    const role = user.role;

    if (role === 'HR' || role === 'SUPER_ADMIN') {
      return [
        { name: 'Dashboard', href: '/hr/dashboard', icon: LayoutDashboard },
        { name: 'Employees', href: '/hr/employees', icon: Users },
        { name: 'Onboarding Links', href: '/hr/invitations', icon: UserCheck },
        { name: 'Submissions', href: '/hr/submissions', icon: ClipboardList },
        { name: 'Attendance', href: '/hr/attendance', icon: Clock },
        { name: 'Leave Requests', href: '/hr/leaves', icon: CalendarOff },
        { name: 'Calendar & Festivals', href: '/hr/calendar', icon: Calendar },
        { name: 'Reminders', href: '/hr/reminders', icon: Bell },
        { name: 'Leaderboard', href: '/hr/leaderboard', icon: Trophy },
        { name: 'Inventory', href: '/admin/inventory', icon: Package },
        { name: 'Issued Assets', href: '/admin/assets', icon: HardHat },
        { name: 'Reports', href: '/hr/reports', icon: BarChart3 },
        { name: 'Audit Logs', href: '/hr/audit-logs', icon: FileText },
        { name: 'Users Management', href: '/hr/users', icon: Users2 },
      ];
    }

    if (role === 'ADMIN') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Leaderboard', href: '/hr/leaderboard', icon: Trophy },
        { name: 'Inventory Stock', href: '/admin/inventory', icon: Package },
        { name: 'Issued Assets', href: '/admin/assets', icon: HardHat },
        { name: 'Reports', href: '/hr/reports', icon: BarChart3 },
      ];
    }

    if (role === 'FRONT_DESK') {
      return [
        { name: 'Dashboard', href: '/frontdesk/dashboard', icon: LayoutDashboard },
        { name: 'Leaderboard', href: '/hr/leaderboard', icon: Trophy },
        { name: 'Visitor Log', href: '/frontdesk/visitors', icon: ClipboardList },
        { name: 'Reports', href: '/hr/reports', icon: BarChart3 },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 bg-card border-r border-border flex flex-col justify-between transition-all duration-300 z-20 select-none shrink-0',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {isCollapsed ? (
              <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
            ) : (
              <div className="bg-[#1C1C1C] px-3 py-1.5 rounded flex items-center gap-2 select-none">
                <img src="/logo.png" alt="EVOQ Logo" className="h-5 w-auto object-contain" />
                <span className="font-serif text-xs font-bold tracking-widest text-[#C5A880]">CORE</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground hidden md:block transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href) || pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans font-medium transition-all group relative',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
                {isCollapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Collapse button for small state / User quick link */}
      <div className="p-4 border-t border-border space-y-2">
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full flex items-center justify-center p-2.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-sans text-sm uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
