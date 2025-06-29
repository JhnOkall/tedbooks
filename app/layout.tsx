/**
 * @file This file defines the root layout for the entire application.
 * It sets up the main HTML structure, includes global styles, and wraps all
 * pages with necessary context providers.
 */

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { JSX } from "react";

const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://tedbooks.vercel.app";

/**
 * Defines the default and Open Graph metadata for the application.
 * This metadata is used for SEO and social sharing, and is applied to all pages.
 * It can be overridden or extended by individual page metadata.
 */
export const metadata: Metadata = {
  // Use a template for dynamic page titles
  title: {
    template: "%s | TedBooks",
    default: "TedBooks - Discover Your Next Favourite Book",
  },
  description: "An elegant e-commerce experience for book lovers.",
  metadataBase: new URL(siteUrl),

  // --- Comprehensive Open Graph & Twitter Card Metadata ---
  openGraph: {
    title: "TedBooks - Discover Your Next Favourite Book",
    description: "An elegant e-commerce experience for book lovers.",
    url: siteUrl,
    siteName: "TedBooks",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "TedBooks E-commerce for Book Lovers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TedBooks - Discover Your Next Favourite Book",
    description: "An elegant e-commerce experience for book lovers.",
    site: "@tedbooks",
    images: [`${siteUrl}/og-image.png`],
  },

  // --- Favicons and App Icons ---
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-96x96.png",
    apple: "/apple-touch-icon.png",
  },

  // --- Other Important Metadata ---
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/**
 * The root layout component is a React Server Component that wraps the entire application.
 * It is responsible for the top-level <html> and <body> tags.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components, typically the active page.
 * @returns {JSX.Element} The root HTML structure of the application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    // The `lang` attribute is set for accessibility and SEO.
    // `suppressHydrationWarning` is often necessary when using next-themes
    // to prevent a React warning about server/client mismatch for the theme attribute.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
        {/*
          TODO: [Performance] Replace these manual font links with the `next/font` package.
          Using `next/font` will automatically optimize fonts, host them with your deployment,
          and eliminate layout shifts (CLS) for a better performance score.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      {/*
        Base styling is applied to the body tag, including font-family and anti-aliasing for better text rendering.
        The flex layout ensures the footer correctly sticks to the bottom of the viewport.
      */}
      <body className="font-body antialiased min-h-screen flex flex-col">
        {/*
          The Providers component is a common pattern to wrap client-side context providers
          (like session, theme, cart) around server components without turning the entire
          root layout into a client component.
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
