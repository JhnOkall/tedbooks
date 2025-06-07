/**
 * @file This file defines the main "Shop" page for the application.
 * As a React Server Component, it is responsible for fetching and displaying the
 * complete list of books, and handling search queries from the URL.
 */

import { MainLayout } from "@/components/layout/MainLayout";
import { BookList } from "@/components/books/BookList";
import { getAllBooks } from "@/lib/data";
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
  searchParams?: { search?: string };
}): Promise<JSX.Element> {
  // Extracts the search query from the URL's search parameters.
  const searchQuery = searchParams?.search;

  // Fetches the list of books from the data source, passing the search query for filtering.
  // This data fetching occurs on the server.
  const books = await getAllBooks(searchQuery);

  // TODO: Implement pagination to handle a large number of books efficiently.
  // This would involve passing page and limit parameters to `getAllBooks` and
  // rendering pagination controls on the page.

  // TODO: Add more advanced filtering capabilities, such as filtering by category,
  // price range, or sorting options. This would require UI controls and updated API/data-fetching logic.

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
          {/* TODO: The SearchInput component should be pre-populated with the current `searchQuery`
          from the URL to provide a better user experience. */}
          <SearchInput />
        </div>
        {/*
          The fetched book data is passed to the BookList component.
          The `_id` field (a Mongoose ObjectId) is converted to a string, which is a crucial
          step to ensure the data is serializable and can be safely passed from a
          Server Component to a Client Component.
        */}
        <BookList
          books={books.map((book) => ({ ...book, _id: book._id.toString() }))}
        />
      </div>
    </MainLayout>
  );
}
