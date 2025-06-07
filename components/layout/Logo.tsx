/**
 * @file Defines the Logo component for the application.
 * This component renders the site's brand name as a clickable link to the homepage.
 */

import Link from "next/link";
import { JSX } from "react";

/**
 * A simple, reusable component that displays the site logo and links to the root page.
 *
 * @returns {JSX.Element} The rendered logo component.
 */
export function Logo(): JSX.Element {
  // TODO: The logo text "TedBooks" is hardcoded. For better flexibility, this
  // could be sourced from a global configuration or a CMS.
  return (
    <Link
      href="/"
      className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
      aria-label="TedBooks, back to homepage"
    >
      TedBooks
    </Link>
  );
}
