import { getFeaturedBooks } from "@/lib/data";
import { BookCard } from "./BookCard";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Make the component async to fetch data
export async function FeaturedBooks() {
  // Await the data from the API
  const featuredBooks = await getFeaturedBooks();

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
