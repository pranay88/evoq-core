'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

const initialState = {
  success: false,
  message: '',
  errors: {} as Record<string, string[]>,
  role: '',
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';
  
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(loginAction as any, initialState);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle redirects and errors
  useEffect(() => {
    if (state.success) {
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        // Default dashboards based on roles
        switch (state.role) {
          case 'HR':
            router.push('/hr/dashboard');
            break;
          case 'ADMIN':
            router.push('/admin/dashboard');
            break;
          case 'FRONT_DESK':
            router.push('/frontdesk/dashboard');
            break;
          case 'EMPLOYEE':
            router.push('/employee/dashboard');
            break;
          default:
            router.push('/unauthorized');
        }
      }
      router.refresh();
    } else if (state.message) {
      setErrorMsg(state.message);
    }
  }, [state, router, redirectPath]);

  // Handle errors passed as search parameters (e.g. session timeout)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'inactive') {
      setErrorMsg('This account has been deactivated. Please contact HR.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Branding Column */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-16 gold-gradient text-white select-none">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <ShieldCheck className="w-8 h-8 text-white/90" />
            <span className="font-sans font-semibold tracking-wider text-sm text-white/80">SECURITY GATEWAY</span>
          </div>
        </div>
        <div className="my-auto">
          <div className="flex items-center gap-3 mb-6 bg-[#1C1C1C] px-4 py-2 rounded w-fit select-none">
            <img src="/logo.png" alt="EVOQ Logo" className="h-10 sm:h-12 w-auto object-contain" />
            <span className="font-serif text-lg sm:text-xl font-bold tracking-widest text-[#C5A880]">CORE</span>
          </div>
          <p className="text-xl md:text-2xl font-light text-white/90 leading-relaxed font-sans max-w-lg">
            People. Places. Operations. Connected.
          </p>
        </div>
        <div className="text-xs text-white/60 font-sans mt-8">
          &copy; {new Date().getFullYear()} EVOQ Realtech. All rights reserved.
        </div>
      </div>

      {/* Form Column */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-serif text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground font-sans text-sm">
              Please enter your credentials to access the EVOQ internal network.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md font-sans">
              {errorMsg}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2 font-sans">
                Official Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/50 transition-all font-sans text-sm"
                placeholder="email@evoqrealtech.com"
              />
              {state.errors?.email && (
                <p className="mt-1.5 text-xs text-destructive font-sans">{state.errors.email[0]}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase font-sans">
                  Password
                </label>
                <a href="/forgot-password" className="text-xs text-primary hover:underline font-sans">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/50 pr-12 transition-all font-sans text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {state.errors?.password && (
                <p className="mt-1.5 text-xs text-destructive font-sans">{state.errors.password[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-sans font-medium rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Verifying Credentials...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center pt-2">
              <a
                href="/attendance-portal"
                className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
              >
                ⚡ Quick Lobby Attendance Check-In / Check-Out
              </a>
            </div>
          </form>

          {/* Demo Credentials Box */}
          <div className="mt-12 p-5 bg-secondary rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3 font-sans">Demo Credentials</h3>
            <div className="space-y-2 text-xs text-muted-foreground font-sans">
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span><strong>HR:</strong> hr@evoqrealtech.com</span>
                <span className="text-foreground">Password@123</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span><strong>Admin:</strong> admin@evoqrealtech.com</span>
                <span className="text-foreground">Password@123</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span><strong>Front Desk (HQ):</strong> fd1.hq@evoqrealtech.com</span>
                <span className="text-foreground">Password@123</span>
              </div>
              <div className="flex justify-between">
                <span><strong>Front Desk (Noida):</strong> fd1.on@evoqrealtech.com</span>
                <span className="text-foreground">Password@123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
