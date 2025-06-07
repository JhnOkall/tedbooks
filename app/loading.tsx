/**
 * @file Defines the default loading UI for route segments.
 * In the Next.js App Router, this file automatically creates a Suspense boundary
 * that wraps the page, showing this component as a fallback while server components
 * are being fetched and rendered.
 */

import { MainLayout } from "@/components/layout/MainLayout";
import { Loader2 } from "lucide-react";
import { JSX } from "react";

/**
 * A server component that displays a loading spinner. This UI is shown to the user
 * during server-side data fetching and rendering for a route segment.
 *
 * @returns {JSX.Element} The rendered loading state component.
 */
export default function Loading(): JSX.Element {
  // TODO: For a more advanced user experience, replace this generic spinner with
  // a skeleton loader that mimics the layout of the page being loaded. This reduces
  // layout shift and improves perceived performance.
  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="text-center">
          <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
          <p className="text-xl font-semibold text-muted-foreground">
            Loading, please wait...
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
