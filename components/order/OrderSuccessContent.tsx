/**
 * @file Defines the `OrderSuccessContent` component, which is responsible for displaying the
 * order confirmation page. This client component fetches order details based on an ID from
 * the URL, clears the user's cart, and provides download links for purchased items.
 */

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

/**
 * Renders the content for the order success/confirmation page.
 * It manages three states: loading, order not found (or error), and order found.
 */
export function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  /**
   * State to hold the order details. It uses a three-state approach:
   * - `undefined`: Initial loading state before the fetch completes.
   * - `null`: State indicating an error or that the order was not found.
   * - `Order`: State indicating a successful fetch with order data.
   */
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  const paymentRef = searchParams.get("ref");

  /**
   * Effect hook to fetch the order details from the API when the component mounts
   * or when the `paymentRef` in the URL changes.
   */
  useEffect(() => {
    // If there is no paymentRef in the URL, we can immediately determine the order is not found.
    if (!paymentRef) {
      setOrder(null);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const res = await fetch(`/api/orders/by-ref/${paymentRef}`);

        // If the API responds with a non-2xx status code (e.g., 404, 403),
        // we treat it as an error and assume the order cannot be displayed.
        if (!res.ok) {
          throw new Error("Order not found or access denied.");
        }

        const data: Order = await res.json();
        setOrder(data);

        // Crucial Side Effect: Clear the user's shopping cart only after
        // we have successfully confirmed and loaded their new order.
        clearCart();
      } catch (error) {
        // TODO: Implement a robust logging service (e.g., Sentry) to capture production errors.
        console.error("Failed to fetch order:", error);
        setOrder(null); // Transition to the "not found" state on any fetch failure.
      }
    };

    fetchOrderDetails();
  }, [paymentRef, clearCart]);

  // Render a loading state while the order data is being fetched.
  if (order === undefined) {
    // This state is typically handled by a <Suspense> boundary in Next.js,
    // but this provides a fallback.
    return <p className="text-center py-20">Loading order details...</p>;
  }

  // Render an error/not-found state if the order could not be loaded.
  if (!order) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 text-center">
        <Card className="max-w-lg mx-auto rounded-lg shadow-lg p-8">
          <ShoppingBag className="mx-auto h-20 w-20 text-destructive mb-6" />
          <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find the details for this order. It might be invalid, or
            you may not have permission to view it.
          </p>
          {/* TODO: Centralize application routes like '/shop' into a constants file. */}
          <Button asChild size="lg" className="rounded-lg shadow-md">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Filter for items that have a download URL to render the downloads section.
  const downloadableItems = order.items.filter((item) => item.downloadUrl);

  // Render the successful order confirmation view.
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Card className="max-w-2xl mx-auto rounded-lg shadow-lg text-center">
        <CardHeader className="pt-8">
          <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-4 animate-in fade-in zoom-in-75" />
          <CardTitle className="text-3xl md:text-4xl">
            Thank You For Your Order!
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Your order{" "}
            <span className="font-semibold text-primary">{order.customId}</span>{" "}
            has been placed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6 md:px-10">
          {/* Renders a list of purchased items with their download links. */}
          {downloadableItems.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Your Downloads</h3>
              <ul className="space-y-4 text-left">
                {downloadableItems.map((item: OrderItem) => (
                  <li
                    key={item._id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-background"
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
                    {/* TODO: Implement secure, time-limited download URLs. Storing and serving
                    static URLs is a security risk for digital products. The backend should
                    generate a temporary, signed URL upon request. */}
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
            <Button asChild size="lg" className="rounded-lg shadow-md">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-lg">
              <Link href="/account">View My Orders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
