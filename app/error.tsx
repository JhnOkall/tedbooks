/**
 * @file Defines a global error boundary for the application using the Next.js
 * `error.js` file convention. This component must be a client component.
 * It catches unhandled runtime errors in its child segments and provides a UI
 * for the user to recover or navigate away.
 */

"use client";

import { JSX, useEffect } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * A client component that serves as an error boundary.
 *
 * @param {object} props - The props provided by Next.js to the error boundary.
 * @param {Error & { digest?: string }} props.error - The error object that was caught.
 * @param {() => void} props.reset - A function to re-render the component tree within the boundary, attempting a recovery.
 * @returns {JSX.Element} The rendered error page UI.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  /**
   * Effect hook to log the captured error. In a production environment, this
   * is where you would integrate with an error reporting service.
   */
  useEffect(() => {
    // TODO: [Production] Replace `console.error` with a dedicated error reporting service
    // like Sentry, LogRocket, or Axiom to effectively track and debug production errors.
    console.error(error);
  }, [error]);

  return (
    <MainLayout>
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4 py-16">
        <AlertTriangle className="h-24 w-24 text-destructive mb-8" />
        <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-lg">
          We're sorry, but an unexpected error occurred. You can try to refresh
          the page or go back to the homepage.
        </p>

        {/* The error digest is a hash of the error, useful for matching server-side logs. */}
        {error?.digest && (
          <p className="text-sm text-muted-foreground mb-8">
            Error Digest: {error.digest}
          </p>
        )}
        <div className="flex gap-4">
          <Button
            onClick={
              // Attempts to recover by re-rendering the segment where the error occurred.
              () => reset()
            }
            size="lg"
            variant="outline"
            className="rounded-lg"
          >
            Try Again
          </Button>
          <Button asChild size="lg" className="rounded-lg shadow-md">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
