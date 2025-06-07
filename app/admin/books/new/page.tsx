/**
 * @file This file defines the admin page for adding a new book to the catalog.
 * It provides a comprehensive form for all book details, including file uploads.
 */

"use client";

import { useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

/**
 * A client component that provides a form for administrators to create a new book,
 * including uploading the cover image and the book file itself.
 */
export default function AddNewBookPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs are used to access the file input elements directly.
  const coverFileRef = useRef<HTMLInputElement>(null);
  const bookFileRef = useRef<HTMLInputElement>(null);

  /**
   * Handles the form submission, orchestrating file uploads and the final API call
   * to create the book record in the database.
   * @param {FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const coverFile = coverFileRef.current?.files?.[0];
    const bookFile = bookFileRef.current?.files?.[0];

    try {
      // Validate that a cover image has been selected.
      if (!coverFile) {
        throw new Error("A cover image is required.");
      }
      if (!bookFile) {
        throw new Error("A book file (PDF, EPUB) is required.");
      }

      /**
       * A helper function to upload a file to the server via the `/api/upload` endpoint.
       * @param {File} file - The file to be uploaded.
       * @returns {Promise<string>} The URL of the uploaded file from Vercel Blob.
       */
      const uploadFile = async (file: File): Promise<string> => {
        const response = await fetch(
          // Pass the filename as a query parameter for the server to use.
          `/api/upload?filename=${encodeURIComponent(file.name)}`,
          {
            method: "POST",
            body: file,
          }
        );
        if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
        const newBlob = await response.json();
        return newBlob.url;
      };

      // Sequentially upload files and show progress via toasts.
      toast.info("Uploading cover image...");
      const coverImageUrl = await uploadFile(coverFile);

      toast.info("Uploading book file...");
      const bookFileUrl = await uploadFile(bookFile);

      // Prepare the final book data payload for the API.
      const bookData = {
        title: formData.get("title"),
        author: formData.get("author"),
        price: Number(formData.get("price")),
        category: formData.get("category"),
        description: formData.get("description"),
        synopsis: formData.get("synopsis"),
        featured: formData.get("featured") === "on",
        coverImage: coverImageUrl,
        fileUrl: bookFileUrl,
      };

      // Send the book data to the server to create the database record.
      toast.loading("Saving book details...");
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save the book.");
      }

      toast.dismiss(); // Dismiss the "Saving..." toast.
      toast.success("Book created successfully!");
      router.push("/admin/books"); // Redirect to the main books management page.
    } catch (err: any) {
      toast.dismiss(); // Ensure loading toast is dismissed on error.
      setError(err.message); // Display the error in the inline alert.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Add New Book</h1>
          <p className="text-muted-foreground">
            Fill in the details to add a new book to your catalog.
          </p>
        </div>
        <Button variant="outline" asChild className="rounded-lg">
          {/* TODO: Centralize application routes like '/admin/books' in a constants file. */}
          <Link href="/admin/books">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Books
          </Link>
        </Button>
      </header>

      <Card className="rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
            <CardDescription>
              Enter information for the new book.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display an error message if the form submission fails. */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  name="title"
                  id="title"
                  placeholder="Enter book title"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  name="author"
                  id="author"
                  placeholder="Enter author's name"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price (KES)</Label>
                <Input
                  name="price"
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 1200.00"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  name="category"
                  id="category"
                  placeholder="e.g., Fiction, Sci-Fi"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Short Description (for card views)
              </Label>
              <Textarea
                name="description"
                id="description"
                placeholder="A brief summary (1-2 sentences)"
                rows={3}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="synopsis">Full Synopsis</Label>
              <Textarea
                name="synopsis"
                id="synopsis"
                placeholder="Detailed synopsis of the book"
                rows={6}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="coverFile">Cover Image</Label>
                <Input
                  id="coverFile"
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookFile">Book File (PDF, EPUB)</Label>
                <Input
                  id="bookFile"
                  ref={bookFileRef}
                  type="file"
                  accept=".pdf,.epub"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox name="featured" id="featured" disabled={isSubmitting} />
              <Label htmlFor="featured" className="font-normal cursor-pointer">
                Mark as Featured Book
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-4">
            <Button
              type="submit"
              className="rounded-lg shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Save Book
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
