/**
 * @file This file defines the main Sign-In page for the application.
 * It provides a user-friendly interface for authentication, primarily using
 * a social provider (Google), and handles potential sign-in errors.
 */

"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * The main component for the sign-in page. It handles displaying sign-in options
 * and processing error messages returned by NextAuth.
 */
export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  /**
   * Effect hook to log any sign-in errors passed in the URL.
   * This is useful for debugging authentication issues.
   */
  useEffect(() => {
    if (error) {
      // TODO: [UX] Instead of just logging, use a toast notification library (like sonner)
      // to display a user-friendly, non-blocking error message.
      console.error("NextAuth Sign-in Error:", error);
    }
  }, [error]);

  /**
   * Initiates the sign-in process with the specified provider ('google').
   * It passes the `callbackUrl` to NextAuth, which will redirect the user
   * to their intended destination upon successful authentication.
   */
  const handleSignIn = async () => {
    await signIn("google", { callbackUrl });
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-2xl rounded-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Welcome to TedBooks</CardTitle>
            <CardDescription className="pt-2">
              Sign in to continue to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Conditionally renders an error message box if a sign-in error is detected. */}
            {error && (
              <div className="bg-destructive/10 p-3 rounded-md text-center">
                <p className="text-sm text-destructive font-medium">
                  {/* Provides a more user-friendly message for common NextAuth errors. */}
                  {/* TODO: Expand this mapping to handle other potential NextAuth error codes for a better user experience. */}
                  {error === "OAuthAccountNotLinked"
                    ? "This email is already associated with another account. Please sign in with the original method."
                    : "An error occurred during sign-in. Please try again."}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full h-12 text-base rounded-lg border-2 hover:bg-accent/50"
              onClick={handleSignIn}
            >
              Continue with Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col items-center text-center text-xs text-muted-foreground pt-6">
            <p>
              By continuing, you acknowledge that you have read and agree to our
            </p>
            <p>
              {/* TODO: Centralize application routes like '/privacy-policy' into a shared constants file to improve maintainability. */}
              <Link
                href="/privacy-policy"
                className="underline hover:text-primary"
              >
                Privacy Policy
              </Link>
              {" and "}
              <Link
                href="/terms-and-conditions"
                className="underline hover:text-primary"
              >
                Terms & Conditions
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
