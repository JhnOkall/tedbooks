/**
 * @file Defines the CartIcon component, a UI element typically used in the site
 * header to provide a visual indicator of the shopping cart's status and a link
 * to the cart page.
 */

"use client";

import Link from "next/link";
import { Loader2, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { JSX } from "react";

/**
 * Renders a shopping cart icon that displays the total number of items in the cart.
 * It shows a loading state during initial cart data synchronization and links to the main cart page.
 *
 * @returns {JSX.Element} The rendered cart icon component.
 */
export function CartIcon(): JSX.Element {
  // Retrieves cart state, including the total item count and the loading status, from the global CartContext.
  const { totalItems, isLoading } = useCart();

  // While the cart data is being initialized (e.g., fetching from the database on login),
  // display a loading spinner to provide visual feedback to the user.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-9 h-9">
        <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin text-muted-foreground" />
      </div>
    );
  }

  // TODO: For larger applications, centralize route paths like '/cart' into a
  // constants file to improve maintainability and avoid magic strings.

  return (
    <Button asChild variant="ghost" size="icon" className="relative w-9 h-9">
      <Link href="/cart">
        <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
        {/* Conditionally render a badge with the item count only if the cart is not empty. */}
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-in fade-in-0 zoom-in-75">
            {totalItems}
          </span>
        )}
        {/* Accessibility: Provides a descriptive label for screen readers. */}
        <span className="sr-only">View shopping cart</span>
      </Link>
    </Button>
  );
}
