/**
 * @file Defines the `Providers` component, a client-side wrapper that composes
 * all global context providers for the application. This pattern centralizes
 * provider logic and keeps the root layout clean.
 */

"use client";

import type { JSX, ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/context/CartContext";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";

/**
 * A client component that wraps the entire application with necessary context providers.
 * This makes global state and functionality—such as session management, theme switching,
 * and shopping cart state—available to all child components.
 *
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components to be wrapped, typically the application's root layout content.
 * @returns {JSX.Element} The composed providers wrapping the children.
 */
export function Providers({ children }: { children: ReactNode }): JSX.Element {
  return (
    // Provides authentication and session state (e.g., user data) from NextAuth.js.
    // It should be placed at a high level in the component tree.
    <SessionProvider>
      {/*
        Manages the application's color theme (light, dark, system).
        - `attribute="class"` enables theme switching by adding a 'dark' class to the <html> element.
        - `defaultTheme="system"` sets the initial theme based on the user's OS preference.
        - `enableSystem` allows the "system" theme option to work correctly.
      */}
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {/*
          Custom context provider for managing the application-wide shopping cart state and actions.
          It is placed inside the SessionProvider to potentially access session data.
        */}
        <CartProvider>
          {children}
          {/* Renders toast notifications. It is placed here to be accessible from anywhere in the app. */}
          {/* TODO: Consider customizing the Toaster's position or style here if a non-default appearance is desired globally. */}
          <Toaster />
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
