'use client';

import { useState, useActionState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPasswordAction } from '@/app/actions/auth';
import { ArrowLeft, CheckCircle2, ShieldAlert, Key } from 'lucide-react';

const initialState = {
  success: false,
  message: '',
  errors: {} as Record<string, string[]>,
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [matchError, setMatchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (password !== confirmPassword) {
        setMatchError('Passwords do not match');
        return prevState;
      }
      setMatchError('');
      return resetPasswordAction(emailParam, password);
    },
    initialState
  );

  useEffect(() => {
    if (state.success) {
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-sm border border-border">
        <Link 
          href="/login" 
          className="inline-flex items-center text-xs font-semibold text-primary hover:underline mb-8 font-sans gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Login
        </Link>

        {state.success ? (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce" />
            <h1 className="text-3xl font-serif text-foreground mb-4">Password Reset Successful</h1>
            <p className="text-muted-foreground font-sans text-sm mb-6">
              Your password has been successfully updated. You will be redirected to the login page shortly.
            </p>
            <Link 
              href="/login"
              className="inline-block text-sm text-primary hover:underline font-sans font-semibold"
            >
              Redirecting to Login... Click here if it takes too long
            </Link>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-serif text-foreground mb-2">Set New Password</h1>
            <p className="text-muted-foreground font-sans text-sm mb-8">
              Resetting password for: <strong className="text-foreground">{emailParam || 'demo@houseofevoq.com'}</strong>
            </p>

            {!emailParam && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs rounded-md font-sans flex gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>
                  <strong>Warning:</strong> No email parameter was found in the URL. If you came here directly, password resets will default to: <strong>demo@houseofevoq.com</strong>.
                </span>
              </div>
            )}

            {(state.message || matchError) && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md font-sans">
                {matchError || state.message}
              </div>
            )}

            <form action={formAction} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2 font-sans">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/50 transition-all font-sans text-sm"
                  placeholder="••••••••"
                />
                {state.errors?.password && (
                  <p className="mt-1.5 text-xs text-destructive font-sans">{state.errors.password[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2 font-sans">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/50 transition-all font-sans text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-sans font-medium rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-sm"
              >
                {isPending ? (
                  'Updating Password...'
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background px-6 py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
