'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    
    // Simulate sending email link
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-sm border border-border">
        <Link 
          href="/login" 
          className="inline-flex items-center text-xs font-semibold text-primary hover:underline mb-8 font-sans gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Login
        </Link>

        {submitted ? (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-serif text-foreground mb-4">Check Your Email</h1>
            <p className="text-muted-foreground font-sans text-sm mb-6">
              We have sent a password reset link to <strong>{email}</strong>. Please follow the instructions in the email.
            </p>
            <div className="p-4 bg-secondary rounded-md border border-border text-xs text-muted-foreground font-sans mb-8">
              <strong>Demo Tip:</strong> For testing, you can access the reset page directly by clicking the link below:
              <br />
              <Link href="/reset-password?email=demo@houseofevoq.com" className="text-primary underline mt-2 block font-semibold">
                Go to Reset Password Page
              </Link>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="w-full py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-sans rounded-md transition-colors text-sm font-medium border border-border"
            >
              Try another email
            </button>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-serif text-foreground mb-2">Reset Password</h1>
            <p className="text-muted-foreground font-sans text-sm mb-8">
              Enter the official email address associated with your account, and we will send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2 font-sans">
                  Official Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/50 transition-all font-sans text-sm"
                  placeholder="email@houseofevoq.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-sans font-medium rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-sm"
              >
                {loading ? (
                  'Sending Link...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reset Link
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
