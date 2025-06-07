/**
 * @file Defines a custom 404 "Not Found" page for the application.
 * This component is automatically rendered by Next.js when a user navigates to a
 * route that does not exist.
 */

import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import { JSX } from "react";

/**
 * A server component that provides a user-friendly interface for 404 errors.
 *
 * @returns {JSX.Element} The rendered 404 page.
 */
export default function NotFound(): JSX.Element {
  // TODO: The static text content on this page could be managed through a headless CMS
  // or a localization file (i18n) to allow for easier updates by non-developers.
  return (
    <MainLayout>
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4 py-16">
        <FileQuestion className="h-24 w-24 text-primary mb-8" />
        <h1 className="text-5xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-md">
          Oops! The page you are looking for does not exist. It might have been
          moved or deleted.
        </p>
        <Button asChild size="lg" className="rounded-lg shadow-md">
          {/* TODO: Centralize application routes like '/' into a shared constants file
          to improve maintainability and prevent magic strings. */}
          <Link href="/">Go Back to Homepage</Link>
        </Button>
      </div>
    </MainLayout>
  );
}
