import { IBook } from "@/models/Book";
import { BookCard } from "./BookCard";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Helper function to get the base URL for API calls
// This works on both server and client, and is configurable via environment variables
function getBaseUrl() {
  // If running on the server, use the internal host
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Otherwise, use the localhost URL for local development
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

// Make the component async to fetch data
export async function FeaturedBooks() {
  let featuredBooks: IBook[] = [];

  // Directly fetch the featured books within the component
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/books?featured=true`, {
      // Revalidate this data every hour (3600 seconds)
      // This caches the result and prevents hitting the DB on every request.
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      // Log the error for debugging, but don't crash the page
      console.error(`Failed to fetch featured books: ${res.statusText}`);
      // Let the component render the "no books" state by keeping featuredBooks as an empty array
    } else {
      featuredBooks = await res.json();
    }
  } catch (error) {
    console.error("An error occurred while fetching featured books:", error);
    // On network or other errors, keep featuredBooks as an empty array to prevent page crash
  }

  // If there are no books, we can show a message or just nothing
  if (!featuredBooks || featuredBooks.length === 0) {
    return (
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-headline font-bold mb-8 text-center">
            Featured Books
          </h2>
          <Alert variant="default" className="max-w-xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Featured Books</AlertTitle>
            <AlertDescription>
              Check back later for our curated selection of featured books.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-headline font-bold mb-8 text-center">
          Featured Books
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {featuredBooks.map((book) => (
            <BookCard
              key={book._id.toString()}
              book={{ ...book, _id: book._id.toString() }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
