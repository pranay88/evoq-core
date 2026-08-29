
'use client';

import { useState } from 'react';
import { Link2, Check, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { sendOnboardingEmail } from '@/app/actions/email';

interface CopyLinkButtonProps {
  token: string;
  email: string;
  phone?: string;
}

export default function CopyLinkButton({ token, email, phone }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  const getUrl = () => typeof window !== 'undefined' ? `${window.location.origin}/onboard/${token}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(getUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmail = async () => {
    setIsSending(true);
    const res = await sendOnboardingEmail(email, getUrl());
    setEmailStatus(res.success ? 'success' : 'error');
    setIsSending(false);
    setTimeout(() => setEmailStatus(''), 2000);
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* Email Button */}
      <button
        onClick={handleEmail}
        disabled={isSending}
        title="Send via Email"
        className="inline-flex items-center justify-center w-7 h-7 border border-border bg-card text-foreground hover:bg-secondary hover:text-primary rounded shadow-sm transition-colors disabled:opacity-50"
      >
        {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
          emailStatus === 'success' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Mail className="w-3.5 h-3.5" />
        )}
      </button>

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${(phone || '').replace(/[^0-9]/g, '')}?text=Hi%2C%20welcome%20to%20House%20of%20Evoq%21%20Please%20complete%20your%20onboarding%20registration%20using%20this%20secure%20link%3A%20${encodeURIComponent(getUrl())}`}
        target="_blank"
        rel="noreferrer"
        title="Send via WhatsApp"
        className="inline-flex items-center justify-center w-7 h-7 border border-[#25D366]/30 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 rounded shadow-sm transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </a>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        type="button"
        title="Copy Link"
        className="inline-flex items-center justify-center w-7 h-7 border border-border bg-card text-foreground hover:bg-secondary hover:text-primary rounded shadow-sm transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5 text-primary" />}
      </button>
    </div>
  );
}
