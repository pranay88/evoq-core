import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { formatDate } from '@/lib/utils';
import InvitationForm from '@/components/onboarding/invitation-form';
import CopyLinkButton from '@/components/onboarding/copy-link-button';
import { Link2, Mail, Phone, Calendar, User, Eye } from 'lucide-react';

export default async function InvitationsPage() {
  const session = await getSession();

  // Fetch all invitations
  const invitations = await db.employeeInvitation.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      createdBy: {
        select: { name: true },
      },
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EXPIRED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Self-Onboarding Links</h1>
        <p className="text-sm text-muted-foreground font-sans">
          Generate secure, token-based registration links for new hires to self-onboard without an internal account.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generate Invitation Form */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-4 sticky top-20">
            <h2 className="text-md font-serif font-bold text-foreground pb-2 border-b border-border/60">Generate Link</h2>
            <InvitationForm />
          </div>
        </div>

        {/* Invitations Listing Table */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-secondary/10">
              <h2 className="text-md font-serif font-bold text-foreground">Sent Invitation Logs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-5 py-3">Candidate Email</th>
                    <th className="px-5 py-3">Generated Date</th>
                    <th className="px-5 py-3">Expiry Date</th>
                    <th className="px-5 py-3">Created By</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Copy Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                        No onboarding invitations sent yet.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-5 py-4 font-semibold text-foreground">
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-primary" /> {inv.email}</span>
                            {inv.phone && <span className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1"><Phone className="w-3 h-3 text-primary" /> {inv.phone}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{formatDate(inv.createdAt)}</td>
                        <td className="px-5 py-4 text-muted-foreground">{formatDate(inv.expiresAt)}</td>
                        <td className="px-5 py-4 text-muted-foreground">{inv.createdBy?.name}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadge(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {inv.status === 'PENDING' && (
                            <CopyLinkButton token={inv.token} />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
