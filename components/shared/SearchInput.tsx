/**
 * @file Defines the SearchInput component, a reusable UI element for initiating
 * book searches throughout the application.
 */

"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, FormEvent, JSX } from "react";
import { useRouter } from "next/navigation";

/**
 * A client component that provides a search input field.
 * It allows users to type a query and submit it, which then navigates
 * them to the main shop/search results page with the query appended.
 *
 * @returns {JSX.Element} The rendered search input form.
 */
export function SearchInput(): JSX.Element {
  // State to hold and manage the current value of the search input field.
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  /**
   * Handles the form submission event.
   * It prevents the default page reload and programmatically navigates the user
   * to the search results page with their query.
   * @param {FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();

    // Only proceed if the search term is not empty after trimming whitespace.
    if (trimmedSearchTerm) {
      // TODO: Synchronize the input's state with the URL's search parameter.
      // If a user lands on `/shop?search=query`, the input should be pre-populated with 'query'.
      // This would require using the `useSearchParams` hook.
      router.push(`/shop?search=${encodeURIComponent(trimmedSearchTerm)}`);
    }
  };

  // TODO: Implement debouncing on the input's `onChange` event to enable live search
  // suggestions in a dropdown without overwhelming the server or router on every keystroke.

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-xl mx-auto">
      <Input
        type="search" // Using type="search" offers better semantics and browser-native features like a clear button.
        placeholder="Search for books by title or author..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-12 pl-12 pr-4 rounded-lg shadow-md text-base"
        aria-label="Search for books"
      />
      {/*
        The search icon is positioned absolutely within the relative form container
        to create an integrated and visually appealing input field.
      */}
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
    </form>
  );
}
