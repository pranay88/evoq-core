'use client';

import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

interface CopyLinkButtonProps {
  token: string;
}

export default function CopyLinkButton({ token }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/onboard/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary hover:text-primary rounded-md shadow-sm transition-colors cursor-pointer select-none"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Link2 className="w-3.5 h-3.5 text-primary" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
