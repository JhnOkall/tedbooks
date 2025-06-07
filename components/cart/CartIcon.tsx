"use client";

import Link from "next/link";
import { Loader2, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export function CartIcon() {
  // isLoading is now available from our upgraded context
  const { totalItems, isLoading } = useCart();

  // If the cart is fetching from the DB, show a subtle loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-9 h-9">
        <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Button asChild variant="ghost" size="icon" className="relative w-9 h-9">
      <Link href="/cart">
        <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-in fade-in-0 zoom-in-75">
            {totalItems}
          </span>
        )}
        <span className="sr-only">View shopping cart</span>
      </Link>
    </Button>
  );
}
