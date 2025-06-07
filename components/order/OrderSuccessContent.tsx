"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Download, ShoppingBag } from "lucide-react";
import type { Order, OrderItem } from "@/types";
import { useCart } from "@/context/CartContext";
import { Separator } from "@/components/ui/separator";

export function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // If no orderId is present in the URL, set state to not found.
    if (!orderId) {
      setOrder(null);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);

        // If API returns not-ok (e.g., 404, 403), treat as not found.
        if (!res.ok) {
          throw new Error("Order not found or access denied.");
        }

        const data: Order = await res.json();
        setOrder(data);

        // IMPORTANT: Clear the cart only after successfully fetching the order.
        clearCart();
      } catch (error) {
        console.error("Failed to fetch order:", error);
        setOrder(null); // Set to not found on any error
      }
    };

    fetchOrderDetails();
  }, [orderId, clearCart]);

  // Initial loading state
  if (order === undefined) {
    // The Suspense fallback will handle this, but as a backup:
    return <p className="text-center py-20">Loading order details...</p>;
  }

  // Order not found state
  if (!order) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 text-center">
        <Card className="max-w-lg mx-auto rounded-2xl shadow-xl p-8">
          <ShoppingBag className="mx-auto h-20 w-20 text-destructive mb-6" />
          <h1 className="text-3xl font-headline font-bold mb-4">
            Order Not Found
          </h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find the details for this order. It might be invalid, or
            you may not have permission to view it.
          </p>
          <Button asChild size="lg" className="rounded-xl shadow-md">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Order found successfully state
  // We check for download URLs. In a real app, these might be added later.
  const downloadableItems = order.items.filter((item) => item.downloadUrl);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Card className="max-w-2xl mx-auto rounded-2xl shadow-xl text-center">
        <CardHeader className="pt-8">
          <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-4 animate-in fade-in zoom-in-75" />
          <CardTitle className="text-3xl md:text-4xl font-headline">
            Thank You For Your Order!
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Your order{" "}
            <span className="font-semibold text-primary">{order.customId}</span>{" "}
            has been placed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6 md:px-10">
          {/* This download section remains the same, it will work if downloadUrl is present */}
          {downloadableItems.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Your Downloads</h3>
              <ul className="space-y-4 text-left">
                {downloadableItems.map((item: OrderItem) => (
                  <li
                    key={item._id} // Use the unique order item ID
                    className="flex items-center justify-between p-3 border rounded-lg shadow-sm bg-background"
                  >
                    <div className="flex items-center space-x-3">
                      <Image
                        src={item.coverImage}
                        alt={item.title}
                        width={50}
                        height={75}
                        className="rounded object-cover aspect-[2/3]"
                      />
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          by {item.author}
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" className="rounded-lg">
                      <Link
                        href={item.downloadUrl || "#"}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Separator className="my-6" />
          <p className="text-sm text-muted-foreground">
            You will receive an email confirmation shortly. You can also view
            your order details in your account.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 pb-6">
            <Button asChild size="lg" className="rounded-xl shadow-md">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link href="/account/orders">View My Orders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
