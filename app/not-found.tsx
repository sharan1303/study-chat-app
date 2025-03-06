import { Suspense } from "react";
import Link from "next/link";

// Fallback component while loading
function NotFoundFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Loading...</h1>
    </div>
  );
}

// Actual NotFound content
function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-xl mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}

// Main NotFound component with Suspense
export default function NotFound() {
  return (
    <Suspense fallback={<NotFoundFallback />}>
      <NotFoundContent />
    </Suspense>
  );
}
