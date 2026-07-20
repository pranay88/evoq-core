import { db } from '@/lib/db';
import OnboardForm from '@/components/onboarding/onboard-form';
import { ShieldCheck, HelpCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface OnboardPageProps {
  params: Promise<{ token: string }>;
}

export default async function OnboardPage({ params }: OnboardPageProps) {
  const { token } = await params;

  // Retrieve invitation details
  const invitation = await db.employeeInvitation.findUnique({
    where: { token },
  });

  const now = new Date();

  // Validate invitation token
  const isInvalid = !invitation;
  const isExpired = invitation && (invitation.status === 'EXPIRED' || now > invitation.expiresAt);
  const isAlreadySubmitted = invitation && invitation.status === 'SUBMITTED';

  if (isInvalid || isExpired || isAlreadySubmitted) {
    let errorTitle = 'Link Invalid';
    let errorDesc = 'This self-onboarding link is invalid or does not match any active invitations.';

    if (isAlreadySubmitted) {
      errorTitle = 'Onboarding Completed';
      errorDesc = 'Your onboarding details have already been submitted successfully. This single-use link is now inactive.';
    } else if (isExpired) {
      errorTitle = 'Link Expired';
      errorDesc = 'This self-onboarding invitation link has expired. Registration links are valid for 7 days. Please contact HR to request a new link.';
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12 font-sans">
        <div className="w-full max-w-md text-center p-8 bg-card rounded-lg shadow-sm border border-border">
          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-serif text-foreground mb-4">{errorTitle}</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {errorDesc}
          </p>
          <div className="text-xs text-muted-foreground/60 border-t border-border pt-4">
            EVOQ Realtech Onboarding Network Gateway
          </div>
        </div>
      </div>
    );
  }

  // Safe to assert invitation is not null
  const inv = invitation!;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Public Header Branding */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-3 bg-[#1C1C1C] px-4 py-2 rounded select-none">
              <img src="/logo.png" alt="EVOQ Logo" className="h-8 w-auto object-contain" />
              <span className="font-serif text-md font-bold tracking-widest text-[#C5A880]">CORE</span>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-bold text-foreground">Employee Registration Gateway</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Onboarding Invitation: <strong className="text-foreground">{inv.email}</strong>
            </p>
          </div>
        </div>

        {/* Multi-step form wrapper */}
        <OnboardForm token={token} defaultEmail={inv.email} defaultPhone={inv.phone} />
      </div>

      <footer className="text-center text-xs text-muted-foreground/60 select-none mt-12">
        &copy; {new Date().getFullYear()} EVOQ Realtech. Secure Operations Network (EVOQ CORE).
      </footer>
    </div>
  );
}
