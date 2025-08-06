/**
 * @file Defines the SearchInput component, a reusable UI element for initiating
 * book searches throughout the application.
 */

"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, FormEvent, JSX } from "react";
// --- MODIFICATION START: Import necessary hooks ---
import { useRouter, usePathname, useSearchParams } from "next/navigation";
// --- MODIFICATION END ---

/**
 * A client component that provides a search input field.
 * It intelligently reads from and writes to the URL's query parameters,
 * preserving any other existing filters (like genre).
 *
 * @returns {JSX.Element} The rendered search input form.
 */
export function SearchInput(): JSX.Element {
  // --- MODIFICATION START: Use hooks to interact with the URL ---
  const router = useRouter();
  const pathname = usePathname(); // Gets the current path, e.g., "/shop"
  const searchParams = useSearchParams(); // Gets the current URL query params

  // Initialize the input's state directly from the 'search' URL parameter.
  // This ensures the input is always in sync with the URL on page load.
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  // --- MODIFICATION END ---

  /**
   * Handles the form submission event.
   * It constructs a new URL that includes the new search term while preserving
   * any existing query parameters.
   * @param {FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();

    // Create a mutable copy of the current search parameters.
    const params = new URLSearchParams(searchParams.toString());

    if (trimmedSearchTerm) {
      // If there's a search term, set it.
      params.set("search", trimmedSearchTerm);
    } else {
      // If the search term is empty, remove the 'search' parameter from the URL.
      // This allows the user to clear their search.
      params.delete("search");
    }

    // Construct the new URL and navigate.
    // This preserves other params like `genre` automatically.
    // Example: from /shop?genre=sci-fi, a search for "dune" becomes /shop?genre=sci-fi&search=dune
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-xl mx-auto">
      <Input
        type="search"
        placeholder="Search for books by title or author..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-12 pl-12 pr-4 rounded-lg shadow-md text-base"
        aria-label="Search for books"
      />
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
    </form>
  );
}
