/**
 * @file Defines the FeaturedBooks component, a server-side component responsible for
 * fetching and displaying a curated list of featured books.
 */

import { getFeaturedBooks } from "@/lib/data";
import { BookCard } from "./BookCard";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { JSX } from "react";

/**
 * A React Server Component that fetches and displays a curated list of featured books.
 * It directly fetches data on the server, making it efficient and SEO-friendly.
 * It includes a fallback UI for when no featured books are available.
 *
 * @returns {Promise<JSX.Element>} A promise that resolves to the rendered component.
 */
export async function FeaturedBooks(): Promise<JSX.Element> {
  // Fetches the list of featured books directly on the server at build time or request time.
  const featuredBooks = await getFeaturedBooks();

  // Handle the case where no featured books are available or the fetch returns an empty array.
  // This ensures the component degrades gracefully without causing errors.
  if (!featuredBooks || featuredBooks.length === 0) {
    // TODO: The UI for the empty state could be configured via a CMS or props to be more dynamic.
    return (
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Featured Books
          </h2>
          <Alert variant="default" className="max-w-xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Featured Books Available</AlertTitle>
            <AlertDescription>
              Please check back later for our curated selection.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  // TODO: Implement a more specific error boundary for this component using Next.js's error.tsx
  // file convention to handle potential data fetching failures gracefully.

  return (
    <section className="py-12 md:py-16 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Featured Books</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {featuredBooks.map((book) => (
            <BookCard
              key={book._id.toString()}
              // The `book` object fetched from the database may have a non-serializable `_id` (Mongoose ObjectId).
              // We convert `_id` to a string to ensure it can be safely passed as a prop to the client-side `BookCard` component.
              book={{ ...book, _id: book._id.toString() }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
