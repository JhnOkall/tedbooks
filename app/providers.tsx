"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/context/CartContext";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
