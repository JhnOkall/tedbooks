/**
 * @file This file defines the server-rendered page for editing a book.
 * It fetches the book's data and delegates the form rendering to a client component.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import type { IBook } from "@/models/Book";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EditBookForm } from "@/components/admin/edit-book-form";

// Helper function to fetch book data on the server
async function getBook(id: string): Promise<IBook | null> {
  try {
    // Use an absolute URL for server-side fetching
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/books/${id}`, {
      cache: "no-store", // Ensure we always get the latest data
    });

    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch book:", error);
    return null;
  }
}

/**
 * The main page component for editing a book. This is a Server Component.
 */
export default async function EditBookPage({
  params,
}: {
  params: { id: string };
}) {
  const book = await getBook(params.id);

  // If the book isn't found, render the 404 page
  if (!book) {
    notFound();
  }

  return (
    <div className="py-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold truncate">
            Edit Book: {book.title}
          </h1>
          <p className="text-muted-foreground">
            Modify the details of this book.
          </p>
        </div>
        <Button variant="outline" asChild className="rounded-lg">
          <Link href="/admin/books">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Books
          </Link>
        </Button>
      </header>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
          <CardDescription>
            Update the information below. To replace a file, just upload a new
            one.
          </CardDescription>
        </CardHeader>
        {/* Pass the server-fetched data to the client component */}
        <EditBookForm book={book} />
      </Card>
    </div>
  );
}
