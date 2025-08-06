/**
 * @file This file defines the main "Shop" page for the application.
 * As a React Server Component, it is responsible for fetching and displaying the
 * complete list of books, and handling search queries from the URL.
 */

import { MainLayout } from "@/components/layout/MainLayout";
import { BookList } from "@/components/books/BookList";
import { getAllBooks, getGenreBySlug } from "@/lib/data";
import { SearchInput } from "@/components/shared/SearchInput";
import { JSX } from "react";

/**
 * The main shop page component. This is an `async` Server Component, allowing it
 * to fetch data directly on the server before rendering.
 *
 * @param {object} props - The component props, automatically provided by Next.js.
 * @param {object} [props.searchParams] - The URL query parameters.
 * @param {string} [props.searchParams.search] - The search term used to filter books.
 * @returns {Promise<JSX.Element>} A promise that resolves to the rendered shop page.
 */

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: { search?: string; genre?: string };
}): Promise<JSX.Element> {
  const searchQuery = searchParams?.search;
  const genreSlug = searchParams?.genre;

  const books = await getAllBooks({ searchQuery, genreSlug });
  const genre = genreSlug ? await getGenreBySlug(genreSlug) : null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Our Collection</h1>
          <p className="text-lg text-muted-foreground">
            Browse through our extensive library of books.
          </p>
        </header>

        <div className="mb-8 max-w-xl mx-auto">
          {/* No more prop is needed! The component handles its own state. */}
          <SearchInput />
        </div>

        <BookList
          books={books.map((book) => ({ ...book, _id: book._id.toString() }))}
        />
      </div>
    </MainLayout>
  );
}
