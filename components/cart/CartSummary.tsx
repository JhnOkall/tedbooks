"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { Loader2 } from "lucide-react";
import { PayHeroButton } from "@/components/checkout/PayHeroButton";

export function CartSummary() {
  const { totalPrice, totalItems, cartItems, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [isCheckoutInitiated, setIsCheckoutInitiated] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{
    id: string;
    customId: string;
  } | null>(null);

  const handleInitiateCheckout = async () => {
    if (!session?.user) {
      toast.error("Please sign in to proceed to checkout.");
      router.push("/api/auth/signin?callbackUrl=/cart");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsProcessingOrder(true);
    toast.loading("Preparing your order...");

    try {
      // Step 1: Create a PENDING order in our database
      const orderPayload = {
        items: cartItems.map((item) => ({
          bookId: item._id,
          quantity: item.quantity,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) throw new Error("Could not create an order.");

      const newPendingOrder = await res.json();
      setPendingOrder({
        id: newPendingOrder._id,
        customId: newPendingOrder.customId,
      });

      // Step 2: Now that order exists, show the payment button
      setIsCheckoutInitiated(true);
      toast.dismiss();
    } catch (error: any) {
      toast.error("Checkout Failed", { description: error.message });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handlePaymentSuccess = () => {
    // The webhook will handle the order update. We just need to give the user feedback and redirect.
    toast.loading("Payment received! Finalizing your order...");
    // Clear the cart on the client-side immediately
    clearCart();

    // Redirect to the success page using the PENDING order ID.
    // The page will poll or wait for the webhook to update the status.
    router.push(`/order/success?orderId=${pendingOrder?.id}`);
  };

  const handlePaymentFailure = () => {
    toast.error("Payment Failed", {
      description: "Your payment could not be processed. Please try again.",
    });
    // User can retry payment without creating a new order.
  };

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            Subtotal ({totalItems} items)
          </span>
          <span className="font-semibold">Ksh. {totalPrice.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total</span>
          <span>Ksh. {totalPrice.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter>
        {!isCheckoutInitiated ? (
          <Button
            size="lg"
            className="w-full rounded-xl text-lg shadow-md"
            onClick={handleInitiateCheckout}
            disabled={cartItems.length === 0 || isProcessingOrder}
          >
            {isProcessingOrder ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : null}
            Proceed to Checkout
          </Button>
        ) : (
          <div className="w-full space-y-4">
            <PayHeroButton
              amount={totalPrice}
              reference={pendingOrder!.customId} // Use the REAL customId from the pending order
              onSuccess={handlePaymentSuccess}
              onFailure={handlePaymentFailure}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsCheckoutInitiated(false)}
            >
              Cancel Payment
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
