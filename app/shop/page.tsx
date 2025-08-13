/**
 * @file This file defines the main "Shop" page for the application.
 * As a React Server Component, it is responsible for fetching and displaying the
 * initial list of books, and handling search queries from the URL.
 * The BookList component now handles infinite scrolling for additional pages.
 */

import { MainLayout } from "@/components/layout/MainLayout";
import { BookList } from "@/components/books/BookList";
import { getAllBooks, getGenreBySlug } from "@/lib/data";
import { SearchInput } from "@/components/shared/SearchInput";
import { JSX } from "react";

/**
 * The main shop page component. This is an `async` Server Component, allowing it
 * to fetch the initial page of data directly on the server before rendering.
 * Additional pages are loaded client-side through infinite scroll.
 *
 * @param {object} props - The component props, automatically provided by Next.js.
 * @param {object} [props.searchParams] - The URL query parameters.
 * @param {string} [props.searchParams.search] - The search term used to filter books.
 * @param {string} [props.searchParams.genre] - The genre slug used to filter books.
 * @returns {Promise<JSX.Element>} A promise that resolves to the rendered shop page.
 */
export default async function ShopPage({
  searchParams,
}: {
  searchParams?: { search?: string; genre?: string };
}): Promise<JSX.Element> {
  const searchQuery = searchParams?.search;
  const genreSlug = searchParams?.genre;

  // Fetch the first page of books for server-side rendering
  const initialBooks = await getAllBooks({ searchQuery, genreSlug });
  const genre = genreSlug ? await getGenreBySlug(genreSlug) : null;

  // Determine the page title based on current filters
  let pageTitle = "Our Collection";
  let pageDescription = "Browse through our extensive library of books.";

  if (genre) {
    pageTitle = `${genre.name} Books`;
    pageDescription = `Discover amazing books in the ${genre.name.toLowerCase()} genre.`;
  } else if (searchQuery) {
    pageTitle = `Search Results`;
    pageDescription = `Books matching "${searchQuery}"`;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">{pageTitle}</h1>
          <p className="text-lg text-muted-foreground">{pageDescription}</p>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {initialBooks.length > 0 ? `${initialBooks.length}+` : "0"}{" "}
              books
            </p>
          )}
        </header>

        <div className="mb-8 max-w-xl mx-auto">
          <SearchInput />
        </div>

        <BookList
          initialBooks={initialBooks.map((book) => ({
            ...book,
            _id: book._id.toString(),
          }))}
          searchQuery={searchQuery}
          genreSlug={genreSlug}
        />
      </div>
    </MainLayout>
  );
}
