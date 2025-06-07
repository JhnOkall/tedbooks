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
import { useSearchParams, useRouter } from "next/navigation";

const GoogleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
    className="mr-2"
  >
    <path
      d="M17.64 9.20455C17.64 8.56625 17.5827 7.95239 17.4764 7.36364H9V10.8451H13.8436C13.635 11.9701 13.0009 12.9233 12.0477 13.5617V15.8196H14.9564C16.6582 14.2528 17.64 11.9455 17.64 9.20455Z"
      fill="#4285F4"
    />
    <path
      d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5616C11.2418 14.1016 10.2109 14.4204 9 14.4204C6.66 14.4204 4.69818 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
      fill="#34A853"
    />
    <path
      d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29H0.957275C0.347727 8.55 0 10.0318 0 11.29C0 12.5482 0.347727 14.0299 0.957275 15.29L3.96409 12.9582V10.71Z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34545C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.69818 5.16273 6.66 3.57955 9 3.57955Z"
      fill="#EA4335"
    />
  </svg>
);

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (error) {
      // Display a toast or message for specific errors if needed
      // For now, we'll rely on the default error handling
      console.error("Sign-in error:", error);
      // Optionally, redirect to a generic error page or display inline
    }
  }, [error]);

  const handleSignIn = async () => {
    // The callbackUrl will be handled by NextAuth to redirect after successful sign-in
    const result = await signIn("google", { callbackUrl, redirect: false });
    if (result?.error) {
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-2xl rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">
              Welcome to TedBooks
            </CardTitle>
            <CardDescription className="pt-2">
              Sign in to continue to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/10 p-3 rounded-md text-center">
                <p className="text-sm text-destructive font-medium">
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
              <GoogleIcon />
              Continue with Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col items-center text-center text-xs text-muted-foreground pt-6">
            <p>
              By continuing, you acknowledge that you have read and agree to our
            </p>
            <p>
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
