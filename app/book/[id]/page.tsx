/**
 * @file This file defines the dynamic page for displaying the details of a single book.
 * It leverages Next.js App Router features like async Server Components for data fetching
 * and `generateMetadata` for dynamic, SEO-friendly page metadata.
 */

import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { getBookById, getRelatedBooks } from "@/lib/data";
import { BookDetailClient } from "@/components/books/BookDetailClient";
import NotFound from "@/app/not-found";

/**
 * Defines the shape of the props object for this page, which includes the dynamic
 * route parameters provided by Next.js.
 */
type Props = {
  params: { id: string };
};

/**
 * Generates dynamic metadata for the page at build or request time on the server.
 * This is crucial for SEO and for providing rich previews when the page is shared on
 * social media platforms. Next.js automatically de-duplicates the `getBookById` fetch call
 * between this function and the page component itself.
 *
 * @param {Props} props - The props containing the dynamic route parameters.
 * @returns {Promise<Metadata>} A promise that resolves to the page's metadata object.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = await getBookById(params.id);

  // If the book is not found, return a simple "Not Found" title.
  // The page component will handle rendering the 404 page UI.
  if (!book) {
    return {
      title: "Book Not Found",
      description: "The requested book could not be found.",
    };
  }

  // Generate a concise description for social media previews (approx. 160 characters).
  const description = book.synopsis
    ? book.synopsis.split("\n")[0].substring(0, 155) + "..."
    : `Check out the book "${book.title}" by ${book.author}.`;

  // Ensure the image URL is absolute, as required by the Open Graph protocol.
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const imageUrl = book.coverImage.startsWith("http")
    ? book.coverImage
    : `${siteUrl}${book.coverImage}`;

  return {
    title: `${book.title} by ${book.author}`,
    description: description,
    openGraph: {
      title: `${book.title} | TedBooks`,
      description: description,
      url: `${siteUrl}/book/${params.id}`,
      // TODO: The site name "TedBooks" is hardcoded. It should be sourced from a global
      // configuration file or environment variable for better maintainability.
      siteName: "TedBooks",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 1200, // Common aspect ratio for book covers
          alt: `Cover of ${book.title}`,
        },
      ],
      locale: "en_US",
      type: "article", // Using 'article' is more specific than 'website' for a detail page.
    },
    twitter: {
      card: "summary_large_image",
      title: `${book.title} by ${book.author}`,
      description: description,
      images: [imageUrl],
    },
  };
}

/**
 * The main server component for the book detail page.
 * It fetches the required data on the server and passes it down to a client component
 * for interactive rendering.
 */
export default async function BookDetailPage({ params }: Props) {
  const book = await getBookById(params.id);

  console.log("\n--- 2. SERVER_PAGE (BookDetailPage) ---");
  console.log(
    "Initial `book` object received from getBookById:",
    JSON.stringify(book, null, 2)
  );

  if (!book) {
    return <NotFound />;
  }

  // --- FIX START: Sanitize the Mongoose document to a plain object ---
  // This is the crucial step. It ensures the 'genre' field is a plain object.
  const plainBook = JSON.parse(JSON.stringify(book));

  console.log("--- 3. SERVER_PAGE (BookDetailPage) ---");
  console.log(
    "Fetching related books with genreId:",
    plainBook.genre?._id, // Using optional chaining for safety
    "and excludeBookId:",
    plainBook._id
  );
  // --- FIX END ---

  // Now, use the sanitized 'plainBook' object to fetch related books.
  // This guarantees that `plainBook.genre._id` is a valid string.
  const relatedBooks = await getRelatedBooks(
    plainBook.genre._id,
    plainBook._id
  );

  console.log("--- 4. SERVER_PAGE (BookDetailPage) ---");
  console.log(`Found ${relatedBooks.length} related books.`);

  // --- FIX START: Also sanitize the related books array for consistency ---
  const plainRelatedBooks = JSON.parse(JSON.stringify(relatedBooks));
  // --- FIX END ---

  return (
    <MainLayout>
      {/*
        Pass the plain, serializable objects to the client component.
        This prevents any serialization issues.
      */}
      <BookDetailClient book={plainBook} relatedBooks={plainRelatedBooks} />
    </MainLayout>
  );
}
