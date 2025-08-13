/**
 * @file Defines the BookList component with infinite scroll functionality.
 */

"use client";

import type { Book } from "@/types";
import { BookCard } from "./BookCard";
import { useEffect, useRef, useState } from "react";
import { JSX } from "react";

/**
 * Defines the props required by the BookList component.
 */
interface BookListProps {
  /**
   * Initial array of book objects to be displayed.
   */
  initialBooks: Book[];
  /**
   * Current search query for filtering books.
   */
  searchQuery?: string;
  /**
   * Current genre slug for filtering books.
   */
  genreSlug?: string;
}

/**
 * A component that displays a collection of books in a responsive grid with infinite scroll.
 * It handles loading more books as the user scrolls to the bottom.
 *
 * @param {BookListProps} props - The props for the component.
 * @returns {JSX.Element} A grid of BookCard components with infinite scroll functionality.
 */
export function BookList({
  initialBooks,
  searchQuery,
  genreSlug,
}: BookListProps): JSX.Element {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialBooks.length === 12); // Assuming 12 books per page
  const [page, setPage] = useState(1);
  const observerRef = useRef<HTMLDivElement>(null);

  // Reset books when search query or genre changes
  useEffect(() => {
    setBooks(initialBooks);
    setPage(1);
    setHasMore(initialBooks.length === 12);
  }, [initialBooks, searchQuery, genreSlug]);

  // Function to load more books
  const loadMoreBooks = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: "12",
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (genreSlug) {
        params.append("genre", genreSlug);
      }

      const response = await fetch(`/api/books?${params.toString()}`);
      if (response.ok) {
        const newBooks: Book[] = await response.json();

        if (newBooks.length === 0) {
          setHasMore(false);
        } else {
          setBooks((prev) => [...prev, ...newBooks]);
          setPage((prev) => prev + 1);
          setHasMore(newBooks.length === 12);
        }
      }
    } catch (error) {
      console.error("Error loading more books:", error);
    } finally {
      setLoading(false);
    }
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreBooks();
        }
      },
      { threshold: 0.1 }
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
    };
  }, [hasMore, loading, page, searchQuery, genreSlug]);

  // If no books are found
  if (books.length === 0 && !loading) {
    return (
      <p className="text-center text-muted-foreground py-10">
        No books found matching your criteria.
      </p>
    );
  }

  return (
    <div>
      {/* Books grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {books.map((book) => (
          <BookCard key={book._id} book={book} />
        ))}
      </div>

      {/* Loading skeleton for new books */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse">
              <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerRef} className="h-10 flex items-center justify-center">
        {hasMore && !loading && (
          <p className="text-sm text-muted-foreground">Loading more books...</p>
        )}
        {!hasMore && books.length > 0 && (
          <p className="text-sm text-muted-foreground">
            You've reached the end!
          </p>
        )}
      </div>
    </div>
  );
}
