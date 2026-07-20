'use client';

import { useState, useActionState, useEffect } from 'react';
import { generateInvitationAction } from '@/app/actions/onboarding';
import { Send, Loader2, Link2, Copy, CheckCircle2 } from 'lucide-react';

const initialState = {
  success: false,
  message: '',
  token: '',
};

export default function InvitationForm() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, formAction, isPending] = useActionState(
    (async (prevState: any, formData: FormData) => {
      const emailVal = formData.get('email') as string;
      const phoneVal = formData.get('phone') as string;
      return generateInvitationAction(emailVal, phoneVal);
    }) as any,
    initialState
  );

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state.success) {
      setEmail('');
      setPhone('');
    }
  }, [state.success]);

  const getFullOnboardingUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/onboard/${state.token}`;
  };

  const copyToClipboard = () => {
    const url = getFullOnboardingUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 font-sans text-sm">
      {state.message && !state.success && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs">
          {state.message}
        </div>
      )}

      {state.success && state.token ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md space-y-3">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Link Generated Successfully!
          </div>
          <p className="text-xs text-muted-foreground leading-normal">
            Copy and send this secure registration URL to the candidate. They can open this link on mobile or desktop to fill out their details.
          </p>
          <div className="flex items-center bg-background border border-border rounded p-2 gap-2 mt-2">
            <input
              type="text"
              readOnly
              value={getFullOnboardingUrl()}
              className="flex-1 bg-transparent text-xs text-foreground font-mono focus:outline-none select-all truncate"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className="p-1 hover:bg-secondary rounded text-primary"
              title="Copy link"
            >
              {copied ? (
                <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-semibold font-sans">Copied!</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
            Candidate Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-sm"
            placeholder="candidate@email.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
            Candidate Phone (Optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-sm"
            placeholder="e.g. +91 9988776655"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50 text-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating Link...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Generate Invitation
            </>
          )}
        </button>
      </form>
    </div>
  );
}
