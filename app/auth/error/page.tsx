/**
 * @file This file defines a custom, user-friendly error page for handling
 * authentication failures within the NextAuth.js flow.
 */

"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { JSX } from "react";

/**
 * A client component that displays a specific error message based on the `error`
 * query parameter provided by NextAuth.js upon a failed authentication attempt.
 *
 * @returns {JSX.Element} The rendered authentication error page.
 */
export default function AuthErrorPage(): JSX.Element {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Default error messages for unhandled or generic errors.
  let errorMessage = "An unexpected error occurred during authentication.";
  let errorDescription =
    "Please try signing in again. If the problem persists, contact support.";

  /**
   * Maps common NextAuth.js error codes to more descriptive, user-friendly messages.
   * This provides better context to the user than showing a generic failure message.
   * @see https://next-auth.js.org/configuration/pages#error-page
   */
  // TODO: Add more specific error cases as needed based on the authentication providers used.
  switch (error) {
    case "Configuration":
      errorMessage = "Server Configuration Error";
      errorDescription =
        "There is an issue with the server configuration. Please contact support.";
      break;
    case "AccessDenied":
      errorMessage = "Access Denied";
      errorDescription =
        "You do not have permission to sign in or access this resource.";
      break;
    case "Verification":
      errorMessage = "Verification Token Error";
      errorDescription =
        "The sign-in link is invalid or has expired. Please try signing in again.";
      break;
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "EmailCreateAccount":
    case "Callback":
    case "OAuthAccountNotLinked":
      errorMessage = "Authentication Failed";
      errorDescription =
        "Could not sign you in. If you've signed in with this email using a different method before, please use that method. Otherwise, try again or contact support.";
      // Provide a more specific description for a common OAuth linking issue.
      if (error === "OAuthAccountNotLinked") {
        errorDescription =
          "This email is already linked with another provider. Please sign in using the original method you used for this email.";
      }
      break;
    case "EmailSignin":
      errorMessage = "Email Sign-In Error";
      errorDescription =
        "Could not send the sign-in email. Please check the email address and try again.";
      break;
    default:
      // If an error code is present but not explicitly handled, display it for debugging purposes.
      if (error) {
        errorMessage = `Error: ${error}`;
      }
      break;
  }

  return (
    <MainLayout>
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4">
        <Card className="w-full max-w-md text-center shadow-lg rounded-lg">
          <CardHeader>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">{errorMessage}</CardTitle>
            <CardDescription className="pt-2">
              {errorDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* TODO: Centralize application routes like '/auth/signin' and '/' into a shared constants file. */}
            <Button asChild className="w-full rounded-lg">
              <Link href="/auth">Try Sign In Again</Link>
            </Button>
            <Button variant="link" asChild className="mt-2">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
