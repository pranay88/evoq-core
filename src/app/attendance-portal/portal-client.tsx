'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markPortalAttendanceAction } from '@/app/actions/attendance';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Building,
  ArrowLeft,
  XCircle
} from 'lucide-react';

export default function AttendancePortalClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Live Digital Clock
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Kiosk Overlay Status
  const [result, setResult] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [errorMsg, setErrorMsg] = useState('');

  // Countdown timer to reset the lobby terminal
  useEffect(() => {
    if (!result) return;
    if (countdown === 0) {
      // Clear and reset form fields
      setResult(null);
      setEmailOrId('');
      setPassword('');
      setCountdown(5);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [result, countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId || !password) {
      setErrorMsg('Please enter both employee credentials.');
      return;
    }
    setErrorMsg('');

    startTransition(async () => {
      const res = await markPortalAttendanceAction(emailOrId, password);
      if (res.success) {
        router.push('/employee/dashboard');
      } else {
        setErrorMsg(res.message || 'Verification failed.');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] font-sans text-sm relative overflow-hidden select-none p-4 text-[#faf9f6]">
      {/* Autofill Browser Style Fixes */}
      <style dangerouslySetInnerHTML={{
        __html: `
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0px 1000px #121212 inset !important;
            -webkit-text-fill-color: #faf9f6 !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `
      }} />

      {/* Decorative Gold Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-[#c5a880]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-[#c5a880]/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-30%] w-[40vw] h-[40vw] rounded-full bg-[#c5a880]/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Live Terminal Clock Banner */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-3 bg-[#1c1c1c] px-3.5 py-1.5 rounded-full border border-[#2c2923] w-fit mx-auto shadow-sm select-none">
            <img src="/logo.png" alt="EVOQ Logo" className="h-4 w-auto object-contain" />
            <span className="font-serif text-[10px] font-bold tracking-widest text-[#c5a880]">CORE</span>
          </div>
          <h2 className="text-5xl font-mono font-bold text-[#c5a880] tracking-tight drop-shadow-[0_0_15px_rgba(197,168,128,0.25)]">
            {currentTime || '--:--:--'}
          </h2>
          <p className="text-[10px] text-[#a09a8f] uppercase tracking-widest font-semibold font-sans pt-1">
            {currentDate || '...'}
          </p>
        </div>

        {/* Card Panel */}
        <div className="bg-[#1c1c1c]/90 border border-[#2c2923] p-8 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Overlay Panel for Successful Checkin/Checkout */}
          {result && (
            <div className="absolute inset-0 bg-[#1c1c1c] z-20 flex flex-col items-center justify-center p-6 text-center space-y-5 animate-fade-in select-none">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full font-sans border ${result.type === 'ALREADY_LOGGED' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {result.type === 'CHECK_IN' ? 'Check-in Recorded' : result.type === 'CHECK_OUT' ? 'Check-out Recorded' : 'Already Logged'}
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#faf9f6] mt-4">{result.name}</h3>
                <p className="text-xs text-[#a09a8f] mt-1">{result.type === 'ALREADY_LOGGED' ? result.message : 'EVOQ Realtech On-Site Attendance Network'}</p>
              </div>

              <div className="bg-[#121212]/80 border border-[#2c2923] px-6 py-4 rounded-xl w-full max-w-[280px]">
                <p className="text-[10px] text-[#a09a8f] uppercase tracking-wider font-semibold">Recorded Time</p>
                <p className="text-2xl font-mono font-bold text-[#faf9f6] mt-0.5">{result.time}</p>
                {result.workingHours !== undefined && result.workingHours !== null && (
                  <p className="text-xs text-[#c5a880] font-semibold mt-1 font-sans">Total Hours today: {result.workingHours} hrs</p>
                )}
              </div>

              <div className="flex flex-col gap-3 mt-2 w-full max-w-[280px]">
                <button
                  onClick={() => router.push('/employee/dashboard')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#c5a880] hover:bg-[#d5b890] text-[#121212] font-semibold rounded-lg shadow-md transition-colors"
                >
                  Proceed to My Dashboard
                </button>
                <p className="text-[10px] text-[#a09a8f]/60 font-sans">
                  Lobby screen resetting automatically in <strong className="text-[#faf9f6]">{countdown}s</strong>...
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="border-b border-[#2c2923] pb-4 text-center">
              <h1 className="text-xl font-serif font-bold text-[#faf9f6]">Regional Staff Portal</h1>
              <p className="text-xs text-[#a09a8f] mt-1 font-sans">Enter your ID or email to access your dashboard.</p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-md flex items-start gap-2 font-sans">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-[#a09a8f] uppercase mb-2 font-sans">
                  Email address or Employee ID
                </label>
                <input
                  type="text"
                  required
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#121212] border border-[#2c2923] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] text-[#faf9f6] placeholder:text-muted-foreground/30 transition-all font-sans text-sm"
                  placeholder="e.g. employee@houseofevoq.com or EVOQ101"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-[#a09a8f] uppercase mb-2 font-sans">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#121212] border border-[#2c2923] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880] text-[#faf9f6] placeholder:text-muted-foreground/30 transition-all font-sans text-sm"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:text-[#faf9f6] text-[#a09a8f]/50 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-3.5 bg-gradient-to-r from-[#c5a880] to-[#ab865b] hover:from-[#d5b890] hover:to-[#bc966b] text-[#121212] font-bold rounded-lg shadow-lg shadow-[#c5a880]/5 hover:shadow-[#c5a880]/15 transition-all duration-300 disabled:opacity-50 text-sm tracking-wider active:scale-[0.99] font-sans"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Login to Dashboard</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Back Link to Security Gateway Login */}
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-1.5 text-xs text-[#a09a8f] hover:text-[#c5a880] transition-colors mx-auto font-sans font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Security Gateway
        </button>
      </div>
    </div>
  );
}
