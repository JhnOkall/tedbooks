/**
 * @file Defines the MainLayout component, which serves as the primary layout
 * wrapper for the pages of the application.
 */

"use client";

import type { JSX, ReactNode } from "react";
import { motion } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/**
 * Defines the props accepted by the MainLayout component.
 */
interface MainLayoutProps {
  /**
   * The content to be rendered within the main layout, typically the page component.
   */
  children: ReactNode;
}

/**
 * Provides the consistent structure for application pages, including the
 * navigation bar, a main content area with transition animations, and a footer.
 *
 * @param {MainLayoutProps} props - The props for the component.
 * @returns {JSX.Element} The rendered layout with the page content.
 */
export function MainLayout({ children }: MainLayoutProps): JSX.Element {
  return (
    // Uses a flex column layout to ensure the footer sticks to the bottom of the viewport.
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/*
        The main content area is wrapped with `motion.main` from Framer Motion
        to apply a consistent fade-in and slide-up animation to page transitions.
      */}
      {/* TODO: The animation variants are defined inline. For a larger application,
      extract these variants into a shared configuration object to ensure consistency
      and reduce code duplication across different animated components. */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="flex-grow" // Ensures this element grows to fill available space.
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}
