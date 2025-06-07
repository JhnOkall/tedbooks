/**
 * @file This file defines the server component for the order success page.
 * It uses a Suspense boundary to provide an elegant loading state while the
 * client-side content fetches and renders the order details.
 */

import { JSX, Suspense } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { OrderSuccessContent } from "@/components/order/OrderSuccessContent";
import { Loader2 } from "lucide-react";

/**
 * A React Server Component that acts as the entry point for the order success page.
 * Its primary responsibility is to set up the page layout and manage the loading state
 * for its dynamic, client-side child component.
 *
 * @returns {JSX.Element} The rendered order success page with a Suspense boundary.
 */
export default function OrderSuccessPage(): JSX.Element {
  return (
    <MainLayout>
      {/*
        The Suspense boundary is used here to handle the initial loading state of the
        `OrderSuccessContent` client component. `OrderSuccessContent` fetches order data
        on the client, and this boundary ensures a fallback UI is shown until that
        data fetching is complete, preventing a blank screen.
      */}
      <Suspense fallback={<LoadingSpinner />}>
        <OrderSuccessContent />
      </Suspense>
    </MainLayout>
  );
}

/**
 * A simple, reusable component that displays a loading spinner.
 * It serves as the fallback UI for the Suspense boundary on this page.
 *
 * @returns {JSX.Element} The rendered loading spinner.
 */
function LoadingSpinner(): JSX.Element {
  // TODO: If this loading spinner style is used in multiple places, consider moving it
  // to a shared components directory (e.g., `components/ui/spinner.tsx`) to promote reusability.
  return (
    <div className="container mx-auto flex justify-center items-center py-20">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
