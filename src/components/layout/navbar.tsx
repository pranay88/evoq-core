'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Menu,
  ChevronDown,
  LogOut,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import { logoutAction, switchSiteAction } from '@/app/actions/auth';

interface NavbarProps {
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
  onMenuToggle: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export default function Navbar({ user, sites, onMenuToggle }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sync theme state with actual class list on mount
  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(activeTheme);
  }, []);

  // Fetch notifications (mocked for initial layout, but will connect to backend API soon)
  useEffect(() => {
    // Standard mock notifications matching the seed alerts
    const mockNotifications: NotificationItem[] = [
      {
        id: '1',
        title: 'Low Stock Alert',
        description: 'JK A4 Paper Ream is below minimum stock level.',
        type: 'LOW_STOCK',
        createdAt: new Date().toISOString(),
        read: false,
      },
      {
        id: '2',
        title: 'Upcoming Birthday Today',
        description: 'Rohan Sen (TECH) celebrates their birthday today!',
        type: 'BIRTHDAY',
        createdAt: new Date().toISOString(),
        read: false,
      },
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const handleSignOut = async () => {
    const res = await logoutAction(user.userId, user.name, user.role);
    if (res.success) {
      router.push('/login');
      router.refresh();
    }
  };

  const handleSiteChange = async (siteId: string) => {
    if (!siteId || siteId === user.siteId) return;
    const res = await switchSiteAction(siteId);
    if (res.success) {
      router.refresh();
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Generate dynamic breadcrumbs
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, index) => {
      const url = `/${parts.slice(0, index + 1).join('/')}`;
      const name = part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ');
      const isLast = index === parts.length - 1;

      return (
        <span key={url} className="flex items-center text-xs font-sans">
          <span className="mx-2 text-muted-foreground/60">/</span>
          {isLast ? (
            <span className="font-semibold text-foreground">{name}</span>
          ) : (
            <Link href={url} className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              {name}
            </Link>
          )}
        </span>
      );
    });
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 z-10 select-none">
      {/* Left side: Hamburger and Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden md:flex items-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-sans font-medium">
            EVOQ CORE
          </Link>
          {getBreadcrumbs()}
        </div>
      </div>

      {/* Right side: Site Selector, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Site Indicator / Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md border border-border/80">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          {user.role === 'HR' || user.role === 'ADMIN' ? (
            <div className="relative flex items-center">
              <select
                value={user.siteId || ''}
                onChange={(e) => handleSiteChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground font-sans pr-6 focus:outline-none cursor-pointer appearance-none"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-0 pointer-events-none" />
            </div>
          ) : (
            <span className="text-xs font-semibold text-foreground font-sans">
              {user.siteName ? `${user.siteName} (${user.siteCode})` : 'No Site Context'}
            </span>
          )}
        </div>

        {/* Theme Toggler */}
        <button
          onClick={() => {
            const nextTheme = theme === 'light' ? 'dark' : 'light';
            setTheme(nextTheme);
            localStorage.setItem('theme', nextTheme);
            if (nextTheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }}
          className="p-2 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-all flex items-center justify-center shrink-0"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500 animate-[spin_12s_linear_infinite]" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserDropdownOpen(false);
            }}
            className="p-2 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-md shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                <span className="font-serif font-bold text-sm text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline font-sans font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground font-sans">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors flex gap-3 ${
                        n.read ? 'opacity-60' : ''
                      }`}
                    >
                      {n.type === 'LOW_STOCK' ? (
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-foreground font-sans">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground font-sans mt-0.5">{n.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 hover:bg-secondary rounded-md transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-sans font-semibold flex items-center justify-center uppercase text-sm">
              {user.name.charAt(0)}
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors font-sans text-left"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
