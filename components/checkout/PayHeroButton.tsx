"use client";

interface Window {
  PayHero: {
    init: (config: any) => void;
  };
}

declare const PayHero: Window["PayHero"];

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface PayHeroButtonProps {
  amount: number;
  reference: string;
  onSuccess: (data: any) => void;
  onFailure: (data: any) => void;
}

export function PayHeroButton({
  amount,
  reference,
  onSuccess,
  onFailure,
}: PayHeroButtonProps) {
  const { data: session } = useSession();
  const sdkLoaded = useRef(false);

  const handleScriptLoad = () => {
    if (sdkLoaded.current || typeof PayHero === "undefined") return;

    sdkLoaded.current = true;

    PayHero.init({
      paymentUrl: process.env.NEXT_PUBLIC_PAYHERO_LIPWA_URL!,
      containerId: "payHeroContainer",
      channelID: parseInt(process.env.NEXT_PUBLIC_PAYHERO_CHANNEL_ID!, 10),
      amount: amount,
      phone: session?.user?.phone || "",
      name: session?.user?.name || "Valued Customer",
      reference: reference,
      buttonName: `Pay Now KES ${amount.toFixed(2)}`,
      buttonColor: process.env.NEXT_PUBLIC_PAYHERO_BUTTON_COLOR!,
      width: "100%",
      height: "48px",
      // We will handle redirection manually after creating our own order
      successUrl: null,
      failedUrl: null,
      // This URL is for server-to-server confirmation (webhook)
      callbackUrl: `${window.location.origin}/api/webhooks/payhero`,
    });
  };

  useEffect(() => {
    const handlePaymentMessage = (event: MessageEvent) => {
      // Ensure the event is from a trusted source if possible
      if (event.data.paymentSuccess) {
        onSuccess(event.data);
      } else if (event.data.paymentSuccess === false) {
        onFailure(event.data);
      }
    };

    window.addEventListener("message", handlePaymentMessage);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("message", handlePaymentMessage);
    };
  }, [onSuccess, onFailure]);

  return (
    <>
      <Script
        src="https://applet.payherokenya.com/cdn/button_sdk.js?v=3.1"
        onLoad={handleScriptLoad}
        strategy="lazyOnload"
      />
      {/* The container where the button will be injected */}
      <div id="payHeroContainer">
        <div className="h-12 flex items-center justify-center bg-gray-200 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    </>
  );
}
