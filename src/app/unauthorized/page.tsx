import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md text-center p-8 bg-card rounded-lg shadow-sm border border-border">
        <h1 className="text-4xl font-serif text-foreground mb-4">Access Denied</h1>
        <p className="text-muted-foreground font-sans mb-8">
          You do not have the required permissions to view this page. If you believe this is an error, please contact your system administrator.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-sans rounded-md transition-colors shadow-sm"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
