import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md text-center p-8 bg-card rounded-lg shadow-sm border border-border">
        <h1 className="text-4xl font-serif text-foreground mb-4">404 — Page Not Found</h1>
        <p className="text-muted-foreground font-sans mb-8">
          The page you are looking for does not exist or has been moved.
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
