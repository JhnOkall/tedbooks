import { notFound } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { getBookById, getRelatedBooks } from "@/lib/data";
import { BookDetailClient } from "@/components/books/BookDetailClient";

export default async function BookDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // 1. Fetch the main book data on the server
  const book = await getBookById(params.id);

  // 2. If not found, render the 404 page (a Next.js server feature)
  if (!book) {
    notFound();
  }

  // 3. Fetch related books based on the main book's category
  const relatedBooks = await getRelatedBooks(book);

  // 4. Render the layout and pass the server-fetched data to the Client Component
  return (
    <MainLayout>
      <BookDetailClient book={book} relatedBooks={relatedBooks} />
    </MainLayout>
  );
}
