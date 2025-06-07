"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useCart } from "@/context/CartContext";
import { CartItemCard } from "@/components/cart/CartItemCard";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, ShoppingBag } from "lucide-react";

export default function CartPage() {
  // Destructure isLoading from the context
  const { cartItems, clearCart, isLoading } = useCart();

  // Show a loading spinner for the whole page content area
  if (isLoading) {
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
          <h1 className="text-4xl font-headline font-bold text-center">
            Your Shopping Cart
          </h1>
        </header>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
            <p className="text-2xl font-semibold text-muted-foreground mb-4">
              Your cart is empty.
            </p>
            <p className="text-foreground/70 mb-8">
              Looks like you haven't added any books yet. Start exploring!
            </p>
            <Button asChild size="lg" className="rounded-xl shadow-md">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 md:gap-12 items-start">
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <CartItemCard key={item._id} item={item} />
              ))}
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="rounded-xl"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
            <div className="lg:col-span-1">
              <CartSummary />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
