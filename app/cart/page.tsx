/**
 * @file This file defines the main Shopping Cart page for the application.
 * It's a client component that displays the items in the user's cart and provides
 * a summary for checkout.
 */

"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useCart } from "@/context/CartContext";
import { CartItemCard } from "@/components/cart/CartItemCard";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, ShoppingBag } from "lucide-react";

/**
 * The main component for the `/cart` route. It orchestrates the display of
 * the cart's contents, handles loading and empty states, and integrates the
 * checkout summary.
 */
export default function CartPage() {
  // Retrieves cart state and actions from the global CartContext.
  const { cartItems, clearCart, isLoading } = useCart();

  /**
   * Renders a page-level loading indicator while the cart data is being
   * initialized or synchronized with the backend. This provides a clear
   * user feedback during async operations.
   */
  if (isLoading) {
    // TODO: For an improved perceived performance, consider replacing this full-page loader
    // with skeleton loaders that mimic the layout of the cart items and summary card.
    return (
      <MainLayout>
        <div className="container mx-auto flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-center">Your Shopping Cart</h1>
        </header>

        {/* Conditionally renders the UI based on whether the cart has items. */}
        {cartItems.length === 0 ? (
          // Renders a user-friendly message and a call-to-action when the cart is empty.
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
            <p className="text-2xl font-semibold text-muted-foreground mb-4">
              Your cart is empty.
            </p>
            <p className="text-foreground/70 mb-8">
              Looks like you haven't added any books yet. Start exploring!
            </p>
            {/* TODO: Centralize application routes like '/shop' into a shared constants file. */}
            <Button asChild size="lg" className="rounded-lg shadow-md">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          // Renders the main two-column layout for a non-empty cart.
          <div className="grid lg:grid-cols-3 gap-8 md:gap-12 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* Maps over the cart items and renders a card for each one. */}
              {cartItems.map((item) => (
                <CartItemCard key={item._id} item={item} />
              ))}
              <div className="mt-6 flex justify-end">
                {/* TODO: Implement a confirmation dialog for the "Clear Cart" button
                to prevent accidental clearing of the entire cart. */}
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="rounded-lg"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
            {/* The right column contains the order summary and checkout functionality. */}
            <div className="lg:col-span-1">
              <CartSummary />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
