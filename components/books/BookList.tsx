import type { Book } from "@/types";
import { BookCard } from "./BookCard";

interface BookListProps {
  books: Book[];
}

export function BookList({ books }: BookListProps) {
  if (!books.length) {
    return (
      <p className="text-center text-muted-foreground py-10">No books found.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
      {books.map((book) => (
        <BookCard key={book._id} book={book} />
      ))}
    </div>
  );
}
