/**
 * @file This file defines the admin page for managing the book catalog.
 * It provides a table view of all books with actions to add, edit, or delete them.
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IBook } from "@/models/Book";
import { PlusCircle, Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * The main component for the "Manage Books" admin page. It fetches and displays
 * all books in a table and provides UI for CRUD (Create, Read, Update, Delete) operations.
 */
export default function ManageBooksPage() {
  const [books, setBooks] = useState<IBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State to hold the book targeted for deletion, which also controls the confirmation dialog.
  const [bookToDelete, setBookToDelete] = useState<IBook | null>(null);
  // State to manage the loading status during the deletion API call.
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Effect hook to fetch all books from the API when the component mounts.
   */
  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/books");
        if (!res.ok) {
          throw new Error("Failed to fetch books.");
        }
        const data = await res.json();
        setBooks(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, []);

  /**
   * Handles the deletion of a book after confirmation.
   * It sends a DELETE request to the API and optimistically updates the local state.
   */
  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/books/${bookToDelete._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete the book.");
      }

      // Optimistically update the UI by filtering out the deleted book.
      setBooks((prevBooks) =>
        prevBooks.filter((book) => book._id !== bookToDelete._id)
      );
      toast.success(`'${bookToDelete.title}' has been deleted.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBookToDelete(null); // Close the confirmation dialog.
      setIsDeleting(false);
    }
  };

  // Displays a loading spinner while the initial data is being fetched.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Displays an error message if the data fetch fails.
  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Fetching Books</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="py-6 space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manage Books</h1>
            <p className="text-muted-foreground">
              Add, edit, or remove books from your catalog.
            </p>
          </div>
          <Button asChild className="rounded-lg shadow-md">
            <Link href="/admin/books/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Book
            </Link>
          </Button>
        </header>

        <Card className="rounded-lg shadow-md">
          <CardHeader>
            <CardTitle>Book List</CardTitle>
            <CardDescription>
              A list of all books in your store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {books.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                No books found. Add one to get started!
              </p>
            ) : (
              <div className="overflow-x-auto">
                {/* TODO: Implement pagination for the books table to handle a large catalog efficiently. */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Featured</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((book) => (
                      <TableRow key={book._id.toString()}>
                        <TableCell>
                          <Image
                            src={book.coverImage}
                            alt={book.title}
                            width={50}
                            height={75}
                            className="rounded object-cover aspect-[2/3]"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {book.title}
                        </TableCell>
                        <TableCell>{book.author}</TableCell>
                        {/* TODO: The currency 'Ksh.' is hardcoded. Use a centralized currency formatter. */}
                        <TableCell className="text-right">
                          Ksh. {book.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {book.featured ? (
                            <Badge>Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button asChild variant="outline" size="icon">
                              <Link href={`/admin/books/edit/${book._id}`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => setBookToDelete(book)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Renders the deletion confirmation dialog when a book is selected for deletion. */}
      <AlertDialog
        open={!!bookToDelete}
        onOpenChange={() => setBookToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              book
              <span className="font-bold"> "{bookToDelete?.title}" </span>
              from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBook}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
