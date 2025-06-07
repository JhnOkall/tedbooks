/**
 * @file Defines the BookList component, which is responsible for rendering a grid of BookCard components.
 */

import type { Book } from "@/types";
import { BookCard } from "./BookCard";
import { JSX } from "react";

/**
 * Defines the props required by the BookList component.
 */
interface BookListProps {
  /**
   * An array of book objects to be displayed.
   */
  books: Book[];
}

/**
 * A component that displays a collection of books in a responsive grid.
 * It handles the case where no books are provided by showing a message.
 *
 * @param {BookListProps} props - The props for the component.
 * @returns {JSX.Element} A grid of BookCard components or a message if the list is empty.
 */
export function BookList({ books }: BookListProps): JSX.Element {
  // TODO: Implement a loading state, possibly by accepting an `isLoading` prop and rendering
  // skeleton loaders to improve the user experience during data fetching.

  // If the books array is empty, display a user-friendly message.
  if (!books || books.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10">
        No books found matching your criteria.
      </p>
    );
  }

  // Render the grid of books.
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
      {books.map((book) => (
        <BookCard key={book._id} book={book} />
      ))}
    </div>
    // TODO: Implement pagination or an "infinite scroll" feature to handle large datasets
    // efficiently and prevent rendering an excessively long list of books at once.
  );
}
