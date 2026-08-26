'use client';

import { useState, useTransition, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createVisitorAction,
  recordVisitorExitAction,
  lookupVisitorPhoneAction
} from '@/app/actions/visitors';
import {
  UserCheck,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Phone,
  Building,
  UserMinus,
  Clock,
  Gift,
  Bell,
  MapPin,
  HelpCircle,
  AlertTriangle,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import Link from 'next/link';

interface FrontDeskDashboardViewProps {
  user: any;
  visitorsToday: any[];
  birthdaysToday: any[];
  upcomingBirthdays: any[];
  upcomingFestivals: any[];
  reminders: any[];
  lastEom: any | null;
}

export default function FrontDeskDashboardView({
  user,
  visitorsToday,
  birthdaysToday,
  upcomingBirthdays,
  upcomingFestivals,
  reminders,
  lastEom
}: FrontDeskDashboardViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');

  const [state, formAction, createPending] = useActionState(createVisitorAction, {
    success: false,
    message: '',
  });

  // Reset check-in modal on success
  useEffect(() => {
    if (state.success && checkInOpen) {
      setCheckInOpen(false);
      setPhone('');
      setName('');
      setCompany('');
      setLookupMessage('');
      state.success = false; // reset
      router.refresh();
    }
  }, [state.success, checkInOpen, router, state]);

  // Trigger phone lookup on 10 digit entries
  useEffect(() => {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length >= 10) {
      setIsLookupLoading(true);
      setLookupMessage('');
      
      lookupVisitorPhoneAction(cleanPhone).then((res) => {
        setIsLookupLoading(false);
        if (res.success && res.found) {
          setName(res.name || '');
          setCompany(res.company || '');
          setLookupMessage('Returning visitor recognized. Name & company auto-filled.');
        } else {
          setLookupMessage('New visitor detected.');
        }
      });
    }
  }, [phone]);

  const handleCheckout = (visitorId: string) => {
    if (!confirm('Record visitor checkout exit time?')) return;
    
    startTransition(async () => {
      const res = await recordVisitorExitAction(visitorId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  const visitorsInside = visitorsToday.filter(v => !v.exitTime);
  const visitorsInsideCount = visitorsInside.length;
  const returningCount = visitorsToday.filter(v => v.isExisting).length;
  const newCount = visitorsToday.length - returningCount;

  return (
    <div className="space-y-6 font-sans text-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Front Desk Operations</h1>
          <p className="text-sm text-muted-foreground">
            Desk officer context set to site location: <strong>{user.siteName || 'HQ'}</strong>.
          </p>
        </div>
        <button
          onClick={() => setCheckInOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-md shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Visitor Check-in
        </button>
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

      {/* Aggregate metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <Link
          href="/frontdesk/visitors"
          className="bg-card border border-border p-5 rounded-lg shadow-sm hover:border-primary/50 hover:shadow-md cursor-pointer transition-all block"
        >
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Visitors Today</span>
          <p className="text-3xl font-serif font-bold text-foreground mt-2">{visitorsToday.length} Checked In</p>
        </Link>
        <Link
          href="/frontdesk/visitors?tab=inside"
          className="bg-card border border-border p-5 rounded-lg shadow-sm hover:border-primary/50 hover:shadow-md cursor-pointer transition-all block"
        >
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Currently Inside</span>
          <p className="text-3xl font-serif font-bold text-primary mt-2">{visitorsInsideCount} Visitors</p>
        </Link>
        <Link
          href="/frontdesk/visitors"
          className="bg-card border border-border p-5 rounded-lg shadow-sm hover:border-primary/50 hover:shadow-md cursor-pointer transition-all block"
        >
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">New Visitors</span>
          <p className="text-3xl font-serif font-bold text-foreground mt-2">{newCount} Registrations</p>
        </Link>
        <Link
          href="/frontdesk/visitors"
          className="bg-card border border-border p-5 rounded-lg shadow-sm hover:border-primary/50 hover:shadow-md cursor-pointer transition-all block"
        >
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Returning Visitors</span>
          <p className="text-3xl font-serif font-bold text-foreground mt-2">{returningCount} Recognized</p>
        </Link>
      </div>

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Visitors currently inside */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border/60">
              <h3 className="text-md font-serif font-bold text-foreground">Visitors Currently Inside</h3>
              <Link href="/frontdesk/visitors" className="text-xs text-primary hover:underline">View Visitor Log</Link>
            </div>
            
            <div className="divide-y divide-border/60">
              {visitorsInside.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">No visitors currently inside this site.</p>
              ) : (
                visitorsInside.map((v) => (
                  <div key={v.id} className="py-3.5 first:pt-0 last:pb-0 flex justify-between items-center gap-4">
                    <div>
                      <span className="font-semibold text-foreground">{v.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">({v.category})</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Host: <strong>{v.personToMeet}</strong> &bull; Purpose: {v.purpose}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCheckout(v.id)}
                      disabled={isPending}
                      className="px-2.5 py-1 bg-secondary text-foreground hover:bg-accent border border-border text-xs font-semibold rounded transition-colors disabled:opacity-50"
                    >
                      Checkout
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Birthdays & Reminders */}
        <div className="space-y-6">
          {/* Birthdays today alert */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60 flex items-center gap-1.5">
              <Gift className="w-5 h-5 text-primary" /> Birthdays Today ({birthdaysToday.length})
            </h3>
            {birthdaysToday.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No staff birthdays today.</p>
            ) : (
              <div className="space-y-2">
                {birthdaysToday.map((emp, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">{emp.fullName}</span>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">{emp.department?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming holidays */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60 flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-primary" /> Upcoming Holidays ({upcomingFestivals.length})
            </h3>
            <div className="space-y-2 text-xs">
              {upcomingFestivals.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No upcoming holidays.</p>
              ) : (
                upcomingFestivals.map((fest, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">{fest.name}</span>
                    <span className="text-muted-foreground font-mono text-[10px]">{formatDate(fest.date)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Check-in Visitor */}
      {checkInOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Visitor Registration Check-In</h3>
              <button onClick={() => setCheckInOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {state.message && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{state.message}</div>
            )}

            <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <input type="hidden" name="siteId" value={user.siteId || ''} />

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Phone Number *</label>
                <div className="relative">
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Visitor mobile number"
                  />
                  {isLookupLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    </span>
                  )}
                </div>
                {lookupMessage && (
                  <p className="text-[10px] text-primary mt-1 font-semibold">{lookupMessage}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Visitor Full Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Visitor full name"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Company / Organization</label>
                <input
                  name="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Visitor Category *</label>
                <select
                  name="category"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Client">Client</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Candidate">Candidate</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Government Official">Government Official</option>
                  <option value="Delivery Person">Delivery Person</option>
                  <option value="Service Provider">Service Provider</option>
                  <option value="Personal Visitor">Personal Visitor</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Person to Meet *</label>
                <input
                  name="personToMeet"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Employee host name"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Purpose of Visit *</label>
                <input
                  name="purpose"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Reason for visit"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Number of Visitors</label>
                <input
                  name="numberOfVisitors"
                  type="number"
                  defaultValue={1}
                  min={1}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Vehicle Number</label>
                <input
                  name="vehicleNumber"
                  type="text"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. KA-01-AB-1234"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Items Carried</label>
                <input
                  name="itemsCarried"
                  type="text"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Laptop, bag"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Remarks</label>
                <textarea
                  name="remarks"
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="General check-in remarks..."
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-3 border-t border-border mt-2">
                <button
                  type="submit"
                  disabled={createPending}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-sans font-medium rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {createPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Register Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
