import { MainLayout } from "@/components/layout/MainLayout";
import { BookList } from "@/components/books/BookList";
import { getAllBooks } from "@/lib/data";
import { SearchInput } from "@/components/shared/SearchInput";

// The page is now an async Server Component
// It receives searchParams from the URL automatically
export default async function ShopPage({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  const searchQuery = searchParams?.search;
  const books = await getAllBooks(searchQuery);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-headline font-bold mb-4">
            Our Collection
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse through our extensive library of books.
          </p>
        </header>
        <div className="mb-8 max-w-xl mx-auto">
          <SearchInput />
        </div>
        {/* Pass the fetched books to the client component */}
        <BookList
          books={books.map((book) => ({ ...book, _id: book._id.toString() }))}
        />
      </div>
    </MainLayout>
  );
}
