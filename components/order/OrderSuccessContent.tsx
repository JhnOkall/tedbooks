/**
 * @file Defines the `OrderSuccessContent` component for the order confirmation page.
 * This component fetches order details, clears the cart, and provides secure, server-generated
 * download links for purchased digital items.
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
import { CheckCircle, Download, Loader2, ShoppingBag } from "lucide-react";
import type { Order, OrderItem } from "@/types";
import { useCart } from "@/context/CartContext";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

/**
 * Renders the content for the order success/confirmation page.
 * It manages three states: loading, order not found (or error), and order found.
 */
export function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  // State to track the download progress for a specific book ID.
  const [downloading, setDownloading] = useState<string | null>(null);

  const paymentRef = searchParams.get("ref");

  /**
   * Effect hook to fetch the order details from the API when the component mounts.
   */
  useEffect(() => {
    if (!paymentRef) {
      setOrder(null);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const res = await fetch(`/api/orders/by-ref/${paymentRef}`);
        if (!res.ok) {
          throw new Error("Order not found or access denied.");
        }
        const data: Order = await res.json();
        setOrder(data);
        clearCart();
      } catch (error) {
        console.error("Failed to fetch order:", error);
        setOrder(null);
      }
    };

    fetchOrderDetails();
  }, [paymentRef, clearCart]);

  /**
   * Handles the secure download process for a purchased item.
   * @param bookId The ID of the book to download.
   * @param bookTitle The title of the book, used for user feedback.
   */
  const handleDownload = async (bookId: string, bookTitle: string) => {
    if (downloading || !order) return; // Prevent multiple clicks or clicks before order loads

    setDownloading(bookId);
    const loadingToast = toast.loading(
      `Preparing download for "${bookTitle}"...`
    );

    try {
      const res = await fetch(`/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id, bookId: bookId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Could not get download link.");
      }

      const { url } = await res.json();

      // Open the signed URL in a new tab to initiate the download.
      // Using window.open is often better for this than window.location.href.
      window.open(url, "_blank");

      toast.dismiss(loadingToast);
      toast.success("Your download is starting!");
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Download Failed", { description: error.message });
    } finally {
      setDownloading(null); // Reset the loading state
    }
  };

  // Render loading state
  if (order === undefined) {
    return <p className="text-center py-20">Loading order details...</p>;
  }

  // Render error/not-found state
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
          <Button asChild size="lg" className="rounded-lg shadow-md">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // NOTE: We no longer need to filter by `downloadUrl` on the client, as the server
  // will handle the logic of whether a book is downloadable.
  const downloadableItems = order.items;

  // Render the successful order confirmation view
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

                    {/* --- SECURE DOWNLOAD BUTTON --- */}
                    <Button
                      size="sm"
                      className="rounded-lg w-[120px]" // Set a fixed width to prevent layout shift
                      onClick={() => handleDownload(item.bookId, item.title)}
                      disabled={downloading === item.bookId}
                    >
                      {downloading === item.bookId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      )}
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
