/**
 * @file Defines the Footer component for the application.
 * This component appears at the bottom of every page and contains copyright information
 * and links to important legal pages.
 */

import Link from "next/link"; // Import Link for client-side navigation
import { JSX } from "react";

export function Footer(): JSX.Element {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-muted-foreground">
          {/* Dynamically gets the current year for the copyright notice. */}©{" "}
          {new Date().getFullYear()} TedBooks. All rights reserved.
        </p>
        {/* TODO: The "Crafted by" message is a personal attribution. For a production
        application, this should be removed or made configurable. */}
        <p className="text-xs text-muted-foreground mt-1">
          Crafted for book lovers.
        </p>
        <div className="mt-2 flex justify-center space-x-4 text-xs text-muted-foreground">
          {/* TODO: Use the Next.js Link component for internal navigation to enable
          client-side routing and improve performance. Also, centralize route paths
          (e.g., '/privacy-policy') in a constants file. */}
          <Link href="/privacy-policy" className="hover:underline">
            Privacy Policy
          </Link>
          <span>|</span>
          <Link href="/terms-and-conditions" className="hover:underline">
            Terms and Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
